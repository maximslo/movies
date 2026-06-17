"""
Step 1 of the embedding pipeline.

For every movie in ../public/movies.json, look it up on TMDB and pull the
rich metadata (genres, keywords, cast, directors, overview, release date, poster)
used to build the multimodal Gemini Embedding 2 input.

Output:
  enriched.json     - list of enriched movie records (cached; re-runnable)
  tmdb_misses.json  - titles that TMDB could not match, for manual override

A manual override map (title -> tmdb_id) can be placed in `overrides.json` to fix
any miss without re-running the whole search.
"""

import json
import os
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

HERE = Path(__file__).parent
MOVIES_JSON = HERE.parent / "public" / "movies.json"
ENRICHED_OUT = HERE / "enriched.json"
MISSES_OUT = HERE / "tmdb_misses.json"
OVERRIDES = HERE / "overrides.json"

load_dotenv(HERE / ".env")
TMDB_TOKEN = os.environ["TMDB_TOKEN"]

SESSION = requests.Session()
SESSION.headers.update(
    {"Authorization": f"Bearer {TMDB_TOKEN}", "accept": "application/json"}
)
BASE = "https://api.themoviedb.org/3"
MAX_CAST = 6


def search_movie(title, year=2024):
    """Return the best-matching TMDB movie id for a title, or None."""
    params = {"query": title, "primary_release_year": year}
    r = SESSION.get(f"{BASE}/search/movie", params=params, timeout=30)
    r.raise_for_status()
    results = r.json().get("results", [])
    if not results:
        # Retry without the year constraint (some festival/limited titles drift)
        r = SESSION.get(f"{BASE}/search/movie", params={"query": title}, timeout=30)
        r.raise_for_status()
        results = r.json().get("results", [])
    return results[0]["id"] if results else None


def fetch_details(movie_id):
    params = {"append_to_response": "keywords,credits"}
    r = SESSION.get(f"{BASE}/movie/{movie_id}", params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def build_text(d):
    """Build the embedding text in the reference Genres/Keywords/Directors/Cast/Overview/Release format."""
    genres = ", ".join(g["name"] for g in d.get("genres", []))
    keywords = ", ".join(k["name"] for k in d.get("keywords", {}).get("keywords", []))
    credits = d.get("credits", {})
    directors = ", ".join(
        c["name"] for c in credits.get("crew", []) if c.get("job") == "Director"
    )
    cast = ", ".join(c["name"] for c in credits.get("cast", [])[:MAX_CAST])
    overview = d.get("overview", "") or ""
    release = d.get("release_date", "") or ""
    return (
        f"Genres: {genres}\n"
        f"Keywords: {keywords}\n\n"
        f"Directors: {directors}\n"
        f"Cast: {cast}\n\n"
        f"Overview: {overview}\n"
        f"Release: {release}"
    )


def main():
    movies = json.loads(MOVIES_JSON.read_text())
    overrides = json.loads(OVERRIDES.read_text()) if OVERRIDES.exists() else {}

    # Resume support: keep already-enriched titles.
    done = {}
    if ENRICHED_OUT.exists():
        done = {m["title"]: m for m in json.loads(ENRICHED_OUT.read_text())}

    enriched, misses = [], []
    for i, m in enumerate(movies):
        title = m["title"]
        if title in done:
            enriched.append(done[title])
            continue

        try:
            movie_id = overrides.get(title) or search_movie(title)
            if not movie_id:
                misses.append(title)
                print(f"[{i+1}/{len(movies)}] MISS  {title}")
                continue

            d = fetch_details(movie_id)
            poster_path = d.get("poster_path")
            enriched.append(
                {
                    "title": title,
                    "primaryGenre": m.get("primaryGenre"),
                    "posterFilename": m.get("posterFilename"),
                    "tmdb_id": movie_id,
                    "text": build_text(d),
                    "poster_url": (
                        f"https://image.tmdb.org/t/p/w500{poster_path}"
                        if poster_path
                        else None
                    ),
                }
            )
            print(f"[{i+1}/{len(movies)}] OK    {title}")
            time.sleep(0.05)
        except Exception as e:  # noqa: BLE001
            misses.append(title)
            print(f"[{i+1}/{len(movies)}] ERR   {title}: {e}")

        # Periodic checkpoint so a crash never loses progress.
        if i % 25 == 0:
            ENRICHED_OUT.write_text(json.dumps(enriched, indent=2))

    ENRICHED_OUT.write_text(json.dumps(enriched, indent=2))
    MISSES_OUT.write_text(json.dumps(misses, indent=2))
    print(f"\nEnriched {len(enriched)}/{len(movies)} movies. {len(misses)} misses.")
    if misses:
        print(f"Misses written to {MISSES_OUT.name}; add overrides to overrides.json.")


if __name__ == "__main__":
    main()
