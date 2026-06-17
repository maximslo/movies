import embedding from '@/public/embedding.json';

interface EmbeddingPoint {
  title: string;
  x: number;
  y: number;
  community: number;
  color: string;
  subcluster?: number;
  vibe?: string;
  primaryGenre: string | null;
  posterFilename: string | null;
}

// Horizontal squish toward a spherical cloud (1 = natural width).
const SQUISH = 0.8;

/**
 * Decorative particle cloud that sits BEHIND the title section: one dot per 2024
 * film, positioned by the 2D UMAP projection of its 3072-dim Gemini Embedding 2
 * vector and colored by its "vibe" sub-cluster. Rendered as a centered, contained
 * sphere (not full-bleed) behind the text. Static + SSR-safe — a single SVG whose
 * square viewBox keeps every dot perfectly round.
 */
export default function TitleEmbeddingBackground() {
  const points = embedding as EmbeddingPoint[];

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center select-none"
      aria-hidden="true"
    >
      <svg
        className="aspect-square w-[560px] max-w-[88%] -translate-y-10"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        {points.map((p, i) => (
          <circle
            key={i}
            cx={((p.x - 0.5) * SQUISH + 0.5) * 100}
            cy={p.y * 100}
            r={0.45}
            fill={p.color}
            opacity={0.9}
          />
        ))}
      </svg>
    </div>
  );
}
