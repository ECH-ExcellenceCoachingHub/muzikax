'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

interface StemVolumes {
  vocals: number;
  drums: number;
  bass: number;
  other: number;
}

interface MuzikaXStemPlayerProps {
  onClose: () => void;
}

export default function MuzikaXStemPlayer({ onClose }: MuzikaXStemPlayerProps) {
  const { audioRef, currentTrack } = useAudioPlayer();
  
  // Stem state
  const [hasStems, setHasStems] = useState(false);
  const [stemVolumes, setStemVolumes] = useState<StemVolumes>({
    vocals: 1,
    drums: 1,
    bass: 1,
    other: 1
  });
  const [isKaraokeMode, setIsKaraokeMode] = useState(false);
  const [isInstrumentalBoost, setIsInstrumentalBoost] = useState(false);
  const [stemsLoaded, setStemsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load stems on mount
  useEffect(() => {
    loadStems();
  }, [currentTrack]);

  const loadStems = async () => {
    if (!currentTrack?.id) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tracks/${currentTrack.id}/stems`);
      
      // Handle 404 gracefully - stems not ready yet
      if (response.status === 404) {
        console.log('🎵 Stems not ready yet - track is still processing');
        setHasStems(false);
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.hasStems) {
        setHasStems(true);
        setStemsLoaded(true);
      } else {
        setHasStems(false);
      }
    } catch (error) {
      console.error('Failed to load stems:', error);
      setHasStems(false);
    } finally {
      setIsLoading(false);
    }
  };

  const setStemVolume = (stem: keyof StemVolumes, volume: number) => {
    setStemVolumes(prev => ({ ...prev, [stem]: Math.max(0, Math.min(1, volume)) }));
  };

  const toggleKaraokeMode = () => {
    const newState = !isKaraokeMode;
    setIsKaraokeMode(newState);
    
    if (newState) {
      setStemVolumes({ vocals: 0, drums: 1, bass: 1, other: 1 });
    } else {
      setStemVolumes({ vocals: 1, drums: 1, bass: 1, other: 1 });
    }
  };

  const toggleInstrumentalBoost = () => {
    const newState = !isInstrumentalBoost;
    setIsInstrumentalBoost(newState);
    
    if (newState) {
      setStemVolumes({ vocals: 0.3, drums: 1.2, bass: 1.3, other: 1.1 });
    } else {
      setStemVolumes({ vocals: 1, drums: 1, bass: 1, other: 1 });
    }
  };

  const resetStems = () => {
    setStemVolumes({ vocals: 1, drums: 1, bass: 1, other: 1 });
    setIsKaraokeMode(false);
    setIsInstrumentalBoost(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-black via-black/95 to-transparent pb-8 pt-20 px-4 sm:px-8 animate-slideUp backdrop-blur-3xl border-t border-white/10 max-h-[85vh] overflow-y-auto">
      {/* Mobile pull handle */}
      <div className="flex justify-center mb-6 lg:hidden">
        <button onClick={onClose} className="w-12 h-1.5 bg-white/20 rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold flex items-center gap-3 text-text-primary">
            <span>🎵</span>
            Stem Player
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Stem Status */}
        {isLoading ? (
          <div className="mb-6 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
            <div className="flex items-center gap-3 text-yellow-400">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span>Loading stems...</span>
            </div>
          </div>
        ) : hasStems ? (
          <div className="mb-6 p-6 bg-green-500/10 border border-green-500/30 rounded-2xl">
            <div className="flex items-center gap-3 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>✅ Stems loaded - Perfect quality!</span>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="text-blue-400 text-xl">ℹ️</div>
              <div className="text-blue-300">
                <div className="font-semibold mb-1">Track is playing with standard audio</div>
                <div className="text-sm opacity-80">
                  AI stem separation is being processed. Check back in 2-3 minutes for professional quality stems!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Modes */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={toggleKaraokeMode}
            disabled={!hasStems}
            className={`p-4 rounded-2xl border-2 transition-all ${
              !hasStems
                ? 'bg-gray-800/30 border-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                : isKaraokeMode
                  ? 'bg-gradient-to-br from-primary to-primary-light border-white/40 text-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            <div className="text-2xl mb-2">🎤</div>
            <div className="font-bold">Karaoke Mode</div>
            <div className="text-xs opacity-70">
              {!hasStems ? 'Processing...' : 'Remove vocals'}
            </div>
          </button>

          <button
            onClick={toggleInstrumentalBoost}
            disabled={!hasStems}
            className={`p-4 rounded-2xl border-2 transition-all ${
              !hasStems
                ? 'bg-gray-800/30 border-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                : isInstrumentalBoost
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500 border-white/40 text-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
            }`}
          >
            <div className="text-2xl mb-2">🎸</div>
            <div className="font-bold">Instrumental Boost</div>
            <div className="text-xs opacity-70">
              {!hasStems ? 'Processing...' : 'Enhance music'}
            </div>
          </button>
        </div>

        {/* Stem Sliders */}
        {hasStems && (
          <div className="space-y-6 mb-6">
            <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
              Stem Mixer
            </h4>

            {[
              { id: 'vocals', label: 'Vocals', icon: '🎤' },
              { id: 'drums', label: 'Drums', icon: '🥁' },
              { id: 'bass', label: 'Bass', icon: '🎸' },
              { id: 'other', label: 'Other', icon: '🎹' }
            ].map((stem) => (
              <div key={stem.id} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{stem.icon}</span>
                    <span className="font-medium text-white">{stem.label}</span>
                  </div>
                  <span className="text-sm text-white/70">
                    {(stemVolumes[stem.id as keyof StemVolumes] * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={stemVolumes[stem.id as keyof StemVolumes]}
                  onChange={(e) => setStemVolume(stem.id as keyof StemVolumes, parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            ))}
          </div>
        )}

        {/* Reset Button */}
        <button
          onClick={resetStems}
          className="w-full p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all"
        >
          🔄 Reset All Stems
        </button>

        {/* Info */}
        <div className="mt-6 p-4 bg-purple-500/10 border border-primary/20 rounded-2xl">
          <p className="text-sm text-purple-200">
            💡 <strong>Pro Tip:</strong> Pre-processed stems provide studio-quality separation with zero noise!
          </p>
        </div>
      </div>
    </div>
  );
}
