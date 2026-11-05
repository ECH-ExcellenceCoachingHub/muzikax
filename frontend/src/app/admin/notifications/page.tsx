'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import notificationService from '../../../services/notificationService'

interface Notification {
  _id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success' | 'track_deleted' | 'reply'
  createdAt: string
  recipientId: {
    name: string
    email: string
    role: string
  }
  data?: {
    sentByAdmin?: boolean
    isReply?: boolean
  }
}

interface User {
  _id: string
  name: string
  email: string
  role: string
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Form states
  const [selectedUser, setSelectedUser] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [notificationType, setNotificationType] = useState<'info' | 'warning' | 'error' | 'success'>('info')
  const [sendToAllCreators, setSendToAllCreators] = useState(false)
  const [sendToAllUsers, setSendToAllUsers] = useState(false)
  
  const { isAuthenticated, userRole } = useAuth()

  // Access control is handled once in src/app/admin/layout.tsx.

  // Fetch sent notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('accessToken')
        if (token) {
          notificationService.setToken(token)
          const response = await notificationService.getAdminSentNotifications(currentPage, 20)
          setNotifications(response.notifications)
          setTotalPages(response.totalPages)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch notifications')
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated && userRole === 'admin') {
      fetchNotifications()
    }
  }, [isAuthenticated, userRole, currentPage])

  // Fetch users for dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        console.log('Fetching users with token:', token ? `${token.substring(0, 10)}...` : 'No token');
        console.log('Search query:', searchQuery);
        
        if (token) {
          const params = new URLSearchParams();
          if (searchQuery) {
            params.append('query', searchQuery);
          }
          params.append('limit', '50'); // Increase limit for better selection
          
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/search?${params.toString()}`;
          console.log('API URL:', apiUrl);
          
          const response = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          console.log('Response status:', response.status);
          
          if (response.ok) {
            const userData = await response.json()
            console.log('User search response:', userData); // Debug log
            const formattedUsers = (userData.users || []).map((user: any) => ({
              _id: user._id || user.id,
              name: user.name,
              email: user.email,
              role: user.role
            }));
            console.log('Formatted users:', formattedUsers); // Debug log
            setUsers(formattedUsers);
            setFilteredUsers(formattedUsers);
          } else {
            const errorText = await response.text();
            console.error('User search failed:', response.status, errorText);
            setError(`Failed to fetch users: ${response.status} - ${errorText}`);
          }
        } else {
          console.log('No token found in localStorage');
          setError('Authentication token not found. Please log in again.');
        }
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError(`Error fetching users: ${err.message}`);
      }
    }

    if (isAuthenticated && userRole === 'admin') {
      fetchUsers()
    }
  }, [isAuthenticated, userRole, searchQuery])

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required')
      return
    }

    if (!sendToAllCreators && !sendToAllUsers && !selectedUser) {
      setError('Please select a recipient or choose to send to all creators/users')
      return
    }

    try {
      setSending(true)
      setError('')
      
      const token = localStorage.getItem('accessToken')
      if (token) {
        notificationService.setToken(token)
        
        await notificationService.sendNotification(
          sendToAllCreators || sendToAllUsers ? null : selectedUser,
          title,
          message,
          notificationType,
          sendToAllCreators,
          sendToAllUsers
        )
        
        // Reset form
        setTitle('')
        setMessage('')
        setSelectedUser('')
        setSendToAllCreators(false)
        setSendToAllUsers(false)
        
        // Show success and refresh notifications
        alert('Notification sent successfully!')
        setCurrentPage(1) // Reset to first page
        
        // Refetch notifications
        const response = await notificationService.getAdminSentNotifications(1, 20)
        setNotifications(response.notifications)
        setTotalPages(response.totalPages)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  const getTypeBadge = (type: string) => {
    const typeStyles = {
      error: 'bg-red-500/20 text-red-300',
      warning: 'bg-yellow-500/20 text-yellow-300',
      success: 'bg-green-500/20 text-green-300',
      info: 'bg-blue-500/20 text-blue-300',
      reply: 'bg-purple-500/20 text-purple-300'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeStyles[type as keyof typeof typeStyles] || typeStyles.info}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    )
  }

  return (
    <div className="w-full">

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Send Notification Form */}
            <div className="card-bg rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Send Notification</h2>
              
              <form onSubmit={handleSendNotification} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Notification Type
                  </label>
                  <select
                    value={notificationType}
                    onChange={(e) => setNotificationType(e.target.value as any)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="success">Success</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="sendToAllCreators"
                      checked={sendToAllCreators}
                      onChange={(e) => {
                        setSendToAllCreators(e.target.checked);
                        if (e.target.checked) setSendToAllUsers(false);
                      }}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-700 rounded bg-gray-800"
                    />
                    <label htmlFor="sendToAllCreators" className="ml-2 block text-sm text-gray-400">
                      Send to all creators
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="sendToAllUsers"
                      checked={sendToAllUsers}
                      onChange={(e) => {
                        setSendToAllUsers(e.target.checked);
                        if (e.target.checked) setSendToAllCreators(false);
                      }}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-700 rounded bg-gray-800"
                    />
                    <label htmlFor="sendToAllUsers" className="ml-2 block text-sm text-gray-400">
                      Send to all users (fans & creators)
                    </label>
                  </div>
                </div>

                {!sendToAllCreators && !sendToAllUsers && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Recipient
                    </label>
                    <div className="mb-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search users by name or email..."
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select a user</option>
                      {filteredUsers.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email}) - {user.role}
                        </option>
                      ))}
                    </select>
                    {filteredUsers.length === 0 && searchQuery && (
                      <p className="text-gray-400 text-sm mt-2">No users found matching your search.</p>
                    )}
                    {users.length > 0 && !searchQuery && (
                      <p className="text-gray-400 text-sm mt-2">Showing {users.length} users. Use search to filter.</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter notification title"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter notification message"
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full px-4 py-3 bg-primary hover:bg-primary/80 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
                >
                  {sending ? 'Sending...' : 'Send Notification'}
                </button>
              </form>
            </div>

            {/* Sent Notifications */}
            <div className="card-bg rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Sent Notifications</h2>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-200">No notifications sent</h3>
                  <p className="mt-1 text-sm text-gray-400">You haven't sent any notifications yet.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification._id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-white">{notification.title}</h3>
                            {getTypeBadge(notification.type)}
                          </div>
                          
                          <p className="text-gray-300 text-sm mb-2">{notification.message}</p>
                          
                          <div className="text-xs text-gray-500">
                            To: {notification.recipientId.name} ({notification.recipientId.email})
                          </div>
                          
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(notification.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded transition-colors text-sm"
                  >
                    Previous
                  </button>
                  
                  <div className="text-gray-400 text-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded transition-colors text-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
  )
}
