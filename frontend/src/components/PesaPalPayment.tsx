'use client'

import { useState, useEffect } from 'react'
import { FaMobileAlt, FaCheckCircle, FaTimesCircle, FaSpinner, FaInfoCircle, FaCreditCard, FaWallet, FaUniversity } from 'react-icons/fa'

interface PesaPalPaymentProps {
  trackId: string
  trackTitle: string
  price: number
  onClose: () => void
  onSuccess: (downloadLink: string) => void
}

interface PaymentStatus {
  status: 'idle' | 'processing' | 'redirecting' | 'success' | 'failed'
  message: string
  orderId?: string
  redirectUrl?: string
  downloadLink?: string
}

export default function PesaPalPayment({
  trackId,
  trackTitle,
  price,
  onClose,
  onSuccess
}: PesaPalPaymentProps) {
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'mobile' | 'card' | 'bank'>('mobile')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    status: 'idle',
    message: ''
  })
  const [countdown, setCountdown] = useState(120) // 2 minutes for PesaPal
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone number format
  const isValidPhoneNumber = (number: string): boolean => {
    const cleanNumber = number.replace(/\D/g, '');
    return cleanNumber.length >= 9 && cleanNumber.length <= 15;
  }

  // Initiate payment
  const initiatePayment = async () => {
    // Either email OR phone number is required (PesaPal requirement)
    if (!email && !phoneNumber) {
      setPaymentStatus({
        status: 'failed',
        message: 'Please provide either an email address or phone number'
      })
      return
    }

    // Validate email if provided
    if (email && !isValidEmail(email)) {
      setPaymentStatus({
        status: 'failed',
        message: 'Please enter a valid email address'
      })
      return
    }

    // Validate phone number if provided
    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
      setPaymentStatus({
        status: 'failed',
        message: 'Please enter a valid phone number'
      })
      return
    }

    try {
      setPaymentStatus({
        status: 'processing',
        message: 'Initializing payment request...'
      })

      let response = await fetch('/api/payments/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        },
        body: JSON.stringify({
          trackId,
          phoneNumber: phoneNumber || '',
          email: email || '',
          amount: price
        })
      })

      // If token is expired, try to refresh it
      if (response.status === 401) {
        console.log('Token might be expired, attempting to refresh...');
        const refreshTokenValue = localStorage.getItem('refreshToken');
        if (refreshTokenValue) {
          const refreshResponse = await fetch('/api/auth/refresh-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken: refreshTokenValue })
          });
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            localStorage.setItem('accessToken', refreshData.accessToken);
            localStorage.setItem('refreshToken', refreshData.refreshToken);
            
            // Retry the request with new token
            response = await fetch('/api/payments/request', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${refreshData.accessToken}`
              },
              body: JSON.stringify({
                trackId,
                phoneNumber: phoneNumber || '',
                email,
                amount: price
              })
            });
          } else {
            // If refresh failed, redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return;
          }
        } else {
          // No refresh token available, redirect to login
          window.location.href = '/login';
          return;
        }
      }

      const data = await response.json()

      if (response.ok) {
        setPaymentStatus({
          status: 'redirecting',
          message: 'Redirecting to PesaPal secure payment page...',
          orderId: data.orderId,
          redirectUrl: data.redirectUrl
        })
        
        // Redirect to PesaPal after a short delay
        setTimeout(() => {
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl
          }
        }, 2000)
        
        // Start countdown timer
        startStatusCheck(data.orderId)
      } else {
        setPaymentStatus({
          status: 'failed',
          message: data.message || 'Failed to initiate payment'
        })
      }
    } catch (error: any) {
      console.error('Payment initiation error:', error)
      
      // Handle different types of errors
      let errorMessage = 'Network error. Please try again.';
      
      if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
        errorMessage = 'Payment service temporarily unavailable. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setPaymentStatus({
        status: 'failed',
        message: errorMessage
      })
    }
  }

  // Start checking payment status
  const startStatusCheck = (orderId: string) => {
    setCountdown(120) // 2 minutes for PesaPal
    const interval = setInterval(async () => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          if (paymentStatus.status === 'redirecting' || paymentStatus.status === 'processing') {
            setPaymentStatus({
              status: 'failed',
              message: 'Payment timeout. Please check your email for payment confirmation or try again.'
            })
          }
          return 0
        }
        return prev - 1
      })

      // Check payment status
      if (paymentStatus.status === 'redirecting' || paymentStatus.status === 'processing') {
        try {
          setIsCheckingStatus(true)
          const response = await fetch(`/api/payments/status/${orderId}`, {
            credentials: 'include'
          })
          
          const data = await response.json()
          
          if (response.ok) {
            if (data.status === 'completed') {
              clearInterval(interval)
              setPaymentStatus({
                status: 'success',
                message: 'Payment successful!',
                downloadLink: data.downloadLink
              })
              
              if (data.downloadLink) {
                setTimeout(() => {
                  onSuccess(data.downloadLink)
                  onClose()
                }, 2000)
              }
            } else if (data.status === 'failed') {
              clearInterval(interval)
              setPaymentStatus({
                status: 'failed',
                message: 'Payment failed. Please try again.'
              })
            }
          }
        } catch (error) {
          console.error('Status check error:', error)
        } finally {
          setIsCheckingStatus(false)
        }
      }
    }, 5000) // Check every 5 seconds for PesaPal
  }

  // Reset payment flow
  const resetPayment = () => {
    setPaymentStatus({
      status: 'idle',
      message: ''
    })
    setCountdown(120)
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-[9999] p-2 sm:p-4 overflow-hidden">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md sm:max-w-lg border border-gray-700 overflow-hidden shadow-2xl animate-fade-in transform transition-all duration-300 scale-100 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-4 sm:p-6 flex items-center justify-between relative flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg sm:text-xl text-text-primary">Buy Beat</h2>
            <p className="text-white/80 text-xs sm:text-sm mt-1">Secure payment processing</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-1 sm:p-2 rounded-full hover:bg-white/10"
          >
            <FaTimesCircle size={20} className="sm:w-7 sm:h-7" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
          {/* Track Info */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-4 sm:p-6 mb-6 border border-gray-700 shadow-lg">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2 truncate text-text-primary">{trackTitle}</h3>
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-green-400 font-extrabold text-xl sm:text-2xl">{price.toLocaleString()}</span>
                  <span className="text-gray-400 font-medium text-sm">RWF</span>
                </div>
              </div>
              <div className="bg-green-500/20 p-2 sm:p-3 rounded-xl border border-green-500/30 flex-shrink-0">
                <FaCreditCard className="text-green-400 text-xl sm:text-2xl" />
              </div>
            </div>
          </div>

          {paymentStatus.status === 'idle' && (
            <div className="space-y-8">
              {/* Payment Information */}
              <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-700 mb-6">
                <h3 className="text-gray-300 font-semibold mb-3 sm:mb-4 text-center text-sm sm:text-base">Payment Information</h3>
                <p className="text-gray-400 text-center text-sm mb-4">
                  Provide either email or phone number for payment confirmation
                </p>
              </div>

              {/* Email Input */}
              <div className="space-y-2 mb-4">
                <label className="block text-gray-300 font-medium text-sm flex items-center gap-2">
                  <FaCreditCard className="text-green-500 text-sm" />
                  Email Address <span className="text-gray-500 text-xs">(Optional if phone provided)</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 text-sm"
                  />
                </div>
                <p className="text-xs text-gray-400 ml-1">
                  Required for payment confirmation (or provide phone number)
                </p>
              </div>
              
              {/* Phone Number Input */}
              <div className="space-y-2 mb-5">
                <label className="block text-gray-300 font-medium text-sm flex items-center gap-2">
                  <FaMobileAlt className="text-blue-500 text-sm" />
                  Phone Number <span className="text-gray-500 text-xs">(Optional if email provided)</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+250XXXXXXXX"
                    className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                  />
                </div>
                <p className="text-xs text-gray-400 ml-1">
                  For SMS notifications (or provide email address)
                </p>
              </div>

              {/* Payment Button */}
              <button
                onClick={initiatePayment}
                disabled={!email.trim() && !phoneNumber.trim()}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-4 sm:py-4 sm:px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
              >
                <FaCreditCard className="text-sm sm:text-base" />
                <span>Pay • {price.toLocaleString()} RWF</span>
              </button>
            </div>
          )}

          {paymentStatus.status === 'processing' && (
            <div className="text-center space-y-5">
              
              <div className="flex justify-center">
                <div className="relative">
                  <FaSpinner className="animate-spin text-4xl sm:text-5xl text-yellow-500" />
                  {isCheckingStatus && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FaInfoCircle className="text-blue-500 text-xl sm:text-2xl" />
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-white font-bold text-lg sm:text-xl">{paymentStatus.message}</p>
                <p className="text-gray-400 text-sm mt-1">Please wait while we process your payment...</p>
              </div>

              <div className="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-800 rounded-xl p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <FaInfoCircle className="text-yellow-400 text-lg sm:text-xl mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-200 font-medium text-sm">Secure Processing</p>
                    <p className="text-yellow-300 text-xs mt-1">
                      Your payment is being securely processed through PesaPal
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {paymentStatus.status === 'redirecting' && (
            <div className="text-center space-y-5">
              
              <div className="flex justify-center">
                <FaSpinner className="animate-spin text-4xl sm:text-5xl text-blue-500" />
              </div>
              
              <div>
                <p className="text-white font-bold text-lg sm:text-xl">{paymentStatus.message}</p>
                <p className="text-gray-400 text-sm mt-1">
                  Time remaining: <span className="text-blue-400 font-bold">{countdown}s</span>
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-800 rounded-xl p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <FaInfoCircle className="text-blue-400 text-lg sm:text-xl mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-200 font-medium text-sm">Redirecting to PesaPal</p>
                    <p className="text-blue-300 text-xs mt-1">
                      You will be redirected to complete your transaction
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {paymentStatus.status === 'success' && (
            <div className="text-center space-y-5">
              
              <div className="flex justify-center">
                <div className="relative">
                  <FaCheckCircle className="text-5xl sm:text-6xl text-green-500 animate-bounce" />
                  <div className="absolute inset-0 bg-green-500 rounded-full opacity-20 animate-ping"></div>
                </div>
              </div>
              
              <div>
                <p className="text-white font-bold text-xl sm:text-2xl">{paymentStatus.message}</p>
                <p className="text-gray-400 text-sm mt-1">
                  Download will start automatically...
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-800 rounded-xl p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <FaCheckCircle className="text-green-400 text-lg sm:text-xl mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-green-200 font-medium text-sm">Payment Confirmed</p>
                    <p className="text-green-300 text-xs mt-1">
                      🎵 Your beat is ready for download. Thank you!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {paymentStatus.status === 'failed' && (
            <div className="text-center space-y-5">
              
              <div className="flex justify-center">
                <FaTimesCircle className="text-4xl sm:text-5xl text-red-500" />
              </div>
              
              <div>
                <p className="text-white font-bold text-lg sm:text-xl">{paymentStatus.message}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={resetPayment}
                  className="flex-1 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white font-semibold py-2.5 px-4 sm:py-3 sm:px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                >
                  <FaCreditCard className="text-sm" />
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-2.5 px-4 sm:py-3 sm:px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                >
                  <FaTimesCircle className="text-sm" />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-center gap-2 text-gray-400 font-medium text-xs sm:text-sm">
            <FaCreditCard className="text-green-500 text-base sm:text-xl" />
            <span>Powered by PesaPal • Secure SSL</span>
          </div>
        </div>
      </div>
    </div>
  )
}