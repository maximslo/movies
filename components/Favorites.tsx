'use client';

import { useState } from 'react';
import { Movie } from '@/lib/types';
import Image from 'next/image';

interface FavoritesProps {
  movies: Movie[];
  favoriteMovies: Set<string>;
}

export default function Favorites({ movies, favoriteMovies }: FavoritesProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  const favoritedMoviesList = movies.filter(movie => favoriteMovies.has(movie.title));

  const shareText = () => {
    const text = `My Favorite Movies from 2024:\n\n${favoritedMoviesList.map((movie, idx) => 
      `${idx + 1}. ${movie.title}${movie.productionCompany ? ` (${movie.productionCompany})` : ''}`
    ).join('\n')}`;
    return text;
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const text = shareText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-2024-favorites.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Favorite Movies from 2024',
          text: shareText(),
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopyToClipboard();
    }
  };

  if (favoritedMoviesList.length === 0) {
    return (
      <div className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <h2 className="text-4xl md:text-5xl font-sans font-bold text-gray-900 mb-6">
            Your Favorites
          </h2>
          <p className="text-lg text-gray-600">
            Click the heart icon on any movie to add it to your favorites list.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-24">
      <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-sans font-bold text-gray-900 mb-6">
            Your Favorites
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            {favoritedMoviesList.length} {favoritedMoviesList.length === 1 ? 'movie' : 'movies'} saved
          </p>
          
          {/* Share Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={handleShare}
              className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 flex items-center gap-2 text-sm md:text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share List
            </button>
            
            <button
              onClick={handleCopyToClipboard}
              className={`px-6 py-3 font-semibold rounded-lg flex items-center gap-2 text-sm md:text-base ${
                copySuccess 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-100'
              }`}
            >
              {copySuccess ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy to Clipboard
                </>
              )}
            </button>
            
            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-white text-gray-900 border-2 border-gray-900 font-semibold rounded-lg hover:bg-gray-100 flex items-center gap-2 text-sm md:text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download List
            </button>
          </div>
        </div>

        {/* Favorites Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
          {favoritedMoviesList.map((movie) => (
            <div key={movie.title} className="group">
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow">
                {movie.posterFilename && (
                  <Image
                    src={`/posters/${movie.posterFilename}`}
                    alt={movie.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 16vw, 12vw"
                  />
                )}
              </div>
              <p className="mt-2 text-xs md:text-sm font-semibold text-gray-900 text-center line-clamp-2 group-hover:text-gray-700">
                {movie.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
