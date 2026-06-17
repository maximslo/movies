"""
Step 4 — "clusters of clusters".

Splits each top-level Leiden community into finer sub-clusters (recursive Leiden),
then asks Gemini 2.5 Flash to give each sub-cluster an evocative *vibe* name
(e.g. "Mindbenders", "Slow-Burn Dread") from its member films + TMDB keywords.

Reads:  vectors.npy, ids.json, enriched.json, ../public/embedding.json
Writes: ../public/embedding.json   (adds subcluster + vibe per point)
        ../public/clusters.json     (per sub-cluster metadata)
"""

import colorsys
import json
import os
import re
from collections import Counter
from pathlib import Path

import igraph as ig
import leidenalg as la
import numpy as np
from dotenv import load_dotenv
from google import genai
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import normalize

HERE = Path(__file__).parent
EMB_JSON = HERE.parent / "public" / "embedding.json"
CLUSTERS_JSON = HERE.parent / "public" / "clusters.json"

load_dotenv(HERE / ".env")
TARGET_SUB_SIZE = 55  # aim for sub-clusters of roughly this many films
SEED = 42


def sub_partition(vectors, resolution):
    k = min(10, len(vectors) - 1)
    nn = NearestNeighbors(n_neighbors=k + 1, metric="cosine").fit(vectors)
    dist, idx = nn.kneighbors(vectors)
    edges, weights = [], []
    for i in range(len(vectors)):
        for j, d in zip(idx[i][1:], dist[i][1:]):
            edges.append((i, int(j)))
            weights.append(1.0 - float(d))
    g = ig.Graph(n=len(vectors), edges=edges, directed=False)
    g.es["weight"] = weights
    g.simplify(combine_edges="max")
    part = la.find_partition(
        g, la.RBConfigurationVertexPartition, weights="weight",
        resolution_parameter=resolution, seed=SEED,
    )
    return np.asarray(part.membership)


def merge_to_target(vectors, mem, target):
    """Merge the smallest sub-cluster into its nearest neighbour until == target."""
    mem = mem.copy()
    while len(set(mem)) > target:
        labels = sorted(set(mem))
        cents = {}
        for lbl in labels:
            c = vectors[mem == lbl].mean(0)
            cents[lbl] = c / (np.linalg.norm(c) + 1e-9)
        small = min(labels, key=lambda l: int((mem == l).sum()))
        nearest = max(
            (l for l in labels if l != small),
            key=lambda l: float(cents[small] @ cents[l]),
        )
        mem[mem == small] = nearest
    remap = {lbl: i for i, lbl in enumerate(sorted(set(mem)))}
    return np.array([remap[x] for x in mem])


def split_community(vectors):
    """Split a community into ~target broad sub-clusters (Leiden, then merge down)."""
    n = len(vectors)
    target = max(1, round(n / TARGET_SUB_SIZE))
    if n < 14 or target <= 1:
        return np.zeros(n, dtype=int)
    mem = sub_partition(vectors, 1.0)
    res_iter = iter((1.5, 2.0, 2.8))
    while mem.max() + 1 < target:  # too few -> raise resolution
        try:
            mem = sub_partition(vectors, next(res_iter))
        except StopIteration:
            break
    if mem.max() + 1 > target:  # too many -> merge down to exactly target
        mem = merge_to_target(vectors, mem, target)
    return mem


def shades(hex_color, n):
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) / 255 for i in (0, 2, 4))
    hue, light, sat = colorsys.rgb_to_hls(r, g, b)
    levels = [light] if n == 1 else [0.42 + 0.34 * i / (n - 1) for i in range(n)]
    out = []
    for li in levels:
        rr, gg, bb = colorsys.hls_to_rgb(hue, li, sat)
        out.append("#%02x%02x%02x" % (int(rr * 255), int(gg * 255), int(bb * 255)))
    return out


def name_cluster(client, parent_genre, titles, keywords):
    prompt = (
        "You are naming a cluster of 2024 films grouped by semantic similarity "
        "(plot, mood, themes). Give a short, evocative VIBE label of 1-3 words in "
        "Title Case -- not a bare genre word. Think: 'Mindbenders', 'Slow-Burn "
        "Dread', 'Cozy Comfort Watches', 'Feel-Good Underdogs', 'Neon Revenge'. "
        f"The films lean {parent_genre}. Also write a 6-10 word description.\n\n"
        f"Films: {', '.join(titles)}\n"
        f"Common keywords: {', '.join(keywords)}\n\n"
        'Return STRICT JSON only: {"name": "...", "blurb": "..."}'
    )
    resp = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
    text = (resp.text or "").strip()
    text = re.sub(r"^```(?:json)?|```$", "", text, flags=re.MULTILINE).strip()
    try:
        obj = json.loads(text)
        return obj["name"].strip(), obj["blurb"].strip()
    except Exception:
        return (keywords[0].title() if keywords else parent_genre), ""


def main():
    vectors = normalize(np.load(HERE / "vectors.npy"))
    ids = json.loads((HERE / "ids.json").read_text())
    enriched = {m["title"]: m for m in json.loads((HERE / "enriched.json").read_text())}
    points = json.loads(EMB_JSON.read_text())
    by_title = {p["title"]: p for p in points}
    client = genai.Client(vertexai=True, project=os.environ["GCP_PROJECT"], location="global")

    # Group point-indices by parent community.
    parents = {}
    for i, rec in enumerate(ids):
        parents.setdefault(by_title[rec["title"]]["community"], []).append(i)

    clusters_meta = []
    sub_global_id = 0
    for parent in sorted(parents):
        members = parents[parent]
        base_color = by_title[ids[members[0]]["title"]]["color"]
        sub = split_community(vectors[members])
        n_sub = sub.max() + 1
        palette = shades(base_color, n_sub)
        parent_genre = Counter(
            by_title[ids[m]["title"]]["primaryGenre"] for m in members
            if by_title[ids[m]["title"]]["primaryGenre"]
        ).most_common(1)[0][0]

        for s in range(n_sub):
            sub_idx = [members[j] for j in range(len(members)) if sub[j] == s]
            titles = [ids[m]["title"] for m in sub_idx]
            kw_counter = Counter()
            for t in titles:
                kws = enriched.get(t, {}).get("text", "")
                for line in kws.splitlines():
                    if line.startswith("Keywords:"):
                        for k in line[len("Keywords:"):].split(","):
                            if k.strip():
                                kw_counter[k.strip()] += 1
            top_kw = [k for k, _ in kw_counter.most_common(12)]
            name, blurb = name_cluster(client, parent_genre, titles[:25], top_kw)
            color = palette[s]
            for t in titles:
                by_title[t]["subcluster"] = sub_global_id
                by_title[t]["vibe"] = name
                by_title[t]["color"] = color
            clusters_meta.append({
                "id": sub_global_id,
                "parent": int(parent),
                "name": name,
                "blurb": blurb,
                "size": len(titles),
                "color": color,
                "examples": titles[:4],
            })
            print(f"  [parent {parent}] sub {sub_global_id}: {name} ({len(titles)}) — {blurb}")
            sub_global_id += 1

    EMB_JSON.write_text(json.dumps(points, indent=2))
    CLUSTERS_JSON.write_text(json.dumps(clusters_meta, indent=2))
    print(f"\n{sub_global_id} vibe sub-clusters across {len(parents)} communities.")


if __name__ == "__main__":
    main()
