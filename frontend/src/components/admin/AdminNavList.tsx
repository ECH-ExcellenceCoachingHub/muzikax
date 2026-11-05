'use client'

import Link from 'next/link'
import AdminIcon from './AdminIcon'
import { ADMIN_NAV, isAdminNavItemActive } from './adminNav'

interface AdminNavListProps {
  pathname: string | null
  /** Icon-only rail. Section labels collapse to a divider. */
  collapsed?: boolean
  /** Fired after a link is followed — used to close the mobile drawer. */
  onNavigate?: () => void
}

/**
 * Renders the grouped admin navigation. Shared by the desktop sidebar and the
 * mobile drawer so both stay in sync automatically.
 */
export default function AdminNavList({
  pathname,
  collapsed = false,
  onNavigate,
}: AdminNavListProps) {
  return (
    <nav className="flex flex-col gap-6" aria-label="Admin navigation">
      {ADMIN_NAV.map((section) => (
        <div key={section.title}>
          {collapsed ? (
            <div className="mx-auto mb-2 h-px w-8 bg-gray-800" aria-hidden="true" />
          ) : (
            <h2 className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {section.title}
            </h2>
          )}

          <ul className="space-y-1">
            {section.items.map((item) => {
              const active = isAdminNavItemActive(pathname, item)

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    title={collapsed ? item.name : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      collapsed ? 'justify-center' : ''
                    } ${
                      active
                        ? 'bg-primary/15 text-white'
                        : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'
                    }`}
                  >
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary to-primary-light"
                        aria-hidden="true"
                      />
                    )}

                    <AdminIcon
                      name={item.icon}
                      className={`h-5 w-5 flex-shrink-0 ${active ? 'text-primary' : ''}`}
                    />

                    {!collapsed && <span className="truncate">{item.name}</span>}

                    {/* Tooltip for the collapsed rail */}
                    {collapsed && (
                      <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg border border-gray-800 bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-xl group-hover:block">
                        {item.name}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
