"""
Step 3 of the embedding pipeline.

Cluster the movie vectors with Leiden community detection on a cosine kNN graph,
project them to 2D with UMAP, color each community, and write the lean JSON the
article reads.

Output:
  ../public/embedding.json
    [{ title, x, y, community, color, primaryGenre, posterFilename }]
"""

import json
from pathlib import Path

import igraph as ig
import leidenalg as la
import numpy as np
import umap
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import normalize

HERE = Path(__file__).parent
VECTORS = HERE / "vectors.npy"
IDS = HERE / "ids.json"
OUT = HERE.parent / "public" / "embedding.json"

K = 15
RESOLUTION = 1.0  # raise for more/smaller communities, lower for fewer/larger
SEED = 42

# Distinct, dark-background-friendly categorical palette (Tableau 20-ish).
PALETTE = [
    "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f",
    "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#bab0ac",
    "#86bcb6", "#d37295", "#fabfd2", "#b6992d", "#499894",
    "#d4a6c8", "#86b3d1", "#f1ce63", "#a0cbe8", "#ffbe7d",
]


def build_knn_graph(vectors, k=K):
    """Cosine kNN graph as an undirected igraph, weighted by similarity."""
    nn = NearestNeighbors(n_neighbors=k + 1, metric="cosine").fit(vectors)
    dist, idx = nn.kneighbors(vectors)
    edges, weights = [], []
    for i in range(len(vectors)):
        for j, d in zip(idx[i][1:], dist[i][1:]):  # skip self
            edges.append((i, int(j)))
            weights.append(1.0 - float(d))  # cosine similarity
    g = ig.Graph(n=len(vectors), edges=edges, directed=False)
    g.es["weight"] = weights
    g.simplify(combine_edges="max")
    return g


def main():
    raw = np.load(VECTORS)
    vectors = normalize(raw)  # L2 normalize -> cosine geometry
    ids = json.loads(IDS.read_text())

    # --- Leiden community detection ---
    g = build_knn_graph(vectors)
    partition = la.find_partition(
        g,
        la.RBConfigurationVertexPartition,
        weights="weight",
        resolution_parameter=RESOLUTION,
        seed=SEED,
    )
    communities = np.asarray(partition.membership)
    n_comm = communities.max() + 1
    print(f"Leiden found {n_comm} communities")

    # --- 2D projection ---
    reducer = umap.UMAP(
        n_neighbors=K, min_dist=0.1, metric="cosine", random_state=SEED
    )
    coords = reducer.fit_transform(vectors)
    # Rotate so the cloud's principal (longest) axis is horizontal, so it sits
    # naturally in the wide desktop hero. Frontend stretches x/y independently to
    # fill the banner; uniform SVG scaling there keeps the dots themselves round.
    centered = coords - coords.mean(0)
    _, _, vt = np.linalg.svd(centered, full_matrices=False)
    coords = centered @ vt.T  # column 0 = principal axis -> x
    # Min-max normalize each axis to [0, 1].
    mins, maxs = coords.min(0), coords.max(0)
    coords = (coords - mins) / (maxs - mins)

    out = []
    for i, rec in enumerate(ids):
        comm = int(communities[i])
        out.append(
            {
                "title": rec["title"],
                "x": round(float(coords[i, 0]), 4),
                "y": round(float(coords[i, 1]), 4),
                "community": comm,
                "color": PALETTE[comm % len(PALETTE)],
                "primaryGenre": rec.get("primaryGenre"),
                "posterFilename": rec.get("posterFilename"),
            }
        )

    OUT.write_text(json.dumps(out, indent=2))
    print(f"Wrote {len(out)} points to {OUT}")

    # Quick sanity: dominant genre per community.
    from collections import Counter

    for c in range(n_comm):
        genres = [
            o["primaryGenre"] for o in out if o["community"] == c and o["primaryGenre"]
        ]
        top = Counter(genres).most_common(3)
        print(f"  community {c}: {len(genres)} films, top genres {top}")


if __name__ == "__main__":
    main()
