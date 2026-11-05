'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import {
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  markWithdrawalAsPaid,
  getEarningsDashboard,
  type Withdrawal,
  type AllWithdrawalsResponse,
  type EarningsDashboard
} from '../../../services/withdrawalService'

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [dashboard, setDashboard] = useState<EarningsDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'dashboard'>('pending')
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showPaidModal, setShowPaidModal] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [transactionRef, setTransactionRef] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  
  const router = useRouter()
  const { isAuthenticated, user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/login')
    }
  }, [isAuthenticated, user, router, isLoading])

  useEffect(() => {
    if (user?.role === 'admin') {
      if (activeTab === 'dashboard') {
        fetchDashboard()
      } else {
        fetchWithdrawals()
      }
    }
  }, [user, activeTab, page, statusFilter])

  const fetchWithdrawals = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const status = activeTab === 'pending' ? 'pending' : statusFilter
      const response = await getAllWithdrawals(status, page, 20)
      
      setWithdrawals(response.withdrawals)
      setTotalPages(response.pagination.totalPages)
    } catch (err: any) {
      setError(err.message)
      console.error('Failed to fetch withdrawals:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await getEarningsDashboard()
      setDashboard(data)
    } catch (err: any) {
      setError(err.message)
      console.error('Failed to fetch dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal)
    setShowApproveModal(true)
  }

  const handleReject = async (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal)
    setRejectReason('')
    setShowRejectModal(true)
  }

  const handleMarkPaid = async (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal)
    setTransactionRef('')
    setShowPaidModal(true)
  }

  const submitApprove = async () => {
    if (!selectedWithdrawal) return
    
    setActionLoading(true)
    try {
      await approveWithdrawal(selectedWithdrawal._id)
      alert('Withdrawal approved successfully')
      setShowApproveModal(false)
      setSelectedWithdrawal(null)
      fetchWithdrawals()
    } catch (err: any) {
      alert(`Failed to approve: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const submitReject = async () => {
    if (!selectedWithdrawal || !rejectReason) {
      alert('Please provide a rejection reason')
      return
    }
    
    setActionLoading(true)
    try {
      await rejectWithdrawal(selectedWithdrawal._id, rejectReason)
      alert('Withdrawal rejected successfully')
      setShowRejectModal(false)
      setSelectedWithdrawal(null)
      setRejectReason('')
      fetchWithdrawals()
    } catch (err: any) {
      alert(`Failed to reject: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const submitMarkPaid = async () => {
    if (!selectedWithdrawal) return
    
    setActionLoading(true)
    try {
      await markWithdrawalAsPaid(selectedWithdrawal._id, transactionRef)
      alert('Withdrawal marked as paid successfully')
      setShowPaidModal(false)
      setSelectedWithdrawal(null)
      setTransactionRef('')
      fetchWithdrawals()
    } catch (err: any) {
      alert(`Failed to mark as paid: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-900/30 text-green-400'
      case 'approved':
        return 'bg-blue-900/30 text-blue-400'
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400'
      case 'rejected':
        return 'bg-red-900/30 text-red-400'
      default:
        return 'bg-gray-900/30 text-gray-400'
    }
  }

  return (
    <div className="w-full">
      <div className="w-full">
        <div className="max-w-7xl mx-auto">

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-700">
          <button
            onClick={() => {
              setActiveTab('pending')
              setStatusFilter('pending')
              setPage(1)
            }}
            className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${
              activeTab === 'pending'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Pending Requests
          </button>
          <button
            onClick={() => {
              setActiveTab('all')
              setStatusFilter('')
              setPage(1)
            }}
            className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            All Withdrawals
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Earnings Dashboard
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="text-white text-sm">Loading...</div>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300">
            {error}
          </div>
        ) : activeTab === 'dashboard' && dashboard ? (
          // Dashboard View
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="card-bg rounded-2xl p-5 border border-gray-700/50">
                <p className="text-gray-400 text-sm font-medium">Total Platform Earnings</p>
                <p className="text-2xl font-bold text-primary mt-2">
                  ₽{dashboard.summary.totalPlatformEarnings.toLocaleString()}
                </p>
              </div>
              
              <div className="card-bg rounded-2xl p-5 border border-gray-700/50">
                <p className="text-gray-400 text-sm font-medium">Total Withdrawn</p>
                <p className="text-2xl font-bold text-green-500 mt-2">
                  ₽{dashboard.summary.totalWithdrawn.toLocaleString()}
                </p>
              </div>
              
              <div className="card-bg rounded-2xl p-5 border border-gray-700/50">
                <p className="text-gray-400 text-sm font-medium">Remaining Balance</p>
                <p className="text-2xl font-bold text-blue-500 mt-2">
                  ₽{dashboard.summary.remainingBalance.toLocaleString()}
                </p>
              </div>

              <div className="card-bg rounded-2xl p-5 border border-gray-700/50">
                <p className="text-gray-400 text-sm font-medium">Total Artists</p>
                <p className="text-2xl font-bold text-white mt-2">
                  {dashboard.summary.totalArtists}
                </p>
              </div>

              <div className="card-bg rounded-2xl p-5 border border-gray-700/50">
                <p className="text-gray-400 text-sm font-medium">Total Transactions</p>
                <p className="text-2xl font-bold text-white mt-2">
                  {dashboard.summary.totalTransactions}
                </p>
              </div>

              <div className="card-bg rounded-2xl p-5 border border-gray-700/50">
                <p className="text-gray-400 text-sm font-medium">Pending Approved</p>
                <p className="text-2xl font-bold text-amber-500 mt-2">
                  ₽{dashboard.summary.totalApprovedPending.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Withdrawal Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="card-bg rounded-2xl p-4 border border-gray-700/50 text-center">
                <p className="text-2xl font-bold text-white">{dashboard.withdrawalStats.totalRequests}</p>
                <p className="text-gray-400 text-xs mt-1">Total Requests</p>
              </div>
              <div className="card-bg rounded-2xl p-4 border border-gray-700/50 text-center">
                <p className="text-2xl font-bold text-yellow-500">{dashboard.withdrawalStats.pending}</p>
                <p className="text-gray-400 text-xs mt-1">Pending</p>
              </div>
              <div className="card-bg rounded-2xl p-4 border border-gray-700/50 text-center">
                <p className="text-2xl font-bold text-blue-500">{dashboard.withdrawalStats.approved}</p>
                <p className="text-gray-400 text-xs mt-1">Approved</p>
              </div>
              <div className="card-bg rounded-2xl p-4 border border-gray-700/50 text-center">
                <p className="text-2xl font-bold text-green-500">{dashboard.withdrawalStats.paid}</p>
                <p className="text-gray-400 text-xs mt-1">Paid</p>
              </div>
              <div className="card-bg rounded-2xl p-4 border border-gray-700/50 text-center">
                <p className="text-2xl font-bold text-red-500">{dashboard.withdrawalStats.rejected}</p>
                <p className="text-gray-400 text-xs mt-1">Rejected</p>
              </div>
            </div>

            {/* Top Artists */}
            {dashboard.topArtists && dashboard.topArtists.length > 0 && (
              <div className="card-bg rounded-2xl p-5 sm:p-6 border border-gray-700/50">
                <h2 className="text-lg font-bold text-white mb-4">Top Earning Artists</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-400">Artist</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-400">Email</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-400">Total Earnings</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-400">Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.topArtists.map((item) => (
                        <tr key={item.artist._id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                          <td className="py-3 px-4 text-white font-medium">{item.artist.name}</td>
                          <td className="py-3 px-4 text-gray-400">{item.artist.email}</td>
                          <td className="py-3 px-4 text-right text-green-500 font-medium">
                            ₽{item.totalEarnings.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-white">{item.totalSales}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Withdrawals List View
          <div className="card-bg rounded-2xl p-5 sm:p-6 border border-gray-700/50">
            {withdrawals && withdrawals.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-400">Artist</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-400">Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-400">Mobile</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-400">Requested</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-400">Status</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((withdrawal) => (
                        <tr key={withdrawal._id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                          <td className="py-3 px-4 text-white">
                            {typeof withdrawal.artistId === 'object'
                              ? (withdrawal.artistId as any).name
                              : withdrawal.artistId}
                          </td>
                          <td className="py-3 px-4 text-right text-white font-medium">
                            ₽{withdrawal.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-gray-400">{withdrawal.mobileNumber}</td>
                          <td className="py-3 px-4 text-gray-400 text-xs">
                            {new Date(withdrawal.requestDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(withdrawal.status)}`}>
                              {withdrawal.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center gap-2">
                              {withdrawal.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(withdrawal)}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs font-medium transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReject(withdrawal)}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-xs font-medium transition-colors"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {withdrawal.status === 'approved' && (
                                <button
                                  onClick={() => handleMarkPaid(withdrawal)}
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-xs font-medium transition-colors"
                                >
                                  Mark Paid
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-3 py-2 border border-gray-700 rounded text-gray-300 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-gray-400">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-2 border border-gray-700 rounded text-gray-300 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No withdrawals found</p>
              </div>
            )}
          </div>
        )}

        {/* Approve Modal */}
        {showApproveModal && selectedWithdrawal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card-bg rounded-2xl p-6 border border-gray-700/50 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">Approve Withdrawal</h3>
              <p className="text-gray-400 mb-4">
                Are you sure you want to approve this withdrawal request of ₽{selectedWithdrawal.amount.toLocaleString()}?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-white font-medium hover:bg-gray-800/30"
                >
                  Cancel
                </button>
                <button
                  onClick={submitApprove}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 gradient-primary rounded-lg text-white font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {actionLoading ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedWithdrawal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card-bg rounded-2xl p-6 border border-gray-700/50 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">Reject Withdrawal</h3>
              <p className="text-gray-400 mb-4">
                Are you sure you want to reject this withdrawal request?
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why you're rejecting this request"
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-white font-medium hover:bg-gray-800/30"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReject}
                  disabled={actionLoading || !rejectReason}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mark Paid Modal */}
        {showPaidModal && selectedWithdrawal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card-bg rounded-2xl p-6 border border-gray-700/50 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">Mark as Paid</h3>
              <p className="text-gray-400 mb-4">
                Mark withdrawal of ₽{selectedWithdrawal.amount.toLocaleString()} as paid
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Transaction Reference (Optional)
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g., MTN_PAYMENT_12345"
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaidModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-white font-medium hover:bg-gray-800/30"
                >
                  Cancel
                </button>
                <button
                  onClick={submitMarkPaid}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Mark Paid'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  )
}
