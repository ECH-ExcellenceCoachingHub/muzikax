import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCommunity } from '../contexts/CommunityContext';
import { FaHeart, FaRegHeart, FaComment, FaShare, FaEllipsisH, FaMusic, FaImage, FaVideo, FaMicrophone } from 'react-icons/fa';

const CommunityPostCard = ({ post, showFullContent = false }) => {
  const { user } = useAuth();
  const { likePost } = useCommunity();
  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const toggleLike = async () => {
    if (!user) {
      alert('Please log in to like posts');
      return;
    }
    try {
      await likePost(post.id);
    } catch (error) {
      console.error('Error liking post:', error);
      alert('Failed to like post. Please try again.');
    }
  };

  const handleShare = () => {
    if (!user) {
      alert('Please log in to share posts');
      return;
    }
    navigator.clipboard.writeText(window.location.origin + `/community/post/${post.id}`);
    alert('Post link copied to clipboard!');
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const renderPostTypeIcon = (type) => {
    switch (type) {
      case 'audio':
        return <FaMicrophone className="text-green-500" />;
      case 'image':
        return <FaImage className="text-blue-500" />;
      case 'video':
        return <FaVideo className="text-red-500" />;
      default:
        return <FaMusic className="text-purple-500" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const shouldTruncate = post.content.length > 200 && !showFullContent;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 mb-4 border border-gray-700 hover:border-primary/30 transition-all duration-300">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {post.userAvatar ? (
            <img
              src={post.userAvatar}
              alt={post.userName}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center border-2 border-primary">
              <span className="text-white font-bold text-sm">
                {post.userName ? post.userName.charAt(0).toUpperCase() : '?'}
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-white">{post.userName}</h3>
              {post.userRole === 'Creator' && (
                <span className="bg-gradient-to-r from-primary to-primary-hover text-white text-xs px-2 py-1 rounded-full">
                  Creator
                </span>
              )}
              {post.isVerified && (
                <span className="text-blue-400 text-lg">✓</span>
              )}
            </div>
            <p className="text-xs text-gray-400 flex items-center space-x-1">
              <span>{formatDate(post.createdAt)}</span>
              {post.circleName && (
                <>
                  <span>•</span>
                  <span className="text-primary">{post.circleName}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowActions(!showActions)}
          className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
        >
          <FaEllipsisH />
        </button>
      </div>

      {/* Post Content */}
      <div className="mb-3">
        <div className="flex items-start space-x-2 mb-2">
          {renderPostTypeIcon(post.postType)}
          <p className="text-sm text-gray-300 capitalize">{post.postType}</p>
        </div>
        
        <div className="text-gray-200 mb-2">
          {shouldTruncate ? (
            <>
              <p>{expanded ? post.content : post.content.substring(0, 200)}...</p>
              <button
                onClick={toggleExpand}
                className="text-primary text-sm mt-1 hover:underline"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            </>
          ) : (
            <p>{post.content}</p>
          )}
        </div>

        {/* Media Preview */}
        {post.mediaUrl && (
          <div className="mt-3">
            {post.postType === 'image' ? (
              <img
                src={post.mediaUrl}
                alt="Post media"
                className="rounded-lg max-w-full h-auto max-h-64 object-contain"
              />
            ) : post.postType === 'audio' ? (
              <div className="bg-gray-700/50 rounded-lg p-4 flex items-center space-x-3">
                <FaMicrophone className="text-green-500 text-2xl" />
                <div>
                  <p className="text-white font-medium">Audio Clip</p>
                  <p className="text-gray-400 text-sm">Click to play</p>
                </div>
              </div>
            ) : post.postType === 'video' ? (
              <div className="bg-gray-700/50 rounded-lg p-4 flex items-center space-x-3">
                <FaVideo className="text-red-500 text-2xl" />
                <div>
                  <p className="text-white font-medium">Video Clip</p>
                  <p className="text-gray-400 text-sm">Click to play</p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.tags.map((tag, index) => (
              <span key={index} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Post Stats */}
      <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
        <div className="flex space-x-4">
          <span>{post.likes} likes</span>
          <span>{post.comments} comments</span>
          <span>{post.shares} shares</span>
        </div>
        <span>{post.views} views</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-700">
        <button
          onClick={toggleLike}
          className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-colors ${
            post.liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
          }`}
        >
          {post.liked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
          <span className="text-sm">{post.liked ? 'Liked' : 'Like'}</span>
        </button>
        
        <button className="flex items-center space-x-2 px-3 py-2 rounded-full text-gray-400 hover:text-white transition-colors">
          <FaComment />
          <span className="text-sm">Comment</span>
        </button>
        
        <button
          onClick={handleShare}
          className="flex items-center space-x-2 px-3 py-2 rounded-full text-gray-400 hover:text-white transition-colors"
        >
          <FaShare />
          <span className="text-sm">Share</span>
        </button>
      </div>

      {/* Actions Menu */}
      {showActions && (
        <div className="absolute right-4 top-12 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 w-48">
          <button className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
            Copy Link
          </button>
          <button className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
            Share to...
          </button>
          <button className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
            Save Post
          </button>
          <hr className="border-gray-700" />
          <button className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300">
            Report Post
          </button>
        </div>
      )}
    </div>
  );
};

export default CommunityPostCard;