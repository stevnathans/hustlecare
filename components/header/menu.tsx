"use client";

import { useState, useEffect } from "react";
import {
  Menu as MenuIcon,
  X,
  LogIn,
  Handshake,
  Briefcase,
  Mail,
  Info,
  Search,
  Store,
  BookOpen,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import MenuSearchBar from "./MenuSearchBar";
import NotificationBell from "@/components/Dashboard/NotificationBell";

const NAV_LINKS = [
  { href: "/businesses", label: "Businesses", icon: Briefcase },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/guides", label: "Guides", icon: BookOpen },
  { href: "/services", label: "Services", icon: Handshake },
  { href: "/about", label: "About", icon: Info },
  { href: "/contact", label: "Contact", icon: Mail },
];

export default function Menu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const isAuthenticated = status === "authenticated";

  // Matches the check used in app/vendor/apply/page.tsx
  const isVendor = (session?.user?.role as string | undefined) === "vendor";

  useEffect(() => {
    const handleProfileUpdate = async () => {
      try {
        await update();
      } catch (error) {
        console.error("Error updating session:", error);
      }
    };
    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, [update]);

  const closeAllMenus = () => {
    setIsOpen(false);
    setIsSearchOpen(false);
    setIsProfileOpen(false);
  };

  const handleDashboardClick = () => {
    router.push("/dashboard");
    closeAllMenus();
  };

  const handleVendorDashboardClick = () => {
    router.push("/vendor/dashboard");
    closeAllMenus();
  };

  const handleBecomeVendorClick = () => {
    router.push("/vendor/apply");
    closeAllMenus();
  };

  const handleSignOut = () => {
    signOut();
    closeAllMenus();
  };

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isOpen) setIsOpen(false);
    setIsProfileOpen(false);
  };

  const handleMenuToggle = () => {
    setIsOpen(!isOpen);
    if (isSearchOpen) setIsSearchOpen(false);
    setIsProfileOpen(false);
  };

  const handleProfileToggle = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-4">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="h-8 w-8 flex items-center justify-center group-hover:scale-105 transition-all duration-200">
                <Image
                  src="/images/Favicon.png"
                  alt="Hustlecare Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-emerald-600 bg-clip-text text-transparent group-hover:from-emerald-700 group-hover:to-emerald-700 transition-all duration-200 whitespace-nowrap">
                Hustlecare
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-2 rounded-lg text-[15px] font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/70 dark:hover:bg-emerald-900/20 transition-colors duration-200 whitespace-nowrap"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex flex-1 min-w-0 max-w-xs">
            <MenuSearchBar />
          </div>

          {/* Desktop Right Section */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            {!isVendor && (
              <button
                onClick={handleBecomeVendorClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all duration-200 whitespace-nowrap"
              >
                <Store className="h-4 w-4" />
                Become a Vendor
              </button>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <NotificationBell />

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={handleProfileToggle}
                    className="flex items-center space-x-2 bg-gradient-to-r from-emerald-50 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-900/30 hover:from-emerald-100 hover:to-emerald-100 dark:hover:from-emerald-900/50 dark:hover:to-emerald-900/50 pl-2 pr-3 py-1.5 rounded-full border border-emerald-200/50 dark:border-emerald-700/50 transition-all duration-200 hover:shadow-md group"
                  >
                    {session?.user?.image ? (
                      <div className="h-8 w-8 rounded-full overflow-hidden ring-2 ring-emerald-200 dark:ring-emerald-700 group-hover:ring-emerald-300 dark:group-hover:ring-emerald-600 transition-all duration-200 flex-shrink-0">
                        <Image
                          src={session.user.image}
                          alt="Profile"
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center ring-2 ring-emerald-200 dark:ring-emerald-700 group-hover:ring-emerald-300 dark:group-hover:ring-emerald-600 transition-all duration-200 flex-shrink-0">
                        <span className="text-sm font-semibold text-white">
                          {session?.user?.name?.charAt(0) || "U"}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-200 max-w-[100px] truncate">
                      {session?.user?.name || "User"}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                        isProfileOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isProfileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsProfileOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200/70 dark:border-gray-700/70 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {session?.user?.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {session?.user?.email}
                          </p>
                        </div>

                        <button
                          onClick={handleDashboardClick}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors duration-200"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </button>

                        {isVendor && (
                          <button
                            onClick={handleVendorDashboardClick}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors duration-200"
                          >
                            <Store className="h-4 w-4" />
                            Vendor Dashboard
                          </button>
                        )}

                        <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => router.push("/signup")}
                className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-semibold rounded-full text-white bg-gradient-to-r from-emerald-600 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Get Started
              </button>
            )}
          </div>

          {/* Mobile/Tablet Controls */}
          <div className="lg:hidden flex items-center space-x-1">
            <button
              onClick={handleSearchToggle}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 transition-all duration-200"
            >
              <Search className="h-6 w-6" />
            </button>

            <NotificationBell />

            <button
              onClick={handleMenuToggle}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 transition-all duration-200"
            >
              {isOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Search Bar */}
      {isSearchOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsSearchOpen(false)}
          />
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg z-50">
            <div className="px-4 py-4">
              <MenuSearchBar />
            </div>
          </div>
        </>
      )}

      {/* Mobile/Tablet Menu */}
      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 py-6 space-y-4">
              <div className="pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
                <MenuSearchBar />
              </div>

              <div className="space-y-1">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>

              {!isVendor && (
                <button
                  onClick={handleBecomeVendorClick}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 font-semibold rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all duration-200"
                >
                  <Store className="h-5 w-5" />
                  <span>Become a Vendor</span>
                </button>
              )}

              <div className="border-t border-gray-200/50 dark:border-gray-700/50 my-4"></div>

              {isAuthenticated ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 px-4 py-3 bg-gradient-to-r from-emerald-50 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-900/30 rounded-xl">
                    {session?.user?.image ? (
                      <div className="h-12 w-12 rounded-full overflow-hidden ring-2 ring-emerald-200 dark:ring-emerald-700">
                        <Image
                          src={session.user.image}
                          alt="Profile"
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center ring-2 ring-emerald-200 dark:ring-emerald-700">
                        <span className="text-lg font-semibold text-white">
                          {session?.user?.name?.charAt(0) || "U"}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                        {session?.user?.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {session?.user?.email}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleDashboardClick}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Go to Dashboard</span>
                  </button>

                  {isVendor && (
                    <button
                      onClick={handleVendorDashboardClick}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 font-semibold rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all duration-200"
                    >
                      <Store className="h-5 w-5" />
                      <span>Vendor Dashboard</span>
                    </button>
                  )}

                  <button
                    onClick={handleSignOut}
                    className="w-full text-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    router.push("/signup");
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Get Started</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}