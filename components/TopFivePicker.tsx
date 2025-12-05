'use client';

import { useState } from 'react';
import { Movie } from '@/lib/types';
import Image from 'next/image';

interface TopFivePickerProps {
  movies: Movie[];
}

export default function TopFivePicker({ movies }: TopFivePickerProps) {
  const [selectedMovies, setSelectedMovies] = useState<(Movie | null)[]>([null, null, null, null, null]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSlot, setCurrentSlot] = useState<number | null>(null);

  const moviesWithPosters = movies.filter(movie => movie.posterFilename);

  const filteredMovies = searchTerm
    ? moviesWithPosters.filter(movie =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : moviesWithPosters;

  const handleSlotClick = (index: number) => {
    setCurrentSlot(index);
    setIsSearchOpen(true);
    setSearchTerm('');
  };

  const handleMovieSelect = (movie: Movie) => {
    if (currentSlot !== null) {
      const newSelected = [...selectedMovies];
      newSelected[currentSlot] = movie;
      setSelectedMovies(newSelected);
      setIsSearchOpen(false);
      setCurrentSlot(null);
      setSearchTerm('');
    }
  };

  const handleRemoveMovie = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = [...selectedMovies];
    newSelected[index] = null;
    setSelectedMovies(newSelected);
  };

  const getPersonalityAnalysis = () => {
    const selected = selectedMovies.filter((m): m is Movie => m !== null);
    if (selected.length < 3) return null;

    // Analyze various aspects
    const allGenres = selected.flatMap(m => m.genres);
    const genreCounts = allGenres.reduce((acc, genre) => {
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const studios = selected.map(m => m.productionCompany);
    const months = selected.map(m => m.month);
    
    // Check for major studios
    const majorStudios = ['Universal Pictures', 'Warner Bros.', 'Disney', 'Paramount', 'Sony Pictures', 'Netflix', 'Amazon MGM Studios'];
    const majorStudioCount = studios.filter(s => majorStudios.some(major => s?.includes(major))).length;
    
    // Check genre diversity
    const uniqueGenres = new Set(allGenres);
    const genreDiversity = uniqueGenres.size / allGenres.length;
    
    // Check for indie vibes (A24, Neon, etc.)
    const indieStudios = ['A24', 'Neon', 'IFC', 'Searchlight', 'Focus Features', 'Annapurna'];
    const indieCount = studios.filter(s => indieStudios.some(indie => s?.includes(indie))).length;
    
    // Check for popular genres
    const blockbusterGenres = ['Action', 'Adventure', 'Sci-Fi', 'Fantasy'];
    const blockbusterCount = allGenres.filter(g => blockbusterGenres.includes(g)).length;
    
    const artHouseGenres = ['Drama', 'Documentary', 'Biography', 'History'];
    const artHouseCount = allGenres.filter(g => artHouseGenres.includes(g)).length;

    // Determine personality
    let personality = '';
    let description = '';
    let emoji = '';

    if (indieCount >= 3) {
      personality = "The Indie Connoisseur";
      description = "You gravitate toward independent cinema and artistic storytelling. You appreciate films that challenge conventions and explore unique perspectives.";
      emoji = "🎨";
    } else if (majorStudioCount >= 4 && blockbusterCount >= 5) {
      personality = "The Blockbuster Fan";
      description = "You love big-budget spectacles and crowd-pleasing entertainment. You're drawn to the movies everyone's talking about—and for good reason!";
      emoji = "🍿";
    } else if (artHouseCount >= 5) {
      personality = "The Thoughtful Viewer";
      description = "You seek substance and depth in your viewing choices. Character-driven narratives and real-world stories resonate with you most.";
      emoji = "📚";
    } else if (genreDiversity > 0.7) {
      personality = "The Eclectic Explorer";
      description = "You don't box yourself in! From comedies to thrillers to documentaries, you appreciate great filmmaking across all genres.";
      emoji = "🌈";
    } else if (genreCounts['Horror'] >= 3) {
      personality = "The Horror Enthusiast";
      description = "You live for the thrill, the scares, and the suspense. Horror films are your comfort zone (or discomfort zone?).";
      emoji = "👻";
    } else if (genreCounts['Comedy'] >= 3) {
      personality = "The Comedy Lover";
      description = "Life's too short not to laugh! You seek out films that bring joy, humor, and a good time.";
      emoji = "😂";
    } else if (genreCounts['Romance'] >= 2) {
      personality = "The Romantic";
      description = "You believe in love stories and emotional connections. Films that tug at the heartstrings are your go-to.";
      emoji = "💕";
    } else {
      personality = "The Balanced Cinephile";
      description = "You have a well-rounded taste in cinema, appreciating a good mix of mainstream hits and thoughtful gems. You know what you like!";
      emoji = "⚖️";
    }

    return { personality, description, emoji };
  };

  const getRecommendations = () => {
    // Simple recommendation: Get movies that share genres with selected movies
    const selectedGenres = new Set<string>();
    selectedMovies.forEach(movie => {
      if (movie) {
        movie.genres.forEach(genre => selectedGenres.add(genre));
      }
    });

    const recommendations = moviesWithPosters
      .filter(movie => !selectedMovies.includes(movie))
      .map(movie => {
        const matchingGenres = movie.genres.filter(g => selectedGenres.has(g)).length;
        return { movie, score: matchingGenres };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.movie);

    return recommendations;
  };

  const personalityAnalysis = getPersonalityAnalysis();
  const recommendations = selectedMovies.some(m => m !== null) ? getRecommendations() : [];
  const allSlotsFilled = selectedMovies.every(m => m !== null);

  return (
    <div className="relative">
      {/* Yellow Container */}
      <div className="bg-amber-300 rounded-2xl p-6 md:p-8">
        <h2 className="text-3xl md:text-4xl font-sans font-black text-gray-900 mb-3 text-center">
          Pick our Top 5 Movies
        </h2>
        <p className="text-base md:text-lg text-gray-900 mb-6 text-center">
          Select your favorites and I&apos;ll recommend movies you might enjoy
        </p>

        {/* 5 Poster Slots */}
        <div className="flex justify-center gap-3 md:gap-4 mb-6">
          {selectedMovies.map((movie, index) => (
            <div
              key={index}
              className="relative w-20 h-28 md:w-28 md:h-40 lg:w-32 lg:h-48 rounded-lg overflow-hidden cursor-pointer border-2 border-black hover:border-gray-700 transition-all hover:scale-105"
              onClick={() => handleSlotClick(index)}
            >
              {movie ? (
                <>
                  <Image
                    src={`/posters/${movie.posterFilename}`}
                    alt={movie.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 80px, (max-width: 1024px) 112px, 128px"
                  />
                  {/* Remove button */}
                  <button
                    onClick={(e) => handleRemoveMovie(index, e)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-10"
                  >
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </>
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <svg className="w-8 h-8 md:w-12 md:h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info Text */}
        <p className="text-sm md:text-base text-gray-700 text-center">
          {allSlotsFilled
            ? '🎬 All set! Check out your recommendations below'
            : `${selectedMovies.filter(m => m !== null).length} of 5 selected`}
        </p>
      </div>

      {/* Search Modal */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
          onClick={() => setIsSearchOpen(false)}
        >
          <div 
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                  Select a movie for slot {currentSlot !== null ? currentSlot + 1 : ''}
                </h3>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <input
                type="text"
                placeholder="Search for a movie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                autoFocus
              />
            </div>

            {/* Movie Grid */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {filteredMovies.slice(0, 100).map((movie, index) => (
                  <div
                    key={`${movie.title}-${index}`}
                    className="relative aspect-[2/3] cursor-pointer overflow-hidden rounded border-2 border-gray-200 hover:border-gray-900 transition-all"
                    onClick={() => handleMovieSelect(movie)}
                    title={movie.title}
                  >
                    <Image
                      src={`/posters/${movie.posterFilename}`}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 25vw, (max-width: 768px) 16vw, 10vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Personality Analysis */}
      {personalityAnalysis && (
        <div className="mt-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 md:p-8 border-2 border-purple-200">
          <div className="text-center">
            <div className="text-5xl md:text-6xl mb-4">{personalityAnalysis.emoji}</div>
            <h3 className="text-2xl md:text-3xl font-sans font-black text-gray-900 mb-3">
              {personalityAnalysis.personality}
            </h3>
            <p className="text-base md:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
              {personalityAnalysis.description}
            </p>
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="mt-8 bg-white rounded-2xl p-6 md:p-8 border-2 border-amber-300">
          <h3 className="text-2xl md:text-3xl font-sans font-bold text-gray-900 mb-4 text-center">
            You Might Also Like
          </h3>
          <p className="text-sm md:text-base text-gray-600 mb-6 text-center">
            Based on your selections, here are {recommendations.length} movies I think you&apos;ll enjoy
          </p>
          
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {recommendations.map((movie, index) => (
              <div
                key={`${movie.title}-${index}`}
                className="relative aspect-[2/3] cursor-pointer overflow-hidden rounded border-2 border-gray-200 hover:border-amber-400 transition-all hover:scale-105"
                title={movie.title}
              >
                <Image
                  src={`/posters/${movie.posterFilename}`}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 20vw, (max-width: 768px) 16vw, 10vw"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
