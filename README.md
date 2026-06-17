# every movie in 2024, visualized

A visual exploration of all 573 US films released in 2024 — and an experiment in
escaping genre labels.

**Live:** [movies.maximslo.com](https://movies.maximslo.com) ·
**Writeup:** [how I built this](https://maximslo.com/work/every-movie-2024/)

## The idea

Genres don't tile cleanly. *Everything Everywhere All at Once* is action, sci-fi, comedy,
drama, and family at once, and the same film gets tagged differently on IMDb, Wikipedia, and
Rotten Tomatoes. Any viz that drops a film into one bucket misrepresents most of them.

So the cluster cloud behind the title doesn't use genres at all. Each film is turned into a
point in **3,072-dimensional space** with a *multimodal* embedding — its plot, keywords,
cast, and **poster image** in a single vector — and then grouped by **semantic similarity**.
Films land near each other because of what they're *about*, not how they were labeled.

## How it works

```
scrapers/ ──► dataset.csv ──► public/movies.json          (573 films: title, genres, poster)
                                     │
                  TMDB enrich  ──────┘   plot · keywords · cast · directors · poster
                                     │
            Gemini Embedding 2 ──────┘   text + poster → one 3072-d vector  (multimodal)
                                     │
              Leiden (cosine kNN) ───┘   6 broad communities
                                     │
                    UMAP (2D) ───────┘   x, y for every film
                                     │
      recursive Leiden + ───────────┘   11 "vibe" sub-clusters, each named by
        gemini-2.5-flash                 the LLM (e.g. "Mind-Bending Terrors")
                                     │
                                     ▼
        public/embedding.json + public/clusters.json
                                     │
                                     ▼
        components/TitleEmbeddingBackground.tsx  →  SVG particle cloud behind the hero
```

Three things worth noting:

- **Multimodal embedding** — metadata text *and* the poster are fused into one
  [Gemini Embedding 2](https://ai.google.dev/gemini-api/docs/embeddings) vector, so visual
  style influences similarity, not just plot.
- **Two-level clustering** — Leiden finds 6 communities, then runs again *within* each to
  split out 11 finer "vibes," which `gemini-2.5-flash` names from their member films.
- **Zero runtime ML** — the whole pipeline runs offline; the deployed site just ships static
  JSON and draws SVG dots. Fast, cacheable, no inference on the request path.

## Repo layout

```
movies/
├── app/                  Next.js 16 App Router — the article (page.tsx, layout.tsx)
├── components/           viz components; TitleEmbeddingBackground.tsx = the cluster cloud
├── lib/types.ts          the Movie type
├── public/
│   ├── movies.json       573 films (source of truth for the site)
│   ├── posters/          poster images
│   ├── embedding.json    one point per film: x, y, community, subcluster, vibe, color
│   └── clusters.json     the 11 vibes: name, blurb, size, color, examples
├── scrapers/             Wikipedia/TMDB/RT scrapers, posters.py, dataset.csv
└── embeddings/           the embedding → Leiden → UMAP pipeline  (see its README)
```

## Run it

```bash
npm install
npm run dev        # http://localhost:3000   (build: npm run build)
```

Regenerating the cluster data is a separate, offline step — see
[`embeddings/README.md`](embeddings/README.md). It needs a TMDB token and Google Cloud ADC
(Vertex AI) for the embeddings, then runs five cached Python steps.

## Stack

**Web:** Next.js 16 · React 19 · TypeScript · Tailwind v4 — deployed on Vercel
(auto-deploys from `main`).
**Pipeline:** `google-genai` (Vertex/ADC) · `leidenalg` + `python-igraph` · `umap-learn` ·
`scikit-learn`.

> Secrets (`.env`), the Python `.venv/`, and large derived artifacts (`vectors.npy`,
> `vector_cache.json`) are gitignored — they never leave the machine.
