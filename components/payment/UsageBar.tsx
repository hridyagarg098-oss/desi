'use client'

import { useEffect, useState } from 'react'
import { PLAN_LIMITS } from '@/lib/payment/limits'

interface UsageData {
  tokensLeft: number
  tokensTotal: number
  imagesLeft: number
  imagesTotal: number
  secondsLeft: number
  secondsTotal: number
  plan: string
  trialExpired?: boolean
  trialExpiresAt?: string | null
}

interface UsageBarProps {
  tokensLeft?: number | null      // live-updated from chat API response
  tokensTotal?: number | null
  imagesLeft?: number | null      // live-updated from image API response
  onUpgradeClick: () => void
}

function ProgressBar({ used, total, color }: { used: number; total: number; color: string }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, ((total - used) / total) * 100)) : 0
  const isLow = pct < 25
  return (
    <div className="usage-bar-track">
      <div
        className="usage-bar-fill"
        style={{
          width: `${pct}%`,
          background: isLow
            ? 'linear-gradient(90deg, #ef4444, #f97316)'
            : color,
          transition: 'width 0.4s ease, background 0.3s ease',
        }}
      />
    </div>
  )
}

function formatSeconds(s: number): string {
  if (s >= 60) return `${Math.floor(s / 60)}m ${s % 60}s`
  return `${s}s`
}

export function UsageBar({ tokensLeft: propTokensLeft, tokensTotal: propTokensTotal, imagesLeft: propImagesLeft, onUpgradeClick }: UsageBarProps) {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/call/track')
      if (res.ok) {
        const data = await res.json()
        setUsage(data)
      }
    } catch {
      // no-op
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsage()
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsage, 30000)
    return () => clearInterval(interval)
  }, [])

  // Override with live values from props when available
  const tokensLeft  = propTokensLeft  ?? usage?.tokensLeft  ?? 0
  const tokensTotal = propTokensTotal ?? usage?.tokensTotal ?? PLAN_LIMITS.free.tokens_per_day
  const imagesLeft  = propImagesLeft  ?? usage?.imagesLeft  ?? 0
  const imagesTotal = usage?.imagesTotal ?? PLAN_LIMITS.free.images_per_day
  const secondsLeft  = usage?.secondsLeft  ?? 0
  const secondsTotal = usage?.secondsTotal ?? PLAN_LIMITS.free.call_seconds_per_day
  const plan = usage?.plan ?? 'free'

  if (loading) return null

  const planLabel: Record<string, string> = {
    free: 'Free',
    trial: '✨ Trial',
    premium: '👑 Premium',
    basic: 'Basic',
    guest: 'Guest',
  }

  const isLimitReached = tokensLeft === 0 || imagesLeft === 0 || secondsLeft === 0

  return (
    <div className={`usage-bar-wrapper ${isLimitReached ? 'pulsing' : ''}`}>
      {/* Plan badge */}
      <div className="usage-plan-badge">{planLabel[plan] ?? plan}</div>

      {/* Token count */}
      <div className="usage-item">
        <div className="usage-label">
          <span>💬</span>
          <span className={tokensLeft === 0 ? 'text-red' : ''}>
            {tokensLeft}/{tokensTotal} tokens
          </span>
        </div>
        <ProgressBar used={tokensTotal - tokensLeft} total={tokensTotal} color="linear-gradient(90deg, #c4934a, #e8c49a)" />
      </div>

      {/* Image count */}
      <div className="usage-item">
        <div className="usage-label">
          <span>📸</span>
          <span className={imagesLeft === 0 ? 'text-red' : ''}>
            {imagesLeft}/{imagesTotal} photos
          </span>
        </div>
        <ProgressBar used={imagesTotal - imagesLeft} total={imagesTotal} color="linear-gradient(90deg, #8B1538, #c4934a)" />
      </div>

      {/* Call time */}
      <div className="usage-item">
        <div className="usage-label">
          <span>📞</span>
          <span className={secondsLeft === 0 ? 'text-red' : ''}>
            {formatSeconds(secondsLeft)}/{formatSeconds(secondsTotal)}
          </span>
        </div>
        <ProgressBar used={secondsTotal - secondsLeft} total={secondsTotal} color="linear-gradient(90deg, #1a237e, #7986cb)" />
      </div>

      {/* Upgrade CTA — only show for free/expired users */}
      {(plan === 'free' || plan === 'guest' || usage?.trialExpired) && (
        <button className="usage-upgrade-btn" onClick={onUpgradeClick}>
          {usage?.trialExpired ? '🔄 Trial khatam — Renew ₹20' : '⬆️ Trial ₹20/day'}
        </button>
      )}

      <style jsx>{`
        .usage-bar-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 1rem;
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(196,147,74,0.2);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .usage-bar-wrapper::-webkit-scrollbar { display: none; }
        .pulsing { animation: subtlePulse 2s ease-in-out infinite; }
        @keyframes subtlePulse {
          0%,100% { border-bottom-color: rgba(196,147,74,0.2) }
          50% { border-bottom-color: rgba(239,68,68,0.5) }
        }

        .usage-plan-badge {
          flex-shrink: 0;
          background: rgba(196,147,74,0.15);
          border: 1px solid rgba(196,147,74,0.4);
          border-radius: 20px;
          padding: 0.2rem 0.6rem;
          font-size: 0.7rem;
          font-weight: 700;
          color: #c4934a;
          white-space: nowrap;
        }

        .usage-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 90px;
          flex-shrink: 0;
        }
        .usage-label {
          display: flex;
          gap: 4px;
          align-items: center;
          font-size: 0.65rem;
          color: rgba(255,255,255,0.7);
          white-space: nowrap;
        }
        .text-red { color: #f87171 !important; font-weight: 700; }

        .usage-bar-track {
          height: 3px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        .usage-bar-fill {
          height: 100%;
          border-radius: 2px;
        }

        .usage-upgrade-btn {
          flex-shrink: 0;
          padding: 0.3rem 0.8rem;
          background: linear-gradient(135deg, #8B1538, #c4934a);
          border: none;
          border-radius: 20px;
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.2s;
        }
        .usage-upgrade-btn:hover { opacity: 0.85; }
      `}</style>
    </div>
  )
}
