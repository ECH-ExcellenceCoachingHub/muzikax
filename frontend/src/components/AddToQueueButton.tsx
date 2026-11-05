'use client'

import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { useState } from 'react';

interface AddToQueueButtonProps {
  track: {
    id: string;
    title: string;
    artist: string;
    coverImage: string;
    audioUrl: string;
    duration?: number;
    creatorId?: string;
    type?: 'song' | 'beat' | 'mix';
    creatorWhatsapp?: string;
    paymentType?: 'free' | 'paid';
    price?: number;
  };
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  showText?: boolean;
  className?: string;
}

const AddToQueueButton = ({ 
  track, 
  size = 'md', 
  variant = 'primary',
  showText = false,
  className = ''
}: AddToQueueButtonProps) => {
  const { addToQueue, queue } = useAudioPlayer();
  const [isLoading, setIsLoading] = useState(false);
  const [added, setAdded] = useState(false);

  // Check if track is already in queue
  const isInQueue = queue.some(qTrack => qTrack.id === track.id);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInQueue || isLoading) return;
    
    setIsLoading(true);
    try {
      addToQueue(track);
      setAdded(true);
      
      // Reset added state after animation
      setTimeout(() => {
        setAdded(false);
      }, 2000);
    } catch (error) {
      console.error('Error adding to queue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-primary hover:bg-[#E67E00] text-white',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-white',
    ghost: 'bg-transparent hover:bg-white/10 text-gray-400 hover:text-white'
  };

  // Animation classes
  const animationClass = added ? 'animate-pulse scale-110' : '';

  return (
    <button
      onClick={handleClick}
      disabled={isInQueue || isLoading}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${animationClass}
        ${className}
        rounded-full flex items-center justify-center transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${!isInQueue && !isLoading ? 'hover:scale-105 active:scale-95' : ''}
      `}
      title={isInQueue ? 'Already in queue' : `Add ${track.title} to queue`}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      ) : isInQueue ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
        </svg>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {showText && (
            <span className="ml-2 text-sm">Add to Queue</span>
          )}
        </>
      )}
    </button>
  );
};

export default AddToQueueButton;