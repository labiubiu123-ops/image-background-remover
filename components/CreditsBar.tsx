'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface CreditsBarProps {
  onUpgradeClick: () => void
}

export default function CreditsBar({ onUpgradeClick }: CreditsBarProps) {
  const { data: session, status } = useSession()
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status !== 'authenticated') { setLoading(false); return }
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(d => { setCredits(d.credits); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status])

  if (status !== 'authenticated' || loading) return null

  const unlimited = credits === -1
  const low = !unlimited && credits !== null && credits <= 1

  return (
    <div className="flex items-center gap-2 text-sm">
      {unlimited ? (
        <span className="flex items-center gap-1.5 text-violet-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Pro · 无限次
        </span>
      ) : (
        <button
          onClick={credits === 0 ? onUpgradeClick : undefined}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 border transition-all
            ${low
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
              : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
        >
          <span>{low ? '⚠️' : '💎'}</span>
          <span>{credits ?? 0} 积分剩余</span>
          {credits === 0 && (
            <span className="ml-1 text-xs text-amber-300 underline">充值</span>
          )}
        </button>
      )}
    </div>
  )
}
