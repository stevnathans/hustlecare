"use client";

import { useState } from "react";
import { Menu as MenuIcon, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Menu({ user }: { user?: { name: string; photoURL?: string } }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-green-600">
          Hustlecare
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#" className="text-gray-700 hover:text-green-600">Samples</Link>
          <Link href="#" className="text-gray-700 hover:text-green-600">About</Link>
          <Link href="#" className="text-gray-700 hover:text-green-600">Contact</Link>

          {user ? (
            <Image
              src={user.photoURL || "/default-avatar.png"}
              alt={user.name}
              width={36}
              height={36}
              className="rounded-full"
            />
          ) : (
            <Link href="/login" className="text-green-600 font-medium hover:underline">
              Login
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden">
          {isOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-white border-t px-4 py-3 space-y-3">
          <Link href="#" className="block text-gray-700">Samples</Link>
          <Link href="#" className="block text-gray-700">About</Link>
          <Link href="#" className="block text-gray-700">Contact</Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Image
                src={user.photoURL || "/default-avatar.png"}
                alt={user.name}
                width={36}
                height={36}
                className="rounded-full"
              />
              <span className="text-sm text-gray-600">{user.name}</span>
            </div>
          ) : (
            <Link href="/login" className="text-green-600 font-medium">Login</Link>
          )}
        </div>
      )}
    </header>
  );
}
