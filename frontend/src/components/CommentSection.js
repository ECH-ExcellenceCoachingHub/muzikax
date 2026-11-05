'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { useAuth } from '../contexts/AuthContext';
export default function CommentSection({ trackId }) {
    const { currentTrack, comments, addComment, loadComments } = useAudioPlayer();
    const { isAuthenticated, user } = useAuth();
    const [newComment, setNewComment] = useState('');
    // If a trackId is provided as prop, we should load comments for that track
    // Otherwise, we use the currentTrack from context
    const activeTrackId = trackId || (currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.id);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            alert('Please log in to post a comment');
            return;
        }
        if (!newComment.trim()) {
            return;
        }
        if (!activeTrackId) {
            return;
        }
        try {
            // Add the comment through the audio player context
            await addComment({
                text: newComment.trim(),
                userId: (user === null || user === void 0 ? void 0 : user.id) || '',
                username: (user === null || user === void 0 ? void 0 : user.name) || 'Anonymous'
            });
            // Clear the input
            setNewComment('');
        }
        catch (error) {
            console.error('Error posting comment:', error);
            alert('Failed to post comment. Please try again.');
        }
    };
    // Format timestamp
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    // If we have a trackId prop that's different from currentTrack.id, 
    // we should show a message or handle it appropriately
    if (trackId && currentTrack && trackId !== currentTrack.id) {
        return (_jsx("div", { className: "text-gray-400 text-center py-4", children: "Comments for a different track" }));
    }
    if (!currentTrack && !trackId) {
        return (_jsx("div", { className: "text-gray-400 text-center py-4", children: "No track selected" }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [isAuthenticated ? (_jsxs("form", { onSubmit: handleSubmit, className: "flex gap-2", children: [_jsx("input", { type: "text", value: newComment, onChange: (e) => setNewComment(e.target.value), placeholder: "Add a comment...", className: "flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" }), _jsx("button", { type: "submit", disabled: !newComment.trim() || !activeTrackId, className: `px-4 py-2 rounded-lg font-medium transition-colors ${newComment.trim() && activeTrackId
                            ? 'bg-primary text-white hover:bg-primary/80'
                            : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`, children: "Post" })] })) : (_jsxs("div", { className: "text-gray-400 text-sm text-center py-2", children: [_jsx("button", { onClick: () => window.location.href = '/login', className: "text-primary hover:underline", children: "Log in" }), " to post a comment"] })), _jsx("div", { className: "space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800", children: comments.length === 0 ? (_jsx("div", { className: "text-gray-400 text-center py-4", children: "No comments yet. Be the first to comment!" })) : (comments.map((comment) => (_jsxs("div", { className: "border-b border-gray-700/50 pb-3 last:border-0 last:pb-0", children: [_jsxs("div", { className: "flex justify-between items-start mb-1", children: [_jsx("span", { className: "font-medium text-white text-sm", children: comment.username }), _jsx("span", { className: "text-gray-500 text-xs", children: formatTimestamp(comment.timestamp) })] }), _jsx("p", { className: "text-gray-300 text-sm", children: comment.text })] }, comment.id)))) })] }));
}
