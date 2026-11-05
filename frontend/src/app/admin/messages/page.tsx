'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

interface ContactMessage {
  _id: string;
  message: string;
  name: string;
  email: string;
  type: string;
  status: string;
  createdAt: string;
  userId?: { username: string; email: string };
  adminReply?: string;
}

export default function AdminMessages() {
  const { isAuthenticated, userRole } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [stats, setStats] = useState<{
    total: number;
    byStatus: Array<{ _id: string; count: number }>;
    byType: Array<{ _id: string; count: number }>;
  }>({ total: 0, byStatus: [], byType: [] });

  // Access control is handled once in src/app/admin/layout.tsx.
  useEffect(() => {
    fetchMessages();
    fetchStats();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const status = filterStatus !== 'all' ? `status=${filterStatus}` : '';
      const type = filterType !== 'all' ? `type=${filterType}` : '';
      const params = [status, type].filter(Boolean).join('&');
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/contact-messages${params ? '?' + params : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch messages');

      const data = await response.json();
      setMessages(data.data);
      setError('');
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/contact-messages/stats`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/contact-messages/${selectedMessage._id}/reply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({ adminReply: replyText })
        }
      );

      if (response.ok) {
        alert('Reply sent successfully!');
        setReplyText('');
        setSelectedMessage(null);
        fetchMessages();
      } else {
        alert('Failed to send reply');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error sending reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleStatusChange = async (messageId: string, newStatus: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/contact-messages/${messageId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (response.ok) {
        fetchMessages();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/contact-messages/${messageId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );

      if (response.ok) {
        setSelectedMessage(null);
        fetchMessages();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div className="w-full">
      <div className="w-full">
        <div className="w-full">

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Messages</p>
              <p className="text-2xl font-bold text-green-500">{stats.total}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Unread</p>
              <p className="text-2xl font-bold text-yellow-500">
                {stats.byStatus?.find((s) => s._id === 'new')?.count || 0}
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Replied</p>
              <p className="text-2xl font-bold text-blue-500">
                {stats.byStatus?.find((s) => s._id === 'replied')?.count || 0}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-green-500"
              >
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-green-500"
              >
                <option value="all">All</option>
                <option value="feedback">Feedback</option>
                <option value="bug_report">Bug Report</option>
                <option value="feature_request">Feature Request</option>
                <option value="general_inquiry">General Inquiry</option>
              </select>
            </div>
            <button
              onClick={() => {
                setFilterStatus('all');
                setFilterType('all');
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg self-end"
            >
              Reset
            </button>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 text-red-400">
              {error}
            </div>
          )}

          {/* Messages Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Messages List */}
            <div className="lg:col-span-2 space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
                  No messages found
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedMessage?._id === msg._id ? 'border-2 border-green-500' : 'border border-gray-700 hover:border-green-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold">{msg.name}</p>
                        <p className="text-sm text-gray-400">{msg.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        msg.status === 'new' ? 'bg-yellow-900/50 text-yellow-400' :
                        msg.status === 'replied' ? 'bg-blue-900/50 text-blue-400' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {msg.status}
                      </span>
                    </div>
                    <p className="text-gray-300 line-clamp-2">{msg.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Message Detail */}
            {selectedMessage && (
              <div className="lg:col-span-1">
                <div className="bg-gray-800 rounded-lg p-6 sticky top-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Details</h3>
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-400">Name</p>
                      <p className="font-medium">{selectedMessage.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="font-medium text-sm break-all">{selectedMessage.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Type</p>
                      <p className="font-medium capitalize">{selectedMessage.type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <select
                        value={selectedMessage.status}
                        onChange={(e) => {
                          handleStatusChange(selectedMessage._id, e.target.value);
                          setSelectedMessage({ ...selectedMessage, status: e.target.value });
                        }}
                        className="w-full mt-1 px-2 py-1 bg-gray-700 rounded border border-gray-600"
                      >
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="replied">Replied</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Date</p>
                      <p className="font-medium">{new Date(selectedMessage.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4 mb-4">
                    <p className="text-sm text-gray-400 mb-2">Message</p>
                    <p className="text-sm bg-gray-900 rounded p-3">{selectedMessage.message}</p>
                  </div>

                  {selectedMessage.adminReply && (
                    <div className="bg-green-900/20 border border-green-700 rounded p-3 mb-4">
                      <p className="text-sm text-green-400 mb-2">Your Reply:</p>
                      <p className="text-sm">{selectedMessage.adminReply}</p>
                    </div>
                  )}

                  {selectedMessage.status !== 'replied' && (
                    <form onSubmit={handleReplySubmit} className="space-y-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-sm resize-none"
                        rows={4}
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingReply || !replyText.trim()}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-sm font-medium transition-colors"
                      >
                        {isSubmittingReply ? 'Sending...' : 'Send Reply'}
                      </button>
                    </form>
                  )}

                  <button
                    onClick={() => handleDeleteMessage(selectedMessage._id)}
                    className="w-full mt-3 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-700 rounded text-sm text-red-400 transition-colors"
                  >
                    Delete Message
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
