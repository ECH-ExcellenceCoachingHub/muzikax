"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

interface TopArtistsSectionProps {
  creators: any[];
  loading: boolean;
}

export default function TopArtistsSection({ creators, loading }: TopArtistsSectionProps) {
  const router = useRouter();

  const generateAvatar = (name: string) => {
    const firstLetter = name.charAt(0).toUpperCase();
    return (
      <div className="w-full h-full bg-gradient-to-br from-gold-500 to-orange-500 flex items-center justify-center">
        <span className="text-4xl md:text-5xl font-bold text-white">
          {firstLetter}
        </span>
      </div>
    );
  };

  return (
    <section className="w-full px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-6 md:py-8 lg:py-10 border-t border-white/5">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-text-primary"
        >
          🎤 Top Artists
        </motion.h2>
        <Link
          href="/explore?tab=creators"
          className="text-gold-400 hover:text-gold-300 text-xs md:text-sm lg:text-base font-semibold transition-all hover:underline flex items-center gap-1 group"
        >
          View All
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Artists Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6 lg:gap-8">
        {loading ? (
          // Skeleton loaders
          Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center space-y-3"
            >
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-[var(--card-bg)]/70 animate-pulse"></div>
              <div className="h-4 bg-[var(--card-bg)]/70 rounded w-20"></div>
            </motion.div>
          ))
        ) : (
          // Artist cards
          creators.slice(0, 12).map((artist, index) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group flex flex-col items-center space-y-3 cursor-pointer"
              onClick={() => router.push(`/artists/${artist.id}`)}
            >
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full overflow-hidden border-4 border-transparent group-hover:border-gold-500/50 transition-all duration-300 shadow-lg group-hover:shadow-glow-primary">
                  {artist.avatar && artist.avatar.trim() !== '' ? (
                    <img
                      src={artist.avatar}
                      alt={artist.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    generateAvatar(artist.name)
                  )}
                </div>

                {/* Verified Badge */}
                {artist.verified && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-blue-500 rounded-full p-1.5 shadow-lg">
                    <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* Play Button Overlay */}
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-gold-500 to-orange-500 flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="text-center mt-2 md:mt-3">
                <h3 className="text-xs md:text-sm lg:text-base font-bold group-hover:text-gold-400 transition-colors truncate max-w-[120px] md:max-w-[140px] lg:max-w-[160px] text-text-primary">
                  {artist.name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {(artist.followers / 1000).toFixed(1)}K followers
                </p>
              </div>

              {/* Follow Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-1.5 rounded-full bg-gradient-to-r from-gold-500 to-orange-500 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  // Add follow functionality here
                }}
              >
                Follow
              </motion.button>
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
}
