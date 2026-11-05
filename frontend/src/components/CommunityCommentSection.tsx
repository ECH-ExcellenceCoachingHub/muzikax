'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCommunity } from '../contexts/CommunityContext';
import { FaHeart, FaRegHeart, FaTrash } from 'react-icons/fa';

interface Comment {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  text: string;
  likes: number;
  liked: boolean;
  createdAt: string;
  replies?: Comment[];
}

interface CommunityCommentSectionProps {
  postId: string;
  autoLoad?: boolean;
}

export default function CommunityCommentSection({ 
  postId, 
  autoLoad = true 
}: CommunityCommentSectionProps) {
  const { user } = useAuth();
  const { comments, fetchComments, addComment, deleteComment, likeComment, loading } = useCommunity();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});

  const postComments = comments[postId] || [];
  const isLoading = loading?.commentsFetching?.[postId] || false;

  useEffect(() => {
    if (autoLoad && postId) {
      fetchComments(postId);
    }
  }, [postId, autoLoad, fetchComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      alert('Please log in to post a comment');
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await addComment(postId, newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await deleteComment(postId, commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment.');
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      alert('Please log in to like comments');
      return;
    }

    try {
      await likeComment(postId, commentId);
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const isAuthenticated = !!user;

  return (
    <div className="mt-4 space-y-4 border-t border-gray-700 pt-4">
      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              newComment.trim() && !isSubmitting
                ? 'bg-primary text-white hover:bg-primary/80'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </form>
      ) : (
        <div className="text-gray-400 text-sm text-center py-2">
          <button 
            onClick={() => window.location.href = '/login'}
            className="text-primary hover:underline"
          >
            Log in
          </button>
          {' '}to post a comment
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {isLoading && postComments.length === 0 ? (
          <div className="flex justify-center py-6">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : postComments.length === 0 ? (
          <div className="text-gray-400 text-center py-6 text-sm">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          postComments.map((comment: Comment) => (
            <div 
              key={comment.id} 
              className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  {comment.userAvatar ? (
                    <img
                      src={comment.userAvatar}
                      alt={comment.username}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center border border-primary/30">
                      <span className="text-white font-bold text-[10px]">
                        {comment.username ? comment.username.charAt(0).toUpperCase() : '?'}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-white text-sm">{comment.username}</span>
                    <span className="text-gray-500 text-xs ml-2">{formatTimestamp(comment.createdAt)}</span>
                  </div>
                </div>
                {user?.id === comment.userId && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                    title="Delete comment"
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              <p className="text-gray-300 text-sm mb-2 break-words">{comment.text}</p>
              
              {/* Comment Actions */}
              <button
                onClick={() => handleLikeComment(comment.id)}
                className={`text-xs flex items-center gap-1 transition-colors ${
                  comment.liked
                    ? 'text-red-500'
                    : 'text-gray-400 hover:text-red-500'
                }`}
              >
                {comment.liked ? (
                  <FaHeart className="w-3 h-3" />
                ) : (
                  <FaRegHeart className="w-3 h-3" />
                )}
                <span>{comment.likes > 0 ? comment.likes : ''}</span>
              </button>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setShowReplies(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}
                    className="text-xs text-primary hover:underline"
                  >
                    {showReplies[comment.id] 
                      ? `Hide ${comment.replies.length} repl${comment.replies.length === 1 ? 'y' : 'ies'}`
                      : `Show ${comment.replies.length} repl${comment.replies.length === 1 ? 'y' : 'ies'}`
                    }
                  </button>
                  
                  {showReplies[comment.id] && (
                    <div className="mt-2 space-y-2 pl-4 border-l border-gray-600">
                      {comment.replies.map((reply: Comment) => (
                        <div key={reply.id} className="bg-gray-800/20 rounded p-2">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {reply.userAvatar ? (
                                <img
                                  src={reply.userAvatar}
                                  alt={reply.username}
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center border border-primary/30">
                                  <span className="text-white font-bold text-[8px]">
                                    {reply.username ? reply.username.charAt(0).toUpperCase() : '?'}
                                  </span>
                                </div>
                              )}
                              <span className="font-semibold text-white text-xs">{reply.username}</span>
                              <span className="text-gray-500 text-xs">{formatTimestamp(reply.createdAt)}</span>
                            </div>
                            {user?.id === reply.userId && (
                              <button
                                onClick={() => handleDeleteComment(reply.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete reply"
                              >
                                <FaTrash className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                          <p className="text-gray-300 text-xs break-words">{reply.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
