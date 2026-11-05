'use client';

import { useState } from 'react';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { useAuth } from '../contexts/AuthContext';

interface CommentSectionProps {
  trackId?: string;
}

export default function CommentSection({ trackId }: CommentSectionProps) {
  const { currentTrack, comments, addComment, loadComments } = useAudioPlayer();
  const { isAuthenticated, user } = useAuth();
  const [newComment, setNewComment] = useState('');

  // If a trackId is provided as prop, we should load comments for that track
  // Otherwise, we use the currentTrack from context
  const activeTrackId = trackId || currentTrack?.id;

  const handleSubmit = async (e: React.FormEvent) => {
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
        userId: user?.id || '',
        username: user?.name || 'Anonymous'
      });
      
      // Clear the input
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // If we have a trackId prop that's different from currentTrack.id, 
  // we should show a message or handle it appropriately
  if (trackId && currentTrack && trackId !== currentTrack.id) {
    return (
      <div className="text-gray-400 text-center py-4">
        Comments for a different track
      </div>
    );
  }

  if (!currentTrack && !trackId) {
    return (
      <div className="text-gray-400 text-center py-4">
        No track selected
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || !activeTrackId}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              newComment.trim() && activeTrackId
                ? 'bg-primary text-white hover:bg-primary/80'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Post
          </button>
        </form>
      ) : (
        <div className="text-gray-400 text-sm text-center py-2">
          <button 
            onClick={() => window.location.href = '/login'}
            className="text-primary hover:underline"
          >
            Log in
          </button> to post a comment
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {comments.length === 0 ? (
          <div className="text-gray-400 text-center py-4">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-700/50 pb-3 last:border-0 last:pb-0">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-white text-sm">{comment.username}</span>
                <span className="text-gray-500 text-xs">{formatTimestamp(comment.timestamp)}</span>
              </div>
              <p className="text-gray-300 text-sm">{comment.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}