// components/Dashboard/DashboardClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import DesktopSidebar from "@/components/UserProfile/DesktopSidebar";
import MobileHeader from "@/components/UserProfile/MobileHeader";
import DashboardHome from "@/components/Dashboard/DashboardHome";
import ProfileTab from "@/components/Dashboard/ProfileTab";
import MyListsTab from "@/components/Dashboard/MyListsTab";
import SettingsTab from "@/components/Dashboard/SettingsTab";
import HelpTab from "@/components/Dashboard/HelpTab";

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  createdAt: string;
}

interface Stats {
  totalBusinesses: number;
  totalItems: number;
  totalCost: number;
}

interface RecentActivity {
  id: string;
  businessName: string;
  itemName: string;
  price: number;
  createdAt: string;
}

interface DashboardClientProps {
  user: User;
  stats: Stats;
  recentActivity: RecentActivity[];
}

export default function DashboardClient({ user, stats, recentActivity }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { theme, setTheme } = useTheme(); // Removed unused systemTheme
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardHome user={user} stats={stats} recentActivity={recentActivity} />;
      case "profile":
        return <ProfileTab user={user} />;
      case "my-lists":
        return <MyListsTab />;
      case "settings":
        return <SettingsTab user={user} theme={theme} setTheme={setTheme} />;
      case "help":
        return <HelpTab />;
      default:
        return <DashboardHome user={user} stats={stats} recentActivity={recentActivity} />;
    }
  };

  if (!mounted) {
    return (
      <div className="flex h-full">
        <DesktopSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <MobileHeader activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 md:pl-64 pt-16 md:pt-0">
          <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <div className="animate-pulse">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <DesktopSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <MobileHeader activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 md:pl-64 pt-16 md:pt-0">
        <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}