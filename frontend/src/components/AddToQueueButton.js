'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { useState } from 'react';
const AddToQueueButton = ({ track, size = 'md', variant = 'primary', showText = false, className = '' }) => {
    const { addToQueue, queue } = useAudioPlayer();
    const [isLoading, setIsLoading] = useState(false);
    const [added, setAdded] = useState(false);
    // Check if track is already in queue
    const isInQueue = queue.some(qTrack => qTrack.id === track.id);
    const handleClick = async () => {
        if (isInQueue || isLoading)
            return;
        setIsLoading(true);
        try {
            addToQueue(track);
            setAdded(true);
            // Reset added state after animation
            setTimeout(() => {
                setAdded(false);
            }, 2000);
        }
        catch (error) {
            console.error('Error adding to queue:', error);
        }
        finally {
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
    return (_jsx("button", { onClick: handleClick, disabled: isInQueue || isLoading, className: `
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${animationClass}
        ${className}
        rounded-full flex items-center justify-center transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${!isInQueue && !isLoading ? 'hover:scale-105 active:scale-95' : ''}
      `, title: isInQueue ? 'Already in queue' : `Add ${track.title} to queue`, children: isLoading ? (_jsx("div", { className: "w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" })) : isInQueue ? (_jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) })) : (_jsxs(_Fragment, { children: [_jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" }) }), showText && (_jsx("span", { className: "ml-2 text-sm", children: "Add to Queue" }))] })) }));
};
export default AddToQueueButton;
