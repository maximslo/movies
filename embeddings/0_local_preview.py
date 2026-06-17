"""
OPTIONAL preview generator — NOT the real pipeline.

Builds ../public/embedding.json locally (TF-IDF + KMeans + PCA over the
enriched TMDB text) so the article can be previewed before Gemini/ADC is set up.
Run 2_embed.py + 3_cluster_project.py afterward to replace this with the real
Gemini Embedding 2 + Leiden + UMAP result.
"""

import json
from pathlib import Path

import numpy as np
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.feature_extraction.text import TfidfVectorizer

HERE = Path(__file__).parent
ENRICHED = HERE / "enriched.json"
OUT = HERE.parent / "public" / "embedding.json"

PALETTE = [
    "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f",
    "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#bab0ac",
]


def main():
    movies = json.loads(ENRICHED.read_text())
    texts = [m["text"] for m in movies]

    X = TfidfVectorizer(max_features=4000, stop_words="english").fit_transform(texts)
    communities = KMeans(n_clusters=len(PALETTE), random_state=42, n_init=10).fit_predict(X)
    coords = PCA(n_components=2, random_state=42).fit_transform(X.toarray())
    coords = (coords - coords.min(0)) / (coords.max(0) - coords.min(0))

    out = []
    for i, m in enumerate(movies):
        c = int(communities[i])
        out.append(
            {
                "title": m["title"],
                "x": round(float(coords[i, 0]), 4),
                "y": round(float(coords[i, 1]), 4),
                "community": c,
                "color": PALETTE[c % len(PALETTE)],
                "primaryGenre": m.get("primaryGenre"),
                "posterFilename": m.get("posterFilename"),
            }
        )
    OUT.write_text(json.dumps(out, indent=2))
    print(f"[preview] wrote {len(out)} points to {OUT}")


if __name__ == "__main__":
    main()
