'use client';
import { useEffect, useState } from 'react';
import { 
  Users, 
  ShoppingCart, 
  Building, 
  Star, 
  MessageSquare, 
  TrendingUp,
  DollarSign,
  Eye,
  Activity
} from 'lucide-react';

interface Stats {
  users: {
    total: number;
    activeToday: number;
    newThisWeek: number;
    trend: number;
  };
  businesses: {
    total: number;
    published: number;
    draft: number;
  };
  products: {
    total: number;
    averagePrice: number;
    byVendor: number;
  };
  requirements: {
    total: number;
    required: number;
    optional: number;
  };
  comments: {
    total: number;
    pending: number;
    approved: number;
  };
  reviews: {
    total: number;
    averageRating: number;
    pending: number;
  };
  searches: {
    total: number;
    uniqueKeywords: number;
    topKeyword: string;
  };
  carts: {
    total: number;
    totalValue: number;
    averageValue: number;
  };
}

interface RecentActivity {
  id: string;
  action: string;
  entity: string;
  user: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/activity')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setRecentActivity(activityData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    subtitle, 
    trend, 
    color = "blue" 
  }: { 
    title: string; 
    value: string | number; 
    icon: React.ElementType; 
    subtitle?: string; 
    trend?: number;
    color?: string;
  }) => {
    const colorClasses: Record<string, string> = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
      indigo: 'bg-indigo-500',
      pink: 'bg-pink-500',
      yellow: 'bg-yellow-500',
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div className="flex items-center mt-2">
                <TrendingUp className={`h-4 w-4 mr-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend >= 0 ? '+' : ''}{trend}% from last week
                </span>
              </div>
            )}
          </div>
          <div className={`${colorClasses[color]} p-3 rounded-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening with Hustlecare today.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Activity className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.users.total.toLocaleString() || '0'}
          icon={Users}
          subtitle={`${stats?.users.activeToday || 0} active today`}
          trend={stats?.users.trend}
          color="blue"
        />
        
        <StatCard
          title="Businesses"
          value={stats?.businesses.total || '0'}
          icon={Building}
          subtitle={`${stats?.businesses.published || 0} published`}
          color="purple"
        />
        
        <StatCard
          title="Products"
          value={stats?.products.total.toLocaleString() || '0'}
          icon={ShoppingCart}
          subtitle={`Avg: KES ${stats?.products.averagePrice.toLocaleString() || 0}`}
          color="green"
        />
        
        <StatCard
          title="Total Cart Value"
          value={`KES ${stats?.carts.totalValue.toLocaleString() || 0}`}
          icon={DollarSign}
          subtitle={`${stats?.carts.total || 0} active carts`}
          color="orange"
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Requirements"
          value={stats?.requirements.total || '0'}
          icon={Eye}
          subtitle={`${stats?.requirements.required || 0} required`}
          color="indigo"
        />
        
        <StatCard
          title="Reviews"
          value={stats?.reviews.total || '0'}
          icon={Star}
          subtitle={`Avg rating: ${stats?.reviews.averageRating.toFixed(1) || '0.0'} stars`}
          color="yellow"
        />
        
        <StatCard
          title="Comments"
          value={stats?.comments.total || '0'}
          icon={MessageSquare}
          subtitle={`${stats?.comments.pending || 0} pending approval`}
          color="pink"
        />
        
        <StatCard
          title="Searches"
          value={stats?.searches.total.toLocaleString() || '0'}
          icon={TrendingUp}
          subtitle={`Top: ${stats?.searches.topKeyword || 'N/A'}`}
          color="red"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          <p className="text-sm text-gray-500 mt-1">Latest admin actions across the platform</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {activity.entity} • by {activity.user}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-4">Content Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">Businesses</span>
              <span className="text-sm font-bold text-blue-900">{stats?.businesses.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">Requirements</span>
              <span className="text-sm font-bold text-blue-900">{stats?.requirements.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">Products</span>
              <span className="text-sm font-bold text-blue-900">{stats?.products.total || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <h3 className="text-sm font-semibold text-green-900 mb-4">User Engagement</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700">Active Carts</span>
              <span className="text-sm font-bold text-green-900">{stats?.carts.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700">Searches Today</span>
              <span className="text-sm font-bold text-green-900">{stats?.searches.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-700">Reviews</span>
              <span className="text-sm font-bold text-green-900">{stats?.reviews.total || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <h3 className="text-sm font-semibold text-purple-900 mb-4">Moderation Queue</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-700">Pending Comments</span>
              <span className="text-sm font-bold text-purple-900">{stats?.comments.pending || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-700">Pending Reviews</span>
              <span className="text-sm font-bold text-purple-900">{stats?.reviews.pending || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-700">Draft Businesses</span>
              <span className="text-sm font-bold text-purple-900">{stats?.businesses.draft || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}