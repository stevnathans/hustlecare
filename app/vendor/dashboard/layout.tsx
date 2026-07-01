/* eslint-disable @typescript-eslint/no-unused-vars */
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

const SIDEBAR_W = 248;
const BOTTOM_NAV_H = 64;

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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin text-emerald-600" />
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

  const Sidebar = () => (
    <aside className="flex h-full flex-col overflow-hidden border-r border-gray-200 bg-white" style={{ width: SIDEBAR_W }}>
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 pb-4 pt-5">
        <div className="flex h-8.5 w-8.5 flex-shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50">
          <Store size={16} className="text-emerald-600" />
        </div>
        <div>
          <div className="text-sm font-bold leading-tight text-gray-900">Hustlecare</div>
          <div className="mt-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-emerald-600">
            Vendor Portal
          </div>
        </div>
      </div>

      {/* User */}
      <div className="mx-3 mt-3 flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
        <div className="flex-shrink-0">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt=""
              width={34}
              height={34}
              className="h-8.5 w-8.5 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              {session?.user?.name?.[0]?.toUpperCase() ?? 'V'}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-gray-900">
            {session?.user?.name || 'Vendor'}
          </div>
          <div className="truncate text-xs text-gray-400">{session?.user?.email}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2">
        <div className="px-3 pb-1.5 pt-2 text-[0.62rem] font-bold uppercase tracking-wider text-gray-400">
          Navigation
        </div>
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                active
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-[55%] w-0.5 -translate-y-1/2 rounded-r bg-emerald-600" />
              )}
              <item.icon size={16} className={`flex-shrink-0 ${active ? 'text-emerald-600' : 'text-gray-400'}`} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={13} className="text-emerald-500 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-0.5 border-t border-gray-100 p-3">
        <Link
          href="/vendors"
          target="_blank"
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
        >
          <ExternalLink size={14} className="text-gray-400" />
          <span>View Marketplace</span>
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="fixed bottom-0 left-0 top-0 z-10 hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile drawer overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className="fixed bottom-0 left-0 top-0 z-50 transition-transform duration-300 ease-in-out md:hidden"
        style={{ width: SIDEBAR_W, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        <div className="relative h-full">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="absolute right-3.5 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm"
          >
            <X size={18} />
          </button>
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <main className="flex min-w-0 flex-1 flex-col md:ml-[248px]">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50">
              <Store size={14} className="text-emerald-600" />
            </div>
            <span className="text-sm font-bold text-gray-900">Vendor Portal</span>
          </div>
          <div className="flex-shrink-0">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                {session?.user?.name?.[0]?.toUpperCase() ?? 'V'}
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 p-4 text-gray-900 md:px-9 md:py-8">{children}</div>

        {/* Spacer so bottom nav doesn't cover content */}
        <div
          className="md:hidden"
          style={{ height: `calc(${BOTTOM_NAV_H}px + env(safe-area-inset-bottom, 0px))` }}
        />
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-gray-200 bg-white/95 backdrop-blur-lg md:hidden"
        style={{ height: BOTTOM_NAV_H, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[0.62rem] font-semibold ${
                active ? 'text-emerald-600' : 'text-gray-400'
              }`}
            >
              <item.icon size={20} className={active ? 'text-emerald-600' : 'text-gray-400'} />
              <span>{item.short}</span>
              {active && (
                <span className="absolute top-1.5 h-1 w-1 rounded-full bg-emerald-600" />
              )}
            </Link>
          );
        })}
        <Link
          href="/vendor/dashboard/products/new"
          aria-label="Add product"
          className="my-auto ml-1 mr-1 flex h-12.5 w-12.5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 shadow-lg shadow-emerald-600/30"
        >
          <Plus size={22} className="text-white" />
        </Link>
      </nav>
    </div>
  );
}

function VendorGate({ role }: { role: string }) {
  const hasApplied = role === 'user';
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-[440px] rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-15 w-15 items-center justify-center rounded-full bg-emerald-50" style={{ width: 60, height: 60 }}>
          {hasApplied ? <Clock size={28} className="text-emerald-600" /> : <Shield size={28} className="text-indigo-500" />}
        </div>
        <h1 className="mb-3 text-xl font-bold text-gray-900">Vendor Access Required</h1>
        <p className="mb-7 text-sm leading-relaxed text-gray-500">
          {hasApplied
            ? "Your account hasn't been approved as a vendor yet. If you've already applied, check your email for updates."
            : 'Apply to become a vendor to access the vendor dashboard.'}
        </p>
        <div className="flex flex-col gap-2.5">
          <Link
            href="/vendor/apply"
            className="flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            {hasApplied ? 'Check Application Status' : 'Apply to Become a Vendor'}
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}