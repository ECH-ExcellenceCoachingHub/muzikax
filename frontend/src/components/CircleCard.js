import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCommunity } from '../contexts/CommunityContext';
import { FaUsers, FaMusic, FaMicrophone, FaUserPlus, FaUserCheck } from 'react-icons/fa';

const CircleCard = ({ circle, onJoinLeaveClick }) => {
  const { user } = useAuth();
  const { joinCircle, leaveCircle } = useCommunity();
  const [joining, setJoining] = useState(false);
  const [isMember, setIsMember] = useState(circle.isMember);

  const handleJoinLeave = async () => {
    if (!user) {
      alert('Please log in to join circles');
      return;
    }

    setJoining(true);
    try {
      if (isMember) {
        await leaveCircle(circle.id);
        setIsMember(false);
      } else {
        await joinCircle(circle.id);
        setIsMember(true);
      }
      
      // Call parent callback if provided
      if (onJoinLeaveClick) {
        onJoinLeaveClick(circle.id, !isMember);
      }
    } catch (error) {
      console.error('Error joining/leaving circle:', error);
      alert(`Failed to ${isMember ? 'leave' : 'join'} circle. Please try again.`);
    } finally {
      setJoining(false);
    }
  };

  const getCircleIcon = (type) => {
    switch (type) {
      case 'artist':
        return <FaMicrophone className="text-purple-500" />;
      case 'fan':
      default:
        return <FaUsers className="text-blue-500" />;
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:border-primary/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-primary to-primary-hover w-12 h-12 rounded-full flex items-center justify-center">
            {getCircleIcon(circle.type)}
          </div>
          <div>
            <h3 className="font-bold text-white truncate max-w-[150px]">{circle.name}</h3>
            <p className="text-xs text-gray-400 capitalize">{circle.type} circle</p>
          </div>
        </div>
        {circle.verified && (
          <span className="text-blue-400 text-lg">✓</span>
        )}
      </div>

      <p className="text-gray-300 text-sm mb-3 line-clamp-2">{circle.description}</p>

      <div className="flex flex-wrap gap-1 mb-4">
        {circle.tags && circle.tags.length > 0 && circle.tags.slice(0, 3).map((tag, index) => (
          <span key={index} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
        <div className="flex items-center space-x-1">
          <FaUsers className="text-gray-500" size={12} />
          <span>{circle.memberCount} members</span>
        </div>
        {circle.genre && (
          <div className="flex items-center space-x-1">
            <FaMusic className="text-gray-500" size={12} />
            <span className="capitalize">{circle.genre}</span>
          </div>
        )}
      </div>

      <button
        onClick={handleJoinLeave}
        disabled={joining}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
          isMember
            ? 'bg-gray-700 text-white hover:bg-gray-600'
            : 'bg-gradient-to-r from-primary to-primary-hover text-white hover:from-primary-hover hover:to-primary-hover'
        }`}
      >
        {joining ? (
          <span>Processing...</span>
        ) : isMember ? (
          <>
            <FaUserCheck />
            <span>Joined</span>
          </>
        ) : (
          <>
            <FaUserPlus />
            <span>Join Circle</span>
          </>
        )}
      </button>
    </div>
  );
};

export default CircleCard;