"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "../../contexts/LanguageContext";

interface BeatCardProps {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  plays: number;
  likes: number;
  audioUrl: string;
  type?: 'song' | 'beat' | 'mix';
  paymentType?: 'free' | 'paid';
  price?: number;
  currency?: string;
  creatorId?: string;
}

export default function BeatCard({ 
  beat, 
  onPlay, 
  isActive 
}: { 
  beat: BeatCardProps; 
  onPlay: () => void;
  isActive: boolean;
}) {
  const router = useRouter();
  const { t } = useLanguage();

  const formatPrice = (price?: number, currency?: string) => {
    if (!price) return t('free');
    return `${currency || '$'}${price.toFixed(2)}`;
  };

  return (
    <button onClick={onPlay} data-active={isActive} className="mx-card group">
      <div className="mx-card-media aspect-square w-full">
        {beat.coverImage ? (
          <img src={beat.coverImage} alt={beat.title} />
        ) : (
          <div className="mx-card-zoom flex items-center justify-center bg-surface-overlay">
            <svg className="w-10 h-10 text-text-muted" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
        )}

        {beat.paymentType && (
          <span
            className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded-full ${
              beat.paymentType === 'paid' ? 'bg-primary text-black' : 'bg-[#10B981] text-white'
            }`}
          >
            {beat.paymentType === 'paid' ? formatPrice(beat.price, beat.currency) : t('free')}
          </span>
        )}

        {isActive && (
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-primary text-[10px] font-bold rounded-full">
            {t('nowPlaying')}
          </span>
        )}

        <span className="mx-card-play">
          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        </span>
      </div>

      <div className="min-w-0">
        <p className="mx-card-title">{beat.title}</p>
        <p className="mx-card-subtitle">{beat.artist}</p>
      </div>
    </button>
  );
}
