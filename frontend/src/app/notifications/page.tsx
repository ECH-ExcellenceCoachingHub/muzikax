'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { FaArrowLeft } from 'react-icons/fa'
import notificationService from '../../services/notificationService'
import Link from 'next/link'
import NotificationSettings from '../../components/NotificationSettings'

interface Notification {
  _id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success' | 'track_deleted' | 'reply' | 'stem_processing'
  read: boolean
  createdAt: string
  senderId?: {
    name: string
    email: string
    role: string
  }
  data?: {
    sentByAdmin?: boolean
    isReply?: boolean
    originalNotificationId?: string
    replied?: boolean
    repliedAt?: string
    trackId?: string
    trackTitle?: string
    hasStems?: boolean
    progress?: number
    status?: string
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  
  // Live stem processing tracking
  const [processingTracks, setProcessingTracks] = useState<{[key: string]: {progress: number, status: string}}>({})
  const router = useRouter()
  const { isAuthenticated, userRole } = useAuth()

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
        if (token) {
          notificationService.setToken(token)
          const response = await notificationService.getNotifications(currentPage, 20)
          setNotifications(response.notifications)
          setTotalPages(response.totalPages)
          
          // Extract tracks that are still processing for live updates
          const processingTrackIds = response.notifications
            .filter((n: Notification) => n.type === 'stem_processing' && n.data?.status !== 'completed' && n.data?.status !== 'failed')
            .map((n: Notification) => n.data?.trackId)
            .filter((id: string | undefined): id is string => !!id)
          
          if (processingTrackIds.length > 0) {
            startPollingProcessingTracks(processingTrackIds)
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch notifications')
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchNotifications()
    }
  }, [isAuthenticated, currentPage])
  
  // Poll processing tracks for live progress updates
  const startPollingProcessingTracks = (trackIds: string[]) => {
    const pollInterval = setInterval(async () => {
      try {
        const updates: {[key: string]: {progress: number, status: string}} = {}
        
        for (const trackId of trackIds) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${trackId}/stems`)
          const data = await response.json()
          
          if (data.hasStems || data.progress >= 100 || data.status === 'completed') {
            // Processing complete!
            updates[trackId] = { progress: 100, status: 'completed' }
          } else if (data.status === 'failed') {
            // Processing failed
            updates[trackId] = { progress: 0, status: 'failed' }
          } else {
            // Still processing - update progress
            updates[trackId] = { 
              progress: data.progress || 0, 
              status: data.status || 'processing' 
            }
          }
        }
        
        setProcessingTracks(prev => ({ ...prev, ...updates }))
        
        // Stop polling if all tracks are complete
        const allComplete = Object.values(updates).every(
          t => t.status === 'completed' || t.status === 'failed'
        )
        if (allComplete) {
          clearInterval(pollInterval)
          // Refresh notifications to show completion
          setTimeout(() => window.location.reload(), 2000)
        }
      } catch (error) {
        console.error('Error polling processing tracks:', error)
      }
    }, 5000) // Poll every 5 seconds
    
    return () => clearInterval(pollInterval)
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      if (token) {
        notificationService.setToken(token)
        await notificationService.markAsRead(notificationId)
        
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        )
      }
    } catch (err: any) {
      console.error('Error marking as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      if (token) {
        notificationService.setToken(token)
        await notificationService.markAllAsRead()
        
        // Update local state
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        )
      }
    } catch (err: any) {
      console.error('Error marking all as read:', err)
    }
  }

  const handleDelete = async (notificationId: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return
    
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      if (token) {
        notificationService.setToken(token)
        await notificationService.deleteNotification(notificationId)
        
        // Update local state
        setNotifications(prev => 
          prev.filter(notif => notif._id !== notificationId)
        )
      }
    } catch (err: any) {
      console.error('Error deleting notification:', err)
    }
  }

  const handleReply = async (notificationId: string) => {
    if (!replyMessage.trim()) return
    
    try {
      setReplyLoading(true)
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      if (token) {
        notificationService.setToken(token)
        await notificationService.replyToNotification(notificationId, replyMessage)
        
        // Reset reply state
        setReplyingTo(null)
        setReplyMessage('')
        
        // Show success message
        alert('Reply sent successfully!')
      }
    } catch (err: any) {
      console.error('Error sending reply:', err)
      alert('Failed to send reply')
    } finally {
      setReplyLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error':
      case 'track_deleted':
        return 'border-red-500/50 bg-red-500/10'
      case 'warning':
        return 'border-yellow-500/50 bg-yellow-500/10'
      case 'success':
        return 'border-green-500/50 bg-green-500/10'
      case 'reply':
        return 'border-blue-500/50 bg-blue-500/10'
      default:
        return 'border-gray-700 bg-gray-800/50'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stem_processing':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        )
      case 'error':
      case 'track_deleted':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        )
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        )
      case 'reply':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        )
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-14 md:pt-0 bg-background">
      {/* Mobile Header with Back Button */}
      <div className="md:hidden bg-gray-900/50 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white transition-colors p-2 -ml-2"
              aria-label="Go back"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black text-text-primary">Notifications</h1>
              <p className="text-xs text-gray-400">Stay updated</p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-gray-900/50 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
              <p className="text-gray-400 mt-1">Stay updated with platform announcements and messages</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
              >
                Mark All as Read
              </button>
              <Link 
                href="/profile" 
                className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors text-sm"
              >
                Back to Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notification Settings */}
        <NotificationSettings />

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-200">No notifications</h3>
            <p className="mt-1 text-sm text-gray-400">You don't have any notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div 
                key={notification._id}
                className={`rounded-xl border p-5 transition-all duration-200 ${
                  notification.read 
                    ? 'bg-gray-800/30 border-gray-700' 
                    : `bg-gray-800/50 ${getTypeColor(notification.type)}`
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-2 rounded-lg ${
                      notification.read ? 'bg-gray-700' : getTypeColor(notification.type).replace('border', 'bg')
                    }`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-lg font-semibold ${
                          notification.read ? 'text-gray-300' : 'text-white'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-white">
                            New
                          </span>
                        )}
                      </div>
                      
                      <p className={`mt-2 text-gray-300 ${!notification.read ? 'font-medium' : ''}`}>
                        {notification.message}
                      </p>
                      
                      {/* Live Progress Bar for Stem Processing */}
                      {notification.type === 'stem_processing' && notification.data?.trackId && (
                        <div className="mt-4 space-y-2">
                          {(() => {
                            const trackProgress = processingTracks[notification.data!.trackId!]
                            const progress = trackProgress?.progress || 0
                            const status = trackProgress?.status || notification.data?.status || 'processing'
                            
                            return (
                              <div className="bg-gray-700/50 rounded-lg p-4 border border-primary/30">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-primary-light">
                                    {status === 'completed' ? '✅ Stems Ready!' : 
                                     status === 'failed' ? '⚠️ Processing Failed' :
                                     '⚙️ Processing...'}
                                  </span>
                                  <span className="text-sm font-bold text-white">{Math.round(progress)}%</span>
                                </div>
                                
                                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                                  <div 
                                    className={`h-3 rounded-full transition-all duration-500 ${
                                      status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                                      status === 'failed' ? 'bg-gradient-to-r from-red-500 to-orange-600' :
                                      'bg-gradient-to-r from-primary to-purple-600 animate-pulse'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                                
                                {status === 'processing' && (
                                  <p className="mt-2 text-xs text-gray-400">
                                    🎵 AI is separating your track into 4 stems (vocals, drums, bass, other)
                                  </p>
                                )}
                                
                                {status === 'completed' && (
                                  <p className="mt-2 text-xs text-green-400">
                                    🎉 Your track is now public with professional quality stems!
                                  </p>
                                )}
                                
                                {status === 'failed' && (
                                  <p className="mt-2 text-xs text-red-400">
                                    ⚠️ Stem processing failed, but your track is still available with standard playback.
                                  </p>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      )}
                      
                      {notification.senderId && (
                        <div className="mt-2 text-sm text-gray-400">
                          From: <span className="text-gray-300">{notification.senderId.name}</span>
                          {notification.senderId.role === 'admin' && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-primary-light">
                              Admin
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="mt-3 text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>

                      {/* Reply Section */}
                      {notification.data?.sentByAdmin && userRole === 'creator' && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          {replyingTo === notification._id ? (
                            <div className="space-y-3">
                              <textarea
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                placeholder="Write your reply..."
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                                rows={3}
                              />
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleReply(notification._id)}
                                  disabled={replyLoading || !replyMessage.trim()}
                                  className="px-4 py-2 bg-primary hover:bg-primary/80 disabled:opacity-50 text-white rounded-lg transition-colors text-sm"
                                >
                                  {replyLoading ? 'Sending...' : 'Send Reply'}
                                </button>
                                <button
                                  onClick={() => {
                                    setReplyingTo(null)
                                    setReplyMessage('')
                                  }}
                                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReplyingTo(notification._id)}
                              className="inline-flex items-center px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                              </svg>
                              Reply to Admin
                            </button>
                          )}
                        </div>
                      )}

                      {notification.data?.replied && (
                        <div className="mt-3 text-sm text-green-400">
                          ✓ Replied on {new Date(notification.data.repliedAt!).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Mark as read"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(notification._id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete notification"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  Previous
                </button>
                
                <div className="text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
