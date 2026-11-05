import React from 'react';
import Link from 'next/link';
import { FaHeart, FaComment } from 'react-icons/fa';

interface VibeCardProps {
  vibe: {
    id: string;
    userName: string;
    userAvatar?: string;
    content: string;
    mediaUrl?: string;
    mediaThumbnail?: string;
    likes: number;
    commentCount: number;
    postType: 'text' | 'image' | 'video' | 'audio';
  };
}

const VibeCard: React.FC<VibeCardProps> = ({ vibe }) => {
  const firstLetter = vibe.userName ? vibe.userName.charAt(0).toUpperCase() : '?';

  // Generate a gradient thumbnail for videos without mediaThumbnail
  const getVideoFallbackThumbnail = () => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    ];
    
    // Use a consistent gradient based on vibe ID
    const index = vibe.id.charCodeAt(vibe.id.length - 1) % gradients.length;
    return gradients[index];
  };

  return (
    <Link 
      href={`/community?postId=${vibe.id}`} 
      className="flex-shrink-0 w-64 sm:w-72 bg-surface/40 border-border-light/50 rounded-2xl overflow-hidden group snap-start mx-surface"
    >
      <div className="p-4 flex flex-col h-full">
        {/* User Info */}
        <div className="flex items-center space-x-3 mb-3">
          <div className="relative">
            {vibe.userAvatar ? (
              <img
                src={vibe.userAvatar}
                alt={vibe.userName}
                className="w-10 h-10 rounded-full object-cover border-2 border-primary/30 group-hover:border-primary transition-colors duration-500"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-hot flex items-center justify-center border-2 border-primary/30 group-hover:border-primary transition-colors duration-500">
                <span className="text-white font-bold text-sm">{firstLetter}</span>
              </div>
            )}
            {vibe.postType !== 'text' && (
              <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[10px] p-1 rounded-full border border-background-deep">
                {vibe.postType === 'image' ? '📸' : vibe.postType === 'video' ? '🎥' : '🎵'}
              </div>
            )}
          </div>
          <div className="overflow-hidden">
            <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors duration-300 text-text-primary">
              {vibe.userName}
            </h3>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Community Vibe</p>
          </div>
        </div>

        {/* Content Preview */}
        <div className="flex-1 mb-4">
          {vibe.mediaUrl && (vibe.postType === 'image' || vibe.postType === 'video') ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-3">
              {vibe.postType === 'image' ? (
                <img 
                  src={vibe.mediaUrl} 
                  alt="Vibe media" 
                  className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                />
              ) : (
                <div className="relative w-full h-full">
                  {vibe.mediaThumbnail ? (
                    <img 
                      src={vibe.mediaThumbnail} 
                      alt="Video thumbnail" 
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                  ) : vibe.mediaUrl ? (
                    // Show video with poster generated from first frame or fallback gradient
                    <div 
                      className="w-full h-full relative"
                      style={{ background: getVideoFallbackThumbnail() }}
                    >
                      {/* Overlay play icon to indicate it's a video */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <svg className="w-8 h-8 fill-current text-white" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-surface flex items-center justify-center">
                      <span className="text-4xl">🎥</span>
                    </div>
                  )}
                  {/* Play icon overlay for videos */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                    <div className="w-10 h-10 rounded-full btn-primary flex items-center justify-center text-white transform group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background-deep/60 to-transparent"></div>
            </div>
          ) : vibe.postType === 'audio' ? (
            <div className="bg-surface/30 rounded-xl p-3 mb-3 flex items-center space-x-3 border border-border-light/50">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                </svg>
              </div>
              <span className="text-xs text-text-secondary">Voice Note</span>
            </div>
          ) : null}
          <p className="text-text-secondary text-sm line-clamp-3 leading-relaxed italic">
            "{vibe.content}"
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-border-light/30 text-text-secondary text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 group/stat">
              <FaHeart className="group-hover/stat:text-primary transition-colors" />
              <span>{vibe.likes}</span>
            </div>
            <div className="flex items-center space-x-1.5 group/stat">
              <FaComment className="group-hover/stat:text-blue-400 transition-colors" />
              <span>{vibe.commentCount}</span>
            </div>
          </div>
          <span className="text-primary font-medium group-hover:translate-x-1 transition-transform duration-300">
            View All →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default VibeCard;
