'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import GenreGrid from '@/components/GenreGrid';
import CompactGenreGrid from '@/components/CompactGenreGrid';
import MovieSearch from '@/components/MovieSearch';
import TopFivePicker from '@/components/TopFivePicker';
import { Movie } from '@/lib/types';
import moviesData from '@/public/movies.json';

const FEATURED_MOVIES = [
  { title: 'Dune: Part Two', filename: 'Dune_Part_Two.jpg' },
  { title: 'Anora', filename: 'Anora.jpg' },
  { title: 'Challengers', filename: 'Challengers.jpg' },
  { title: 'Babygirl', filename: 'Babygirl.jpg' },
  { title: 'Wicked', filename: 'Wicked.jpg' },
  { title: 'Inside Out 2', filename: 'Inside_Out_2.jpg' },
];

export default function Home() {
  const [currentPosterIndex, setCurrentPosterIndex] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const movies = moviesData as Movie[];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPosterIndex((prev) => (prev + 1) % FEATURED_MOVIES.length);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const currentMovie = FEATURED_MOVIES[currentPosterIndex];

  return (
    <article className="min-h-screen bg-black">
      {/* Hero Section */}
      <header className="py-16 px-6 md:py-32 bg-black">
        <div className="max-w-6xl mx-auto">
          {/* Title with integrated poster */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-sans font-black text-center leading-[0.85] text-white tracking-tight">
            {/* Mobile Layout */}
            <div className="flex md:hidden flex-col items-center justify-center gap-4">
              <div className="flex flex-col gap-0 leading-[0.85]">
                <span className="text-4xl">573</span>
                <span className="text-6xl">Movies</span>
              </div>
              <div className="relative w-32 h-48 rounded-md overflow-hidden z-0">
                <Image
                  src={`/posters/${currentMovie.filename}`}
                  alt={currentMovie.title}
                  fill
                  className="object-cover shadow-2xl"
                  priority
                />
              </div>
              <div className="flex flex-col gap-0 leading-[0.85]">
                <span>That Define</span>
                <span>2024</span>
              </div>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden md:flex flex-col items-center justify-center gap-0">
              <span className="relative z-20">every movie</span>
              <div className="flex items-center justify-center gap-6 md:gap-8 lg:gap-10 relative">
                <span className="relative z-20">in</span>
                <div className="relative w-20 md:h-30 lg:w-24 lg:h-36 aspect-[2/3] rounded-md overflow-hidden z-10 mt-1">
                  <Image
                    src={`/posters/${currentMovie.filename}`}
                    alt={currentMovie.title}
                    fill
                    className="object-cover shadow-2xl"
                    priority
                  />
                </div>
                <span className="relative z-20">2024,</span>
              </div>
              <span className="relative z-20">visualized</span>
            </div>
          </h1>

          {/* Byline */}
          <div className="flex items-center justify-center gap-4 text-sm text-gray-400 mt-12 font-mono">
            <span>By Maxim Slobodchikov</span>
            <span>•</span>
            <time>November 24, 2024</time>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <div className="bg-black pb-16">
        <div className="max-w-2xl mx-auto px-6 md:px-12 lg:px-16">
          {/* Opening Paragraph */}
          <p className="text-xl md:text-2xl leading-relaxed text-gray-200 mb-8 font-serif">
            Every December I end up thinking about all the movies I didn’t watch. Roughly 500 films come out each year. Yet at my best I manage maybe one a week, usually on a night in with friends or family. In the age of short-form everything, the feature film feels like an older, more deliberate art form I'm relearning how to appreciate (I was born in 2003 and while I’d love to pretend my attention span hasn’t been kneecapped by the algorithm, here we are).

          </p>
        </div>
      </div>

      {/* Body Content - White Background */}
      <div className="bg-white">
        <div className="max-w-2xl mx-auto px-6 md:px-12 lg:px-16 py-16">
        {/* Body Paragraphs */}
        <div className="space-y-12 text-xl md:text-2xl leading-relaxed text-gray-700 font-serif">
          <p>
            Still, films remain one of the few things worth surrendering my time to. They give me room to sink into a world, follow a thread all the way through, to let myself get carried somewhere new. I love the way a good movie makes me feel. How I’ll stand up filled with whimsy. Inspired, suddenly full of possibility. Maybe it’s the story, maybe it’s the escape, maybe it’s just the reminder that people can change, that beauty and meaning exist, that life can be dramatic, romantic, hilarious, surreal.
          </p>

          <p>This project started as a push for myself: a way to see the full landscape of what came out in 2024 and what I inevitably missed. But it’s also for anyone else who wants that same nudge, because nothing quite matches the way a good film reopens the world.
          </p>
        </div>
        </div>
      </div>

      {/* Genre Visualizations - Main Genres */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Column 1 */}
            <div className="space-y-8">
              <GenreGrid movies={movies} genre="Action" title="Action" primaryOnly={false} />
              <GenreGrid movies={movies} genre="Horror" title="Horror" primaryOnly={false} />
              <GenreGrid movies={movies} genre="Comedy" title="Comedy" primaryOnly={false} />
            </div>
            
            {/* Column 2 */}
            <div className="space-y-8">
              <GenreGrid movies={movies} genre="Drama" title="Drama" primaryOnly={false} />
              <GenreGrid movies={movies} genre="Romance" title="Romance" primaryOnly={false} />
              <GenreGrid movies={movies} genre="Sci-Fi" title="Sci-Fi" primaryOnly={false} />
            </div>
            
            {/* Column 3 */}
            <div className="space-y-8">
              <GenreGrid movies={movies} genre="Mystery" title="Mystery" primaryOnly={false} />
              <GenreGrid movies={movies} genre="Kids & Family" title="Kids & Family" primaryOnly={false} />
              <GenreGrid movies={movies} genre="Thriller" title="Thriller" primaryOnly={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Less Popular Genres Section */}
      <div className="bg-gray-50 py-12 pb-0">
        <div className="max-w-2xl mx-auto px-6 md:px-12 lg:px-16 mb-8">
          <h2 className="text-3xl md:text-4xl font-sans font-bold text-gray-900 mb-4 text-center">
            beyond the mainstream...
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed text-center">
            Beyond the popular categories, these genres 
            are fewer in number, but they represent the diversity of cinematic storytelling.
          </p>
        </div>
        
        <div className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Column 1 */}
              <div className="space-y-8">
                <GenreGrid movies={movies} genre="Adventure" title="Adventure" primaryOnly={false} />
                <GenreGrid movies={movies} genre="Crime" title="Crime" primaryOnly={false} />
                <GenreGrid movies={movies} genre="Fantasy" title="Fantasy" primaryOnly={false} />
                <GenreGrid movies={movies} genre="Holiday" title="Holiday" primaryOnly={false} />
                <GenreGrid movies={movies} genre="LGBTQ+" title="LGBTQ+" primaryOnly={false} />
              </div>
              
              {/* Column 2 */}
              <div className="space-y-8">
                <GenreGrid movies={movies} genre="Animation" title="Animation" primaryOnly={false} />
                <GenreGrid movies={movies} genre="Biography" title="Biography" primaryOnly={false} />
                <GenreGrid movies={movies} genre="History" title="History" primaryOnly={false} />
                <GenreGrid movies={movies} genre="Music" title="Music" primaryOnly={false} />
                <GenreGrid movies={movies} genre="Sports" title="Sports" primaryOnly={false} />
                <GenreGrid movies={movies} genre="Spirituality" title="Spirituality" primaryOnly={false} />
              </div>
              
              {/* Column 3 */}
              <div className="space-y-8">
                <GenreGrid movies={movies} genre="Documentary" title="Documentary" primaryOnly={false} />
                <GenreGrid movies={movies} genre="Musical" title="Musical" primaryOnly={false} />
                <GenreGrid movies={movies} genre="War" title="War" primaryOnly={false} />
                <GenreGrid movies={movies} genre="Western" title="Western" primaryOnly={false} />
                <GenreGrid movies={movies} genre="Anime" title="Anime" primaryOnly={false} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Visualization Section */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-24">
        <div className="max-w-3xl mx-auto px-6 md:px-12 lg:px-16 mb-16 text-center">
          <p className="text-lg text-gray-700 leading-relaxed">
            Every single film from 2024, visualized as a single grid. Each tiny square represents one movie, 
            colored by its primary genre.
          </p>
        </div>
        
        <div className="flex justify-center px-6">
          <CompactGenreGrid movies={movies} />
        </div>
      </div>

      {/* Explore All Movies Section */}
      <div className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16">
          <MovieSearch movies={movies} onFavoritesChange={setFavorites} />
        </div>
      </div>

      {/* Top Five Picker Section */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16">
          <TopFivePicker movies={movies} />
        </div>
      </div>
    </article>
  );
}
