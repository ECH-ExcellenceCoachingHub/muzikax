import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaMicrophone, FaHeadphones, FaCalendar, FaMusic, FaPlay, FaPause } from 'react-icons/fa';

const LiveRoomCard = ({ liveRoom, onJoinClick }) => {
  const { user } = useAuth();
  const [joining, setJoining] = useState(false);

  const handleJoin = () => {
    if (!user) {
      alert('Please log in to join live rooms');
      return;
    }
    
    if (onJoinClick) {
      onJoinClick(liveRoom);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:border-primary/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-[#00CED1] to-[#20B2AA] w-12 h-12 rounded-full flex items-center justify-center">
            {liveRoom.isLive ? <FaMicrophone className="text-white" /> : <FaHeadphones className="text-white" />}
          </div>
          <div>
            <h3 className="font-bold text-white truncate max-w-[180px]">{liveRoom.title}</h3>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-gray-400">Hosted by {liveRoom.hostName}</p>
              {liveRoom.isVerified && (
                <span className="text-blue-400 text-lg">✓</span>
              )}
            </div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs text-white ${liveRoom.isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}>
          {liveRoom.isLive ? 'LIVE' : 'SCHEDULED'}
        </span>
      </div>

      <p className="text-gray-300 text-sm mb-3 line-clamp-2">{liveRoom.description}</p>

      <div className="grid grid-cols-2 gap-3 mb-4 text-xs text-gray-400">
        <div className="flex items-center space-x-2">
          <FaCalendar className="text-gray-500" size={12} />
          <span>{formatDate(liveRoom.scheduledStartTime)} at {formatTime(liveRoom.scheduledStartTime)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <FaHeadphones className="text-gray-500" size={12} />
          <span>{liveRoom.currentListeners || 0}/{liveRoom.maxListeners} listeners</span>
        </div>
        {liveRoom.genre && (
          <div className="flex items-center space-x-2">
            <FaMusic className="text-gray-500" size={12} />
            <span className="capitalize">{liveRoom.genre}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {liveRoom.tags && liveRoom.tags.length > 0 && liveRoom.tags.slice(0, 3).map((tag, index) => (
          <span key={index} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
            #{tag}
          </span>
        ))}
      </div>

      <button
        onClick={handleJoin}
        disabled={joining || (!liveRoom.isLive && new Date(liveRoom.scheduledStartTime) > new Date())}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
          liveRoom.isLive
            ? 'bg-gradient-to-r from-[#00CED1] to-[#20B2AA] text-white hover:from-[#20B2AA] hover:to-[#00CED1]'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
        }`}
      >
        {joining ? (
          <span>Joining...</span>
        ) : liveRoom.isLive ? (
          <>
            <FaPlay />
            <span>Join Live Room</span>
          </>
        ) : (
          <>
            <FaPause />
            <span>Scheduled</span>
          </>
        )}
      </button>
    </div>
  );
};

export default LiveRoomCard;