'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import notificationService from '../services/notificationService';

export default function NotificationSettings() {
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const checkPushStatus = async () => {
      if (!isAuthenticated) return;
      
      try {
        const supported = await notificationService.isPushSupported();
        setIsPushSupported(supported);
        
        if (supported) {
          const subscribed = await notificationService.isPushSubscribed();
          setIsSubscribed(subscribed);
        }
      } catch (error) {
        console.error('Error checking push status:', error);
      }
    };

    checkPushStatus();
  }, [isAuthenticated]);

  const handleSubscribe = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'YOUR_VAPID_PUBLIC_KEY_HERE';
      
      if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY === 'YOUR_VAPID_PUBLIC_KEY_HERE') {
        setMessage('Push notifications are not properly configured.');
        return;
      }
      
      await notificationService.subscribeToPush(VAPID_PUBLIC_KEY);
      setIsSubscribed(true);
      setMessage('Successfully subscribed to push notifications!');
    } catch (error) {
      console.error('Error subscribing:', error);
      setMessage('Failed to subscribe to push notifications: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      await notificationService.unsubscribeFromPush();
      setIsSubscribed(false);
      setMessage('Successfully unsubscribed from push notifications.');
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setMessage('Failed to unsubscribe from push notifications: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (!isPushSupported) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6">
        <p className="text-yellow-300 text-sm">
          Push notifications are not supported in your browser.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Notification Settings</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-medium">Push Notifications</h4>
            <p className="text-gray-400 text-sm mt-1">
              Receive real-time notifications on your device even when the app is closed
            </p>
          </div>
          
          <button
            onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isSubscribed
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-primary hover:bg-primary/80 text-white'
            } disabled:opacity-50`}
          >
            {loading ? (
              'Processing...'
            ) : isSubscribed ? (
              'Disable Push'
            ) : (
              'Enable Push'
            )}
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.includes('Success') || message.includes('subscribed') 
              ? 'bg-green-500/10 text-green-400 border border-green-500/50' 
              : 'bg-red-500/10 text-red-400 border border-red-500/50'
          }`}>
            {message}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Get notified when artists you follow release new tracks</p>
          <p>• Receive alerts about personalized playlist recommendations</p>
          <p>• Stay informed about important account updates</p>
          <p>• Notifications work on mobile devices and desktop browsers</p>
        </div>
      </div>
    </div>
  );
}