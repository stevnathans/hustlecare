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
  FileText
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  requiredRoles: string[];
}

const navItems: NavItem[] = [
  { 
    name: "Dashboard", 
    href: "/admin", 
    icon: Home, 
    requiredRoles: ["author", "editor", "reviewer", "admin"] 
  },
  { 
    name: "Users", 
    href: "/admin/users", 
    icon: Users, 
    requiredRoles: ["admin"] 
  },
  { 
    name: "Businesses", 
    href: "/admin/businesses", 
    icon: Building, 
    requiredRoles: ["author", "editor", "admin"] 
  },
  { 
    name: "Requirements", 
    href: "/admin/requirements", 
    icon: ClipboardList, 
    requiredRoles: ["author", "editor", "admin"] 
  },
  { 
    name: "Products", 
    href: "/admin/products", 
    icon: ShoppingCart, 
    requiredRoles: ["author", "editor", "admin"] 
  },
  { 
    name: "Vendors", 
    href: "/admin/vendors", 
    icon: Store, 
    requiredRoles: ["editor", "admin"] 
  },
  { 
    name: "Comments", 
    href: "/admin/comments", 
    icon: MessageSquare, 
    requiredRoles: ["reviewer", "editor", "admin"] 
  },
  { 
    name: "Reviews", 
    href: "/admin/reviews", 
    icon: Star, 
    requiredRoles: ["reviewer", "editor", "admin"] 
  },
  { 
    name: "Audit Logs", 
    href: "/admin/audit", 
    icon: FileText, 
    requiredRoles: ["admin"] 
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role || "user";

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter(item =>
    item.requiredRoles.includes(userRole)
  );

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      user: "bg-gray-100 text-gray-800",
      author: "bg-blue-100 text-blue-800",
      editor: "bg-purple-100 text-purple-800",
      reviewer: "bg-green-100 text-green-800",
      admin: "bg-red-100 text-red-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const Sidebar = () => (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Hustlecare</h2>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {session?.user?.name || "User"}
            </p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(userRole)}`}>
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 space-y-1">
        <Link
          href="/admin/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 md:z-10">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 md:pl-64">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 md:hidden">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}