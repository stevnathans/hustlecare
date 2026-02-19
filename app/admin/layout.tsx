'use client';
import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Home,
  Users,
  ShoppingCart,
  Building,
  ClipboardList,
  MessageSquare,
  Star,
  Store,
  Menu,
  X,
  Shield,
  LogOut,
  Settings,
  FileText,
  LayoutGrid
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  requiredRoles: string[];
}

const navItems: NavItem[] = [
  { name: "Dashboard",    href: "/admin",                icon: Home,          requiredRoles: ["author","editor","reviewer","admin"] },
  { name: "Users",        href: "/admin/users",          icon: Users,         requiredRoles: ["admin"] },
  { name: "Businesses",   href: "/admin/businesses",     icon: Building,      requiredRoles: ["author","editor","admin"] },
  { name: "Categories",   href: "/admin/categories",     icon: LayoutGrid,    requiredRoles: ["author","editor","admin"] },
  { name: "Requirements", href: "/admin/requirements",   icon: ClipboardList, requiredRoles: ["author","editor","admin"] },
  { name: "Products",     href: "/admin/products",       icon: ShoppingCart,  requiredRoles: ["author","editor","admin"] },
  { name: "Vendors",      href: "/admin/vendors",        icon: Store,         requiredRoles: ["editor","admin"] },
  { name: "Comments",     href: "/admin/comments",       icon: MessageSquare, requiredRoles: ["reviewer","editor","admin"] },
  { name: "Reviews",      href: "/admin/reviews",        icon: Star,          requiredRoles: ["reviewer","editor","admin"] },
  { name: "Audit Logs",   href: "/admin/audit",          icon: FileText,      requiredRoles: ["admin"] },
];

const ROLE_BADGE: Record<string, string> = {
  user:     "bg-admin-muted/60 text-admin-muted-fg",
  author:   "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20",
  editor:   "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20",
  reviewer: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  admin:    "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role || "user";

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  const visibleNavItems = navItems.filter(item =>
    item.requiredRoles.includes(userRole)
  );

  const roleBadge = ROLE_BADGE[userRole] ?? ROLE_BADGE.user;

  const Sidebar = () => (
    <aside className="w-64 bg-admin-surface border-r border-admin-border flex flex-col h-full">

      {/* Brand */}
      <div className="p-6 border-b border-admin-border">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-admin-fg tracking-tight">Hustlecare</h2>
            <p className="text-[11px] text-admin-muted-fg font-medium tracking-wide uppercase">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-admin-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-500/20 flex-shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-admin-fg truncate">
              {session?.user?.name || "User"}
            </p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold mt-0.5 ${roleBadge}`}>
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-widest uppercase text-admin-muted-fg">
          Navigation
        </p>
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 group relative
                ${isActive
                  ? "bg-indigo-600/15 text-indigo-400 shadow-sm"
                  : "text-admin-nav-fg hover:bg-admin-hover hover:text-admin-fg"
                }
              `}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-500 rounded-r-full" />
              )}
              <Icon className={`h-4 w-4 flex-shrink-0 transition-colors ${isActive ? "text-indigo-400" : "text-admin-muted-fg group-hover:text-admin-fg"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-admin-border space-y-0.5">
        <Link
          href="/admin/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-admin-nav-fg hover:bg-admin-hover hover:text-admin-fg transition-all group"
        >
          <Settings className="h-4 w-4 text-admin-muted-fg group-hover:text-admin-fg transition-colors" />
          <span>Settings</span>
        </Link>
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all group"
        >
          <LogOut className="h-4 w-4 transition-colors" />
          <span>Sign Out</span>
        </Link>
      </div>
    </aside>
  );

  return (
    <>
      {/* Inject CSS variables scoped to admin only */}
      <style>{`
        .admin-shell {
          --admin-bg:         #0d0d12;
          --admin-surface:    #13131a;
          --admin-surface-2:  #1a1a24;
          --admin-border:     rgba(255,255,255,0.07);
          --admin-fg:         #f0f0f5;
          --admin-nav-fg:     #9494b0;
          --admin-muted-fg:   #55556e;
          --admin-hover:      rgba(255,255,255,0.05);
        }
        .bg-admin-bg        { background-color: var(--admin-bg); }
        .bg-admin-surface   { background-color: var(--admin-surface); }
        .bg-admin-surface-2 { background-color: var(--admin-surface-2); }
        .border-admin-border { border-color: var(--admin-border); }
        .text-admin-fg      { color: var(--admin-fg); }
        .text-admin-nav-fg  { color: var(--admin-nav-fg); }
        .text-admin-muted-fg { color: var(--admin-muted-fg); }
        .bg-admin-hover     { background-color: var(--admin-hover); }
        .bg-admin-muted     { background-color: rgba(255,255,255,0.06); }

        /* Thin custom scrollbar for sidebar */
        .admin-shell nav::-webkit-scrollbar { width: 3px; }
        .admin-shell nav::-webkit-scrollbar-track { background: transparent; }
        .admin-shell nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 999px; }
        .admin-shell nav::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>

      <div className="admin-shell flex min-h-screen bg-admin-bg">

        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 md:z-10">
          <Sidebar />
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 w-64 bg-admin-surface z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-admin-hover text-admin-muted-fg hover:text-admin-fg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <Sidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 md:pl-64 min-w-0">

          {/* Mobile header */}
          <header className="sticky top-0 z-30 bg-admin-surface border-b border-admin-border md:hidden backdrop-blur-md">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-admin-hover text-admin-muted-fg hover:text-admin-fg transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-admin-fg">Admin Panel</span>
              </div>
              <div className="w-9" />
            </div>
          </header>

          {/* Page content */}
          <div className="p-6 md:p-8 text-admin-fg">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}