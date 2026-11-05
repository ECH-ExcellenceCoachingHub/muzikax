"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Genre {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  artists: number;
  tracks: number;
}

interface Mood {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<"genres" | "moods" | "trends">("genres");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const genres: Genre[] = [
    {
      id: "afrobeats",
      name: "Afrobeats",
      description: "Contemporary African popular music blending traditional rhythms with modern production, characterized by infectious grooves and danceable beats.",
      icon: "🎵",
      color: "from-yellow-500 to-orange-500",
      artists: 127,
      tracks: 2450
    },
    {
      id: "hiphop",
      name: "Hip Hop/Rap",
      description: "Urban storytelling through rhythmic speech and beats, featuring socially conscious lyrics and innovative flows from Rwanda's vibrant rap scene.",
      icon: "🎤",
      color: "from-purple-500 to-pink-500",
      artists: 89,
      tracks: 1890
    },
    {
      id: "rnb",
      name: "R&B/Soul",
      description: "Smooth vocals and emotional expression combine with contemporary production in this soulful genre that's gaining popularity among Rwandan artists.",
      icon: "💖",
      color: "from-red-500 to-pink-500",
      artists: 64,
      tracks: 1230
    },
    {
      id: "traditional",
      name: "Traditional/Folk",
      description: "Ancient musical traditions preserved through generations, featuring traditional instruments and cultural storytelling that connects modern audiences to Rwanda's heritage.",
      icon: "🥁",
      color: "from-green-500 to-teal-500",
      artists: 45,
      tracks: 890
    },
    {
      id: "electronic",
      name: "Electronic/Dance",
      description: "Modern electronic production meeting African rhythms, creating club-ready anthems and experimental soundscapes that energize dance floors.",
      icon: "⚡",
      color: "from-blue-500 to-cyan-500",
      artists: 73,
      tracks: 1560
    },
    {
      id: "gospel",
      name: "Gospel/Gospel",
      description: "Spiritual music combining traditional worship with contemporary sounds, reflecting Rwanda's strong religious heritage through uplifting melodies and inspiring messages.",
      icon: "⛪",
      color: "from-indigo-500 to-purple-500",
      artists: 52,
      tracks: 980
    }
  ];

  const moods: Mood[] = [
    {
      id: "energetic",
      name: "Energetic",
      description: "High-energy tracks perfect for workouts, parties, and getting pumped up",
      color: "bg-red-500",
      icon: "🔥"
    },
    {
      id: "chill",
      name: "Chill Vibes",
      description: "Relaxed, laid-back music for unwinding and casual listening",
      color: "bg-blue-500",
      icon: "🌊"
    },
    {
      id: "romantic",
      name: "Romantic",
      description: "Love songs and intimate ballads for romantic moments",
      color: "bg-pink-500",
      icon: "💕"
    },
    {
      id: "focus",
      name: "Focus Mode",
      description: "Instrumental and ambient tracks for concentration and productivity",
      color: "bg-green-500",
      icon: "🎯"
    },
    {
      id: "uplifting",
      name: "Uplifting",
      description: "Positive, motivational music to boost your spirits",
      color: "bg-yellow-500",
      icon: "✨"
    },
    {
      id: "melancholy",
      name: "Melancholy",
      description: "Emotional, introspective tracks for reflective moments",
      color: "bg-purple-500",
      icon: "🌧️"
    }
  ];

  const trendingArtists = [
    {
      id: "bruce-melody",
      name: "Bruce Melody",
      genre: "Afrobeats/Hip-Hop",
      followers: "125K",
      image: "/placeholder-artist-1.jpg",
      isNew: true
    },
    {
      id: "king-james",
      name: "King James",
      genre: "Afrobeats",
      followers: "98K",
      image: "/placeholder-artist-2.jpg",
      isNew: false
    },
    {
      id: "miss-shanel",
      name: "Miss Shanel",
      genre: "Afropop",
      followers: "87K",
      image: "/placeholder-artist-3.jpg",
      isNew: true
    }
  ];

  const trendingTracks = [
    {
      id: "track-1",
      title: "Imboga",
      artist: "Bruce Melody",
      plays: "2.3M",
      duration: "3:42",
      isNew: true
    },
    {
      id: "track-2",
      title: "Igitero",
      artist: "King James",
      plays: "1.8M",
      duration: "4:15",
      isNew: false
    },
    {
      id: "track-3",
      title: "Keza",
      artist: "Miss Shanel",
      plays: "1.5M",
      duration: "3:28",
      isNew: true
    }
  ];

  const selectedGenreData = genres.find(g => g.id === selectedGenre) || genres[0];

  return (
    <div className="min-h-screen text-white bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">Discover Music</h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Explore Rwanda's diverse musical landscape through genres, moods, and emerging trends
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12 border-b border-gray-700 pb-6">
          <button
            onClick={() => setActiveTab("genres")}
            className={`px-6 py-3 font-medium rounded-lg transition-all ${
              activeTab === "genres"
                ? "bg-primary text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            By Genre
          </button>
          <button
            onClick={() => setActiveTab("moods")}
            className={`px-6 py-3 font-medium rounded-lg transition-all ${
              activeTab === "moods"
                ? "bg-primary text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            By Mood
          </button>
          <button
            onClick={() => setActiveTab("trends")}
            className={`px-6 py-3 font-medium rounded-lg transition-all ${
              activeTab === "trends"
                ? "bg-primary text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            Trends
          </button>
        </div>

        {/* Genres Tab */}
        {activeTab === "genres" && (
          <div>
            {!selectedGenre ? (
              <div>
                <h2 className="text-3xl font-bold mb-8 text-center text-text-primary">Explore by Genre</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {genres.map((genre) => (
                    <div
                      key={genre.id}
                      onClick={() => setSelectedGenre(genre.id)}
                      className="rounded-xl p-6 cursor-pointer group mx-surface"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-16 h-16 bg-gradient-to-br ${genre.color} rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                          {genre.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold group-hover:text-primary transition-colors text-text-primary">
                            {genre.name}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {genre.artists} artists • {genre.tracks} tracks
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm">
                        {genre.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <button
                    onClick={() => setSelectedGenre(null)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    Back to Genres
                  </button>
                </div>

                <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-8 border border-gray-700">
                  <div className="flex items-center gap-6 mb-8">
                    <div className={`w-24 h-24 bg-gradient-to-br ${selectedGenreData.color} rounded-full flex items-center justify-center text-4xl`}>
                      {selectedGenreData.icon}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold mb-2 text-text-primary">{selectedGenreData.name}</h2>
                      <p className="text-gray-400 mb-4">
                        {selectedGenreData.artists} artists • {selectedGenreData.tracks} tracks
                      </p>
                      <p className="text-gray-300 max-w-2xl">
                        {selectedGenreData.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-bold mb-4 text-text-primary">Featured Artists</h3>
                      <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center">
                              <span className="text-white font-bold">A{i}</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-white">Artist Name {i}</h4>
                              <p className="text-gray-400 text-sm">Popular tracks • {Math.floor(Math.random() * 50) + 10}K followers</p>
                            </div>
                            <button className="text-primary hover:text-primary transition-colors">
                              Follow
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold mb-4 text-text-primary">Popular Tracks</h3>
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                          <div key={i} className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg group mx-surface">
                            <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors">
                              ▶
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-white">Track Title {i}</h4>
                              <p className="text-gray-400 text-sm">Artist Name • {Math.floor(Math.random() * 200) + 50}K plays</p>
                            </div>
                            <span className="text-gray-500 text-sm">{Math.floor(Math.random() * 4) + 2}:{String(Math.floor(Math.random() * 60)).padStart(2, '0')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 text-center">
                    <Link 
                      href={`/explore/${selectedGenreData.id}`}
                      className="inline-block bg-gradient-to-r from-primary to-primary-light text-white px-8 py-3 rounded-full font-semibold hover:from-primary hover:to-primary-light transition-all"
                    >
                      Explore All {selectedGenreData.name} Music
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Moods Tab */}
        {activeTab === "moods" && (
          <div>
            <h2 className="text-3xl font-bold mb-8 text-center text-text-primary">Find Music by Mood</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {moods.map((mood) => (
                <div
                  key={mood.id}
                  className="rounded-xl p-6 group text-center cursor-pointer mx-surface"
                >
                  <div className={`${mood.color} w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    {mood.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors text-text-primary">
                    {mood.name}
                  </h3>
                  <p className="text-gray-300 text-sm mb-4">
                    {mood.description}
                  </p>
                  <button className="text-primary hover:text-primary font-medium transition-colors">
                    Play Playlist
                  </button>
                </div>
              ))}
            </div>

            {/* Curated Playlists */}
            <div className="mt-16">
              <h3 className="text-2xl font-bold mb-6 text-center text-text-primary">Curated Mood Playlists</h3>
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { name: "Morning Energy", mood: "Energetic", tracks: 25 },
                  { name: "Late Night Vibes", mood: "Chill", tracks: 18 },
                  { name: "Workout Power", mood: "Energetic", tracks: 32 },
                  { name: "Study Focus", mood: "Focus", tracks: 22 }
                ].map((playlist, index) => (
                  <div key={index} className="rounded-xl p-4 group mx-surface">
                    <div className="bg-gradient-to-br from-primary to-primary-light h-32 rounded-lg mb-4 flex items-center justify-center group-hover:opacity-90 transition-opacity">
                      <span className="text-4xl">🎧</span>
                    </div>
                    <h4 className="font-semibold text-white mb-1">{playlist.name}</h4>
                    <p className="text-gray-400 text-sm">{playlist.mood} • {playlist.tracks} tracks</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === "trends" && (
          <div>
            <h2 className="text-3xl font-bold mb-8 text-center text-text-primary">What's Trending</h2>
            
            <div className="grid lg:grid-cols-2 gap-8 mb-12">
              {/* Trending Artists */}
              <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-text-primary">
                  <span>🔥</span> Trending Artists
                </h3>
                <div className="space-y-4">
                  {trendingArtists.map((artist, index) => (
                    <div key={artist.id} className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary w-8">
                        #{index + 1}
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {artist.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{artist.name}</h4>
                        <p className="text-gray-400 text-sm">{artist.genre} • {artist.followers} followers</p>
                      </div>
                      {artist.isNew && (
                        <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded-full">
                          New
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending Tracks */}
              <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-text-primary">
                  <span>📈</span> Hot Tracks
                </h3>
                <div className="space-y-4">
                  {trendingTracks.map((track, index) => (
                    <div key={track.id} className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg group">
                      <div className="text-2xl font-bold text-primary w-8">
                        #{index + 1}
                      </div>
                      <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-colors">
                        ▶
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{track.title}</h4>
                        <p className="text-gray-400 text-sm">{track.artist} • {track.plays} plays</p>
                      </div>
                      <span className="text-gray-500 text-sm">{track.duration}</span>
                      {track.isNew && (
                        <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded-full">
                          New
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Weekly Charts */}
            <div className="bg-gradient-to-r from-primary/10 to-primary-light/10 rounded-xl p-8 border border-primary/20">
              <h3 className="text-2xl font-bold mb-6 text-center text-text-primary">Weekly Top Charts</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    🥇
                  </div>
                  <h4 className="font-bold text-white mb-2">Top Tracks This Week</h4>
                  <p className="text-gray-300 text-sm">Discover the songs everyone's streaming right now</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#C0C0C0] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    🥈
                  </div>
                  <h4 className="font-bold text-white mb-2">Rising Stars</h4>
                  <p className="text-gray-300 text-sm">Artists gaining momentum this week</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#CD7F32] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    🥉
                  </div>
                  <h4 className="font-bold text-white mb-2">Breakthrough Hits</h4>
                  <p className="text-gray-300 text-sm">New releases making waves</p>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <Link 
                  href="/charts"
                  className="inline-block bg-gradient-to-r from-primary to-primary-light text-white px-8 py-3 rounded-full font-semibold hover:from-primary hover:to-primary-light transition-all"
                >
                  View Full Charts
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-primary/10 to-primary-light/10 rounded-xl p-8 border border-primary/20 text-center">
          <h2 className="text-2xl font-bold mb-4 text-text-primary">Ready to Dive Deeper?</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Create your personalized music experience with custom playlists, artist recommendations, and exclusive content tailored to your taste.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup"
              className="bg-gradient-to-r from-primary to-primary-light text-white px-8 py-3 rounded-full font-semibold hover:from-primary hover:to-primary-light transition-all inline-flex items-center justify-center"
            >
              Create Free Account
            </Link>
            <button className="border border-gray-600 text-gray-300 px-8 py-3 rounded-full font-semibold hover:bg-gray-700/50 transition-colors inline-flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Listen Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
