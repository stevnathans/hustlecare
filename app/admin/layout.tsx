// app/admin/layout.tsx
import "@/app/globals.css"
import Link from "next/link"
import { ReactNode } from "react"
import { Home, Users, ShoppingCart, Building, ClipboardList, MessageSquare, Star } from "lucide-react"
import { ModeToggle } from "@/components/ui/mode-toggle"

const navItems = [
  { name: "Dashboard", href: "/admin", icon: <Home size={20} /> },
  { name: "Users", href: "/admin/users", icon: <Users size={20} /> },
  { name: "Products", href: "/admin/products", icon: <ShoppingCart size={20} /> },
  { name: "Businesses", href: "/admin/businesses", icon: <Building size={20} /> },
  { name: "Requirements", href: "/admin/requirements", icon: <ClipboardList size={20} /> },
  { name: "Comments", href: "/admin/comments", icon: <MessageSquare size={20} /> },
  { name: "Reviews", href: "/admin/reviews", icon: <Star size={20} /> },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted text-muted-foreground">
      <aside className="w-64 p-4 bg-white dark:bg-gray-900 border-r hidden md:block">
        <div className="text-xl font-bold mb-6 text-primary">Admin Dashboard</div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1">
        <header className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900">
          <div className="md:hidden font-semibold text-lg">Admin</div>
          <ModeToggle />
        </header>
        <section className="p-6">
          {children}
        </section>
      </main>
    </div>
  )
}
