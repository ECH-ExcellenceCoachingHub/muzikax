import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCommunity } from '../contexts/CommunityContext';
import { FaTimes, FaImage, FaVideo, FaMicrophone, FaMusic, FaGlobe, FaLock } from 'react-icons/fa';

const CreatePostModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { createPost } = useCommunity();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [language, setLanguage] = useState('en');
  const [location, setLocation] = useState('');
  const [genre, setGenre] = useState('');
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [privacy, setPrivacy] = useState('public'); // public or private

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      alert('Please enter some content for your post');
      return;
    }

    setIsLoading(true);
    
    try {
      const postData = {
        content: content.trim(),
        postType,
        ...(mediaUrl && { mediaUrl }),
        language,
        ...(location && { location }),
        ...(genre && { genre }),
        ...(tags && { tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag) }),
        isPublic: privacy === 'public'
      };

      const response = await createPost(postData);
      alert('Post created successfully!');
      
      // Reset form
      setContent('');
      setMediaUrl('');
      setLocation('');
      setGenre('');
      setTags('');
      
      if (onSuccess) {
        onSuccess(response.post);
      }
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const postTypes = [
    { value: 'text', label: 'Text', icon: <FaMusic /> },
    { value: 'image', label: 'Image', icon: <FaImage /> },
    { value: 'video', label: 'Video', icon: <FaVideo /> },
    { value: 'audio', label: 'Audio', icon: <FaMicrophone /> }
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'rw', name: 'Kinyarwanda' },
    { code: 'sw', name: 'Swahili' },
    { code: 'fr', name: 'French' },
    { code: 'am', name: 'Amharic' },
    { code: 'ha', name: 'Hausa' },
    { code: 'ig', name: 'Igbo' },
    { code: 'yo', name: 'Yoruba' }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Create Post</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700"
            >
              <FaTimes size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Post Content */}
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Content *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share something with the community..."
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows={4}
                required
              />
            </div>

            {/* Post Type */}
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Post Type</label>
              <div className="grid grid-cols-4 gap-2">
                {postTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setPostType(type.value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${
                      postType === type.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <span className="text-lg mb-1">{type.icon}</span>
                    <span className="text-sm">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Media URL */}
            {(postType === 'image' || postType === 'video' || postType === 'audio') && (
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">
                  {postType === 'image' ? 'Image URL' : postType === 'video' ? 'Video URL' : 'Audio URL'}
                </label>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder={`Enter ${postType} URL...`}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}

            {/* Language */}
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where are you posting from?"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Genre */}
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Genre</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="What genre is your post related to?"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Add tags separated by commas (e.g., music, africa, rwanda)"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Privacy */}
            <div className="mb-6">
              <label className="block text-gray-300 mb-2">Privacy</label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setPrivacy('public')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                    privacy === 'public'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-600 bg-gray-700/50 text-gray-300'
                  }`}
                >
                  <FaGlobe />
                  <span>Public</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrivacy('private')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                    privacy === 'private'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-600 bg-gray-700/50 text-gray-300'
                  }`}
                >
                  <FaLock />
                  <span>Private</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-gradient-to-r from-primary to-primary-hover text-white rounded-lg hover:from-primary-hover hover:to-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;