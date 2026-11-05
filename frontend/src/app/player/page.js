'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import PlaylistSelectionModal from '../../components/PlaylistSelectionModal';
import ReportTrackModal from '../../components/ReportTrackModal';
import { fetchCreatorProfile, fetchTracksByCreatorPublic } from '../../services/trackService';
const FullPagePlayer = () => {
    var _a, _b;
    const { currentTrack, isPlaying, togglePlayPause, closePlayer, minimizeAndGoBack, progress, duration, setProgress, playNextTrack, playPreviousTrack, addToFavorites, removeFromFavorites, favorites, comments, addComment, audioRef, volume, setVolume, playbackRate, setPlaybackRate, shareTrack, downloadTrack, // Add downloadTrack from context
    shufflePlaylist, // Add shufflePlaylist from context
    toggleLoop, isLooping, queue, // Add queue from context
    addToQueue, // Add addToQueue from context
    removeFromQueue, // Add removeFromQueue from context
    clearQueue, // Add clearQueue from context
    playFromQueue, // Add playFromQueue from context
    moveQueueItem, // Add moveQueueItem from context
    addRecommendationsToQueue, // Add addRecommendationsToQueue from context
    frequencyData } = useAudioPlayer();
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const progressRef = useRef(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [toast, setToast] = useState(null);
    const [comment, setComment] = useState('');
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false); // Added state for modal
    const [isShareModalOpen, setIsShareModalOpen] = useState(false); // Added state for share modal
    const [isReportModalOpen, setIsReportModalOpen] = useState(false); // Added state for report modal
    // Added state for creator profile and tracks
    const [creator, setCreator] = useState(null);
    const [creatorTracks, setCreatorTracks] = useState([]);
    const [loadingCreator, setLoadingCreator] = useState(false);
    // Added state for comment replies
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const hasAutoPlayedRef = useRef(false);
    // Removed canvas refs as we're no longer using music visualization  
    // Process comments to create a threaded structure
    const processComments = () => {
        // Convert existing comments to CommentWithReplies format
        const commentsWithReplies = comments.map(comment => (Object.assign(Object.assign({}, comment), { replies: [] })));
        // Separate top-level comments and replies
        const topLevelComments = [];
        const replies = [];
        commentsWithReplies.forEach(comment => {
            // Check if this is a reply (by looking for @mentions)
            const isReply = comment.text.startsWith('@');
            if (isReply) {
                replies.push(comment);
            }
            else {
                topLevelComments.push(comment);
            }
        });
        // Attach replies to their parent comments
        replies.forEach(reply => {
            // Extract the username being replied to (everything between @ and space)
            const match = reply.text.match(/^@(\w+)/);
            if (match) {
                const repliedToUsername = match[1];
                // Find the parent comment by username
                const parentComment = topLevelComments.find(comment => comment.username === repliedToUsername);
                if (parentComment) {
                    // Add parentId to reply
                    reply.parentId = parentComment.id;
                    // Add reply to parent's replies array
                    parentComment.replies.push(reply);
                }
                else {
                    // If parent not found, treat as top-level comment
                    topLevelComments.push(reply);
                }
            }
            else {
                // If no match, treat as top-level comment
                topLevelComments.push(reply);
            }
        });
        return topLevelComments;
    };
    // Process comments whenever the comments array changes
    const [threadedComments, setThreadedComments] = useState([]);
    // Check if current track is in favorites
    useEffect(() => {
        if (currentTrack) {
            setIsFavorite(favorites.some(track => track.id === currentTrack.id));
        }
    }, [currentTrack, favorites]);
    // Process comments to create threaded structure
    useEffect(() => {
        setThreadedComments(processComments());
    }, [comments]);
    // Toast notification effect
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => {
                setToast(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);
    // Listen for shuffle events to show appropriate notifications
    useEffect(() => {
        const handleShuffleAttempted = (event) => {
            const { success, reason, playlistChanged, playlistLength } = event.detail;
            if (!success) {
                // Show message when shuffle couldn't be performed
                setToast({
                    message: reason || 'Unable to shuffle playlist',
                    type: 'error'
                });
            }
            else {
                // Show success message when shuffle was performed
                if (playlistChanged) {
                    setToast({
                        message: 'Playlist shuffled successfully!',
                        type: 'success'
                    });
                }
                else {
                    setToast({
                        message: 'Playlist order unchanged',
                        type: 'success'
                    });
                }
            }
        };
        // Add event listener
        window.addEventListener('shuffleAttempted', handleShuffleAttempted);
        // Clean up event listener
        return () => {
            window.removeEventListener('shuffleAttempted', handleShuffleAttempted);
        };
    }, []);
    // Listen for general toast notifications from other pages
    useEffect(() => {
        const handlePlayerToast = (event) => {
            const { message, type } = event.detail;
            setToast({ message, type });
        };
        // Add event listener
        window.addEventListener('playerToast', handlePlayerToast);
        // Clean up event listener
        return () => {
            window.removeEventListener('playerToast', handlePlayerToast);
        };
    }, []);
    // Fetch creator profile and tracks when currentTrack changes
    useEffect(() => {
        const fetchCreatorData = async () => {
            if (!currentTrack || !currentTrack.creatorId)
                return;
            setLoadingCreator(true);
            try {
                // Fetch creator profile
                const creatorData = await fetchCreatorProfile(currentTrack.creatorId);
                setCreator(creatorData);
                // Fetch creator's tracks
                const tracksData = await fetchTracksByCreatorPublic(currentTrack.creatorId);
                // Filter out the current track and limit to 3 tracks
                const filteredTracks = tracksData
                    .filter((track) => track._id !== currentTrack.id)
                    .slice(0, 3);
                setCreatorTracks(filteredTracks);
            }
            catch (error) {
                console.error('Error fetching creator data:', error);
            }
            finally {
                setLoadingCreator(false);
            }
        };
        fetchCreatorData();
    }, [currentTrack]);
    // Format time in MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };
    // Handle progress bar click
    const handleProgressClick = (e) => {
        if (!progressRef.current || !currentTrack || !duration)
            return;
        const rect = progressRef.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newProgress = percent * duration;
        // Update progress in context
        setProgress(newProgress);
        // Seek in audio element by accessing it through the context
        if (audioRef && audioRef.current) {
            audioRef.current.currentTime = newProgress;
        }
    };
    // Toggle favorite status
    const toggleFavorite = () => {
        if (!currentTrack)
            return;
        if (isFavorite) {
            // Remove from favorites
            removeFromFavorites(currentTrack.id);
            setToast({ message: 'Removed from favorites!', type: 'success' });
        }
        else {
            // Add to favorites
            addToFavorites(currentTrack);
            setToast({ message: 'Added to favorites!', type: 'success' });
        }
        setIsFavorite(!isFavorite);
    };
    // Handle adding comment
    const handleAddComment = () => {
        if (!comment.trim() || !currentTrack)
            return;
        if (!isAuthenticated) {
            setToast({ message: 'Please log in to comment', type: 'error' });
            return;
        }
        addComment({
            userId: (user === null || user === void 0 ? void 0 : user.id) || 'anonymous',
            username: (user === null || user === void 0 ? void 0 : user.name) || 'Anonymous',
            text: comment
        });
        setComment('');
        setToast({ message: 'Comment added!', type: 'success' });
    };
    // Handle adding reply
    const handleAddReply = (parentId, parentUsername) => {
        if (!replyText.trim() || !currentTrack)
            return;
        if (!isAuthenticated) {
            setToast({ message: 'Please log in to reply', type: 'error' });
            return;
        }
        // Add the reply as a new comment with a mention
        addComment({
            userId: (user === null || user === void 0 ? void 0 : user.id) || 'anonymous',
            username: (user === null || user === void 0 ? void 0 : user.name) || 'Anonymous',
            text: `@${parentUsername} ${replyText}`
        });
        setReplyText('');
        setReplyingTo(null);
        setToast({ message: 'Reply added!', type: 'success' });
    };
    // Handle adding to playlist
    const handleAddToPlaylist = () => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        setIsPlaylistModalOpen(true);
    };
    // Handle track added to playlist
    const handleTrackAdded = () => {
        setToast({ message: 'Added to playlist!', type: 'success' });
    };
    // Redirect to home page if there's no current track
    useEffect(() => {
        if (!currentTrack) {
            // Always redirect to home page when player is closed
            console.log('Redirecting to home page');
            router.push('/');
        }
    }, [currentTrack, router]);
    // Don't render if there's no current track
    if (!currentTrack) {
        return null;
    }
    // Function to generate avatar with first letter of name
    const generateAvatar = (name) => {
        const firstLetter = name.charAt(0).toUpperCase();
        return (_jsx("div", { className: "w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center", children: _jsx("span", { className: "text-lg font-bold text-white", children: firstLetter }) }));
    };
    // Recursive component to render comments and their replies
    const CommentItem = ({ comment, isReply = false }) => (_jsxs("div", { className: isReply ? "ml-6 mt-3 pl-4 border-l-2 border-gray-600" : "", children: [_jsxs("div", { className: "bg-gray-700/50 rounded-lg p-4", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-semibold", children: comment.username }), _jsx("p", { className: "text-gray-300 text-sm mt-1", children: comment.text })] }), _jsx("span", { className: "text-xs text-gray-400", children: new Date(comment.timestamp).toLocaleDateString() })] }), _jsx("div", { className: "mt-2", children: _jsx("button", { onClick: () => setReplyingTo(replyingTo === comment.id ? null : comment.id), className: "text-xs text-primary hover:text-[#E67E00]", children: replyingTo === comment.id ? 'Cancel' : 'Reply' }) }), replyingTo === comment.id && (_jsxs("div", { className: "mt-3 pl-4 border-l-2 border-gray-600", children: [_jsx("textarea", { value: replyText, onChange: (e) => setReplyText(e.target.value), placeholder: `Reply to ${comment.username}...`, className: "w-full bg-gray-700 text-white rounded-lg p-2 mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary", rows: 2 }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => handleAddReply(comment.id, comment.username), disabled: !replyText.trim() || !isAuthenticated, className: "bg-primary hover:bg-[#E67E00] text-white px-3 py-1 rounded text-sm disabled:opacity-50", children: "Post Reply" }), _jsx("button", { onClick: () => {
                                            setReplyingTo(null);
                                            setReplyText('');
                                        }, className: "bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm", children: "Cancel" })] })] }))] }), comment.replies && comment.replies.length > 0 && (_jsx("div", { className: "mt-3", children: comment.replies.map(reply => (_jsx(CommentItem, { comment: reply, isReply: true }, reply.id))) }))] }));
    // Handle volume change
    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
    };
    // Handle playback rate change
    const handlePlaybackRateChange = (e) => {
        const newRate = parseFloat(e.target.value);
        setPlaybackRate(newRate);
    };
    // Get playback rate label for display
    const getPlaybackRateLabel = () => {
        return `${playbackRate}x`;
    };
    // Removed music visualization effect as requested
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-indigo-900 text-white relative overflow-hidden pb-28 md:pb-0", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-primary/30 via-primary-light/20 to-primary-light/30 animate-pulse z-0" }), _jsx("div", { className: "absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-primary-light/20 z-0" }), _jsx("div", { className: "absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary-light/20 via-transparent to-primary/20 z-0" }), _jsxs("div", { className: "relative z-10", children: [toast && (_jsx("div", { className: `fixed top-20 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`, children: toast.message })), _jsx(PlaylistSelectionModal, { isOpen: isPlaylistModalOpen, onClose: () => setIsPlaylistModalOpen(false), onTrackAdded: handleTrackAdded }), isShareModalOpen && (_jsx("div", { className: "fixed inset-0 bg-black/70 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "text-xl font-bold", children: "Share Track" }), _jsx("button", { onClick: () => setIsShareModalOpen(false), className: "text-gray-400 hover:text-white", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsxs("div", { className: "flex items-center mb-6 p-4 bg-gray-700 rounded-lg", children: [_jsx("img", { src: currentTrack.coverImage, alt: currentTrack.title, className: "w-16 h-16 rounded-lg object-cover" }), _jsxs("div", { className: "ml-4", children: [_jsx("h4", { className: "font-bold truncate", children: currentTrack.title }), _jsx("p", { className: "text-gray-400 text-sm", children: currentTrack.artist })] })] }), _jsxs("div", { className: "grid grid-cols-4 gap-4", children: [_jsxs("button", { onClick: () => {
                                                shareTrack('facebook');
                                                setIsShareModalOpen(false);
                                            }, className: "flex flex-col items-center p-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors", children: [_jsx("svg", { className: "w-6 h-6", fill: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12z" }) }), _jsx("span", { className: "text-xs mt-2", children: "Facebook" })] }), _jsxs("button", { onClick: () => {
                                                shareTrack('twitter');
                                                setIsShareModalOpen(false);
                                            }, className: "flex flex-col items-center p-3 bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors", children: [_jsx("svg", { className: "w-6 h-6", fill: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" }) }), _jsx("span", { className: "text-xs mt-2", children: "Twitter" })] }), _jsxs("button", { onClick: () => {
                                                shareTrack('whatsapp');
                                                setIsShareModalOpen(false);
                                            }, className: "flex flex-col items-center p-3 bg-green-500 rounded-lg hover:bg-green-600 transition-colors", children: [_jsx("svg", { className: "w-6 h-6", fill: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" }) }), _jsx("span", { className: "text-xs mt-2", children: "WhatsApp" })] }), _jsxs("button", { onClick: () => {
                                                shareTrack('linkedin');
                                                setIsShareModalOpen(false);
                                            }, className: "flex flex-col items-center p-3 bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors", children: [_jsx("svg", { className: "w-6 h-6", fill: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" }) }), _jsx("span", { className: "text-xs mt-2", children: "LinkedIn" })] })] }), _jsxs("button", { onClick: () => {
                                        shareTrack('copy');
                                        setToast({ message: 'Link copied to clipboard!', type: 'success' });
                                        setIsShareModalOpen(false);
                                    }, className: "w-full mt-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors", children: [_jsx("svg", { className: "w-5 h-5 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" }) }), "Copy Link"] })] }) })), _jsxs("div", { className: "flex justify-between items-center p-4 sm:p-6 border-b border-white/10 gap-2 flex-wrap backdrop-blur-sm bg-black/20", children: [_jsx("button", { onClick: minimizeAndGoBack, className: "flex items-center text-gray-300 hover:text-white transition-all duration-300 p-3 rounded-xl hover:bg-white/10 min-w-[44px] min-h-[44px] touch-manipulation", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 19l-7-7 7-7" }) }) }), _jsx("h1", { className: "text-xl sm:text-2xl font-bold px-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light whitespace-nowrap", children: "Now Playing" }), _jsx("div", { className: "flex items-center gap-3", children: _jsx("button", { onClick: closePlayer, className: "w-12 h-12 sm:w-11 sm:h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/20 transition-all duration-300 min-w-[44px] min-h-[44px] touch-manipulation shadow-lg", title: "Close player", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }) }) }) })] }), _jsx("div", { className: "container mx-auto px-2 sm:px-4 py-2 sm:py-4 md:py-8", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8", children: [_jsx("div", { className: "lg:col-span-2", children: _jsxs("div", { className: "flex flex-col items-center", children: [_jsxs("div", { className: "relative mb-6 sm:mb-8 group", children: [_jsx("div", { className: "absolute -inset-2 sm:-inset-3 md:-inset-4 bg-gradient-to-r from-primary via-primary-light to-primary-light rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 animate-pulse" }), _jsx("img", { src: currentTrack.coverImage, alt: currentTrack.title, className: "relative w-40 h-40 sm:w-52 sm:h-52 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-3xl object-cover shadow-2xl border-2 sm:border-4 border-white/10" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-3xl" })] }), _jsxs("div", { className: "text-center mb-6 sm:mb-8 w-full px-4", children: [_jsx("h2", { className: "text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg", children: currentTrack.title }), _jsx(Link, { href: `/artists/${(typeof currentTrack.creatorId === 'object' && currentTrack.creatorId !== null)
                                                            ? currentTrack.creatorId._id
                                                            : currentTrack.creatorId}`, className: "text-lg sm:text-xl md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light hover:from-[#E67E00] hover:to-[#ffd64d] mt-2 inline-block font-semibold", children: currentTrack.artist }), (currentTrack.type === 'beat' || (currentTrack.title && currentTrack.title.toLowerCase().includes('beat'))) && (_jsxs("div", { className: "mt-3 flex flex-wrap justify-center gap-2", children: [_jsx("span", { className: "px-3 py-1 bg-purple-600 text-white text-sm font-bold rounded-full", children: "BEAT" }), currentTrack.paymentType === 'paid' ? (_jsx("span", { className: "px-3 py-1 bg-green-600 text-white text-sm font-bold rounded-full", children: "PAID BEAT" })) : (_jsx("span", { className: "px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-full", children: "FREE BEAT" }))] })), _jsxs("div", { className: "flex justify-center gap-6 sm:gap-8 mt-4 text-gray-200", children: [_jsxs("div", { className: "flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl", children: [_jsx("svg", { className: "w-5 h-5 mr-2 text-primary", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" }) }), _jsxs("span", { className: "font-medium", children: [currentTrack.plays || 0, " plays"] })] }), _jsxs("div", { className: "flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl", children: [_jsx("svg", { className: "w-5 h-5 mr-2 text-primary-light", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" }) }), _jsxs("span", { className: "font-medium", children: [currentTrack.likes || 0, " likes"] })] })] })] }), _jsxs("div", { className: "w-full max-w-2xl mb-6", children: [_jsx("div", { ref: progressRef, onClick: handleProgressClick, className: "w-full h-2 sm:h-1.5 bg-gray-700 rounded-full cursor-pointer group touch-pan-x", children: _jsx("div", { className: "h-full bg-primary rounded-full relative", style: { width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }, children: _jsx("div", { className: "absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 sm:w-3 sm:h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" }) }) }), _jsxs("div", { className: "flex justify-between text-sm text-gray-400 mt-2", children: [_jsx("span", { children: formatTime(progress) }), _jsx("span", { children: formatTime(duration) })] })] }), _jsxs("div", { className: "flex justify-center items-center w-full max-w-2xl mb-6", children: [_jsx("div", { className: "flex items-center mr-1 sm:mr-2", children: _jsxs("select", { value: playbackRate, onChange: handlePlaybackRateChange, className: "bg-gray-800 text-white text-xs rounded-full px-1.5 py-0.5 sm:px-2 sm:py-1 focus:outline-none focus:ring-1 focus:ring-primary touch-manipulation", children: [_jsx("option", { value: "0.5", children: "0.5x" }), _jsx("option", { value: "0.75", children: "0.75x" }), _jsx("option", { value: "1", children: "1x" }), _jsx("option", { value: "1.25", children: "1.25x" }), _jsx("option", { value: "1.5", children: "1.5x" }), _jsx("option", { value: "2", children: "2x" })] }) }), _jsxs("div", { className: "flex justify-center items-center gap-3 sm:gap-4 md:gap-6", children: [_jsx("button", { onClick: playPreviousTrack, className: "\r\n                        w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full\r\n                        bg-white/10 backdrop-blur-md\r\n                        flex items-center justify-center\r\n                        text-white\r\n                        shadow-md\r\n                        hover:bg-white/20\r\n                        hover:scale-110\r\n                        active:scale-95\r\n                        transition-all duration-300\r\n                        touch-manipulation\r\n                        min-w-[44px] min-h-[44px]\r\n                      ", children: _jsx("svg", { className: "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" }) }) }), _jsx("button", { onClick: togglePlayPause, className: "\r\n                        w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full\r\n                        bg-gradient-to-br from-primary to-primary-light\r\n                        flex items-center justify-center\r\n                        text-white\r\n                        shadow-[0_0_40px_rgba(255, 140, 0,0.6)]\r\n                        hover:shadow-[0_0_60px_rgba(255, 140, 0,0.9)]\r\n                        hover:scale-105\r\n                        active:scale-95\r\n                        transition-all duration-300\r\n                        touch-manipulation\r\n                        min-w-[64px] min-h-[64px]\r\n                      ", children: isPlaying ? (_jsx("svg", { className: "w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M6 5h4v14H6zm8 0h4v14h-4z" }) })) : (_jsx("svg", { className: "w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 ml-1", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M8 5v14l11-7z" }) })) }), _jsx("button", { onClick: () => playNextTrack(), className: "\r\n                        w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full\r\n                        bg-white/10 backdrop-blur-md\r\n                        flex items-center justify-center\r\n                        text-white\r\n                        shadow-md\r\n                        hover:bg-white/20\r\n                        hover:scale-110\r\n                        active:scale-95\r\n                        transition-all duration-300\r\n                        touch-manipulation\r\n                        min-w-[44px] min-h-[44px]\r\n                      ", children: _jsx("svg", { className: "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" }) }) })] }), _jsxs("div", { className: "flex items-center ml-1 sm:ml-2", children: [_jsx("svg", { className: "w-3 h-3 sm:w-4 sm:h-4 mr-1 text-gray-400 flex-shrink-0", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" }) }), _jsx("input", { type: "range", min: "0", max: "1", step: "0.01", value: volume, onChange: handleVolumeChange, className: "w-12 sm:w-16 accent-primary touch-pan-x" })] })] }), _jsxs("div", { className: "flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 max-w-full px-2", children: [_jsxs("button", { onClick: () => {
                                                            if (!isAuthenticated) {
                                                                router.push('/login');
                                                                return;
                                                            }
                                                            toggleFavorite();
                                                            // Show visual feedback
                                                            const isNowFavorite = !isFavorite;
                                                            const message = isNowFavorite ? 'Added to favorites!' : 'Removed from favorites!';
                                                            setToast({ message, type: 'success' });
                                                        }, className: `
                      group flex flex-col items-center gap-1
                      text-xs sm:text-sm
                      ${isFavorite ? 'text-primary' : 'text-gray-400'}
                      hover:text-white
                      transition-all
                      min-w-[60px]
                    `, children: [_jsx("div", { className: "\r\n                        w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full\r\n                        bg-white/10 backdrop-blur-md\r\n                        flex items-center justify-center\r\n                        group-hover:bg-white/20\r\n                        transition-all\r\n                      ", children: _jsx("svg", { className: "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6", fill: isFavorite ? "currentColor" : "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }) }) }), _jsx("span", { className: "truncate", children: "Like" })] }), _jsxs("button", { onClick: handleAddToPlaylist, className: `
                      group flex flex-col items-center gap-1
                      text-xs sm:text-sm
                      text-gray-400
                      hover:text-white
                      transition-all
                      min-w-[60px]
                    `, children: [_jsx("div", { className: "\r\n                        w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full\r\n                        bg-white/10 backdrop-blur-md\r\n                        flex items-center justify-center\r\n                        group-hover:bg-white/20\r\n                        transition-all\r\n                        touch-manipulation\r\n                      ", children: _jsx("svg", { className: "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z", clipRule: "evenodd" }) }) }), _jsx("span", { className: "truncate", children: "Playlist" })] }), _jsxs("button", { onClick: () => setIsShareModalOpen(true), className: `
                      group flex flex-col items-center gap-1
                      text-xs sm:text-sm
                      text-gray-400
                      hover:text-white
                      transition-all
                      min-w-[60px]
                    `, children: [_jsx("div", { className: "\r\n                        w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full\r\n                        bg-white/10 backdrop-blur-md\r\n                        flex items-center justify-center\r\n                        group-hover:bg-white/20\r\n                        transition-all\r\n                      ", children: _jsx("svg", { className: "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" }) }) }), _jsx("span", { className: "truncate", children: "Share" })] }), _jsxs("button", { onClick: shufflePlaylist, className: `
                      group flex flex-col items-center gap-1
                      text-xs sm:text-sm
                      text-gray-400
                      hover:text-white
                      transition-all
                      min-w-[60px]
                    `, title: "Shuffle playlist", children: [_jsx("div", { className: "\r\n                        w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full\r\n                        bg-white/10 backdrop-blur-md\r\n                        flex items-center justify-center\r\n                        group-hover:bg-white/20\r\n                        transition-all\r\n                      ", children: _jsx("svg", { className: "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" }) }) }), _jsx("span", { className: "truncate", children: "Shuffle" })] }), _jsxs("button", { onClick: toggleLoop, className: `
                      group flex flex-col items-center gap-1
                      text-xs sm:text-sm
                      ${isLooping ? 'text-primary' : 'text-gray-400'}
                      hover:text-white
                      transition-all
                      min-w-[60px]
                    `, title: "Loop track/playlist", children: [_jsx("div", { className: "\r\n                        w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full\r\n                        bg-white/10 backdrop-blur-md\r\n                        flex items-center justify-center\r\n                        group-hover:bg-white/20\r\n                        transition-all\r\n                      ", children: _jsx("svg", { className: "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }) }), _jsx("span", { className: "truncate", children: "Loop" })] }), (currentTrack.type === 'beat' || (currentTrack.title && currentTrack.title.toLowerCase().includes('beat'))) ? (
                                                    // For beats, show either WhatsApp button (for paid) or download button (for free)
                                                    currentTrack.paymentType === 'paid' ? (
                                                    // WhatsApp button for paid beats
                                                    _jsxs("button", { onClick: async () => {
                                                            // For paid beats, we need to ensure we have the creator's WhatsApp number
                                                            let creatorWhatsapp = currentTrack.creatorWhatsapp;
                                                            // If we don't have the WhatsApp number, fetch it directly
                                                            if (!creatorWhatsapp && currentTrack.creatorId) {
                                                                const { fetchCreatorWhatsapp } = await import('@/services/trackService');
                                                                const whatsappResult = await fetchCreatorWhatsapp(currentTrack.creatorId);
                                                                if (whatsappResult) {
                                                                    creatorWhatsapp = whatsappResult;
                                                                }
                                                            }
                                                            if (creatorWhatsapp) {
                                                                // Show confirmation dialog with option to open WhatsApp
                                                                const message = `This is a paid beat that requires contacting the creator via WhatsApp to obtain.

Creator's WhatsApp: ${creatorWhatsapp}

Would you like to open WhatsApp to contact the creator?`;
                                                                if (confirm(message)) {
                                                                    const whatsappMessage = `Hi, I'm interested in your beat "${currentTrack.title}" that I found on MuzikaX.`;
                                                                    window.open(`https://wa.me/${creatorWhatsapp}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
                                                                }
                                                            }
                                                            else {
                                                                // No WhatsApp contact available
                                                                alert('This is a paid beat that requires contacting the creator via WhatsApp to obtain. Unfortunately, the creator has not provided their WhatsApp contact information.');
                                                            }
                                                        }, className: `
                          group flex flex-col items-center gap-1
                          text-sm
                          text-green-400
                          hover:text-white
                          transition-all
                        `, children: [_jsx("div", { className: "\r\n                            w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full\r\n                            bg-green-500/20 border border-green-500/30 hover:bg-green-500/30\r\n                            flex items-center justify-center\r\n                            transition-all\r\n                          ", children: _jsx("svg", { className: "w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7", fill: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" }) }) }), _jsx("span", { className: "font-medium", children: "WhatsApp" }), _jsx("span", { className: "text-xs opacity-75", children: "Paid Beat" })] })) : (
                                                    // Direct download button for free beats
                                                    _jsxs("button", { onClick: downloadTrack, className: `
                          group flex flex-col items-center gap-1
                          text-sm
                          text-blue-400
                          hover:text-white
                          transition-all
                        `, children: [_jsx("div", { className: "\r\n                            w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full\r\n                            bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30\r\n                            flex items-center justify-center\r\n                            transition-all\r\n                          ", children: _jsx("svg", { className: "w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" }) }) }), _jsx("span", { className: "font-medium", children: "Download" }), _jsx("span", { className: "text-xs opacity-75", children: "Free Beat" })] }))) : (
                                                    // Regular download button for non-beats
                                                    _jsxs("button", { onClick: downloadTrack, className: `
                        group flex flex-col items-center gap-1
                        text-sm
                        text-gray-400
                        hover:text-white
                        transition-all
                      `, children: [_jsx("div", { className: "\r\n                          w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full\r\n                          bg-white/10 backdrop-blur-md\r\n                          flex items-center justify-center\r\n                          group-hover:bg-white/20\r\n                          transition-all\r\n                        ", children: _jsx("svg", { className: "w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" }) }) }), _jsx("span", { className: "font-medium", children: "Download" })] })), _jsxs("button", { onClick: () => setIsReportModalOpen(true), className: `
                      group flex flex-col items-center gap-1
                      text-xs sm:text-sm
                      text-gray-400
                      hover:text-white
                      transition-all
                      min-w-[60px]
                    `, title: "Report this track", children: [_jsx("div", { className: "\r\n                        w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full\r\n                        bg-white/10 backdrop-blur-md\r\n                        flex items-center justify-center\r\n                        group-hover:bg-white/20\r\n                        transition-all\r\n                        touch-manipulation\r\n                      ", children: _jsx("svg", { className: "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }) }), _jsx("span", { className: "truncate", children: "Report" })] })] }), _jsxs("div", { className: "flex flex-wrap justify-center gap-2 sm:gap-3 mt-4", children: [((_b = (_a = window.audioPlayerContext) === null || _a === void 0 ? void 0 : _a.current) === null || _b === void 0 ? void 0 : _b.type) === 'album' && (_jsxs("div", { className: "px-3 py-2 bg-primary/20 rounded-lg text-sm flex items-center", children: [_jsx("svg", { className: "w-4 h-4 mr-1 text-primary", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" }) }), _jsx("span", { children: "Album Mode" })] })), _jsx("button", { onClick: () => router.push('/favorites'), className: "px-3 py-2 sm:px-4 sm:py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors touch-manipulation", children: "View Favorites" }), _jsx("button", { onClick: () => router.push('/playlists'), className: "px-3 py-2 sm:px-4 sm:py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors touch-manipulation", children: "View Playlists" })] }), _jsxs("div", { className: "mt-6 bg-gray-800/50 rounded-xl p-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-3", children: [_jsx("h3", { className: "font-bold text-lg", children: "Up Next" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: async () => {
                                                                            // Add recommendations to queue
                                                                            const addedCount = await addRecommendationsToQueue(10);
                                                                            if (addedCount > 0) {
                                                                                setToast({ message: `Added ${addedCount} recommendations to queue!`, type: 'success' });
                                                                            }
                                                                            else {
                                                                                setToast({ message: 'No recommendations available', type: 'error' });
                                                                            }
                                                                        }, className: "text-sm text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded", children: "Add Recs" }), _jsx("button", { onClick: () => {
                                                                            // Clear the queue
                                                                            clearQueue();
                                                                            setToast({ message: 'Queue cleared!', type: 'success' });
                                                                        }, className: "text-sm text-gray-400 hover:text-white", children: "Clear" })] })] }), queue && queue.length > 0 ? (_jsx("div", { className: "space-y-2 max-h-60 overflow-y-auto pr-2", children: queue.map((queuedTrack, index) => (_jsxs("div", { draggable: "true", onDragStart: (e) => {
                                                                e.dataTransfer.setData('index', index.toString());
                                                            }, onDragOver: (e) => {
                                                                e.preventDefault();
                                                            }, onDrop: (e) => {
                                                                e.preventDefault();
                                                                const draggedIndex = parseInt(e.dataTransfer.getData('index'));
                                                                if (draggedIndex !== index) {
                                                                    moveQueueItem(draggedIndex, index);
                                                                }
                                                            }, className: "flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors group bg-gray-700/30", onClick: () => {
                                                                // Play this track from the queue
                                                                playFromQueue(queuedTrack.id);
                                                                setToast({ message: `Playing ${queuedTrack.title}`, type: 'success' });
                                                            }, children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { className: "text-gray-500 text-sm w-5", children: index + 1 }), _jsx("svg", { className: "w-4 h-4 text-gray-400 cursor-move", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" }) })] }), _jsx("img", { src: queuedTrack.coverImage, alt: queuedTrack.title, className: "w-10 h-10 rounded object-cover" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium truncate", children: queuedTrack.title }), _jsx("p", { className: "text-xs text-gray-400 truncate", children: queuedTrack.artist })] }), _jsx("button", { onClick: (e) => {
                                                                        e.stopPropagation();
                                                                        removeFromQueue(queuedTrack.id);
                                                                        setToast({ message: 'Removed from queue', type: 'success' });
                                                                    }, className: "text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }) }) })] }, `${queuedTrack.id}-${index}`))) })) : (_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-center py-4 text-sm", children: "Queue is empty" }), _jsx("button", { onClick: async () => {
                                                                    // Add recommendations to queue
                                                                    const addedCount = await addRecommendationsToQueue(10);
                                                                    if (addedCount > 0) {
                                                                        setToast({ message: `Added ${addedCount} recommendations to queue!`, type: 'success' });
                                                                    }
                                                                    else {
                                                                        setToast({ message: 'No recommendations available', type: 'error' });
                                                                    }
                                                                }, className: "w-full mt-2 py-2 bg-primary hover:bg-[#E67E00] rounded-lg text-white font-medium transition-colors", children: "Add Recommendations" })] }))] })] }) }), _jsx(ReportTrackModal, { isOpen: isReportModalOpen, onClose: () => setIsReportModalOpen(false), trackId: currentTrack.id }), _jsxs("div", { className: "lg:col-span-1 space-y-3 sm:space-y-4 md:space-y-6", children: [_jsxs("div", { className: "bg-gray-800/50 rounded-xl p-3 sm:p-4 md:p-6", children: [_jsx("h3", { className: "text-xl font-bold mb-4", children: "Uploaded By" }), loadingCreator ? (_jsx("div", { className: "flex items-center justify-center py-4", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) })) : creator ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [creator.avatar ? (_jsx("img", { src: creator.avatar, alt: creator.name, className: "w-12 h-12 sm:w-12 sm:h-12 rounded-full object-cover" })) : (generateAvatar(creator.name)), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-lg sm:text-lg", children: creator.name }), _jsxs("p", { className: "text-gray-400 text-sm", children: [creator.followersCount || 0, " followers"] })] })] }), creatorTracks.length > 0 && (_jsxs("div", { className: "mt-4", children: [_jsxs("h5", { className: "font-medium mb-2", children: ["More from ", creator.name] }), _jsx("div", { className: "space-y-2", children: creatorTracks.map((track) => (_jsxs("div", { className: "flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors touch-manipulation", onClick: () => {
                                                                            // Play the track
                                                                            const trackData = {
                                                                                id: track._id,
                                                                                title: track.title,
                                                                                artist: track.artist || creator.name,
                                                                                coverImage: track.coverArt || track.coverURL || currentTrack.coverImage,
                                                                                audioUrl: track.audioUrl || track.audioURL,
                                                                                duration: track.duration,
                                                                                creatorId: (typeof currentTrack.creatorId === 'object' && currentTrack.creatorId !== null)
                                                                                    ? currentTrack.creatorId._id
                                                                                    : currentTrack.creatorId
                                                                            };
                                                                            // Assuming there's a playTrack function available in context
                                                                            // For now, we'll just navigate to the artist page
                                                                            const artistId = (typeof currentTrack.creatorId === 'object' && currentTrack.creatorId !== null)
                                                                                ? currentTrack.creatorId._id
                                                                                : currentTrack.creatorId;
                                                                            router.push(`/artists/${artistId}`);
                                                                        }, children: [_jsx("img", { src: track.coverArt || track.coverURL || currentTrack.coverImage, alt: track.title, className: "w-10 h-10 sm:w-10 sm:h-10 rounded object-cover" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium truncate", children: track.title }), _jsx("p", { className: "text-xs text-gray-400 truncate", children: track.artist || creator.name })] })] }, track._id))) })] })), _jsx("button", { onClick: () => router.push(`/artists/${creator._id}`), className: "w-full mt-4 py-2 bg-primary hover:bg-[#E67E00] rounded-lg text-white font-medium transition-colors", children: "View Full Profile" })] })) : (_jsx("p", { className: "text-gray-400 text-center py-4", children: "Creator information not available" }))] }), _jsxs("div", { className: "bg-gray-800/50 rounded-xl p-3 sm:p-4 md:p-6", children: [_jsx("h3", { className: "text-xl font-bold mb-4", children: "Comments" }), _jsxs("div", { className: "mb-6", children: [_jsx("textarea", { value: comment, onChange: (e) => setComment(e.target.value), placeholder: "Add a comment...", className: "w-full bg-gray-700 text-white rounded-lg p-3 mb-2 focus:outline-none focus:ring-2 focus:ring-primary touch-pan-y", rows: 3 }), _jsx("button", { onClick: handleAddComment, disabled: !comment.trim() || !isAuthenticated, className: "bg-primary hover:bg-[#E67E00] text-white px-4 py-3 rounded-lg disabled:opacity-50 touch-manipulation w-full sm:w-auto", children: "Post Comment" })] }), _jsx("div", { className: "space-y-4 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-2 touch-pan-y", children: threadedComments.length > 0 ? (threadedComments.map(comment => (_jsx(CommentItem, { comment: comment }, comment.id)))) : (_jsx("p", { className: "text-gray-400 text-center py-4", children: "No comments yet. Be the first to comment!" })) })] })] })] }) })] })] }));
};
export default FullPagePlayer;
