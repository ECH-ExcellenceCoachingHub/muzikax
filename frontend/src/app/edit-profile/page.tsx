'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface UserProfile {
  _id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  genres?: string[]
  whatsappContact?: string
  creatorType?: string
}

export default function EditProfile() {
  const router = useRouter()
  const { user, updateProfile, fetchUserProfile } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    genres: [] as string[],
    whatsappContact: ''
  })
  
  const [customGenre, setCustomGenre] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  // Available genres
  const availableGenres = [
    'Afrobeat', 'Hip Hop', 'R&B', 'Jazz', 'Gospel', 
    'Electronic', 'Pop', 'Reggae', 'Dancehall', 'Soul',
    'Funk', 'Rock', 'Alternative', 'Indie', 'Classical'
  ]

  // Load user data on mount
  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/edit-profile')
      return
    }

    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        genres: user.genres || [],
        whatsappContact: user.whatsappContact || ''
      })
      
      if (user.avatar) {
        setAvatarPreview(user.avatar)
      }
    }
  }, [user, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
    setSuccess('')
  }

  const handleGenreToggle = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }))
  }

  const handleAddCustomGenre = () => {
    if (customGenre.trim() && !formData.genres.includes(customGenre.trim())) {
      setFormData(prev => ({
        ...prev,
        genres: [...prev.genres, customGenre.trim()]
      }))
      setCustomGenre('')
    }
  }

  const handleRemoveGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.filter(g => g !== genre)
    }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Avatar image must be less than 5MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }
      
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }

    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess('')

    try {
      // Prepare update data
      const updateData: Partial<UserProfile> & { creatorType?: 'artist' | 'dj' | 'producer' } = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        bio: formData.bio.trim(),
        genres: formData.genres,
        whatsappContact: formData.whatsappContact.trim()
      }

      // If there's an avatar file, we'd need to upload it first
      // For now, we'll skip avatar update in this basic version
      // You can implement S3 upload here if needed

      const success = await updateProfile(updateData as any)

      if (success) {
        setSuccess('Profile updated successfully!')
        await fetchUserProfile()
        
        setTimeout(() => {
          router.push('/profile')
        }, 1500)
      } else {
        setError('Failed to update profile. Please try again.')
      }
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setError(err.message || 'An error occurred while updating your profile')
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 pt-14 md:pt-8 bg-background">
      {/* Header */}
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-primary text-sm font-bold uppercase tracking-widest inline-flex items-center gap-2 transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        {/* Page Title */}
        <h1 className="text-3xl sm:text-4xl font-black mb-2 text-text-primary">Edit Profile</h1>
        <p className="text-gray-400 mb-8">Update your profile information and settings</p>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-500 font-bold">{success}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-500 font-bold">{error}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 p-6">
            <h3 className="text-lg font-bold mb-4 text-text-primary">Profile Picture</h3>
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-gray-700 bg-gray-800">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
                      <span className="text-4xl sm:text-5xl font-black text-white">
                        {formData.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <label className="block">
                  <span className="text-sm text-gray-400 mb-2 block">Upload new avatar</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="inline-flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl cursor-pointer transition-all active:scale-95"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Choose Image
                  </label>
                </label>
                {avatarFile && (
                  <p className="text-xs text-gray-500 mt-2">{avatarFile.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Basic Info Section */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 p-6">
            <h3 className="text-lg font-bold mb-4 text-text-primary">Basic Information</h3>
            
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-gray-300 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Your stage name or display name"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-bold text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                  placeholder="Tell fans about yourself, your music, and your journey..."
                />
                <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500 characters</p>
              </div>
            </div>
          </div>

          {/* Genres Section */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 p-6">
            <h3 className="text-lg font-bold mb-4 text-text-primary">Music Genres</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-3">Select your genres:</p>
              <div className="flex flex-wrap gap-2">
                {availableGenres.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => handleGenreToggle(genre)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                      formData.genres.includes(genre)
                        ? 'bg-primary text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Genre Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomGenre())}
                className="flex-1 px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="Add custom genre..."
              />
              <button
                type="button"
                onClick={handleAddCustomGenre}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all active:scale-95"
              >
                Add
              </button>
            </div>

            {/* Selected Genres */}
            {formData.genres.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Selected genres:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.genres.map((genre) => (
                    <span
                      key={genre}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/20 text-primary text-sm rounded-xl border border-primary/30"
                    >
                      {genre}
                      <button
                        type="button"
                        onClick={() => handleRemoveGenre(genre)}
                        className="hover:text-white transition-colors"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contact Section */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 p-6">
            <h3 className="text-lg font-bold mb-4 text-text-primary">Contact Information</h3>
            
            <div>
              <label htmlFor="whatsappContact" className="block text-sm font-bold text-gray-300 mb-2">
                WhatsApp Contact
              </label>
              <input
                type="tel"
                id="whatsappContact"
                name="whatsappContact"
                value={formData.whatsappContact}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="+1 234 567 8900"
              />
              <p className="text-xs text-gray-500 mt-1">Fans can contact you via WhatsApp for bookings and collaborations</p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-bold py-3.5 px-6 rounded-2xl transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 sm:flex-none bg-gray-700 hover:bg-gray-600 text-white font-bold py-3.5 px-6 rounded-2xl transition-all active:scale-95"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
