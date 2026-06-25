// components/Dashboard/NotificationBell.tsx
'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Bell, CheckCheck, ExternalLink, Info, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

type NotifType = 'INFO' | 'SUCCESS' | 'WARNING'

type Notification = {
  id: string
  title: string
  message: string
  type: NotifType
  link: string | null
  isRead: boolean
  createdAt: string
}

const TYPE_CONFIG: Record<NotifType, { icon: React.ElementType; color: string; bg: string }> = {
  INFO:    { icon: Info,          color: '#818cf8', bg: 'rgba(99,102,241,0.1)' },
  SUCCESS: { icon: CheckCircle,   color: '#34d399', bg: 'rgba(16,185,129,0.1)' },
  WARNING: { icon: AlertTriangle, color: '#fbbf24', bg: 'rgba(245,158,11,0.1)' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function NotificationBell() {
  const [open,         setOpen]         = useState(false)
  const [notifications,setNotifications]= useState<Notification[]>([])
  const [unreadCount,  setUnreadCount]  = useState(0)
  const [loading,      setLoading]      = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
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
    }
  }, [])

  // Poll every 60 seconds for new notifications
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function markOne(id: string) {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    )
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

  function handleOpen() {
    setOpen(prev => !prev)
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{ maxHeight: '420px', display: 'flex', flexDirection: 'column' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAll}
                className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col gap-2 p-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 p-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No notifications yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  We&apos;ll let you know when something happens
                </p>
              </div>
            ) : (
              notifications.map(notif => {
                const cfg = TYPE_CONFIG[notif.type]
                const Icon = cfg.icon
                const content = (
                  <div
                    key={notif.id}
                    onClick={() => !notif.isRead && markOne(notif.id)}
                    className={`flex gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800/60 last:border-0 transition-colors cursor-pointer ${
                      notif.isRead
                        ? 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                        : 'bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                      style={{ background: cfg.bg }}
                    >
                      <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold leading-tight ${
                          notif.isRead
                            ? 'text-gray-600 dark:text-gray-300'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {notif.title}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          )}
                          {notif.link && (
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                )

                return notif.link ? (
                  <Link key={notif.id} href={notif.link} onClick={() => !notif.isRead && markOne(notif.id)}>
                    {content}
                  </Link>
                ) : (
                  <div key={notif.id}>{content}</div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}