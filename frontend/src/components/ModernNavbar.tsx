'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import notificationService from '../services/notificationService'
import LanguageModal from './LanguageModal'

export default function ModernNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  
  const userMenuRef = useRef<HTMLDivElement>(null)
  const categoriesRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated: actualAuth, user: actualUser, logout } = useAuth()
  const { t, language: actualLanguage, setLanguage } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  
  // Use mounted state to avoid hydration mismatch
  const mountedAuth = mounted ? actualAuth : false
  const mountedUser = mounted ? actualUser : null
  const language = mounted ? actualLanguage : 'en'

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch unread notification count
  useEffect(() => {
    if (mountedAuth) {
      const fetchUnreadCount = async () => {
        try {
           const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
          if (token) {
            notificationService.setToken(token)
            const response = await notificationService.getUnreadCount()
            setUnreadCount(response.count)
          }
        } catch (error) {
          console.error('Error fetching unread count:', error)
        }
      }
      fetchUnreadCount()
    }
  }, [mountedAuth])

  // Categories
  const categories = [
    { id: 'home', name: t('home'), icon: '🏠' },
    { id: 'charts', name: t('charts'), icon: '📊' },
    { id: 'beats', name: t('beats'), icon: '🎵' },
    { id: 'mixes', name: t('mixes'), icon: '🎧' },
    { id: 'afrobeat', name: 'Afrobeat', icon: '🌍' },
    { id: 'hiphop', name: 'Hip Hop', icon: '🎤' },
    { id: 'rnb', name: 'R&B', icon: '🎷' },
    { id: 'afropop', name: 'Afropop', icon: '🎸' },
    { id: 'gospel', name: 'Gospel', icon: '⛪' },
    { id: 'dancehall', name: 'Dancehall', icon: '💃' },
    { id: 'reggae', name: 'Reggae', icon: '🇯🇲' },
    { id: 'pop', name: 'Pop', icon: '✨' },
    { id: 'electronic', name: 'Electronic', icon: '⚡' },
    { id: 'community', name: t('community'), icon: '👥' },
  ]

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    switch(categoryId) {
      case 'home':
        router.push('/')
        break
      case 'charts':
        router.push('/charts')
        break
      case 'beats':
      case 'mixes':
        router.push(`/explore?type=${categoryId}`)
        break
      case 'community':
        router.push('/community')
        break
      default:
        router.push(`/explore?genre=${categoryId}`)
    }
    setShowCategories(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const handleProfileClick = () => {
    setShowUserMenu(false)
    setTimeout(() => {
      router.push('/library')
    }, 100)
  }

  const handleLogout = async () => {
    await logout()
    setShowUserMenu(false)
    router.push('/')
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'glass-strong backdrop-blur-xl shadow-lg' 
            : 'glass-light backdrop-blur-md'
        }`}
      >
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            
            {/* Left: Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-gold-400 via-orange-500 to-gold-600 flex items-center justify-center shadow-glow-gold group-hover:shadow-glow-primary transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-lg md:text-xl">M</span>
              </div>
              <span className="hidden sm:block text-xl md:text-2xl font-black gradient-text tracking-tight">
                MuzikaX
              </span>
            </Link>

            {/* Center: Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4 md:mx-8">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400 group-focus-within:text-gold-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search songs, artists, albums..."
                  className="w-full pl-12 pr-20 py-3 md:py-3.5 rounded-full bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-transparent transition-all duration-300 hover:bg-white/10"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gradient-to-r from-gold-500 to-orange-500 text-white hover:from-gold-400 hover:to-orange-400 transition-all duration-300 shadow-lg hover:shadow-glow-primary"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Categories Button */}
              <button
                onClick={() => setShowCategories(!showCategories)}
                className={`hidden md:flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 ${
                  showCategories 
                    ? 'bg-gradient-to-r from-gold-500/20 to-orange-500/20 text-gold-400 border border-gold-500/30' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="text-sm font-medium">Browse</span>
              </button>

              {/* Language Switcher */}
              <button
                onClick={() => setShowLanguageModal(true)}
                className="hidden md:flex items-center gap-2 px-3 py-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300"
              >
                <span className="text-lg">🌐</span>
                <span className="text-sm font-medium uppercase">{language}</span>
              </button>

              {/* Notifications */}
              {mountedAuth && (
                <button className="relative p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full ring-2 ring-background animate-pulse" />
                  )}
                </button>
              )}

              {/* Messages */}
              {mountedAuth && (
                <button className="hidden md:flex p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
              )}

              {/* Upload Button */}
              <button
                onClick={() => {
                  if (!mountedAuth) {
                    router.push('/login')
                  } else {
                    router.push('/upload')
                  }
                }}
                className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-gold-500 to-orange-500 text-white font-semibold hover:from-gold-400 hover:to-orange-400 transition-all duration-300 shadow-lg hover:shadow-glow-primary hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm">{t('upload')}</span>
              </button>

              {/* User Menu / Login */}
              {mountedAuth && mountedUser ? (
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 pr-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300"
                  >
                    {mountedUser.avatar ? (
                      <Image
                        src={mountedUser.avatar}
                        alt={mountedUser.name}
                        width={36}
                        height={36}
                        className="rounded-full object-cover ring-2 ring-gold-400/50"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-orange-500 flex items-center justify-center text-sm font-bold text-white ring-2 ring-gold-400/50">
                        {mountedUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-56 glass-strong rounded-2xl border border-white/10 shadow-xl overflow-hidden py-2"
                      >
                        <div className="px-4 py-3 border-b border-white/5">
                          <p className="text-sm font-semibold text-white">{mountedUser.name}</p>
                          <p className="text-xs text-gray-400 capitalize">{mountedUser.role}</p>
                        </div>
                        
                        <div className="py-1">
                          <button
                            onClick={handleProfileClick}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Profile
                          </button>
                          <button
                            onClick={() => {
                              setShowUserMenu(false)
                              router.push('/settings')
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Settings
                          </button>
                        </div>
                        
                        <div className="border-t border-white/5 py-1">
                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => router.push('/login')}
                  className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 text-white font-medium hover:bg-white/5 hover:border-white/30 transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-sm">Log In</span>
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300"
              >
                {isMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Categories Dropdown */}
      <AnimatePresence>
        {showCategories && (
          <motion.div
            ref={categoriesRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-strong border-t border-white/10 overflow-hidden"
          >
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl group mx-surface"
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{cat.icon}</span>
                    <span className="text-xs font-medium text-gray-300 group-hover:text-white text-center">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language Modal */}
      {showLanguageModal && (
        <LanguageModal />
      )}
    </>
  )
}
