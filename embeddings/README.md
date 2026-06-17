# Movie embedding pipeline

Turns every 2024 film into a 3072-dim **Gemini Embedding 2** vector (multimodal:
TMDB metadata text + poster image), clusters them with **Leiden** community
detection, projects to 2D with **UMAP**, and writes `../public/embedding.json`
— the dot cloud rendered behind the article's title.

## Setup

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

Secrets live in `.env` (gitignored): `TMDB_TOKEN`, `GCP_PROJECT`, `GCP_LOCATION`.

Gemini auth is **ADC via Vertex AI** — authenticate once (interactive):

```bash
gcloud auth application-default login
# project needs the Vertex AI API enabled + billing
```

## Run order

| Step | Script | Output | Needs |
|------|--------|--------|-------|
| 1 | `1_enrich_tmdb.py` | `enriched.json` | TMDB token |
| 2 | `2_embed.py` | `vectors.npy`, `ids.json` | ADC / Vertex |
| 3 | `3_cluster_project.py` | `public/embedding.json` | — |
| 4 | `4_subclusters.py` | augments `embedding.json` + `public/clusters.json` | ADC / Vertex |
| 5 | `5_recolor.py` | recolors sub-clusters with vivid hues (no greys) | — |

```bash
.venv/bin/python 1_enrich_tmdb.py
.venv/bin/python 2_embed.py
.venv/bin/python 3_cluster_project.py
.venv/bin/python 4_subclusters.py   # "clusters of clusters" + Gemini vibe names
```

Step 4 recursively splits each community with Leiden and names every sub-cluster
with `gemini-2.5-flash` (e.g. "Mind-Bending Terrors"). It adds `subcluster` + `vibe`
to each point, shades each point's `color` by its sub-cluster, and writes
`clusters.json` (`{id, parent, name, blurb, size, color, examples}`). Re-running it
re-queries the LLM, so names can vary slightly run to run. Tune `TARGET_SUB_SIZE`
for coarser/finer vibes.

All steps cache (`enriched.json`, `vector_cache.json`) so they are cheap to re-run.
Tune cluster count via `RESOLUTION` in `3_cluster_project.py`.

`0_local_preview.py` is an optional **non-Gemini** stand-in (TF-IDF + KMeans + PCA)
that writes a previewable `embedding.json` before ADC is set up. Steps 2→3 replace it.
