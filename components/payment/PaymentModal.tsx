'use client'

import { useState, useEffect, useCallback } from 'react'
import { PLAN_LIMITS } from '@/lib/payment/limits'

interface PaymentModalProps {
  open: boolean
  reason?: string
  onClose: () => void
  onSuccess?: () => void
}

type Step = 'info' | 'qr' | 'reference' | 'success' | 'error'

export function PaymentModal({ open, reason, onClose, onSuccess }: PaymentModalProps) {
  const [step, setStep]             = useState<Step>('info')
  const [loading, setLoading]       = useState(false)
  const [qrData, setQrData]         = useState<{
    uroPayOrderId: string
    qrCode: string
    upiString: string
  } | null>(null)
  const [referenceNum, setReference] = useState('')
  const [error, setError]           = useState('')
  const [polling, setPolling]       = useState(false)

  useEffect(() => {
    if (open) {
      setStep('info')
      setError('')
      setReference('')
      setQrData(null)
    }
  }, [open])

  // Poll order status every 5s after submitting reference
  const pollStatus = useCallback(async (orderId: string) => {
    setPolling(true)
    for (let i = 0; i < 12; i++) {  // poll for 60s
      await new Promise(r => setTimeout(r, 5000))
      try {
        const res = await fetch(`/api/payment/verify?orderId=${orderId}`)
        const data = await res.json()
        if (data.status === 'COMPLETED') {
          setStep('success')
          setPolling(false)
          onSuccess?.()
          return
        }
      } catch {}
    }
    setPolling(false)
  }, [onSuccess])

  const initiate = async () => {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/payment/initiate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan: 'trial' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create order')
      setQrData({
        uroPayOrderId: data.uroPayOrderId,
        qrCode:        data.qrCode,
        upiString:     data.upiString,
      })
      setStep('qr')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const submitReference = async () => {
    if (!qrData || !referenceNum.trim()) {
      setError('Please enter your UPI reference number.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/payment/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          uroPayOrderId:  qrData.uroPayOrderId,
          referenceNumber: referenceNum.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verification failed')

      if (data.status === 'COMPLETED') {
        setStep('success')
        onSuccess?.()
      } else {
        setStep('reference')  // stay on page, poll in background
        pollStatus(qrData.uroPayOrderId)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const openUPI = () => {
    if (qrData?.upiString) {
      window.location.href = qrData.upiString
    }
  }

  if (!open) return null

  const reasonMessages: Record<string, string> = {
    token_limit:    '💬 You’ve used today’s chat tokens.',
    image_limit:    '📸 You’ve reached today’s photo limit.',
    call_limit:     '📞 You’ve used today’s call time.',
    trial_expired:  '⏰ Your trial has expired.',
  }

  return (
    <div className="payment-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="payment-modal">
        {/* Close button */}
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* ── STEP: Info ── */}
        {step === 'info' && (
          <div className="modal-step">
            <div className="modal-badge">👑</div>
            <h2 className="modal-title">Premium Trial</h2>

            {reason && reasonMessages[reason] && (
              <div className="modal-reason">{reasonMessages[reason]}</div>
            )}

            <p className="modal-subtitle">Just ₹20 — unlock full premium access for 24 hours.</p>

            <div className="plan-grid">
              <div className="plan-col plan-free">
                <div className="plan-label">Free 🆓</div>
                <div className="plan-row">💬 {PLAN_LIMITS.free.tokens_per_day} tokens/day</div>
                <div className="plan-row">📸 {PLAN_LIMITS.free.images_per_day} photos/day</div>
                <div className="plan-row">📞 {PLAN_LIMITS.free.call_seconds_per_day}s call/day</div>
              </div>
              <div className="plan-col plan-trial">
                <div className="plan-label">Trial ₹20/day ✨</div>
                <div className="plan-row">💬 {PLAN_LIMITS.trial.tokens_per_day} tokens/day</div>
                <div className="plan-row">📸 {PLAN_LIMITS.trial.images_per_day} photos/day</div>
                <div className="plan-row">📞 {Math.floor(PLAN_LIMITS.trial.call_seconds_per_day / 60)} min call/day</div>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={initiate}
              disabled={loading}
            >
              {loading ? 'Loading…' : '🔒 Pay with UPI — ₹20'}
            </button>

            {error && <p className="modal-error">{error}</p>}

            <p className="modal-note">UPI payment • 100% secure • Direct to merchant</p>
          </div>
        )}

        {/* ── STEP: QR Code ── */}
        {step === 'qr' && qrData && (
          <div className="modal-step">
            <div className="modal-badge">📱</div>
            <h2 className="modal-title">Pay with UPI</h2>
            <p className="modal-subtitle">Scan with any UPI app — PhonePe, Google Pay, Paytm</p>

            <div className="qr-wrapper">
              <img src={qrData.qrCode} alt="UPI QR Code" className="qr-image" />
              <div className="qr-amount">₹20</div>
            </div>

            <button className="btn-upi" onClick={openUPI}>
              📱 Open UPI App
            </button>

            <button
              className="btn-secondary"
              onClick={() => setStep('reference')}
            >
              ✅ Payment done — Enter Reference Number
            </button>

            <p className="modal-note">Your UPI app shows the reference number after payment.</p>
          </div>
        )}

        {/* ── STEP: Enter Reference ── */}
        {step === 'reference' && (
          <div className="modal-step">
            <div className="modal-badge">🔢</div>
            <h2 className="modal-title">UPI Reference Number</h2>
            <p className="modal-subtitle">
              Enter the reference number shown in your UPI app after payment.
            </p>

            <input
              type="text"
              className="ref-input"
              placeholder="e.g. 430686551035"
              value={referenceNum}
              onChange={e => setReference(e.target.value.replace(/\D/g, ''))}
              maxLength={20}
            />

            {polling && (
              <div className="polling-msg">🔄 Verifying your payment…</div>
            )}

            <button
              className="btn-primary"
              onClick={submitReference}
              disabled={loading || polling || !referenceNum.trim()}
            >
              {loading ? 'Verifying…' : '✅ Confirm Payment'}
            </button>

            {error && <p className="modal-error">{error}</p>}

            <button className="btn-link" onClick={() => setStep('qr')}>
              ← Back to QR Code
            </button>
          </div>
        )}

        {/* ── STEP: Success ── */}
        {step === 'success' && (
          <div className="modal-step modal-success">
            <div className="modal-badge success-anim">🎉</div>
            <h2 className="modal-title">Trial Activated! 🎉</h2>
            <p className="modal-subtitle">
              Excellent! Your 24-hour premium trial is now live.
            </p>
            <div className="success-perks">
              <div>💬 {PLAN_LIMITS.trial.tokens_per_day} tokens today</div>
              <div>📸 {PLAN_LIMITS.trial.images_per_day} photos today</div>
              <div>📞 {Math.floor(PLAN_LIMITS.trial.call_seconds_per_day / 60)} min call today</div>
            </div>
            <button className="btn-primary" onClick={onClose}>
              Start Exploring 💫
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .payment-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes pop { 0% { transform: scale(0.5) } 70% { transform: scale(1.15) } 100% { transform: scale(1) } }

        .payment-modal {
          background: linear-gradient(135deg, #1a0a0f 0%, #2d0a14 50%, #1a0a0f 100%);
          border: 1px solid rgba(196,147,74,0.4);
          border-radius: 20px;
          padding: 2rem;
          width: 100%; max-width: 420px;
          position: relative;
          animation: slideUp 0.3s ease;
          box-shadow: 0 25px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .modal-close {
          position: absolute; top: 1rem; right: 1rem;
          background: rgba(255,255,255,0.1); border: none;
          color: #ccc; width: 32px; height: 32px; border-radius: 50%;
          cursor: pointer; font-size: 14px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
        }
        .modal-close:hover { background: rgba(255,255,255,0.2); color: #fff; }

        .modal-step { display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center; }

        .modal-badge {
          font-size: 2.5rem;
          background: rgba(196,147,74,0.1);
          border: 1px solid rgba(196,147,74,0.3);
          border-radius: 50%; width: 72px; height: 72px;
          display: flex; align-items: center; justify-content: center;
        }
        .success-anim { animation: pop 0.5s ease; }

        .modal-title { font-size: 1.5rem; font-weight: 700; color: #e8c49a; margin: 0; }
        .modal-subtitle { color: rgba(255,255,255,0.6); font-size: 0.9rem; margin: 0; }
        .modal-reason {
          background: rgba(196,147,74,0.1); border: 1px solid rgba(196,147,74,0.3);
          border-radius: 10px; padding: 0.6rem 1rem;
          color: #c4934a; font-size: 0.9rem; font-weight: 500;
        }
        .modal-error { color: #f87171; font-size: 0.85rem; }
        .modal-note { color: rgba(255,255,255,0.35); font-size: 0.75rem; }

        .plan-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; width: 100%; }
        .plan-col {
          border-radius: 12px; padding: 0.75rem;
          display: flex; flex-direction: column; gap: 0.4rem;
        }
        .plan-free { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); }
        .plan-trial {
          background: linear-gradient(135deg, rgba(196,147,74,0.15), rgba(139,21,56,0.15));
          border: 1px solid rgba(196,147,74,0.4);
        }
        .plan-label { font-weight: 700; font-size: 0.85rem; color: #e8c49a; margin-bottom: 0.25rem; }
        .plan-row { font-size: 0.8rem; color: rgba(255,255,255,0.7); }

        .btn-primary {
          width: 100%; padding: 0.875rem;
          background: linear-gradient(135deg, #8B1538, #c4934a);
          color: white; font-weight: 700; font-size: 1rem;
          border: none; border-radius: 12px; cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-upi {
          width: 100%; padding: 0.75rem;
          background: linear-gradient(135deg, #1a237e, #311b92);
          color: white; font-weight: 600; border: none; border-radius: 12px;
          cursor: pointer; transition: opacity 0.2s;
        }
        .btn-upi:hover { opacity: 0.9; }

        .btn-secondary {
          width: 100%; padding: 0.75rem;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.8); font-weight: 600; border-radius: 12px;
          cursor: pointer; transition: background 0.2s;
        }
        .btn-secondary:hover { background: rgba(255,255,255,0.12); }

        .btn-link { background: none; border: none; color: rgba(196,147,74,0.8); cursor: pointer; font-size: 0.85rem; }
        .btn-link:hover { color: #c4934a; }

        .qr-wrapper {
          background: white; border-radius: 16px; padding: 1rem;
          position: relative; display: inline-block;
        }
        .qr-image { width: 200px; height: 200px; display: block; }
        .qr-amount {
          position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%);
          background: #c4934a; color: white; font-weight: 700; font-size: 1rem;
          padding: 0.25rem 1rem; border-radius: 20px;
        }

        .ref-input {
          width: 100%; padding: 0.875rem; text-align: center;
          font-size: 1.25rem; font-weight: 600; letter-spacing: 2px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(196,147,74,0.4);
          border-radius: 12px; color: #e8c49a; outline: none;
          transition: border-color 0.2s;
        }
        .ref-input:focus { border-color: #c4934a; }
        .ref-input::placeholder { color: rgba(255,255,255,0.3); letter-spacing: 0; font-size: 0.9rem; font-weight: 400; }

        .polling-msg {
          background: rgba(196,147,74,0.1); border: 1px solid rgba(196,147,74,0.3);
          border-radius: 8px; padding: 0.5rem 1rem;
          color: #c4934a; font-size: 0.85rem;
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.6 } }

        .modal-success { }
        .success-perks {
          display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;
          background: rgba(196,147,74,0.08); border-radius: 12px; padding: 1rem;
          width: 100%;
        }
        .success-perks > div { color: #e8c49a; font-weight: 600; font-size: 0.9rem; }
      `}</style>
    </div>
  )
}
