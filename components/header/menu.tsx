"use client";

import { useState } from "react";
import { Menu as MenuIcon, ShoppingCart, X } from "lucide-react";
import Link from "next/link";
import { useClerk, SignInButton, SignedOut, SignedIn, UserButton} from "@clerk/nextjs"
import router from "next/router";

export default function Menu({ }: { user?: { name: string; photoURL?: string } }) {
  const [isOpen, setIsOpen] = useState(false);
  useClerk()

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
    

          <div>
            <SignedOut>
              <SignInButton />
            </SignedOut>
            <SignedIn>
             <UserButton showName>
               <UserButton.MenuItems>
                <UserButton.Action label="Cart" labelIcon={<ShoppingCart />} onClick ={() => router.push('/cart')} />

               </UserButton.MenuItems>
             </UserButton>
            </SignedIn>

          </div>
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
          <div>
            <SignedOut>
              <SignInButton/>
            </SignedOut>
            <SignedIn>
             <UserButton showName/>
            </SignedIn>
          </div>
        </div>
      )}
    </header>
  );
}
