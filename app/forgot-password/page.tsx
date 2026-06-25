/* eslint-disable react/no-unescaped-entities */
'use client'
// app/forgot-password/page.tsx
import { useState } from 'react'
import Link from 'next/link'

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');
  .fp-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#0d0d12; font-family:'Sora',sans-serif; padding:1rem; }
  .fp-card { width:100%; max-width:400px; background:#13131a; border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:2.25rem; }
  .fp-logo { color:#6366f1; font-size:1.3rem; font-weight:800; text-align:center; margin-bottom:0.35rem; }
  .fp-title { color:#f0f0f5; font-size:1.2rem; font-weight:700; text-align:center; margin-bottom:0.4rem; }
  .fp-sub { color:#55556e; font-size:0.83rem; text-align:center; margin-bottom:1.75rem; line-height:1.6; }
  .fp-label { display:block; font-size:0.78rem; font-weight:600; color:#9494b0; margin-bottom:0.4rem; }
  .fp-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.65rem 0.9rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.88rem; outline:none; transition:border-color 0.2s,box-shadow 0.2s; box-sizing:border-box; }
  .fp-input::placeholder { color:#3a3a56; }
  .fp-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
  .fp-btn { width:100%; padding:0.7rem; background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; border:none; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.88rem; font-weight:600; cursor:pointer; transition:all 0.15s; margin-top:1.25rem; }
  .fp-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 18px rgba(99,102,241,0.35); }
  .fp-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .fp-err { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); color:#f87171; border-radius:8px; padding:0.65rem 0.9rem; font-size:0.82rem; margin-bottom:1rem; }
  .fp-ok  { background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.2); color:#34d399; border-radius:8px; padding:0.65rem 0.9rem; font-size:0.82rem; text-align:center; line-height:1.6; }
  .fp-back { display:block; text-align:center; margin-top:1.25rem; font-size:0.82rem; color:#55556e; text-decoration:none; }
  .fp-back:hover { color:#9494b0; }
`

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Something went wrong.')
        return
      }

      setSubmitted(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{S}</style>
      <div className="fp-wrap">
        <div className="fp-card">
          <div className="fp-logo">HustleCare</div>

          {submitted ? (
            <>
              <div className="fp-title" style={{ marginTop: '1rem' }}>Check your inbox</div>
              <div style={{ marginTop: '1.25rem' }}>
                <div className="fp-ok">
                  If <strong>{email}</strong> is registered, you'll receive a password reset link shortly.<br /><br />
                  The link expires in <strong>1 hour</strong>.
                </div>
              </div>
              <Link href="/signin" className="fp-back">← Back to sign in</Link>
            </>
          ) : (
            <>
              <div className="fp-title" style={{ marginTop: '0.5rem' }}>Forgot your password?</div>
              <div className="fp-sub">Enter your email and we'll send you a reset link.</div>

              {error && <div className="fp-err">{error}</div>}

              <form onSubmit={handleSubmit}>
                <label className="fp-label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="fp-input"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <button type="submit" disabled={loading} className="fp-btn">
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <Link href="/signin" className="fp-back">← Back to sign in</Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}