"use client";

import { useState } from "react";
import { Menu as MenuIcon, X, LogIn, Sparkles, Briefcase, Mail, Info } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Menu() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const isAuthenticated = status === "authenticated";

  const handleDashboardClick = () => {
    router.push('/dashboard');
    setIsOpen(false);
  };

  const handleSignOut = () => {
    signOut();
    setIsOpen(false);
  };

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo with enhanced styling - Updated to match hero colors */}
          <div className="flex-shrink-0 flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent group-hover:from-emerald-700 group-hover:to-green-700 transition-all duration-200">
                Hustlecare
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {/* Navigation Links - Updated hover colors */}
            <div className="flex items-center space-x-6">
              <Link 
                href="/business" 
                className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200 font-medium group"
              >
                <Briefcase className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                <span>Businesses</span>
              </Link>
              
              <Link 
                href="/about" 
                className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200 font-medium group"
              >
                <Info className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                <span>About</span>
              </Link>
              
              <Link 
                href="/contact" 
                className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200 font-medium group"
              >
                <Mail className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                <span>Contact</span>
              </Link>
            </div>

            {/* Authentication Section - Updated colors */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleDashboardClick}
                  className="flex items-center space-x-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 hover:from-emerald-100 hover:to-green-100 dark:hover:from-emerald-900/50 dark:hover:to-green-900/50 px-4 py-2 rounded-full border border-emerald-200/50 dark:border-emerald-700/50 transition-all duration-200 hover:shadow-md group"
                >
                  {session?.user?.image ? (
                    <div className="h-8 w-8 rounded-full overflow-hidden ring-2 ring-emerald-200 dark:ring-emerald-700 group-hover:ring-emerald-300 dark:group-hover:ring-emerald-600 transition-all duration-200">
                      <Image
                        src={session.user.image}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center ring-2 ring-emerald-200 dark:ring-emerald-700 group-hover:ring-emerald-300 dark:group-hover:ring-emerald-600 transition-all duration-200">
                      <span className="text-sm font-semibold text-white">
                        {session?.user?.name?.charAt(0) || "U"}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-200">
                      {session?.user?.name || "User"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors duration-200">
                      Go to Dashboard
                    </span>
                  </div>
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push('/signup')}
                className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-semibold rounded-full text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Get Started
              </button>
            )}
          </div>

          {/* Mobile Menu Button - Updated hover colors */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 transition-all duration-200"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Mobile Menu Panel */}
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg z-50">
            <div className="px-4 py-6 space-y-4">
              {/* Navigation Links - Updated hover colors */}
              <div className="space-y-2">
                <Link
                  href="/samples"
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  <BookOpen className="h-5 w-5" />
                  <span>Samples</span>
                </Link>
                
                <Link
                  href="/about"
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  <Info className="h-5 w-5" />
                  <span>About</span>
                </Link>
                
                <Link
                  href="/contact"
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  <Mail className="h-5 w-5" />
                  <span>Contact</span>
                </Link>
              </div>
              
              {/* Divider */}
              <div className="border-t border-gray-200/50 dark:border-gray-700/50 my-4"></div>
              
              {/* Authentication Section - Updated colors */}
              {isAuthenticated ? (
                <div className="space-y-4">
                  {/* User Info - Updated background colors */}
                  <div className="flex items-center space-x-4 px-4 py-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl">
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
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center ring-2 ring-emerald-200 dark:ring-emerald-700">
                        <span className="text-lg font-semibold text-white">
                          {session?.user?.name?.charAt(0) || "U"}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {session?.user?.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {session?.user?.email}
                      </p>
                    </div>
                  </div>
                  
                  {/* Dashboard Button - Updated gradient colors */}
                  <button
                    onClick={handleDashboardClick}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Sparkles className="h-5 w-5" />
                    <span>Go to Dashboard</span>
                  </button>
                  
                  {/* Sign Out */}
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
                    signIn("google");
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
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