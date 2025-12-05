'use client';

import { Movie } from '@/lib/types';

interface CompactGenreGridProps {
  movies: Movie[];
}

// Genre color mapping
const GENRE_COLORS: { [key: string]: string } = {
  'Drama': '#3b82f6',      // blue - changed from red
  'Mystery': '#6366f1',    // indigo
  'Thriller': '#f97316',   // orange
  'Comedy': '#f59e0b',     // amber/orange
  'Horror': '#7c2d12',     // dark brown - changed from dark red
  'Action': '#dc2626',     // red
  'Romance': '#ec4899',    // pink
  'Sci-Fi': '#06b6d4',     // cyan
  'Kids & Family': '#a855f7', // purple
  'Adventure': '#10b981',  // emerald green
  'Crime': '#475569',      // slate - darker
  'Fantasy': '#a855f7',    // purple
  'Animation': '#d946ef',  // fuchsia
  'Biography': '#f97316',  // orange
  'History': '#84cc16',    // lime green
  'Documentary': '#14b8a6', // teal
  'Music': '#eab308',      // yellow
  'Musical': '#fbbf24',    // amber
  'LGBTQ+': '#c026d3',     // fuchsia-600
  'Sports': '#22c55e',     // green
  'Holiday': '#fb923c',    // orange
  'War': '#57534e',        // stone-600 - darker
  'Western': '#92400e',    // brown - changed from yellow
  'Anime': '#be185d',      // pink-700
  'Spirituality': '#4f46e5', // indigo-600
};

interface GenreGroup {
  genre: string;
  movies: Movie[];
  color: string;
}

export default function CompactGenreGrid({ movies }: CompactGenreGridProps) {
  // Group movies by primary genre
  const genreGroups: { [key: string]: Movie[] } = {};
  
  movies
    .filter(movie => movie.posterFilename)
    .forEach(movie => {
      // Use primaryGenre if available, otherwise fall back to first genre in array
      const primaryGenre = movie.primaryGenre || movie.genres[0];
      if (!genreGroups[primaryGenre]) {
        genreGroups[primaryGenre] = [];
      }
      genreGroups[primaryGenre].push(movie);
    });

  // Convert to array and sort by count for better distribution
  const allGroups: GenreGroup[] = Object.entries(genreGroups)
    .map(([genre, genreMovies]) => ({
      genre,
      movies: genreMovies,
      color: GENRE_COLORS[genre] || '#9ca3af'
    }))
    .sort((a, b) => b.movies.length - a.movies.length);

  // Distribute into 3 columns to balance height (round-robin with manual adjustment)
  const column1: GenreGroup[] = [];
  const column2: GenreGroup[] = [];
  const column3: GenreGroup[] = [];
  
  allGroups.forEach((group, index) => {
    // Manual placement for War
    if (group.genre === 'War') {
      column3.push(group);
    } else if (index % 3 === 0) {
      column1.push(group);
    } else if (index % 3 === 1) {
      column2.push(group);
    } else {
      column3.push(group);
    }
  });

  const renderGenreGroup = (group: GenreGroup) => (
    <div key={group.genre} className="relative inline-block mb-6">
      {/* Genre label - absolutely positioned to align with grid */}
      <div className="absolute -top-4 left-0 text-[10px] font-semibold text-gray-700 whitespace-nowrap">
        {group.genre}
        <span className="text-gray-500 ml-1">({group.movies.length})</span>
      </div>
      
      {/* Compact grid for this genre */}
      <div 
        className="grid"
        style={{ 
          gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(group.movies.length * 1.5))}, 8px)`,
          gridAutoRows: '8px',
          gap: '1px',
        }}
      >
        {group.movies.map((movie, index) => (
          <div
            key={`${movie.title}-${index}`}
            className="cursor-pointer"
            title={`${movie.title}`}
            style={{ backgroundColor: group.color }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex gap-4 justify-center">
      {/* Column 1 */}
      <div className="flex flex-col items-start">
        {column1.map(renderGenreGroup)}
      </div>
      
      {/* Column 2 */}
      <div className="flex flex-col items-start">
        {column2.map(renderGenreGroup)}
      </div>
      
      {/* Column 3 */}
      <div className="flex flex-col items-start">
        {column3.map(renderGenreGroup)}
      </div>
    </div>
  );
}
