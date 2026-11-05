import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaCalendar, FaTrophy, FaUser, FaClock, FaMusic, FaRunning } from 'react-icons/fa';

const ChallengeCard = ({ challenge, onParticipateClick }) => {
  const { user } = useAuth();
  const [participating, setParticipating] = useState(false);

  const handleParticipate = () => {
    if (!user) {
      alert('Please log in to participate in challenges');
      return;
    }
    
    if (onParticipateClick) {
      onParticipateClick(challenge);
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-500' : 'bg-red-500';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getChallengeIcon = (type) => {
    switch (type) {
      case 'music':
        return <FaMusic className="text-yellow-500" />;
      case 'dance':
        return <FaRunning className="text-purple-500" />;
      case 'cover':
        return <FaUser className="text-blue-500" />;
      case 'remix':
        return <FaMusic className="text-green-500" />;
      default:
        return <FaTrophy className="text-orange-500" />;
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:border-primary/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-primary-light to-primary-hover w-12 h-12 rounded-full flex items-center justify-center">
            {getChallengeIcon(challenge.type)}
          </div>
          <div>
            <h3 className="font-bold text-white truncate max-w-[180px]">{challenge.title}</h3>
            <p className="text-xs text-gray-400 capitalize">{challenge.type} challenge</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(challenge.isActive)}`}>
          {challenge.isActive ? 'Active' : 'Ended'}
        </span>
      </div>

      <p className="text-gray-300 text-sm mb-4">{challenge.description}</p>

      <div className="grid grid-cols-2 gap-3 mb-4 text-xs text-gray-400">
        <div className="flex items-center space-x-2">
          <FaCalendar className="text-gray-500" size={12} />
          <span>Start: {formatDate(challenge.startDate)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <FaClock className="text-gray-500" size={12} />
          <span>End: {formatDate(challenge.endDate)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <FaUser className="text-gray-500" size={12} />
          <span>{challenge.participants ? challenge.participants.length : 0} participants</span>
        </div>
        {challenge.prize && (
          <div className="flex items-center space-x-2">
            <FaTrophy className="text-gray-500" size={12} />
            <span className="truncate">{challenge.prize}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {challenge.tags && challenge.tags.length > 0 && challenge.tags.slice(0, 3).map((tag, index) => (
          <span key={index} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
            #{tag}
          </span>
        ))}
      </div>

      <button
        onClick={handleParticipate}
        disabled={participating || !challenge.isActive}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          challenge.hasParticipated
            ? 'bg-gray-700 text-white cursor-default'
            : challenge.isActive
            ? 'bg-gradient-to-r from-primary to-primary-hover text-white hover:from-primary-hover hover:to-primary-hover'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        {participating ? (
          'Processing...'
        ) : challenge.hasParticipated ? (
          'Participated'
        ) : challenge.isActive ? (
          'Participate Now'
        ) : (
          'Challenge Ended'
        )}
      </button>
    </div>
  );
};

export default ChallengeCard;