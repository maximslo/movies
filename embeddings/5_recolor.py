"""
Step 5 — recolor sub-clusters with a vivid, fully-saturated qualitative palette.

The Tableau shades from step 4 included muted slate/teal/pale tones that read as
grey. This assigns each vibe sub-cluster one distinct, punchy hue instead. Names
and cluster membership are untouched.

Updates: ../public/embedding.json (per-point color)
         ../public/clusters.json  (per-cluster color)
"""

import json
from pathlib import Path

HERE = Path(__file__).parent
EMB = HERE.parent / "public" / "embedding.json"
CLUSTERS = HERE.parent / "public" / "clusters.json"

# 12 vivid, well-separated hues (no greys, all high saturation).
VIVID = [
    "#2563eb", "#f97316", "#16a34a", "#dc2626", "#9333ea", "#06b6d4",
    "#eab308", "#db2777", "#84cc16", "#f43f5e", "#14b8a6", "#a16207",
]


def main():
    pts = json.loads(EMB.read_text())
    clusters = json.loads(CLUSTERS.read_text())

    color_for = {c["id"]: VIVID[c["id"] % len(VIVID)] for c in clusters}

    for p in pts:
        sub = p.get("subcluster")
        if sub is not None:
            p["color"] = color_for[sub]
    for c in clusters:
        c["color"] = color_for[c["id"]]

    EMB.write_text(json.dumps(pts, indent=2))
    CLUSTERS.write_text(json.dumps(clusters, indent=2))
    print(f"Recolored {len(pts)} points across {len(clusters)} vibe clusters.")


if __name__ == "__main__":
    main()
