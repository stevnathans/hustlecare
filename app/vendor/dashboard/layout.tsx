'use client';
// app/vendor/dashboard/layout.tsx
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import {
  LayoutDashboard, Package, User, Store,
  LogOut, ChevronRight, Loader2, Clock, Shield,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const NAV_ITEMS = [
  { href: '/vendor/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/vendor/dashboard/products', label: 'Products', icon: Package },
  { href: '/vendor/dashboard/profile', label: 'My Profile', icon: User },
];

export default function VendorDashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin?callbackUrl=/vendor/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div style={loadingStyles.wrap}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#f59e0b' }} />
        <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      </div>
    );
  }

  // Not a vendor — show gate
  if (status === 'authenticated' && String(session.user.role) !== 'vendor' && String(session.user.role) !== 'admin') {
    return <VendorGate role={String(session.user.role)} />;
  }

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div style={layoutStyles.wrap}>
      <style>{LAYOUT_CSS}</style>

      {/* Sidebar */}
      <aside style={layoutStyles.sidebar}>
        <div style={layoutStyles.sidebarTop}>
          <Link href="/" style={layoutStyles.logoLink}>
            <Store size={18} color="#f59e0b" />
            <span style={layoutStyles.logoText}>Hustlecare</span>
          </Link>
          <div style={layoutStyles.vendorBadge}>Vendor Portal</div>
        </div>

        <nav style={layoutStyles.nav}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href, item.exact);
            return (
              <Link key={item.href} href={item.href} style={{
                ...layoutStyles.navLink,
                ...(active ? layoutStyles.navLinkActive : {}),
              }}>
                <item.icon size={16} />
                <span>{item.label}</span>
                {active && <ChevronRight size={13} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </Link>
            );
          })}
        </nav>

        <div style={layoutStyles.sidebarBottom}>
          <div style={layoutStyles.userRow}>
            {session?.user?.image ? (
              <Image src={session.user.image} alt="" width={40} height={40} style={layoutStyles.avatar} />
            ) : (
              <div style={layoutStyles.avatarFallback}>
                {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={layoutStyles.userName}>{session?.user?.name}</div>
              <div style={layoutStyles.userEmail}>{session?.user?.email}</div>
            </div>
          </div>
          <button style={layoutStyles.signOutBtn} onClick={() => signOut({ callbackUrl: '/' })}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={layoutStyles.main}>
        {children}
      </main>
    </div>
  );
}

function VendorGate({ role }: { role: string }) {
  const hasApplied = role === 'user'; // they haven't applied yet, or application is pending

  return (
    <div style={gateStyles.wrap}>
      <style>{LAYOUT_CSS}</style>
      <div style={gateStyles.card}>
        <div style={gateStyles.iconWrap}>
          {hasApplied ? <Clock size={28} color="#f59e0b" /> : <Shield size={28} color="#818cf8" />}
        </div>
        <h1 style={gateStyles.title}>Vendor Access Required</h1>
        <p style={gateStyles.desc}>
          {hasApplied
            ? 'Your account needs to be approved as a vendor to access this area. If you\'ve already applied, check your email for updates.'
            : 'You need to apply as a vendor to access the vendor dashboard.'}
        </p>
        <div style={gateStyles.actions}>
          <Link href="/vendor/apply" style={gateStyles.btnPrimary}>
            {hasApplied ? 'Check Application Status' : 'Apply to Become a Vendor'}
          </Link>
          <Link href="/" style={gateStyles.btnSecondary}>Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

const LAYOUT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080810; }
  a { text-decoration: none; }
`;

const layoutStyles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    minHeight: '100vh',
    background: '#080810',
    fontFamily: "'DM Sans', sans-serif",
    color: '#f0f0f5',
  },
  sidebar: {
    width: 240,
    flexShrink: 0,
    background: '#0c0c16',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky' as const,
    top: 0,
    height: '100vh',
  },
  sidebarTop: {
    padding: '1.25rem 1.25rem 0.75rem',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  logoLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    color: '#f0f0f5',
  },
  logoText: {
    fontFamily: "'Instrument Serif', serif",
    fontSize: '1.1rem',
    color: '#f0f0f5',
  },
  vendorBadge: {
    display: 'inline-flex',
    padding: '0.2rem 0.6rem',
    borderRadius: 100,
    background: 'rgba(245,158,11,0.1)',
    border: '1px solid rgba(245,158,11,0.2)',
    color: '#f59e0b',
    fontSize: '0.68rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  nav: {
    flex: 1,
    padding: '0.75rem 0.75rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.2rem',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.6rem 0.85rem',
    borderRadius: 9,
    color: '#55556e',
    fontSize: '0.85rem',
    fontWeight: 500,
    transition: 'all 0.15s',
    textDecoration: 'none',
  },
  navLinkActive: {
    background: 'rgba(245,158,11,0.1)',
    color: '#fbbf24',
    border: '1px solid rgba(245,158,11,0.18)',
  },
  sidebarBottom: {
    padding: '0.75rem',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.5rem',
    marginBottom: '0.5rem',
    overflow: 'hidden',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    flexShrink: 0,
    objectFit: 'cover' as const,
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    flexShrink: 0,
    background: 'rgba(245,158,11,0.15)',
    color: '#f59e0b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.82rem',
    fontWeight: 700,
  },
  userName: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#e2e2f0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  userEmail: {
    fontSize: '0.7rem',
    color: '#55556e',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  signOutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    width: '100%',
    padding: '0.5rem 0.85rem',
    borderRadius: 8,
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.07)',
    color: '#55556e',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  main: {
    flex: 1,
    overflow: 'auto',
    padding: '2rem',
    minWidth: 0,
  },
};

const loadingStyles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#080810',
  },
};

const gateStyles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#080810',
    fontFamily: "'DM Sans', sans-serif",
    padding: '1rem',
  },
  card: {
    maxWidth: 460,
    width: '100%',
    background: '#0f0f1a',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: '2.5rem',
    textAlign: 'center',
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: '50%',
    background: 'rgba(245,158,11,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.25rem',
  },
  title: {
    fontSize: '1.3rem',
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    color: '#f0f0f5',
    marginBottom: '0.75rem',
  },
  desc: {
    fontSize: '0.84rem',
    color: '#9494b0',
    lineHeight: 1.7,
    marginBottom: '1.75rem',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.65rem',
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.7rem 1.4rem',
    borderRadius: 10,
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#0a0a0f',
    fontSize: '0.88rem',
    fontWeight: 700,
    textDecoration: 'none',
  },
  btnSecondary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.7rem 1.4rem',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.09)',
    color: '#9494b0',
    fontSize: '0.88rem',
    textDecoration: 'none',
  },
};