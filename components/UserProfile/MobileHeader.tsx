'use client';

import { useState } from "react";
import { Bars3Icon, CogIcon, FolderIcon, HomeIcon, QuestionMarkCircleIcon, UserIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { UsersIcon } from "lucide-react";

interface MobileHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function MobileHeader({ activeTab, setActiveTab }: MobileHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: "dashboard", name: "Dashboard", icon: HomeIcon },
    { id: "profile", name: "Profile", icon: UserIcon },
    { id: "my-lists", name: "My Lists", icon: FolderIcon },
      { id: "community", name: 'Community', icon: UsersIcon },
    { id: "settings", name: "Settings", icon: CogIcon },
    { id: "help", name: "Help", icon: QuestionMarkCircleIcon },
  ];

  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false); // Close menu after selection
  };

  const getCurrentTabName = () => {
    const currentTab = navigationItems.find(item => item.id === activeTab);
    return currentTab?.name || "Dashboard";
  };

  return (
    <>
      {/* Mobile header bar */}
      <div className="md:hidden fixed w-full bg-white dark:bg-gray-900 z-10 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h1 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
              {getCurrentTabName()}
            </h1>
          </div>
          <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium text-xs">
              HC
            </span>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu panel */}
          <div className="md:hidden fixed inset-y-0 left-0 z-30 w-80 bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                Hustlecare
              </h1>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="mt-6 px-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabSelect(item.id)}
                    className={`
                      group flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                      ${isActive
                        ? "bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-r-2 border-emerald-600 dark:border-emerald-400"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                      }
                    `}
                  >
                    <Icon 
                      className={`mr-3 h-5 w-5 transition-colors duration-200 ${
                        isActive 
                          ? "text-emerald-600 dark:text-emerald-400" 
                          : "text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400"
                      }`} 
                    />
                    {item.name}
                  </button>
                );
              })}
            </nav>

            {/* Bottom section */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                    HC
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Dashboard
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Welcome back
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}