'use client';
// app/vendor/dashboard/layout.tsx
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Package, User, Store,
  LogOut, ChevronRight, Loader2, Clock, Shield,
  Menu, X, ExternalLink, Plus,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const NAV_ITEMS = [
  { href: '/vendor/dashboard',          label: 'Overview',   short: 'Home',     icon: LayoutDashboard, exact: true },
  { href: '/vendor/dashboard/products', label: 'Products',   short: 'Products', icon: Package },
  { href: '/vendor/dashboard/profile',  label: 'My Profile', short: 'Profile',  icon: User },
];

export default function VendorDashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin?callbackUrl=/vendor/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div style={L.loadWrap}>
        <Loader2 size={28} className="vd-spin" style={{ color: '#f59e0b' }} />
        <style>{BASE_CSS}</style>
      </div>
    );
  }

  if (status === 'authenticated' && !['vendor', 'admin'].includes(String(session.user.role))) {
    return <VendorGate role={String(session.user.role)} />;
  }

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  // isSuspended is computed per-page when needed; not used in the shared layout

  const Sidebar = () => (
    <aside style={L.sidebar}>
      {/* Brand */}
      <div style={L.brand}>
        <div style={L.brandIcon}>
          <Store size={16} color="#f59e0b" />
        </div>
        <div>
          <div style={L.brandName}>Hustlecare</div>
          <div style={L.brandSub}>Vendor Portal</div>
        </div>
      </div>

      {/* User */}
      <div style={L.userBlock}>
        <div style={L.avatarWrap}>
          {session?.user?.image ? (
            <Image src={session.user.image} alt="" width={36} height={36} style={L.avatarImg} />
          ) : (
            <div style={L.avatarFallback}>
              {session?.user?.name?.[0]?.toUpperCase() ?? 'V'}
            </div>
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={L.userName}>{session?.user?.name || 'Vendor'}</div>
          <div style={L.userEmail}>{session?.user?.email}</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={L.nav}>
        <div style={L.navLabel}>Navigation</div>
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href, item.exact);
          return (
            <Link key={item.href} href={item.href} style={{
              ...L.navLink,
              ...(active ? L.navLinkActive : {}),
            }}>
              {active && <span style={L.activeBar} />}
              <item.icon size={16} style={{ color: active ? '#f59e0b' : '#55556e', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {active && <ChevronRight size={13} style={{ color: '#f59e0b', opacity: 0.6 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={L.sideFooter}>
        <Link
          href="/vendors"
          target="_blank"
          style={{ ...L.footerLink, color: '#9494b0' }}
        >
          <ExternalLink size={14} style={{ color: '#55556e' }} />
          <span>View Marketplace</span>
        </Link>
        <button style={{ ...L.footerLink, ...L.signOutBtn }} onClick={() => signOut({ callbackUrl: '/' })}>
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <style>{BASE_CSS}</style>
      <div className="vd-shell" style={L.shell}>

        {/* Desktop sidebar */}
        <div className="vd-desktop-sidebar" style={L.desktopSidebar}>
          <Sidebar />
        </div>

        {/* Mobile drawer overlay (secondary menu: marketplace / sign out / brand) */}
        {sidebarOpen && (
          <div style={L.overlay} onClick={() => setSidebarOpen(false)} />
        )}
        <div className="vd-mobile-sidebar" style={{
          ...L.mobileSidebar,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}>
          <button style={L.mobileClose} onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
          <Sidebar />
        </div>

        {/* Main content */}
        <main className="vd-main" style={L.main}>
          {/* Mobile top bar */}
          <header className="vd-mobile-header" style={L.mobileHeader}>
            <button style={L.menuBtn} onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ ...L.brandIcon, width: 28, height: 28 }}>
                <Store size={14} color="#f59e0b" />
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f0f0f5' }}>Vendor Portal</span>
            </div>
            <div style={L.avatarWrap}>
              {session?.user?.image ? (
                <Image src={session.user.image} alt="" width={28} height={28} style={{ ...L.avatarImg, width: 28, height: 28 }} />
              ) : (
                <div style={{ ...L.avatarFallback, width: 28, height: 28, fontSize: '0.72rem' }}>
                  {session?.user?.name?.[0]?.toUpperCase() ?? 'V'}
                </div>
              )}
            </div>
          </header>

          <div className="vd-content" style={L.content}>
            {children}
          </div>

          {/* Spacer so bottom nav doesn't cover content */}
          <div className="vd-bottom-spacer" />
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="vd-bottom-nav" style={L.bottomNav}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href, item.exact);
            return (
              <Link key={item.href} href={item.href} style={{ ...L.bottomNavItem, color: active ? '#fbbf24' : '#9494b0' }}>
                <item.icon size={20} style={{ color: active ? '#fbbf24' : '#9494b0' }} />
                <span style={L.bottomNavLabel}>{item.short}</span>
                {active && <span style={L.bottomNavDot} />}
              </Link>
            );
          })}
          <Link href="/vendor/dashboard/products/new" style={L.bottomNavFab} aria-label="Add product">
            <Plus size={22} color="#0a0a0f" />
          </Link>
        </nav>
      </div>
    </>
  );
}

function VendorGate({ role }: { role: string }) {
  const hasApplied = role === 'user';
  return (
    <div style={G.wrap}>
      <style>{BASE_CSS}</style>
      <div style={G.card}>
        <div style={G.iconWrap}>
          {hasApplied ? <Clock size={28} color="#f59e0b" /> : <Shield size={28} color="#818cf8" />}
        </div>
        <h1 style={G.title}>Vendor Access Required</h1>
        <p style={G.desc}>
          {hasApplied
            ? "Your account hasn't been approved as a vendor yet. If you've already applied, check your email for updates."
            : 'Apply to become a vendor to access the vendor dashboard.'}
        </p>
        <div style={G.actions}>
          <Link href="/vendor/apply" style={G.btnPrimary}>
            {hasApplied ? 'Check Application Status' : 'Apply to Become a Vendor'}
          </Link>
          <Link href="/" style={G.btnSecondary}>Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  .vd-shell {
    --vd-bg:         #0d0d12;
    --vd-surface:    #13131a;
    --vd-surface-2:  #1a1a24;
    --vd-border:     rgba(255,255,255,0.07);
    --vd-fg:         #f0f0f5;
    --vd-muted:      #9494b0;
    --vd-subtle:     #55556e;
    --vd-hover:      rgba(255,255,255,0.04);
    --vd-amber:      #f59e0b;
    --vd-amber-dim:  rgba(245,158,11,0.12);
    --vd-amber-ring: rgba(245,158,11,0.22);
    --vd-bottom-nav-h: 64px;
  }

  .vd-spin { animation: vd-rotate 1s linear infinite; }
  @keyframes vd-rotate { to { transform: rotate(360deg); } }

  .vd-shell * { box-sizing: border-box; }
  .vd-shell a { text-decoration: none; color: inherit; }

  /* Scrollbar */
  .vd-shell nav::-webkit-scrollbar { width: 3px; }
  .vd-shell nav::-webkit-scrollbar-track { background: transparent; }
  .vd-shell nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 999px; }

  /* Sidebar transition */
  .vd-mobile-sidebar { transition: transform 0.28s cubic-bezier(0.4,0,0.2,1); }

  .vd-bottom-spacer { display: none; height: calc(var(--vd-bottom-nav-h) + env(safe-area-inset-bottom, 0px)); }
  .vd-bottom-nav { display: none; }

  @media (max-width: 768px) {
    .vd-desktop-sidebar { display: none !important; }
    .vd-mobile-header   { display: flex !important; }
    .vd-main            { padding-left: 0 !important; }
    .vd-content         { padding: 1rem !important; }
    .vd-bottom-nav      { display: flex !important; }
    .vd-bottom-spacer   { display: block !important; }
  }
  @media (min-width: 769px) {
    .vd-mobile-sidebar  { display: none !important; }
    .vd-mobile-header   { display: none !important; }
  }
`;

const SIDEBAR_W = 248;

const L: Record<string, React.CSSProperties> = {
  shell:         { display: 'flex', minHeight: '100vh', background: '#0d0d12', fontFamily: "'DM Sans', sans-serif" },
  desktopSidebar:{ width: SIDEBAR_W, flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10 } as React.CSSProperties,
  mobileSidebar: { position: 'fixed', top: 0, left: 0, bottom: 0, width: SIDEBAR_W, zIndex: 50, willChange: 'transform' } as React.CSSProperties,
  overlay:       { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', zIndex: 40 } as React.CSSProperties,
  sidebar:       { width: SIDEBAR_W, height: '100%', background: '#13131a', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  brand:         { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  brandIcon:     { width: 34, height: 34, borderRadius: 9, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  brandName:     { fontSize: '0.9rem', fontWeight: 700, color: '#f0f0f5', lineHeight: 1.2 },
  brandSub:      { fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 1 },
  userBlock:     { display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.85rem 1.1rem', margin: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' },
  avatarWrap:    { flexShrink: 0 },
  avatarImg:     { width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' } as React.CSSProperties,
  avatarFallback:{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 },
  userName:      { fontSize: '0.82rem', fontWeight: 600, color: '#f0f0f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userEmail:     { fontSize: '0.68rem', color: '#55556e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  nav:           { flex: 1, padding: '0.5rem 0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.15rem' },
  navLabel:      { fontSize: '0.62rem', fontWeight: 700, color: '#55556e', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0.5rem 0.75rem 0.4rem' },
  navLink:       { display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.75rem', borderRadius: 9, color: '#9494b0', fontSize: '0.84rem', fontWeight: 500, position: 'relative', transition: 'all 0.15s' } as React.CSSProperties,
  navLinkActive: { background: 'rgba(245,158,11,0.08)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.15)' },
  activeBar:     { position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 2, height: '55%', background: '#f59e0b', borderRadius: '0 2px 2px 0' } as React.CSSProperties,
  sideFooter:    { padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: '0.15rem' },
  footerLink:    { display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.55rem 0.75rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 500, transition: 'all 0.15s', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", width: '100%', textAlign: 'left' as const },
  signOutBtn:    { color: '#f87171' },
  mobileHeader:  { display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#13131a', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, zIndex: 20 } as React.CSSProperties,
  menuBtn:       { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9494b0', cursor: 'pointer' },
  mobileClose:   { position: 'absolute', top: '0.85rem', right: '0.85rem', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#9494b0', cursor: 'pointer', zIndex: 1 } as React.CSSProperties,
  main:          { flex: 1, marginLeft: SIDEBAR_W, minWidth: 0, display: 'flex', flexDirection: 'column' },
  content:       { padding: '2rem 2.25rem', flex: 1, color: '#f0f0f5' },
  loadWrap:      { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d12' },

  /* Bottom tab bar (mobile) */
  bottomNav:     {
    position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30,
    background: 'rgba(19,19,26,0.92)', backdropFilter: 'blur(14px)',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    display: 'flex', alignItems: 'stretch', justifyContent: 'space-around',
    height: 'var(--vd-bottom-nav-h)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  } as React.CSSProperties,
  bottomNavItem: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: '0.2rem', fontSize: '0.62rem', fontWeight: 600, position: 'relative',
  } as React.CSSProperties,
  bottomNavLabel:{ fontSize: '0.62rem' },
  bottomNavDot:  { position: 'absolute', top: 6, width: 4, height: 4, borderRadius: '50%', background: '#f59e0b' },
  bottomNavFab:  {
    width: 50, height: 50, borderRadius: '50%', background: '#f59e0b',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginLeft: '0.25rem', marginRight: '0.25rem',
    boxShadow: '0 4px 14px rgba(245,158,11,0.35)', flexShrink: 0,
  } as React.CSSProperties,
};

const G: Record<string, React.CSSProperties> = {
  wrap:       { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d12', fontFamily: "'DM Sans', sans-serif", padding: '1rem' },
  card:       { maxWidth: 440, width: '100%', background: '#13131a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '2.5rem', textAlign: 'center' },
  iconWrap:   { width: 60, height: 60, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' },
  title:      { fontSize: '1.25rem', fontFamily: "'Instrument Serif', serif", fontWeight: 400, color: '#f0f0f5', marginBottom: '0.75rem' },
  desc:       { fontSize: '0.84rem', color: '#9494b0', lineHeight: 1.7, marginBottom: '1.75rem' },
  actions:    { display: 'flex', flexDirection: 'column', gap: '0.65rem' },
  btnPrimary: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.7rem 1.4rem', borderRadius: 10, background: '#f59e0b', color: '#0a0a0f', fontSize: '0.88rem', fontWeight: 700, textDecoration: 'none' },
  btnSecondary:{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.7rem 1.4rem', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#9494b0', fontSize: '0.88rem', textDecoration: 'none' },
};