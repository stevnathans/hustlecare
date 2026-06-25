/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
// app/admin/emails/page.tsx
import { useEffect, useState, useMemo } from 'react'
import {
  Mail, Send, CheckCircle, XCircle, AlertTriangle,
  Search, X, RefreshCw, Download, Users, Eye,
  Clock,
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'

/* ─── Types ───────────────────────────────────────────────────── */
type EmailStatus = 'SENT' | 'DELIVERED' | 'OPENED' | 'BOUNCED' | 'FAILED'
type EmailType   = 'WELCOME' | 'PASSWORD_RESET' | 'EMAIL_VERIFICATION' | 'NOTIFICATION' | 'CAMPAIGN'

type EmailLog = {
  id: string
  to: string
  subject: string
  type: EmailType
  status: EmailStatus
  resendId: string | null
  error: string | null
  sentAt: string
  openedAt: string | null
  bouncedAt: string | null
  user: { id: string; name: string; email: string } | null
}

type Stats = {
  total: number; sent: number; delivered: number; opened: number
  bounced: number; failed: number; today: number; thisWeek: number; thisMonth: number
  byType: Partial<Record<EmailType, number>>
}

type User = { id: string; name: string; email: string; emailNotifications: boolean }

/* ─── Styles ──────────────────────────────────────────────────── */
const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }
  .e-sc { background:#13131a; border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:1rem 1.25rem; display:flex; align-items:center; justify-content:space-between; }
  .e-sc-icon { width:38px; height:38px; border-radius:9px; display:flex; align-items:center; justify-content:center; }
  .e-table { width:100%; border-collapse:collapse; }
  .e-table th { padding:0.65rem 1rem; text-align:left; font-size:0.7rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid rgba(255,255,255,0.06); white-space:nowrap; background:#13131a; }
  .e-table td { padding:0.9rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; }
  .e-table tbody tr { transition:background 0.15s; }
  .e-table tbody tr:hover { background:rgba(255,255,255,0.025); }
  .u-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 0.9rem 0.55rem 2.4rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s,box-shadow 0.2s; width:100%; }
  .u-input::placeholder { color:#3a3a56; }
  .u-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
  .u-select { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 2rem 0.55rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.82rem; outline:none; cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2355556e' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 0.7rem center; }
  .u-select:focus { border-color:rgba(99,102,241,0.5); }
  .u-select option { background:#1a1a24; }
  .btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.55rem 1.1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.83rem; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap; }
  .btn-primary { background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; box-shadow:0 4px 14px rgba(99,102,241,0.3); }
  .btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(99,102,241,0.4); }
  .btn-primary:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
  .btn-success { background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.25); }
  .btn-success:hover { background:rgba(16,185,129,0.25); }
  .btn-ghost { background:rgba(255,255,255,0.06); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-ghost:hover { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .btn-icon { padding:0.45rem; border-radius:8px; }
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(4px); }
  .modal-box { background:#1a1a24; border:1px solid rgba(255,255,255,0.09); border-radius:16px; padding:1.75rem; width:100%; max-width:480px; box-shadow:0 24px 80px rgba(0,0,0,0.6); max-height:90vh; overflow-y:auto; }
  .f-label { display:block; font-size:0.78rem; font-weight:600; color:#9494b0; margin-bottom:0.4rem; }
  .f-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s,box-shadow 0.2s; box-sizing:border-box; }
  .f-input::placeholder { color:#3a3a56; }
  .f-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
  .f-textarea { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; resize:vertical; min-height:90px; transition:border-color 0.2s,box-shadow 0.2s; box-sizing:border-box; }
  .f-textarea::placeholder { color:#3a3a56; }
  .f-textarea:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
  .f-select { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; box-sizing:border-box; cursor:pointer; }
  .f-select:focus { border-color:rgba(99,102,241,0.5); }
  .f-select option { background:#1a1a24; }
  .u-scroll::-webkit-scrollbar { width:4px; height:4px; }
  .u-scroll::-webkit-scrollbar-track { background:transparent; }
  .u-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
  .skel { background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:6px; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .user-chip { display:inline-flex; align-items:center; gap:0.4rem; background:rgba(99,102,241,0.12); border:1px solid rgba(99,102,241,0.2); border-radius:100px; padding:0.2rem 0.6rem 0.2rem 0.35rem; font-size:0.76rem; color:#a5b4fc; }
  .user-chip button { background:none; border:none; cursor:pointer; color:#6366f1; padding:0; display:flex; line-height:1; }
  .user-search-result { padding:0.55rem 0.75rem; border-radius:7px; cursor:pointer; font-size:0.83rem; display:flex; flex-direction:column; gap:0.1rem; transition:background 0.12s; }
  .user-search-result:hover { background:rgba(255,255,255,0.05); }
`

/* ─── Helpers ─────────────────────────────────────────────────── */
const ICON_COLORS = {
  blue:'rgba(99,102,241,0.15)', green:'rgba(16,185,129,0.15)',
  red:'rgba(239,68,68,0.15)', orange:'rgba(245,158,11,0.15)', purple:'rgba(139,92,246,0.15)',
}
const ICON_FG = {
  blue:'#818cf8', green:'#34d399', red:'#f87171', orange:'#fbbf24', purple:'#a78bfa',
}

const STATUS_CONFIG: Record<EmailStatus, { label:string; bg:string; color:string; icon:React.ElementType }> = {
  SENT:      { label:'Sent',      bg:'rgba(99,102,241,0.12)',  color:'#818cf8', icon:Send },
  DELIVERED: { label:'Delivered', bg:'rgba(16,185,129,0.12)',  color:'#34d399', icon:CheckCircle },
  OPENED:    { label:'Opened',    bg:'rgba(16,185,129,0.18)',  color:'#6ee7b7', icon:Eye },
  BOUNCED:   { label:'Bounced',   bg:'rgba(245,158,11,0.12)',  color:'#fbbf24', icon:AlertTriangle },
  FAILED:    { label:'Failed',    bg:'rgba(239,68,68,0.12)',   color:'#f87171', icon:XCircle },
}

const TYPE_CONFIG: Record<EmailType, { label:string; bg:string; color:string }> = {
  WELCOME:            { label:'Welcome',      bg:'rgba(99,102,241,0.12)', color:'#818cf8' },
  PASSWORD_RESET:     { label:'Reset',        bg:'rgba(245,158,11,0.12)', color:'#fbbf24' },
  EMAIL_VERIFICATION: { label:'Verify',       bg:'rgba(16,185,129,0.12)', color:'#34d399' },
  NOTIFICATION:       { label:'Notification', bg:'rgba(139,92,246,0.12)', color:'#a78bfa' },
  CAMPAIGN:           { label:'Campaign',     bg:'rgba(239,68,68,0.12)',  color:'#f87171' },
}

function fmt(date: string) {
  return new Date(date).toLocaleString('en-KE', {
    day:'2-digit', month:'short', year:'numeric',
    hour:'2-digit', minute:'2-digit',
  })
}
function fmtShort(date: string) {
  return new Date(date).toLocaleDateString('en-KE', { day:'2-digit', month:'short', year:'numeric' })
}

/* ─── Main ────────────────────────────────────────────────────── */
export default function EmailsAdminPage() {
  const [logs,         setLogs]         = useState<EmailLog[]>([])
  const [stats,        setStats]        = useState<Stats | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [search,       setSearch]       = useState('')
  const [typeFilter,   setTypeFilter]   = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page,         setPage]         = useState(1)
  const [totalPages,   setTotalPages]   = useState(1)
  const [totalCount,   setTotalCount]   = useState(0)

  // Send modal state
  const [modalOpen,    setModalOpen]    = useState(false)
  const [userSearch,   setUserSearch]   = useState('')
  const [userResults,  setUserResults]  = useState<User[]>([])
  const [selectedUsers,setSelectedUsers]= useState<User[]>([])
  const [searching,    setSearching]    = useState(false)
  const [sending,      setSending]      = useState(false)
  const [form,         setForm]         = useState({ title:'', message:'', ctaLabel:'', ctaUrl:'' })

  // Detail modal
  const [detailLog,    setDetailLog]    = useState<EmailLog | null>(null)

  const LIMIT = 50

  useEffect(() => { fetchLogs(); }, [page, typeFilter, statusFilter])
  useEffect(() => { fetchStats(); }, [])

  async function fetchLogs() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (typeFilter   !== 'all') params.set('type',   typeFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const r = await fetch(`/api/admin/email/logs?${params}`)
      if (!r.ok) throw new Error()
      const data = await r.json()
      setLogs(data.logs)
      setTotalPages(data.pages)
      setTotalCount(data.total)
    } catch {
      toast.error('Failed to load email logs')
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    setStatsLoading(true)
    try {
      const r = await fetch('/api/admin/email/stats')
      if (r.ok) setStats(await r.json())
    } catch {}
    finally { setStatsLoading(false) }
  }

  // Debounced user search inside the modal
  useEffect(() => {
    if (!userSearch.trim()) { setUserResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}`)
        if (r.ok) {
          const all: User[] = await r.json()
          // Filter out already-selected
          setUserResults(all.filter(u => !selectedUsers.find(s => s.id === u.id)).slice(0, 8))
        }
      } catch {}
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [userSearch, selectedUsers])

  function addUser(u: User) {
    setSelectedUsers(p => [...p, u])
    setUserSearch('')
    setUserResults([])
  }
  function removeUser(id: string) {
    setSelectedUsers(p => p.filter(u => u.id !== id))
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUsers.length) { toast.error('Select at least one recipient'); return }
    if (!form.title.trim() || !form.message.trim()) { toast.error('Title and message are required'); return }
    setSending(true)
    try {
      const r = await fetch('/api/admin/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers.map(u => u.id),
          title: form.title,
          message: form.message,
          ctaLabel: form.ctaLabel || undefined,
          ctaUrl:   form.ctaUrl   || undefined,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      toast.success(`Sent to ${data.succeeded} user${data.succeeded !== 1 ? 's' : ''}${data.failed ? ` (${data.failed} failed)` : ''}`)
      setModalOpen(false)
      setSelectedUsers([])
      setForm({ title:'', message:'', ctaLabel:'', ctaUrl:'' })
      fetchLogs()
      fetchStats()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  function handleExport() {
    const csv = [
      ['ID','To','Subject','Type','Status','Sent At','Opened At','Bounced At','Error'],
      ...logs.map(l => [
        l.id, l.to, `"${l.subject}"`, l.type, l.status,
        fmtShort(l.sentAt),
        l.openedAt  ? fmtShort(l.openedAt)  : '',
        l.bouncedAt ? fmtShort(l.bouncedAt) : '',
        l.error ?? '',
      ]),
    ].map(r => r.join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `email-logs-${new Date().toISOString().slice(0,10)}.csv`,
    })
    a.click()
    toast.success('Exported!')
  }

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs
    const q = search.toLowerCase()
    return logs.filter(l =>
      l.to.toLowerCase().includes(q) ||
      l.subject.toLowerCase().includes(q) ||
      l.user?.name.toLowerCase().includes(q)
    )
  }, [logs, search])

  const deliveryRate = stats && stats.total > 0
    ? Math.round(((stats.delivered + stats.opened) / stats.total) * 100)
    : 0

  return (
    <>
      <style>{S}</style>
      <Toaster position="top-right" toastOptions={{ style:{ background:'#1a1a24', color:'#f0f0f5', border:'1px solid rgba(255,255,255,0.09)' } }} />
      <div className="adm" style={{ minHeight:'100vh' }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.75rem', fontWeight:700, letterSpacing:'-0.03em', marginBottom:'0.25rem' }}>Email Management</h1>
            <p style={{ fontSize:'0.84rem', color:'#55556e' }}>Send notifications and track all transactional emails</p>
          </div>
          <div style={{ display:'flex', gap:'0.65rem', flexWrap:'wrap' }}>
            <button className="btn btn-ghost" onClick={() => { fetchLogs(); fetchStats(); }}>
              <RefreshCw size={14} />Refresh
            </button>
            <button className="btn btn-success" onClick={handleExport}>
              <Download size={14} />Export
            </button>
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
              <Send size={14} />Send Email
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))', gap:'0.75rem', marginBottom:'1.25rem' }}>
          {statsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="e-sc"><div className="skel" style={{ height:56, width:'100%' }} /></div>
            ))
          ) : stats ? ([
            { label:'Total Sent',    val:stats.total,       sub:`${stats.today} today`,            ic:Mail,         col:'blue' },
            { label:'This Week',     val:stats.thisWeek,    sub:`${stats.thisMonth} this month`,   ic:Clock,        col:'purple' },
            { label:'Delivered',     val:stats.delivered,   sub:`${deliveryRate}% rate`,           ic:CheckCircle,  col:'green' },
            { label:'Opened',        val:stats.opened,      sub:'unique opens',                    ic:Eye,          col:'green' },
            { label:'Bounced',       val:stats.bounced,     sub:'',                                ic:AlertTriangle,col:'orange' },
            { label:'Failed',        val:stats.failed,      sub:'check logs',                      ic:XCircle,      col:'red' },
          ] as const).map(s => (
            <div key={s.label} className="e-sc">
              <div>
                <div style={{ fontSize:'0.7rem', color:'#55556e', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'0.4rem' }}>{s.label}</div>
                <div className="adm-mono" style={{ fontSize:'1.5rem', fontWeight:700 }}>{s.val.toLocaleString()}</div>
                {s.sub && <div style={{ fontSize:'0.72rem', color:'#9494b0', marginTop:'0.15rem' }}>{s.sub}</div>}
              </div>
              <div className="e-sc-icon" style={{ background:(ICON_COLORS as any)[s.col] }}>
                <s.ic size={16} color={(ICON_FG as any)[s.col]} />
              </div>
            </div>
          )) : null}
        </div>

        {/* ── Type breakdown ── */}
        {stats && (
          <div style={{ background:'#13131a', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:'1.25rem', display:'flex', gap:'1.5rem', flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#55556e', textTransform:'uppercase', letterSpacing:'0.08em' }}>By type</span>
            {(Object.entries(TYPE_CONFIG) as [EmailType, typeof TYPE_CONFIG[EmailType]][]).map(([type, cfg]) => {
              const count = stats.byType[type] ?? 0
              return (
                <div key={type} style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <span style={{ display:'inline-flex', padding:'0.2rem 0.6rem', borderRadius:100, fontSize:'0.72rem', fontWeight:700, background:cfg.bg, color:cfg.color }}>{cfg.label}</span>
                  <span className="adm-mono" style={{ fontSize:'0.85rem', fontWeight:600 }}>{count.toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Filters ── */}
        <div style={{ display:'flex', gap:'0.65rem', marginBottom:'1rem', flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:220 }}>
            <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#55556e', pointerEvents:'none' }} />
            <input
              type="text"
              placeholder="Search by email, name, or subject…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="u-input"
            />
          </div>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }} className="u-select">
            <option value="all">All Types</option>
            {(Object.entries(TYPE_CONFIG) as [EmailType, any][]).map(([type, cfg]) => (
              <option key={type} value={type}>{cfg.label}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="u-select">
            <option value="all">All Status</option>
            {(Object.entries(STATUS_CONFIG) as [EmailStatus, any][]).map(([status, cfg]) => (
              <option key={status} value={status}>{cfg.label}</option>
            ))}
          </select>
        </div>

        {/* ── Table ── */}
        <div style={{ background:'#13131a', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, overflow:'hidden' }}>
          <div className="u-scroll" style={{ overflowX:'auto' }}>
            <table className="e-table">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Sent At</th>
                  <th style={{ textAlign:'right', paddingRight:'1.25rem' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j}><div className="skel" style={{ height:18, width:j === 1 ? 160 : 90 }} /></td>
                      ))}
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign:'center', padding:'3.5rem 1rem', color:'#3a3a56' }}>
                      <Mail size={36} style={{ margin:'0 auto 0.75rem', display:'block', opacity:0.3 }} />
                      <div style={{ fontSize:'0.9rem', fontWeight:600, color:'#55556e' }}>
                        {search || typeFilter !== 'all' || statusFilter !== 'all' ? 'No emails match your filters' : 'No emails sent yet'}
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.map(log => {
                  const sc = STATUS_CONFIG[log.status]
                  const tc = TYPE_CONFIG[log.type]
                  const StatusIcon = sc.icon
                  return (
                    <tr key={log.id}>
                      <td>
                        <div style={{ display:'flex', flexDirection:'column', gap:'0.15rem' }}>
                          {log.user ? (
                            <>
                              <span style={{ fontSize:'0.86rem', fontWeight:600, color:'#f0f0f5' }}>{log.user.name}</span>
                              <span style={{ fontSize:'0.75rem', color:'#55556e', fontFamily:'DM Mono,monospace' }}>{log.to}</span>
                            </>
                          ) : (
                            <span style={{ fontSize:'0.83rem', color:'#9494b0', fontFamily:'DM Mono,monospace' }}>{log.to}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize:'0.84rem', color:'#c4c4d4', maxWidth:220, display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {log.subject}
                        </span>
                      </td>
                      <td>
                        <span style={{ display:'inline-flex', padding:'0.2rem 0.6rem', borderRadius:100, fontSize:'0.72rem', fontWeight:700, background:tc.bg, color:tc.color }}>
                          {tc.label}
                        </span>
                      </td>
                      <td>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', padding:'0.22rem 0.6rem', borderRadius:100, fontSize:'0.72rem', fontWeight:600, background:sc.bg, color:sc.color }}>
                          <StatusIcon size={11} />{sc.label}
                        </span>
                        {log.error && (
                          <div style={{ fontSize:'0.7rem', color:'#f87171', marginTop:'0.2rem', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={log.error}>
                            {log.error}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize:'0.78rem', color:'#9494b0', fontFamily:'DM Mono,monospace', whiteSpace:'nowrap' }}>
                          {fmt(log.sentAt)}
                        </span>
                      </td>
                      <td style={{ textAlign:'right', paddingRight:'1.25rem' }}>
                        <button className="btn btn-ghost btn-icon" onClick={() => setDetailLog(log)} title="View details">
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination */}
          <div style={{ padding:'0.65rem 1.25rem', borderTop:'1px solid rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.5rem' }}>
            <span style={{ fontSize:'0.75rem', color:'#55556e' }}>
              Showing <span style={{ color:'#9494b0', fontWeight:600 }}>{filteredLogs.length}</span> of <span style={{ color:'#9494b0', fontWeight:600 }}>{totalCount.toLocaleString()}</span> emails
            </span>
            {totalPages > 1 && (
              <div style={{ display:'flex', gap:'0.4rem' }}>
                <button className="btn btn-ghost" style={{ padding:'0.3rem 0.75rem', fontSize:'0.76rem' }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                <span style={{ fontSize:'0.78rem', color:'#55556e', alignSelf:'center', padding:'0 0.25rem' }}>
                  {page} / {totalPages}
                </span>
                <button className="btn btn-ghost" style={{ padding:'0.3rem 0.75rem', fontSize:'0.76rem' }} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
              </div>
            )}
          </div>
        </div>

        {/* ── Send Email Modal ── */}
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
                <h2 style={{ fontSize:'1.05rem', fontWeight:700 }}>Send Notification</h2>
                <button onClick={() => setModalOpen(false)} className="btn btn-ghost btn-icon"><X size={16} /></button>
              </div>

              <form onSubmit={handleSend}>
                <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

                  {/* Recipient search */}
                  <div>
                    <label className="f-label">Recipients</label>

                    {/* Selected chips */}
                    {selectedUsers.length > 0 && (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem', marginBottom:'0.5rem' }}>
                        {selectedUsers.map(u => (
                          <span key={u.id} className="user-chip">
                            <Users size={11} />
                            {u.name}
                            <button type="button" onClick={() => removeUser(u.id)} aria-label={`Remove ${u.name}`}><X size={11} /></button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ position:'relative' }}>
                      <input
                        type="text"
                        placeholder="Search users by name or email…"
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        className="f-input"
                        autoComplete="off"
                      />
                      {(userResults.length > 0 || searching) && (
                        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'#1a1a24', border:'1px solid rgba(255,255,255,0.09)', borderRadius:10, zIndex:50, padding:'0.35rem', boxShadow:'0 12px 40px rgba(0,0,0,0.5)' }}>
                          {searching ? (
                            <div style={{ padding:'0.6rem 0.75rem', fontSize:'0.8rem', color:'#55556e' }}>Searching…</div>
                          ) : userResults.map(u => (
                            <div key={u.id} className="user-search-result" onClick={() => addUser(u)}>
                              <span style={{ fontWeight:600, color:'#f0f0f5', fontSize:'0.84rem' }}>{u.name}</span>
                              <span style={{ color:'#55556e', fontSize:'0.75rem', fontFamily:'DM Mono,monospace' }}>{u.email}</span>
                              {!u.emailNotifications && (
                                <span style={{ fontSize:'0.7rem', color:'#f87171' }}>⚠ Notifications disabled</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize:'0.74rem', color:'#3a3a56', marginTop:'0.35rem' }}>
                      Only active users with notifications enabled will receive the email
                    </div>
                  </div>

                  <div>
                    <label className="f-label">Subject / Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Important update for HustleCare users"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      className="f-input"
                    />
                  </div>

                  <div>
                    <label className="f-label">Message</label>
                    <textarea
                      required
                      placeholder="Write your message here…"
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      className="f-textarea"
                    />
                  </div>

                  {/* Optional CTA */}
                  <div style={{ background:'rgba(255,255,255,0.025)', borderRadius:9, padding:'0.85rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                    <div style={{ fontSize:'0.75rem', fontWeight:700, color:'#55556e', textTransform:'uppercase', letterSpacing:'0.07em' }}>
                      Optional button (CTA)
                    </div>
                    <div>
                      <label className="f-label">Button label</label>
                      <input
                        type="text"
                        placeholder="e.g. View your dashboard"
                        value={form.ctaLabel}
                        onChange={e => setForm({ ...form, ctaLabel: e.target.value })}
                        className="f-input"
                      />
                    </div>
                    <div>
                      <label className="f-label">Button URL</label>
                      <input
                        type="url"
                        placeholder="https://hustlecare.net/…"
                        value={form.ctaUrl}
                        onChange={e => setForm({ ...form, ctaUrl: e.target.value })}
                        className="f-input"
                      />
                    </div>
                  </div>

                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'0.5rem' }}>
                    <span style={{ fontSize:'0.8rem', color:'#55556e' }}>
                      {selectedUsers.length > 0
                        ? `${selectedUsers.length} recipient${selectedUsers.length !== 1 ? 's' : ''} selected`
                        : 'No recipients selected'}
                    </span>
                    <div style={{ display:'flex', gap:'0.65rem' }}>
                      <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={sending || !selectedUsers.length}>
                        <Send size={14} />
                        {sending ? 'Sending…' : `Send${selectedUsers.length > 1 ? ` to ${selectedUsers.length}` : ''}`}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Detail Modal ── */}
        {detailLog && (
          <div className="modal-overlay" onClick={() => setDetailLog(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth:420 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
                <h2 style={{ fontSize:'1.05rem', fontWeight:700 }}>Email Details</h2>
                <button onClick={() => setDetailLog(null)} className="btn btn-ghost btn-icon"><X size={16} /></button>
              </div>

              {(() => {
                const sc = STATUS_CONFIG[detailLog.status]
                const tc = TYPE_CONFIG[detailLog.type]
                const StatusIcon = sc.icon
                const rows: [string, React.ReactNode][] = [
                  ['To',       <span key="to" style={{ fontFamily:'DM Mono,monospace', fontSize:'0.82rem' }}>{detailLog.to}</span>],
                  ['Subject',  detailLog.subject],
                  ['Type',     <span key="type" style={{ display:'inline-flex', padding:'0.2rem 0.55rem', borderRadius:100, fontSize:'0.72rem', fontWeight:700, background:tc.bg, color:tc.color }}>{tc.label}</span>],
                  ['Status',   <span key="status" style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', padding:'0.22rem 0.55rem', borderRadius:100, fontSize:'0.72rem', fontWeight:600, background:sc.bg, color:sc.color }}><StatusIcon size={11} />{sc.label}</span>],
                  ['Sent at',  <span key="sentAt" style={{ fontFamily:'DM Mono,monospace', fontSize:'0.82rem' }}>{fmt(detailLog.sentAt)}</span>],
                  ...(detailLog.openedAt  ? [['Opened at',  <span key="openedAt" style={{ fontFamily:'DM Mono,monospace', fontSize:'0.82rem' }}>{fmt(detailLog.openedAt)}</span>]  as [string, React.ReactNode]] : []),
                  ...(detailLog.bouncedAt ? [['Bounced at', <span key="bouncedAt" style={{ fontFamily:'DM Mono,monospace', fontSize:'0.82rem' }}>{fmt(detailLog.bouncedAt)}</span>]] as [string, React.ReactNode][] : []),
                  ...(detailLog.resendId  ? [['Resend ID',  <span key="resendId" style={{ fontFamily:'DM Mono,monospace', fontSize:'0.75rem', color:'#55556e' }}>{detailLog.resendId}</span>]] as [string, React.ReactNode][] : []),
                  ...(detailLog.user ? [['User', <span key="user" style={{ fontSize:'0.83rem' }}>{detailLog.user.name}</span>]] as [string, React.ReactNode][] : []),
                ]
                return (
                  <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
                    {rows.map(([label, value]) => (
                      <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.65rem 0', borderBottom:'1px solid rgba(255,255,255,0.04)', gap:'1rem' }}>
                        <span style={{ fontSize:'0.78rem', color:'#55556e', fontWeight:600, flexShrink:0 }}>{label}</span>
                        <span style={{ fontSize:'0.84rem', color:'#c4c4d4', textAlign:'right' }}>{value}</span>
                      </div>
                    ))}
                    {detailLog.error && (
                      <div style={{ marginTop:'1rem', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:8, padding:'0.75rem' }}>
                        <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#f87171', marginBottom:'0.35rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>Error</div>
                        <div style={{ fontSize:'0.8rem', color:'#fca5a5', fontFamily:'DM Mono,monospace', wordBreak:'break-all' }}>{detailLog.error}</div>
                      </div>
                    )}
                  </div>
                )
              })()}

              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'1.5rem' }}>
                <button className="btn btn-ghost" onClick={() => setDetailLog(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}