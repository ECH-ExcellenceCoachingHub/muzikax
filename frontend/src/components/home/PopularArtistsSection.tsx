"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface PopularArtistsSectionProps {
  creators: any[];
  isAuthenticated?: boolean;
}

export default function PopularArtistsSection({ creators, isAuthenticated }: PopularArtistsSectionProps) {
  const router = useRouter();

  const generateAvatar = (name: string) => {
    const firstLetter = name.charAt(0).toUpperCase();
    return (
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mx-auto">
        <span className="text-xl sm:text-2xl font-bold text-white">{firstLetter}</span>
      </div>
    );
  };

  return (
    <section className="w-full px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-2 sm:py-4 lg:py-6 border-t border-white/5">
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-text-primary">
          Popular Artists
        </h2>
        <a
          href="/artists"
          className="text-xs font-semibold uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors duration-200"
        >
          See All
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 md:gap-4 lg:gap-6">
        {creators.map((creator, index) => (
          <div
            key={creator.id}
            className={`group relative gradient-border-animated rounded-2xl p-0.5 reveal-on-scroll holographic-shimmer card-lift-3d particle-float light-leak`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="rounded-[14px] glassmorphism-advanced p-3 md:p-4 lg:p-5 backdrop-blur-xl hover:bg-[var(--card-bg)]/70 transition-colors">
              <div 
                className="flex flex-col items-center text-center cursor-pointer group"
                onClick={() => router.push(`/artists/${creator.id}`)}
              >
                <div className="relative mb-2 md:mb-3 pulse-ring">
                  {creator.avatar && creator.avatar.trim() !== '' ? (
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full object-cover mx-auto border-2 md:border-4 border-[var(--card-bg)]/50 shadow-2xl transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    generateAvatar(creator.name)
                  )}
                  {creator.verified && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-primary to-primary-light border-4 border-[var(--card-bg)] flex items-center justify-center neon-glow shadow-lg">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-xs md:text-sm lg:text-base truncate w-full tracking-wide drop-shadow-md mt-2 text-text-primary">
                  {creator.name}
                </h3>
                <p className="text-xs md:text-sm lg:text-base mb-1 md:mb-2 font-semibold text-text-primary">
                  {creator.type}
                </p>
                <p className="text-gray-400 text-xs md:text-sm mb-2 font-medium">
                  {creator.followers.toLocaleString()} followers
                </p>
                <button 
                  className="mt-1 md:mt-2 w-full px-2 md:px-3 py-1.5 gradient-primary text-white hover:shadow-lg hover:shadow-primary/40 rounded-full text-xs md:text-sm font-bold transition-all fab-spring border-0 shadow-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAuthenticated) {
                      router.push('/login');
                    } else {
                      console.log('Following', creator.name);
                    }
                  }}
                >
                  Follow ✨
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
