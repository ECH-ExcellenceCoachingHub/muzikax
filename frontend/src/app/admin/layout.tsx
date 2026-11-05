'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import AdminIcon from '../../components/admin/AdminIcon'
import AdminNavList from '../../components/admin/AdminNavList'
import AdminTopbar from '../../components/admin/AdminTopbar'

const COLLAPSE_STORAGE_KEY = 'admin:sidebarCollapsed'
const DESKTOP_BREAKPOINT = 1024 // matches Tailwind `lg`

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user, isAuthenticated, userRole, isLoading } = useAuth()

  const isAdmin = isAuthenticated && userRole === 'admin'

  /**
   * Single auth gate for the whole admin area. Individual pages used to each
   * run their own setTimeout guard, which double-redirected and flashed.
   */
  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.replace('/login')
    } else if (userRole !== 'admin') {
      router.replace('/')
    }
  }, [isLoading, isAuthenticated, userRole, router])

  // Restore the collapsed rail preference.
  useEffect(() => {
    try {
      setIsCollapsed(window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === 'true')
    } catch {
      // Private mode / blocked storage - fall back to expanded.
    }
  }, [])

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((collapsed) => {
      const next = !collapsed
      try {
        window.localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next))
      } catch {
        // Ignore storage failures; the toggle still works for this session.
      }
      return next
    })
  }, [])

  // Close the mobile drawer whenever the route changes or we hit desktop width.
  useEffect(() => {
    setIsMobileNavOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= DESKTOP_BREAKPOINT) setIsMobileNavOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!isMobileNavOpen) return

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileNavOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobileNavOpen])

  if (isLoading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        <span className="sr-only">Checking admin access</span>
      </div>
    )
  }

  const brand = (
    <Link href="/admin" className="group flex items-center gap-3 overflow-hidden">
      <span className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl shadow-lg ring-2 ring-primary/30 transition-all duration-300 group-hover:ring-primary-light/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/muzikax.png" alt="MuzikaX" className="h-full w-full object-cover" />
      </span>
      {!isCollapsed && (
        <span className="min-w-0">
          <span className="block truncate bg-gradient-to-r from-primary to-primary-light bg-clip-text text-lg font-bold text-transparent">
            MuzikaX
          </span>
          <span className="block text-xs font-medium text-gray-500">Admin Panel</span>
        </span>
      )}
    </Link>
  )

  return (
    <div className="min-h-screen text-white bg-background">
      {/* ---------- Desktop sidebar ---------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-gray-800/60 bg-gray-900/60 backdrop-blur-xl transition-[width] duration-300 lg:flex lg:flex-col ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div
          className={`flex h-16 flex-shrink-0 items-center border-b border-gray-800/60 px-4 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          {brand}
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-5">
          <AdminNavList pathname={pathname} collapsed={isCollapsed} />
        </div>

        <div className="flex-shrink-0 border-t border-gray-800/60 p-3">
          <button
            type="button"
            onClick={logout}
            title={isCollapsed ? 'Sign out' : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400 ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <AdminIcon name="logout" className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Sign out</span>}
          </button>
        </div>

        {/* Collapse handle */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-light text-white shadow-lg transition-transform hover:scale-110"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </aside>

      {/* ---------- Mobile drawer ---------- */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-800/60 bg-gray-900 transition-transform duration-300 lg:hidden ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-800/60 px-4">
          {brand}
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(false)}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
            aria-label="Close navigation menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <AdminNavList pathname={pathname} onNavigate={() => setIsMobileNavOpen(false)} />
        </div>

        <div className="flex-shrink-0 border-t border-gray-800/60 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <AdminIcon name="logout" className="h-5 w-5 flex-shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ---------- Content column ---------- */}
      <div
        className={`flex min-h-screen flex-col transition-[padding] duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <AdminTopbar
          pathname={pathname}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          user={user}
          onLogout={logout}
        />

        <div className="relative flex-1 overflow-x-hidden">
          {/* Ambient glow, pinned to the viewport so it never adds scroll height */}
          <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-primary-light/10 blur-3xl" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
