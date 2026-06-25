'use client'
// app/reset-password/page.tsx
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');
  .rp-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#0d0d12; font-family:'Sora',sans-serif; padding:1rem; }
  .rp-card { width:100%; max-width:400px; background:#13131a; border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:2.25rem; }
  .rp-logo { color:#6366f1; font-size:1.3rem; font-weight:800; text-align:center; margin-bottom:0.35rem; }
  .rp-title { color:#f0f0f5; font-size:1.2rem; font-weight:700; text-align:center; margin-bottom:0.4rem; }
  .rp-sub { color:#55556e; font-size:0.83rem; text-align:center; margin-bottom:1.75rem; line-height:1.6; }
  .rp-label { display:block; font-size:0.78rem; font-weight:600; color:#9494b0; margin-bottom:0.4rem; }
  .rp-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.65rem 0.9rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.88rem; outline:none; transition:border-color 0.2s,box-shadow 0.2s; box-sizing:border-box; }
  .rp-input::placeholder { color:#3a3a56; }
  .rp-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
  .rp-btn { width:100%; padding:0.7rem; background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; border:none; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.88rem; font-weight:600; cursor:pointer; transition:all 0.15s; margin-top:1.25rem; }
  .rp-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 18px rgba(99,102,241,0.35); }
  .rp-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .rp-err { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); color:#f87171; border-radius:8px; padding:0.65rem 0.9rem; font-size:0.82rem; margin-bottom:1rem; }
  .rp-ok  { background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.2); color:#34d399; border-radius:8px; padding:0.65rem 0.9rem; font-size:0.82rem; text-align:center; line-height:1.6; }
  .rp-hint { font-size:0.76rem; color:#3a3a56; margin-top:0.35rem; }
  .rp-back { display:block; text-align:center; margin-top:1.25rem; font-size:0.82rem; color:#55556e; text-decoration:none; }
  .rp-back:hover { color:#9494b0; }
  .rp-invalid { text-align:center; padding:1rem 0; }
`

function ResetPasswordContent() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const token       = searchParams.get('token')

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)

  useEffect(() => {
    if (!token) setError('Missing reset token. Please request a new link.')
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Something went wrong.')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/signin'), 3000)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rp-card">
      <div className="rp-logo">HustleCare</div>

      {success ? (
        <>
          <div className="rp-title" style={{ marginTop: '1rem' }}>Password updated</div>
          <div style={{ marginTop: '1.25rem' }}>
            <div className="rp-ok">
              Your password has been reset successfully.<br /><br />
              Redirecting you to sign in…
            </div>
          </div>
          <Link href="/signin" className="rp-back">Go to sign in now</Link>
        </>
      ) : !token ? (
        <div className="rp-invalid">
          <div className="rp-err" style={{ marginBottom: 0 }}>Invalid or missing reset link. Please request a new one.</div>
          <Link href="/forgot-password" className="rp-back">Request new link</Link>
        </div>
      ) : (
        <>
          <div className="rp-title" style={{ marginTop: '0.5rem' }}>Set new password</div>
          <div className="rp-sub">Choose a strong password for your account.</div>

          {error && <div className="rp-err">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label className="rp-label" htmlFor="password">New password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="rp-input"
                placeholder="Min. 6 characters"
                autoComplete="new-password"
              />
              <div className="rp-hint">At least 6 characters</div>
            </div>

            <div>
              <label className="rp-label" htmlFor="confirm">Confirm password</label>
              <input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="rp-input"
                placeholder="Repeat your password"
                autoComplete="new-password"
              />
            </div>

            <button type="submit" disabled={loading || !token} className="rp-btn">
              {loading ? 'Updating…' : 'Reset password'}
            </button>
          </form>

          <Link href="/signin" className="rp-back">← Back to sign in</Link>
        </>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <>
      <style>{S}</style>
      <div className="rp-wrap">
        <Suspense fallback={
          <div style={{ color: '#55556e', fontFamily: 'Sora,sans-serif', fontSize: '0.88rem' }}>
            Loading…
          </div>
        }>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </>
  )
}