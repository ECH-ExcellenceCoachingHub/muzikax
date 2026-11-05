const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

import pushNotificationService from './pushNotificationService';

class NotificationService {
  constructor() {
    this.token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('token')) : null;
  }

  setToken(token) {
    this.token = token;
  }

  // Push notification methods
  async initializePushNotifications(vapidPublicKey) {
    return await pushNotificationService.initialize(vapidPublicKey);
  }

  async isPushSupported() {
    return pushNotificationService.isPushSupported();
  }

  async isPushSubscribed() {
    return await pushNotificationService.isSubscribed();
  }

  async subscribeToPush(vapidPublicKey) {
    try {
      const subscription = await pushNotificationService.subscribeToPush(vapidPublicKey);
      await pushNotificationService.sendSubscriptionToServer(subscription);
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  async unsubscribeFromPush() {
    try {
      await pushNotificationService.unsubscribeFromPush();
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    }
  }

  async getUserPushSubscriptions() {
    return await pushNotificationService.getUserSubscriptions();
  }

  async getNotifications(page = 1, limit = 20, type = null) {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (type) params.append('type', type);
      
      const response = await fetch(`${API_BASE_URL}/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async getUnreadCount() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  async markAsRead(notificationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Admin methods
  async sendNotification(recipientId, title, message, type = 'info', sendToAllCreators = false, sendToAllUsers = false) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId,
          title,
          message,
          type,
          sendToAllCreators,
          sendToAllUsers
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  async getAdminSentNotifications(page = 1, limit = 20) {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      
      const response = await fetch(`${API_BASE_URL}/api/notifications/sent?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admin sent notifications');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching admin sent notifications:', error);
      throw error;
    }
  }

  // Creator reply methods
  async replyToNotification(notificationId, replyMessage) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ replyMessage })
      });

      if (!response.ok) {
        throw new Error('Failed to reply to notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error replying to notification:', error);
      throw error;
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;