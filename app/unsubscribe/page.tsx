/* eslint-disable react/no-unescaped-entities */
// app/unsubscribe/page.tsx
'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

function UnsubscribeContent() {
  const params  = useSearchParams()
  const success = params.get('success') === 'true'
  const error   = params.get('error')

  return (
    <div style={card}>
      <div style={logoWrap}>
        <Image
          src="/icons/logo.svg"
          alt="Hustlecare"
          width={130}
          height={40}
          style={{ objectFit: 'contain' }}
        />
      </div>

      {success ? (
        <>
          <div style={iconCircle('#f0fdf4', '#059669')}>✓</div>
          <h1 style={title}>You've been unsubscribed</h1>
          <p style={body}>
            You'll no longer receive marketing emails from Hustlecare.
            You can re-enable them anytime from your account settings.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Link href="/dashboard/settings" style={btnPrimary}>
              Manage preferences
            </Link>
            <Link href="/" style={btnGhost}>
              Back to Hustlecare
            </Link>
          </div>
        </>
      ) : error === 'invalid' ? (
        <>
          <div style={iconCircle('#fef2f2', '#dc2626')}>✕</div>
          <h1 style={title}>Invalid link</h1>
          <p style={body}>
            This unsubscribe link is invalid or has expired.
            Sign in to manage your email preferences directly.
          </p>
          <Link href="/signin" style={{ ...btnPrimary, marginTop: '1.5rem', display: 'block', textAlign: 'center' }}>
            Sign in
          </Link>
        </>
      ) : (
        <>
          <div style={iconCircle('#fef2f2', '#dc2626')}>!</div>
          <h1 style={title}>Something went wrong</h1>
          <p style={body}>
            We couldn't process your request. Please try again or manage
            your preferences from your account settings.
          </p>
          <Link href="/dashboard" style={{ ...btnPrimary, marginTop: '1.5rem', display: 'block', textAlign: 'center' }}>
            Go to dashboard
          </Link>
        </>
      )}
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <div style={page}>
      <Suspense fallback={<div style={{ color: '#6b7280', fontFamily: 'Sora,sans-serif' }}>Loading…</div>}>
        <UnsubscribeContent />
      </Suspense>
    </div>
  )
}

// Styles
const page: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f6f9f8',
  fontFamily: "'Sora', Helvetica, Arial, sans-serif",
  padding: '1rem',
}
const card: React.CSSProperties = {
  width: '100%',
  maxWidth: '400px',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  border: '1px solid #e5e7eb',
  padding: '2.25rem',
  textAlign: 'center',
}
const logoWrap: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '1.75rem',
}
const title: React.CSSProperties = {
  fontSize: '1.2rem',
  fontWeight: '700',
  color: '#111827',
  margin: '1rem 0 0.5rem',
  letterSpacing: '-0.02em',
}
const body: React.CSSProperties = {
  fontSize: '0.88rem',
  color: '#6b7280',
  lineHeight: '1.7',
  margin: 0,
}
const btnPrimary: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '0.7rem',
  backgroundColor: '#059669',
  color: '#ffffff',
  borderRadius: '9px',
  fontWeight: '600',
  fontSize: '0.88rem',
  textDecoration: 'none',
  boxSizing: 'border-box',
}
const btnGhost: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '0.7rem',
  backgroundColor: 'transparent',
  color: '#6b7280',
  border: '1px solid #e5e7eb',
  borderRadius: '9px',
  fontWeight: '500',
  fontSize: '0.88rem',
  textDecoration: 'none',
  boxSizing: 'border-box',
}
function iconCircle(bg: string, color: string): React.CSSProperties {
  return {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    backgroundColor: bg,
    color,
    fontSize: '1.4rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
  }
}