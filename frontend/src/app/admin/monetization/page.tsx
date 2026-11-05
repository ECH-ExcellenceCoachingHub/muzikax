'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { 
  getPendingApplications,
  getAllMonetizationRecords,
  approveMonetization,
  rejectMonetization,
  processPayout,
  updateEarningsRate,
  type MonetizationRecord
} from '../../../services/monetizationService'

export default function AdminMonetization() {
  const [pendingApps, setPendingApps] = useState<MonetizationRecord[]>([])
  const [allRecords, setAllRecords] = useState<MonetizationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending')
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [showEarningsModal, setShowEarningsModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<MonetizationRecord | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [earningsRate, setEarningsRate] = useState('1.00')
  const [platformCommission, setPlatformCommission] = useState('20')
  const [actionLoading, setActionLoading] = useState(false)
  
  const router = useRouter()
  const { isAuthenticated, user, isLoading } = useAuth()

  // Check authentication and admin role
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/login')
    }
  }, [isAuthenticated, user, router, isLoading])

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!user || user.role !== 'admin') return
      
      try {
        setLoading(true)
        setError(null)
        
        const [pendingData, allData] = await Promise.all([
          getPendingApplications(),
          getAllMonetizationRecords(1, 50)
        ])
        
        setPendingApps(pendingData.records)
        setAllRecords(allData.records)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (user?.role === 'admin') {
      fetchData()
    }
  }, [user])

  const handleApprove = async (record: MonetizationRecord) => {
    setSelectedRecord(record)
    setAdminNotes('')
    setEarningsRate('1.00')
    setPlatformCommission('20')
    setShowApproveModal(true)
  }

  const handleReject = async (record: MonetizationRecord) => {
    setSelectedRecord(record)
    setRejectionReason('')
    setAdminNotes('')
    setShowRejectModal(true)
  }

  const handleProcessPayout = async (record: MonetizationRecord, payoutId: string, status: 'processed' | 'failed') => {
    try {
      await processPayout(record._id, payoutId, status)
      // Refresh data
      const [pendingData, allData] = await Promise.all([
        getPendingApplications(),
        getAllMonetizationRecords(1, 50)
      ])
      setPendingApps(pendingData.records)
      setAllRecords(allData.records)
      alert(`Payout ${status} successfully`)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleUpdateEarnings = async (record: MonetizationRecord) => {
    setSelectedRecord(record)
    setEarningsRate(record.earningsRate.toString())
    setPlatformCommission(record.platformCommission.toString())
    setAdminNotes(record.adminNotes || '')
    setShowEarningsModal(true)
  }

  const submitApproval = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRecord) return

    try {
      setActionLoading(true)
      await approveMonetization(
        selectedRecord._id,
        parseFloat(earningsRate),
        parseInt(platformCommission),
        adminNotes
      )
      
      // Refresh data
      const [pendingData, allData] = await Promise.all([
        getPendingApplications(),
        getAllMonetizationRecords(1, 50)
      ])
      setPendingApps(pendingData.records)
      setAllRecords(allData.records)
      
      setShowApproveModal(false)
      setSelectedRecord(null)
      alert('Application approved successfully')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const submitRejection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRecord) return

    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    try {
      setActionLoading(true)
      await rejectMonetization(selectedRecord._id, rejectionReason, adminNotes)
      
      // Refresh data
      const [pendingData, allData] = await Promise.all([
        getPendingApplications(),
        getAllMonetizationRecords(1, 50)
      ])
      setPendingApps(pendingData.records)
      setAllRecords(allData.records)
      
      setShowRejectModal(false)
      setSelectedRecord(null)
      setRejectionReason('')
      alert('Application rejected successfully')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const submitEarningsUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRecord) return

    try {
      setActionLoading(true)
      await updateEarningsRate(
        selectedRecord._id,
        parseFloat(earningsRate),
        parseInt(platformCommission),
        adminNotes
      )
      
      // Refresh data
      const [pendingData, allData] = await Promise.all([
        getPendingApplications(),
        getAllMonetizationRecords(1, 50)
      ])
      setPendingApps(pendingData.records)
      setAllRecords(allData.records)
      
      setShowEarningsModal(false)
      setSelectedRecord(null)
      alert('Earnings configuration updated successfully')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary-light/10 rounded-full blur-3xl -z-10"></div>
      
      <div className="w-full">
        <div className="max-w-6xl mx-auto">

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex mb-6 border-b border-gray-800">
            <button
              className={`py-3 px-6 font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('pending')}
            >
              Pending Applications ({pendingApps.length})
            </button>
            <button
              className={`py-3 px-6 font-medium transition-colors ${
                activeTab === 'all'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('all')}
            >
              All Records
            </button>
          </div>

          {/* Pending Applications */}
          {activeTab === 'pending' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Pending Applications</h2>
              
              {pendingApps.length === 0 ? (
                <div className="card-bg rounded-2xl p-8 text-center">
                  <p className="text-gray-400">No pending applications</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingApps.map((record) => (
                    <div key={record._id} className="card-bg rounded-2xl p-6 border border-gray-700/50">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-white">{record.userId.name}</h3>
                            <span className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded">
                              {record.userId.creatorType}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mb-2">{record.userId.email}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-gray-400">Followers: </span>
                              <span className="text-white">{record.followersCount}</span>
                              {record.followersCount >= 20 && (
                                <span className="text-green-400 ml-1">✓</span>
                              )}
                            </div>
                            <div>
                              <span className="text-gray-400">Tracks: </span>
                              <span className="text-white">{record.tracksCount}</span>
                              {record.tracksCount >= 3 && (
                                <span className="text-green-400 ml-1">✓</span>
                              )}
                            </div>
                            <div>
                              <span className="text-gray-400">Applied: </span>
                              <span className="text-white">
                                {new Date(record.applicationDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Status: </span>
                              <span className="text-yellow-400">Pending Review</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(record)}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(record)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Records */}
          {activeTab === 'all' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">All Monetization Records</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 text-gray-400">Creator</th>
                      <th className="text-left py-3 text-gray-400">Type</th>
                      <th className="text-center py-3 text-gray-400">Followers</th>
                      <th className="text-center py-3 text-gray-400">Tracks</th>
                      <th className="text-center py-3 text-gray-400">Status</th>
                      <th className="text-right py-3 text-gray-400">Earnings</th>
                      <th className="text-center py-3 text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRecords.map((record) => (
                      <tr key={record._id} className="border-b border-gray-800 hover:bg-gray-800/30">
                        <td className="py-3">
                          <div>
                            <div className="text-white font-medium">{record.userId.name}</div>
                            <div className="text-gray-400 text-xs">{record.userId.email}</div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded">
                            {record.userId.creatorType}
                          </span>
                        </td>
                        <td className="py-3 text-center text-gray-300">{record.followersCount}</td>
                        <td className="py-3 text-center text-gray-300">{record.tracksCount}</td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            record.status === 'approved' ? 'bg-green-900/30 text-green-400' :
                            record.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                            record.status === 'rejected' ? 'bg-red-900/30 text-red-400' :
                            'bg-gray-900/30 text-gray-400'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="py-3 text-right text-green-400">
                          ${record.totalEarnings.toFixed(2)}
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => handleUpdateEarnings(record)}
                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-bg rounded-2xl p-6 max-w-md w-full border border-gray-700/50">
            <h3 className="text-xl font-bold text-white mb-4">Approve Application</h3>
            <p className="text-gray-400 mb-4">
              Approve monetization for {selectedRecord.userId.name}
            </p>
            
            <form onSubmit={submitApproval}>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">Earnings Rate ($ per 1,000 streams)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.10"
                  max="10.00"
                  value={earningsRate}
                  onChange={(e) => setEarningsRate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">Platform Commission (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={platformCommission}
                  onChange={(e) => setPlatformCommission(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-300 text-sm mb-2">Admin Notes (Optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Add any notes for this approval..."
                ></textarea>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-bg rounded-2xl p-6 max-w-md w-full border border-gray-700/50">
            <h3 className="text-xl font-bold text-white mb-4">Reject Application</h3>
            <p className="text-gray-400 mb-4">
              Reject monetization application for {selectedRecord.userId.name}
            </p>
            
            <form onSubmit={submitRejection}>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Explain why this application is being rejected..."
                  required
                ></textarea>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-300 text-sm mb-2">Admin Notes (Optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={2}
                  placeholder="Additional notes..."
                ></textarea>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Earnings Configuration Modal */}
      {showEarningsModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-bg rounded-2xl p-6 max-w-md w-full border border-gray-700/50">
            <h3 className="text-xl font-bold text-white mb-4">Update Earnings Configuration</h3>
            <p className="text-gray-400 mb-4">
              Update earnings settings for {selectedRecord.userId.name}
            </p>
            
            <form onSubmit={submitEarningsUpdate}>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">Earnings Rate ($ per 1,000 streams)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.10"
                  max="10.00"
                  value={earningsRate}
                  onChange={(e) => setEarningsRate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">Platform Commission (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={platformCommission}
                  onChange={(e) => setPlatformCommission(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-300 text-sm mb-2">Admin Notes (Optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Reason for changes..."
                ></textarea>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEarningsModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-primary-light text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
