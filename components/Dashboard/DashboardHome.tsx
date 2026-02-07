// components/Dashboard/DashboardHome.tsx
"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Activity,
  Clock,
  ArrowRight
} from "lucide-react";

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

interface DashboardHomeProps {
  user: User;
  stats: Stats;
  recentActivity: RecentActivity[];
}

export default function DashboardHome({ user, stats, recentActivity }: DashboardHomeProps) {
  const [greeting, setGreeting] = useState("");
  const [showAllActivities, setShowAllActivities] = useState(false);

  // Update greeting based on current time
  useEffect(() => {
    const updateGreeting = () => {
      const currentHour = new Date().getHours();
      if (currentHour < 12) {
        setGreeting("Good morning");
      } else if (currentHour < 18) {
        setGreeting("Good afternoon");
      } else {
        setGreeting("Good evening");
      }
    };

    updateGreeting();
    // Update greeting every minute to ensure it stays current
    const interval = setInterval(updateGreeting, 60000);

    return () => clearInterval(interval);
  }, []);

  // Get activities to display (first 5 or all based on showAllActivities)
  const activitiesToShow = showAllActivities 
    ? recentActivity 
    : recentActivity.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 dark:from-emerald-800 dark:to-emerald-900 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {greeting}, {user.name || "User"}!
        </h1>
        <p className="text-white/80 dark:text-gray-100">
          Welcome back to your dashboard. Here&apos;s what&apos;s happening with your saved businesses.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Businesses</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalBusinesses}</p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-full">
              <ShoppingBag className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalItems}</p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-full">
              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${stats.totalCost.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            </div>
            {recentActivity.length > 5 && (
              <button 
                onClick={() => setShowAllActivities(!showAllActivities)}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm font-medium flex items-center gap-1"
              >
                {showAllActivities ? "Show less" : "View all"}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {activitiesToShow.length > 0 ? (
            <div className="space-y-4">
              {activitiesToShow.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                      <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Added {activity.itemName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        to {activity.businessName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      ${activity.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Start adding items to your business lists to see activity here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}