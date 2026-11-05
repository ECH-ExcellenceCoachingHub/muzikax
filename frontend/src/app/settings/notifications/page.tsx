'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface NotificationPreferences {
  newTrackFromFollowing: boolean;
  newPlaylist: boolean;
  trendingOfWeek: boolean;
  recommendedArtists: boolean;
  accountUpdates: boolean;
}

export default function NotificationSettingsPage() {
  const { user, fetchUserProfile } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    newTrackFromFollowing: true,
    newPlaylist: true,
    trendingOfWeek: true,
    recommendedArtists: true,
    accountUpdates: true,
  });

  useEffect(() => {
    if (user) {
      fetchUserPreferences();
    }
  }, [user]);

  const fetchUserPreferences = async () => {
    try {
      setIsLoading(true);
      const accessToken = localStorage.getItem('accessToken');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.emailNotifications) {
          setPreferences(userData.emailNotifications);
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleChange = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const accessToken = localStorage.getItem('accessToken');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          emailNotifications: preferences,
        }),
      });

      if (response.ok) {
        await fetchUserProfile();
        showSuccess('Notification preferences saved successfully!');
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      showError('Failed to save notification preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen text-white pt-24 px-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-gray-400">Please log in to manage your notification settings</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen text-white pt-24 px-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pt-24 px-4 pb-12 bg-background">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-text-primary">
            Email Notifications
          </h1>
          <p className="text-gray-400">
            Manage your email notification preferences
          </p>
        </div>

        {/* Settings Cards */}
        <div className="space-y-4">
          {/* New Track from Following Artists */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🎵</span>
                  <h3 className="text-lg font-semibold text-text-primary">New Tracks from Following</h3>
                </div>
                <p className="text-gray-400 text-sm">
                  Get notified when artists you follow release new tracks
                </p>
              </div>
              <button
                onClick={() => handleToggleChange('newTrackFromFollowing')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  preferences.newTrackFromFollowing ? 'bg-primary' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    preferences.newTrackFromFollowing ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* New Playlists */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🎶</span>
                  <h3 className="text-lg font-semibold text-text-primary">New Playlists</h3>
                </div>
                <p className="text-gray-400 text-sm">
                  Receive curated playlists tailored to your taste
                </p>
              </div>
              <button
                onClick={() => handleToggleChange('newPlaylist')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  preferences.newPlaylist ? 'bg-primary' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    preferences.newPlaylist ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Trending of the Week */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🔥</span>
                  <h3 className="text-lg font-semibold text-text-primary">Trending This Week</h3>
                </div>
                <p className="text-gray-400 text-sm">
                  Weekly digest of the hottest tracks on MuzikaX
                </p>
              </div>
              <button
                onClick={() => handleToggleChange('trendingOfWeek')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  preferences.trendingOfWeek ? 'bg-primary' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    preferences.trendingOfWeek ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Recommended Artists */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🌟</span>
                  <h3 className="text-lg font-semibold text-text-primary">Recommended Artists</h3>
                </div>
                <p className="text-gray-400 text-sm">
                  Discover new artists based on your listening habits
                </p>
              </div>
              <button
                onClick={() => handleToggleChange('recommendedArtists')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  preferences.recommendedArtists ? 'bg-primary' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    preferences.recommendedArtists ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Account Updates */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">📧</span>
                  <h3 className="text-lg font-semibold text-text-primary">Account Updates</h3>
                </div>
                <p className="text-gray-400 text-sm">
                  Important updates about your account and security
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Required for critical account notifications
                </p>
              </div>
              <button
                onClick={() => handleToggleChange('accountUpdates')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  preferences.accountUpdates ? 'bg-primary' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    preferences.accountUpdates ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 bg-gradient-to-r from-primary to-[#FF6B6B] rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
          <p className="text-blue-300 text-sm">
            💡 <strong>Tip:</strong> You can unsubscribe from any email by clicking the unsubscribe link at the bottom of our emails.
          </p>
        </div>
      </div>
    </div>
  );
}
