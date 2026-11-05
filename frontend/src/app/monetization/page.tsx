'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { FaArrowLeft } from 'react-icons/fa'
import { 
  getMonetizationStatus, 
  applyForMonetization, 
  requestPayout, 
  getEarningsReport 
} from '../../services/monetizationService'

interface MonetizationStatus {
  status: 'not_applied' | 'pending' | 'approved' | 'rejected' | 'suspended'
  requirements: {
    followersRequired: number
    tracksRequired: number
    currentFollowers: number
    currentTracks: number
    requirementsMet: boolean
  }
  earnings?: {
    totalEarnings: number
    pendingEarnings: number
    paidEarnings: number
    earningsRate: number
    platformCommission: number
  }
  applicationDate?: string
  approvalDate?: string
  rejectionReason?: string
}

interface EarningsReport {
  summary: {
    totalEarnings: number
    pendingEarnings: number
    paidEarnings: number
    totalPlays: number
    totalTracks: number
  }
  trackEarnings: Array<{
    trackId: string
    trackTitle: string
    plays: number
    earnings: number
  }>
  payoutHistory: Array<{
    amount: number
    date: string
    status: 'processed' | 'pending' | 'failed'
    paymentMethod: string
    reference: string
  }>
  earningsRate: number
  platformCommission: number
}

export default function Monetization() {
  const [status, setStatus] = useState<MonetizationStatus | null>(null)
  const [report, setReport] = useState<EarningsReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutMethod, setPayoutMethod] = useState('mobile_money')
  const [payoutLoading, setPayoutLoading] = useState(false)
  
  const router = useRouter()
  const { isAuthenticated, user, isLoading } = useAuth()

  // Check authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router, isLoading])

  // Fetch monetization status
  useEffect(() => {
    const fetchStatus = async () => {
      if (!user || user.role !== 'creator') return
      
      try {
        setLoading(true)
        setError(null)
        const statusData = await getMonetizationStatus()
        setStatus(statusData)
        
        // If approved, fetch earnings report
        if (statusData.status === 'approved') {
          const reportData = await getEarningsReport()
          setReport(reportData)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (user?.role === 'creator') {
      fetchStatus()
    }
  }, [user])

  const handleApply = async () => {
    try {
      setLoading(true)
      const result = await applyForMonetization()
      setStatus(result)
      alert('Application submitted successfully!')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!status?.earnings) return

    const amount = parseFloat(payoutAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (amount > status.earnings.pendingEarnings) {
      alert('Amount exceeds available earnings')
      return
    }

    if (amount < 10) {
      alert('Minimum payout amount is $10')
      return
    }

    try {
      setPayoutLoading(true)
      await requestPayout({ amount, paymentMethod: payoutMethod })
      
      // Refresh status
      const updatedStatus = await getMonetizationStatus()
      setStatus(updatedStatus)
      
      if (updatedStatus.status === 'approved') {
        const updatedReport = await getEarningsReport()
        setReport(updatedReport)
      }
      
      setShowPayoutModal(false)
      setPayoutAmount('')
      alert('Payout request submitted successfully!')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setPayoutLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'creator') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4 text-text-primary">Access Denied</h2>
          <p>Only creators can access monetization features.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-white text-center">Loading monetization data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 overflow-x-hidden relative pt-14 md:pt-0 bg-background">
      <div className="absolute -top-40 -left-20 w-64 h-64 sm:w-96 sm:h-96 bg-primary/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-40 -right-20 w-64 h-64 sm:w-96 sm:h-96 bg-primary-light/10 rounded-full blur-3xl -z-10"></div>
      
      {/* Mobile Header with Back Button */}
      <div className="md:hidden sticky top-0 z-50 bg-gray-900/95 backdrop-blur-lg border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white transition-colors p-2 -ml-2"
              aria-label="Go back"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black text-text-primary">Monetization</h1>
              <p className="text-xs text-gray-400">Earn from your music</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Wrapper to prevent overflow */}
          <div className="w-full overflow-x-hidden">
          {/* Desktop Header */}
          <div className="hidden md:block text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-text-primary">
              Monetization Center
            </h1>
            <p className="text-gray-400">
              Earn money from your music streams
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {!status ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading...</p>
            </div>
          ) : (
            <>
              {/* How Monetization Works (Beta Phase) - NEW SECTION */}
              <div className="card-bg rounded-2xl p-4 sm:p-6 mb-6 border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
                <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-light rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold mb-2 text-text-primary">How Monetization Works (Beta Phase) 🔥</h2>
                    <p className="text-gray-400 text-sm sm:text-base mb-4">
                      We are currently growing our platform and user base. During this early stage, direct cash payouts are not yet active.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700">
                    <div className="text-blue-400 font-bold mb-2 text-sm sm:text-base">🎯 Our Focus</div>
                    <ul className="text-gray-300 text-xs sm:text-sm space-y-1">
                      <li>• Help artists grow their audience</li>
                      <li>• Track real streams & engagement</li>
                      <li>• Prepare a fair payment system</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-700">
                    <div className="text-primary-light font-bold mb-2 text-sm sm:text-base">💡 Why Beta?</div>
                    <ul className="text-gray-300 text-xs sm:text-sm space-y-1">
                      <li>• Building sustainable foundation</li>
                      <li>• Ensuring quality metrics</li>
                      <li>• Testing payment infrastructure</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-green-900/20 rounded-lg border border-green-700">
                    <div className="text-green-400 font-bold mb-2 text-sm sm:text-base">🚀 What's Next</div>
                    <ul className="text-gray-300 text-xs sm:text-sm space-y-1">
                      <li>• Live monetization activation</li>
                      <li>• Real earnings distribution</li>
                      <li>• Advanced analytics dashboard</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Status Card */}
              <div className="card-bg rounded-2xl p-6 mb-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-text-primary">Monetization Status</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    status.status === 'approved' ? 'bg-green-900/30 text-green-400 border border-green-700' :
                    status.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700' :
                    status.status === 'rejected' ? 'bg-red-900/30 text-red-400 border border-red-700' :
                    'bg-gray-900/30 text-gray-400 border border-gray-700'
                  }`}>
                    {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                  </span>
                </div>

                {status.status === 'not_applied' && (
                  <div className="text-center py-8">
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-2 text-text-primary">Get Started with Monetization</h3>
                      <p className="text-gray-400 mb-6">
                        To start earning from your music streams, you need to meet our requirements:
                      </p>
                      
                      {/* Requirements */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className={`p-4 rounded-lg border ${
                          status.requirements.currentFollowers >= status.requirements.followersRequired
                            ? 'bg-green-900/20 border-green-700'
                            : 'bg-gray-800/50 border-gray-700'
                        }`}>
                          <div className="text-2xl font-bold text-white">
                            {status.requirements.currentFollowers}
                            <span className="text-lg text-gray-400">/{status.requirements.followersRequired}</span>
                          </div>
                          <div className="text-gray-400">Followers</div>
                          {status.requirements.currentFollowers >= status.requirements.followersRequired && (
                            <div className="text-green-400 text-sm mt-1">✓ Requirement met</div>
                          )}
                        </div>
                        
                        <div className={`p-4 rounded-lg border ${
                          status.requirements.currentTracks >= status.requirements.tracksRequired
                            ? 'bg-green-900/20 border-green-700'
                            : 'bg-gray-800/50 border-gray-700'
                        }`}>
                          <div className="text-2xl font-bold text-white">
                            {status.requirements.currentTracks}
                            <span className="text-lg text-gray-400">/{status.requirements.tracksRequired}</span>
                          </div>
                          <div className="text-gray-400">Tracks</div>
                          {status.requirements.currentTracks >= status.requirements.tracksRequired && (
                            <div className="text-green-400 text-sm mt-1">✓ Requirement met</div>
                          )}
                        </div>
                      </div>
                      
                      {status.requirements.requirementsMet ? (
                        <button
                          onClick={handleApply}
                          disabled={loading}
                          className="px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                        >
                          {loading ? 'Applying...' : 'Apply for Monetization'}
                        </button>
                      ) : (
                        <div className="text-gray-400">
                          <p>You need to meet all requirements to apply for monetization.</p>
                          <p className="text-sm mt-2">Keep creating and growing your audience!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {status.status === 'pending' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2 text-text-primary">Application Under Review</h3>
                    <p className="text-gray-400">
                      Your monetization application is being reviewed by our team. This usually takes 1-3 business days.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Applied on: {new Date(status.applicationDate || '').toLocaleDateString()}
                    </p>
                  </div>
                )}

                {status.status === 'approved' && status.earnings && (
                  <div>
                    {/* Earnings Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-green-900/20 rounded-lg border border-green-700">
                        <div className="text-xl sm:text-2xl font-bold text-green-400">${status.earnings.totalEarnings.toFixed(2)}</div>
                        <div className="text-gray-400 text-sm">Total Earnings</div>
                      </div>
                      
                      <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-700">
                        <div className="text-xl sm:text-2xl font-bold text-yellow-400">${status.earnings.pendingEarnings.toFixed(2)}</div>
                        <div className="text-gray-400 text-sm">Pending Earnings</div>
                        {status.earnings.pendingEarnings >= 10 && (
                          <button
                            onClick={() => setShowPayoutModal(true)}
                            className="mt-2 text-xs bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded"
                          >
                            Request Payout
                          </button>
                        )}
                      </div>
                      
                      <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700">
                        <div className="text-xl sm:text-2xl font-bold text-blue-400">${status.earnings.paidEarnings.toFixed(2)}</div>
                        <div className="text-gray-400 text-sm">Paid Out</div>
                      </div>
                    </div>

                    {/* Earnings Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                      <div>
                        <span className="text-gray-400">Earnings Rate: </span>
                        <span className="text-white">${status.earnings.earningsRate.toFixed(2)} per 1,000 streams</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Platform Commission: </span>
                        <span className="text-white">{status.earnings.platformCommission}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400">You Receive: </span>
                        <span className="text-white">{100 - status.earnings.platformCommission}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Approved on: </span>
                        <span className="text-white">{new Date(status.approvalDate || '').toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {status.status === 'rejected' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2 text-text-primary">Application Rejected</h3>
                    <p className="text-gray-400 mb-4">
                      {status.rejectionReason || 'Your application did not meet our requirements.'}
                    </p>
                    <button
                      onClick={handleApply}
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                      {loading ? 'Reapplying...' : 'Reapply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Earnings Report (only for approved creators) */}
              {status.status === 'approved' && report && (
                <div className="card-bg rounded-2xl p-6 border border-gray-700/50">
                  <h2 className="text-xl font-bold mb-4 text-text-primary">Earnings Report</h2>
                  
                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                      <div className="text-lg font-bold text-white">{report.summary.totalTracks}</div>
                      <div className="text-gray-400 text-sm">Total Tracks</div>
                    </div>
                    <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                      <div className="text-lg font-bold text-white">{report.summary.totalPlays.toLocaleString()}</div>
                      <div className="text-gray-400 text-sm">Total Plays</div>
                    </div>
                    <div className="text-center p-3 bg-green-900/20 rounded-lg">
                      <div className="text-lg font-bold text-green-400">${report.summary.totalEarnings.toFixed(2)}</div>
                      <div className="text-gray-400 text-sm">Total Earnings</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-900/20 rounded-lg">
                      <div className="text-lg font-bold text-yellow-400">${report.summary.pendingEarnings.toFixed(2)}</div>
                      <div className="text-gray-400 text-sm">Pending</div>
                    </div>
                    <div className="text-center p-3 bg-blue-900/20 rounded-lg">
                      <div className="text-lg font-bold text-blue-400">${report.summary.paidEarnings.toFixed(2)}</div>
                      <div className="text-gray-400 text-sm">Paid Out</div>
                    </div>
                  </div>

                  {/* Track Earnings */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3 text-text-primary">Earnings by Track</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-2 text-gray-400">Track</th>
                            <th className="text-right py-2 text-gray-400">Plays</th>
                            <th className="text-right py-2 text-gray-400">Earnings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.trackEarnings.map((track, index) => (
                            <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/30">
                              <td className="py-3 text-white">{track.trackTitle}</td>
                              <td className="py-3 text-right text-gray-300">{track.plays.toLocaleString()}</td>
                              <td className="py-3 text-right text-green-400">${track.earnings.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Payout History */}
                  {report.payoutHistory.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3 text-text-primary">Payout History</h3>
                      <div className="space-y-2">
                        {report.payoutHistory.map((payout, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                            <div>
                              <div className="text-white font-medium">${payout.amount.toFixed(2)}</div>
                              <div className="text-gray-400 text-sm">{new Date(payout.date).toLocaleDateString()}</div>
                              <div className="text-gray-500 text-xs">{payout.paymentMethod}</div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              payout.status === 'processed' ? 'bg-green-900/30 text-green-400' :
                              payout.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                              'bg-red-900/30 text-red-400'
                            }`}>
                              {payout.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-bg rounded-2xl p-6 max-w-md w-full border border-gray-700/50">
            <h3 className="text-xl font-bold mb-4 text-text-primary">Request Payout</h3>
            
            <form onSubmit={handlePayout}>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="10"
                  max={status?.earnings?.pendingEarnings}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                  required
                />
                <p className="text-gray-500 text-xs mt-1">
                  Available: ${status?.earnings?.pendingEarnings.toFixed(2) || '0.00'}
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-300 text-sm mb-2">Payment Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payoutLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-primary-light text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {payoutLoading ? 'Processing...' : 'Request Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  </div>
)
}
