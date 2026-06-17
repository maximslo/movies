"""
Step 2 of the embedding pipeline.

Turn each enriched movie into a single 3072-dim vector with Gemini Embedding 2,
using a multimodal input: the metadata text + the TMDB poster image.

Auth is ADC via the Vertex AI backend, so run this once first:
    gcloud auth application-default login
(or the setup_adc.sh helper). No API key is stored.

Output:
  vectors.npy  - float32 array (n_movies, 3072), row order matches ids.json
  ids.json     - list of {title, primaryGenre, posterFilename} in row order
"""

import json
import os
from pathlib import Path

import numpy as np
import requests
from dotenv import load_dotenv
from google import genai
from google.genai import types

HERE = Path(__file__).parent
ENRICHED = HERE / "enriched.json"
VECTORS_OUT = HERE / "vectors.npy"
IDS_OUT = HERE / "ids.json"
CACHE = HERE / "vector_cache.json"  # title -> vector, lets us resume cheaply

load_dotenv(HERE / ".env")
MODEL = "gemini-embedding-2"
DIM = 3072


def get_client():
    return genai.Client(
        vertexai=True,
        project=os.environ["GCP_PROJECT"],
        location=os.environ.get("GCP_LOCATION", "us-central1"),
    )


def download_poster(url):
    try:
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        return r.content
    except Exception as e:  # noqa: BLE001
        print(f"  poster download failed ({e}); embedding text-only")
        return None


def embed(client, text, poster_bytes):
    contents = [text]
    if poster_bytes:
        contents.append(
            types.Part.from_bytes(data=poster_bytes, mime_type="image/jpeg")
        )
    resp = client.models.embed_content(
        model=MODEL,
        contents=contents,
        config=types.EmbedContentConfig(
            output_dimensionality=DIM, task_type="CLUSTERING"
        ),
    )
    return resp.embeddings[0].values


def main():
    movies = json.loads(ENRICHED.read_text())
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    client = get_client()

    vectors, ids = [], []
    for i, m in enumerate(movies):
        title = m["title"]
        if title in cache:
            vec = cache[title]
        else:
            poster = download_poster(m["poster_url"]) if m.get("poster_url") else None
            vec = embed(client, m["text"], poster)
            cache[title] = vec
            if i % 10 == 0:
                CACHE.write_text(json.dumps(cache))
            print(f"[{i+1}/{len(movies)}] embedded {title}")

        vectors.append(vec)
        ids.append(
            {
                "title": title,
                "primaryGenre": m.get("primaryGenre"),
                "posterFilename": m.get("posterFilename"),
            }
        )

    CACHE.write_text(json.dumps(cache))
    arr = np.asarray(vectors, dtype=np.float32)
    np.save(VECTORS_OUT, arr)
    IDS_OUT.write_text(json.dumps(ids, indent=2))
    print(f"\nSaved {arr.shape} vectors to {VECTORS_OUT.name}")


if __name__ == "__main__":
    main()
