'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import AdminIcon from './AdminIcon'
import { resolveAdminNavItem } from './adminNav'

interface AdminTopbarProps {
  pathname: string | null
  onOpenMobileNav: () => void
  user: { name?: string; email?: string; avatar?: string } | null
  onLogout: () => void
}

/**
 * Sticky admin header. Owns the page title, breadcrumb and account menu so
 * individual pages no longer have to render their own heading block.
 */
export default function AdminTopbar({
  pathname,
  onOpenMobileNav,
  user,
  onLogout,
}: AdminTopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const current = resolveAdminNavItem(pathname)
  const title = current?.name ?? 'Admin'
  const description = current?.description ?? 'MuzikaX administration'
  const isDashboard = current?.href === '/admin'

  // Close the account menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  const initial = (user?.name || user?.email || 'A').charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-30 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Mobile drawer trigger */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="rounded-lg border border-gray-800 p-2 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white lg:hidden"
          aria-label="Open navigation menu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-xs text-gray-500 sm:flex">
            <Link href="/admin" className="transition-colors hover:text-gray-300">
              Admin
            </Link>
            {!isDashboard && (
              <>
                <span aria-hidden="true">/</span>
                <span className="text-gray-400">{title}</span>
              </>
            )}
          </nav>

          <h1 className="truncate text-lg font-bold text-white sm:text-xl">{title}</h1>
          <p className="hidden truncate text-sm text-gray-500 sm:block">{description}</p>
        </div>

        {/* Back to site */}
        <Link
          href="/"
          className="hidden items-center gap-2 rounded-lg border border-gray-800 px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white sm:flex"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          View site
        </Link>

        {/* Account menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-lg border border-gray-800 py-1.5 pl-1.5 pr-2 transition-colors hover:bg-gray-800"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary to-primary-light text-sm font-bold text-white">
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </span>
            <span className="hidden max-w-[10rem] truncate text-sm font-medium text-white md:block">
              {user?.name || 'Administrator'}
            </span>
            <svg
              className={`hidden h-4 w-4 text-gray-500 transition-transform md:block ${menuOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-2xl"
            >
              <div className="border-b border-gray-800 px-4 py-3">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.name || 'Administrator'}
                </p>
                <p className="truncate text-xs text-gray-500">{user?.email || 'admin'}</p>
              </div>

              <Link
                href="/"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white sm:hidden"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                View site
              </Link>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onLogout()
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <AdminIcon name="logout" className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
