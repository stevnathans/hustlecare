// components/Dashboard/NotificationsContext.tsx
'use client'
import { createContext, useContext, useEffect, useRef, useCallback, useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

export type NotifType = 'INFO' | 'SUCCESS' | 'WARNING'

export type Notification = {
  id: string
  title: string
  message: string
  type: NotifType
  link: string | null
  isRead: boolean
  createdAt: string
}

type NotificationsContextValue = {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markOne: (id: string) => Promise<void>
  markAll: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

// Single fetch + single 60s poll shared by every <NotificationBell/> instance
// mounted under this provider — previously each bell (desktop nav + mobile
// nav, both always mounted, just CSS-hidden) ran its own independent fetch
// and its own interval, doubling /api/user/notifications traffic forever.
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const inFlight = useRef(false)

  const fetchNotifications = useCallback(async () => {
    if (status !== 'authenticated' || inFlight.current) return
    inFlight.current = true
    setLoading(true)
    try {
      const r = await fetch('/api/user/notifications')
      if (r.ok) {
        const data = await r.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } finally {
      setLoading(false)
      inFlight.current = false
    }
  }, [status])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications, status])

  async function markOne(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    await fetch('/api/user/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  async function markAll() {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
    await fetch('/api/user/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    })
  }

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, loading, markOne, markAll }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return ctx
}