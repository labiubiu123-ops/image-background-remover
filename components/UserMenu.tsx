'use client'

import { signOut } from 'next-auth/react'
import { useState } from 'react'

interface UserMenuProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export default function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleSignOut = async () => {
    setLoggingOut(true)
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full pl-2 pr-4 py-1.5 transition-all"
      >
        {user.image ? (
          <img src={user.image} alt="" className="w-7 h-7 rounded-full" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold">
            {user.name?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <span className="text-sm text-gray-200 max-w-[120px] truncate">
          {user.name ?? user.email}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-800">
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={loggingOut}
            className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loggingOut ? '退出中…' : '🚪 退出登录'}
          </button>
        </div>
      )}
    </div>
  )
}
