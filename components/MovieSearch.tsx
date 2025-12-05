'use client';

import { useState, useEffect, useRef } from 'react';
import { Movie } from '@/lib/types';
import Image from 'next/image';

interface MovieReviews {
  imdbRating?: string;
  imdbVotes?: string;
  rottenTomatoesRating?: string;
  metacriticRating?: string;
  plot?: string;
  runtime?: string;
  director?: string;
  actors?: string;
  loading: boolean;
  error?: string;
}

interface MovieSearchProps {
  movies: Movie[];
  onFavoritesChange?: (favorites: Set<string>) => void;
}

const ALL_GENRES = [
  'Action', 'Adventure', 'Animation', 'Anime', 'Biography', 
  'Comedy', 'Crime', 'Documentary', 'Drama', 'Fantasy', 
  'History', 'Holiday', 'Horror', 'Kids & Family', 'LGBTQ+', 
  'Music', 'Musical', 'Mystery', 'Romance', 'Sci-Fi', 
  'Spirituality', 'Sports', 'Thriller', 'War', 'Western'
];

export default function MovieSearch({ movies, onFavoritesChange }: MovieSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredMovie, setHoveredMovie] = useState<Movie | null>(null);
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [movieReviews, setMovieReviews] = useState<MovieReviews | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Fetch movie details when a movie is selected
  useEffect(() => {
    if (!selectedMovie) {
      setMovieReviews(null);
      return;
    }

    const fetchMovieDetails = async () => {
      setMovieReviews({ loading: true });
      
      try {
        // Using OMDb API - you'll need to get a free API key from http://www.omdbapi.com/apikey.aspx
        // For now, using a demo key (limited requests)
        const apiKey = '73b6c603'; // Replace with your actual API key
        const response = await fetch(
          `http://www.omdbapi.com/?i=tt3896198&apikey=${apiKey}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch movie data');
        }

        const data = await response.json();
        
        if (data.Response === 'False') {
          setMovieReviews({ 
            loading: false, 
            error: 'Movie details not found. This might be because the title differs slightly from IMDb records.' 
          });
          return;
        }

        // Extract Rotten Tomatoes rating from Ratings array
        const rtRating = data.Ratings?.find((r: any) => r.Source === 'Rotten Tomatoes')?.Value;
        
        setMovieReviews({
          imdbRating: data.imdbRating !== 'N/A' ? data.imdbRating : undefined,
          imdbVotes: data.imdbVotes !== 'N/A' ? data.imdbVotes : undefined,
          rottenTomatoesRating: rtRating || undefined,
          metacriticRating: data.Metascore !== 'N/A' ? data.Metascore : undefined,
          plot: data.Plot !== 'N/A' ? data.Plot : undefined,
          runtime: data.Runtime !== 'N/A' ? data.Runtime : undefined,
          director: data.Director !== 'N/A' ? data.Director : undefined,
          actors: data.Actors !== 'N/A' ? data.Actors : undefined,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching movie details:', error);
        setMovieReviews({ 
          loading: false, 
          error: 'Unable to load reviews at this time.' 
        });
      }
    };

    fetchMovieDetails();
  }, [selectedMovie]);
  
  // Filter movies with posters
  const moviesWithPosters = movies.filter(movie => movie.posterFilename);
  
  // Filter by search term and genre
  const allFilteredMovies = moviesWithPosters.filter(movie => {
    const matchesSearch = searchTerm
      ? movie.title.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    const matchesGenre = selectedGenre
      ? movie.genres.includes(selectedGenre)
      : true;
    return matchesSearch && matchesGenre;
  });

  // Show only first 6 rows when collapsed (6 rows × 20 columns = 120 movies on large screens)
  const previewCount = 120;
  const filteredMovies = isExpanded ? allFilteredMovies : allFilteredMovies.slice(0, previewCount);
  const hasMore = allFilteredMovies.length > previewCount;

  const handleToggleExpanded = () => {
    if (isExpanded) {
      // Jump to search bar when collapsing
      setIsExpanded(false);
      setTimeout(() => {
        if (searchContainerRef.current) {
          const elementPosition = searchContainerRef.current.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - 80; // 80px extra offset
          window.scrollTo({
            top: offsetPosition,
            behavior: 'auto' // instant jump
          });
        }
      }, 0);
    } else {
      setIsExpanded(true);
    }
  };

  return (
    <div className="relative" ref={searchContainerRef}>
      {/* Search and Filter Controls */}
      <div className="bg-amber-300 rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label htmlFor="movie-search" className="block text-sm font-bold text-gray-900 mb-2">
              Search by title
            </label>
            <input
              id="movie-search"
              type="text"
              placeholder="Ex: Babygirl "
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 text-gray-800 border-2 border-black rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white placeholder:text-gray-400"
            />
          </div>

          {/* Genre Filter */}
          <div className="w-full sm:w-56">
            <label htmlFor="genre-filter" className="block text-sm font-bold text-gray-900 mb-2">
              Filter by genre
            </label>
            <select
              id="genre-filter"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full px-4 py-3 text-base border-2 border-black rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900 bg-orange-400 font-semibold appearance-none cursor-pointer"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              <option value="">All Genres</option>
              {ALL_GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-600 mb-4">
        Showing {filteredMovies.length} of {allFilteredMovies.length} {allFilteredMovies.length === 1 ? 'movie' : 'movies'}
      </p>

      {/* Movie Grid */}
      <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-20 gap-0 mb-6">
        {filteredMovies.map((movie, index) => (
          <div
            key={`${movie.title}-${index}`}
            className="relative aspect-[2/3] cursor-pointer overflow-hidden border border-gray-200 hover:border-gray-900 hover:z-10"
            onClick={() => setSelectedMovie(movie)}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const isMobile = window.innerWidth < 768;
              const cardWidth = isMobile ? window.innerWidth - 32 : 384; // Full width on mobile with padding
              const cardHeight = 200;
              
              let x, y;
              
              if (isMobile) {
                // On mobile, center the card horizontally
                x = 16;
                y = Math.min(rect.bottom + 8, window.innerHeight - cardHeight - 16);
              } else {
                // Desktop: right if space, otherwise left
                x = rect.right + 16;
                if (x + cardWidth > window.innerWidth - 16) {
                  x = rect.left - cardWidth - 16;
                }
                // If still off screen, center it
                if (x < 16) {
                  x = Math.max(16, (window.innerWidth - cardWidth) / 2);
                }
                
                y = rect.top;
                if (y + cardHeight > window.innerHeight - 16) {
                  y = window.innerHeight - cardHeight - 16;
                }
              }
              
              if (y < 16) y = 16;
              
              setCardPosition({ x, y });
              setHoveredMovie(movie);
            }}
            onMouseLeave={() => {
              setHoveredMovie(null);
              setCardPosition(null);
            }}
          >
            {movie.posterFilename && (
              <Image
                src={`/posters/${movie.posterFilename}`}
                alt={movie.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 12vw, (max-width: 768px) 8vw, (max-width: 1024px) 6vw, 5vw"
                loading="eager"
              />
            )}
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={handleToggleExpanded}
            className="px-8 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <span>{isExpanded ? 'Show Less' : `Show All ${allFilteredMovies.length} Movies`}</span>
            <svg 
              className={`w-5 h-5 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Hover Details Card */}
      {hoveredMovie && cardPosition && (
        <div 
          className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-300 p-4 pointer-events-none max-w-[calc(100vw-2rem)] md:w-96" 
          style={{ 
            left: `${cardPosition.x}px`, 
            top: `${cardPosition.y}px`,
            width: window.innerWidth < 768 ? `calc(100vw - 2rem)` : '24rem',
            height: '180px',
            minHeight: '180px'
          }}
        >
          <div className="flex gap-4 h-full">
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

      {/* Movie Detail Modal */}
      {selectedMovie && (
        <div 
          className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-2 md:p-4"
          onClick={() => setSelectedMovie(null)}
        >
          <div 
            className="bg-white rounded-xl max-w-6xl w-full max-h-[98vh] md:max-h-[95vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-3 md:px-6 py-3 md:py-4 flex items-center justify-between z-10">
              <h2 className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900 pr-4 leading-tight">{selectedMovie.title}</h2>
              <button
                onClick={() => setSelectedMovie(null)}
                className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Compact Grid Layout */}
            <div className="p-2 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2 md:gap-4 lg:gap-6">
                {/* Left Column: Poster */}
                {selectedMovie.posterFilename && (
                  <div className="md:col-span-1 lg:col-span-3">
                    <div className="relative w-32 md:w-48 lg:w-full aspect-[2/3] rounded-lg overflow-hidden shadow-lg mx-auto">
                      <Image
                        src={`/posters/${selectedMovie.posterFilename}`}
                        alt={selectedMovie.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 128px, (max-width: 1024px) 192px, 300px"
                      />
                    </div>
                  </div>
                )}

                {/* Middle Column: Info & Details */}
                <div className="md:col-span-1 lg:col-span-5 space-y-2 md:space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-2 md:gap-4">
                    <div>
                      <p className="text-xs md:text-sm text-gray-500 mb-1">Studio</p>
                      <p className="font-semibold text-gray-900 text-sm md:text-base leading-tight">{selectedMovie.productionCompany}</p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-gray-500 mb-1">Release</p>
                      <p className="font-semibold text-gray-900 text-sm md:text-base">
                        {selectedMovie.month} {selectedMovie.openingDate}, 2024
                      </p>
                    </div>
                    {movieReviews?.runtime && !movieReviews.loading && (
                      <div>
                        <p className="text-xs md:text-sm text-gray-500 mb-1">Runtime</p>
                        <p className="font-semibold text-gray-900 text-sm md:text-base">{movieReviews.runtime}</p>
                      </div>
                    )}
                    {movieReviews?.director && !movieReviews.loading && (
                      <div>
                        <p className="text-xs md:text-sm text-gray-500 mb-1">Director</p>
                        <p className="font-semibold text-gray-900 text-sm md:text-base leading-tight">{movieReviews.director}</p>
                      </div>
                    )}
                  </div>

                  {/* Genres */}
                  <div>
                    <p className="text-xs md:text-sm text-gray-500 mb-1">Genres</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMovie.genres.map((genre, idx) => (
                        <span key={idx} className="px-2 py-0.5 md:px-3 md:py-1 bg-gray-900 text-white text-[10px] md:text-sm font-medium rounded-full">
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Cast */}
                  {movieReviews?.actors && !movieReviews.loading && (
                    <div>
                      <p className="text-xs md:text-sm text-gray-500 mb-0.5">Cast</p>
                      <p className="text-xs md:text-base text-gray-900 leading-tight">{movieReviews.actors}</p>
                    </div>
                  )}

                  {/* Plot */}
                  {movieReviews?.plot && !movieReviews.loading && (
                    <div>
                      <p className="text-xs md:text-sm text-gray-500 mb-0.5">Synopsis</p>
                      <p className="text-xs md:text-base text-gray-700 leading-relaxed line-clamp-3 md:line-clamp-none">{movieReviews.plot}</p>
                    </div>
                  )}

                  {/* Favorite Button - Hidden on mobile to save space, shown on larger screens */}
                  <button
                    onClick={() => {
                      const newFavorites = new Set(favorites);
                      if (newFavorites.has(selectedMovie.title)) {
                        newFavorites.delete(selectedMovie.title);
                      } else {
                        newFavorites.add(selectedMovie.title);
                      }
                      setFavorites(newFavorites);
                      onFavoritesChange?.(newFavorites);
                    }}
                    className={`hidden md:flex w-full px-4 py-2.5 rounded-lg font-semibold items-center justify-center gap-2 text-sm md:text-base ${
                      favorites.has(selectedMovie.title)
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-5 h-5" fill={favorites.has(selectedMovie.title) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {favorites.has(selectedMovie.title) ? 'Favorited' : 'Add to Favorites'}
                  </button>
                </div>

                {/* Right Column: Ratings & Links */}
                <div className="md:col-span-2 lg:col-span-4 space-y-2 md:space-y-4">
                  <h3 className="text-sm md:text-lg font-bold text-gray-900">Ratings</h3>
                
                  {movieReviews?.loading && (
                    <div className="bg-gray-50 rounded-lg p-4 md:p-5 text-center">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-300 rounded w-24 mx-auto"></div>
                        <div className="h-4 bg-gray-300 rounded w-16 mx-auto"></div>
                      </div>
                      <p className="text-gray-600 text-sm md:text-base mt-3">Loading...</p>
                    </div>
                  )}

                  {movieReviews?.error && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4">
                      <p className="text-yellow-800 text-sm md:text-base">{movieReviews.error}</p>
                    </div>
                  )}

                  {!movieReviews?.loading && !movieReviews?.error && (
                    <div className="grid grid-cols-3 md:grid-cols-1 gap-1.5 md:gap-3">
                      {/* IMDb Rating */}
                      {movieReviews?.imdbRating && (
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-2 md:p-4 text-center">
                          <div className="text-[10px] md:text-sm font-semibold text-gray-600 mb-0.5">IMDb</div>
                          <div className="text-base md:text-3xl font-bold text-gray-900">{movieReviews.imdbRating}</div>
                          {movieReviews.imdbVotes && (
                            <div className="hidden md:block text-xs text-gray-500 mt-0.5">{movieReviews.imdbVotes} votes</div>
                          )}
                        </div>
                      )}

                      {/* Rotten Tomatoes */}
                      {movieReviews?.rottenTomatoesRating && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-2 md:p-4 text-center">
                          <div className="text-[10px] md:text-sm font-semibold text-gray-600 mb-0.5">Rotten Tomatoes</div>
                          <div className="text-base md:text-3xl font-bold text-gray-900">{movieReviews.rottenTomatoesRating}</div>
                        </div>
                      )}

                      {/* Metacritic */}
                      {movieReviews?.metacriticRating && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-2 md:p-4 text-center">
                          <div className="text-[10px] md:text-sm font-semibold text-gray-600 mb-0.5">Metacritic</div>
                          <div className="text-base md:text-3xl font-bold text-gray-900">{movieReviews.metacriticRating}</div>
                          <div className="hidden md:block text-xs text-gray-500 mt-0.5">out of 100</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* External Links */}
                  <div className="bg-gray-50 rounded-lg p-2 md:p-4 space-y-1.5 md:space-y-3">
                    <p className="text-gray-600 text-xs md:text-base text-center mb-1">
                      View more details:
                    </p>
                    <a
                      href={`https://www.imdb.com/find?q=${encodeURIComponent(selectedMovie.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-3 py-2 md:py-3 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 text-xs md:text-base text-center"
                    >
                      IMDb
                    </a>
                    <a
                      href={`https://www.rottentomatoes.com/search?search=${encodeURIComponent(selectedMovie.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-3 py-2 md:py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 text-xs md:text-base text-center"
                    >
                      Rotten Tomatoes
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
