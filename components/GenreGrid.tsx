'use client';

import { useState } from 'react';
import { Movie } from '@/lib/types';
import Image from 'next/image';

interface GenreGridProps {
  movies: Movie[];
  genre: string;
  title: string;
  primaryOnly?: boolean;
}

export default function GenreGrid({ movies, genre, title, primaryOnly = false }: GenreGridProps) {
  const [hoveredMovie, setHoveredMovie] = useState<Movie | null>(null);

  // Filter movies by genre
  // If primaryOnly is true, only count if it's the first genre (primary genre)
  const filteredMovies = movies.filter(movie => {
    if (!movie.posterFilename) return false;
    
    if (primaryOnly) {
      // Only include if this is the primary (first) genre
      return movie.genres[0] === genre;
    } else {
      // Include if this genre appears anywhere in the genres array
      return movie.genres.includes(genre);
    }
  });

  return (
    <div className="relative">
      <div className="flex justify-center">
        <div className="relative w-full">
          {/* Header aligned to top right of grid */}
          <div className="absolute top-0 right-0 text-right mb-6 z-10">
            <h2 className="text-2xl md:text-3xl font-sans font-bold text-gray-900 mb-0">
              {title}
            </h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {filteredMovies.length} films
            </p>
          </div>
          
          {/* Grid */}
          <div 
            className="grid gap-0 w-full mt-16"
            style={{ 
              gridTemplateColumns: 'repeat(auto-fill, minmax(15px, 1fr))',
              gridAutoRows: '22.5px'
            }}
          >
            {filteredMovies.map((movie, index) => (
              <div
                key={`${movie.title}-${index}`}
                className="relative cursor-pointer"
                onMouseEnter={() => setHoveredMovie(movie)}
                onMouseLeave={() => setHoveredMovie(null)}
              >
                <div className="relative w-full h-full bg-gray-800 overflow-hidden">
                  {movie.posterFilename ? (
                    <Image
                      src={`/posters/${movie.posterFilename}`}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      sizes="20px"
                      loading="eager"
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hover Details Card */}
      {hoveredMovie && (
        <div className="fixed top-4 left-4 right-4 md:top-8 md:left-8 md:right-auto md:w-96 z-50 bg-white/50 backdrop-blur-md rounded-lg shadow-xl border border-gray-200/50 p-4 pointer-events-none" style={{ willChange: 'contents' }}>
          <div className="flex gap-4">
            {/* Large Poster */}
            <div className="relative w-24 h-36 flex-shrink-0 rounded overflow-hidden shadow-sm">
              {hoveredMovie.posterFilename && (
                <Image
                  src={`/posters/${hoveredMovie.posterFilename}`}
                  alt={hoveredMovie.title}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              )}
            </div>
            
            {/* Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-sans font-black text-gray-900 mb-2 leading-tight" style={{ fontWeight: 900 }}>
                {hoveredMovie.title}
              </h3>
              
              {hoveredMovie.productionCompany && (
                <p className="text-xs text-gray-600 mb-1.5">
                  {hoveredMovie.productionCompany}
                </p>
              )}
              
              {hoveredMovie.month && hoveredMovie.openingDate && (
                <p className="text-xs text-gray-500 mb-2">
                  {hoveredMovie.month} {hoveredMovie.openingDate}, 2024
                </p>
              )}
              
              {hoveredMovie.genres && hoveredMovie.genres.length > 0 && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-1">
                    {hoveredMovie.genres.slice(0, 3).map((genre, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 bg-gray-900/10 text-gray-700 text-[10px] font-medium rounded"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
