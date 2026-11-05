import React from 'react';
import { FaFire, FaMicrophoneAlt, FaChartBar, FaGlobeAfrica } from 'react-icons/fa';

const CommunityTabBar = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'trending',
      label: 'Trending',
      icon: <FaFire className="text-orange-500" />
    },
    {
      id: 'spotlight',
      label: 'Artist Spotlight',
      icon: <FaMicrophoneAlt className="text-purple-500" />
    },
    {
      id: 'polls',
      label: 'Community Polls',
      icon: <FaChartBar className="text-green-500" />
    },
    {
      id: 'whatsnew',
      label: "What's New",
      icon: <FaGlobeAfrica className="text-blue-500" />
    }
  ];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-1 mb-6 border border-gray-700">
      <div className="flex justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg transition-all duration-300 min-w-[100px] ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <span className="text-lg mb-1">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CommunityTabBar;