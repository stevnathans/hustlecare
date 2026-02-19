'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  ShoppingCart, 
  Building, 
  Star, 
  MessageSquare, 
  TrendingUp,
  DollarSign,
  Eye,
  Activity,
  ArrowUpRight,
  Clock,
  AlertCircle
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

interface QuickStat {
  label: string;
  value: number;
  change: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
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
        
        // Set quick stats for mini charts
        setQuickStats([
          { label: 'Users', value: statsData.users.total, change: statsData.users.trend },
          { label: 'Businesses', value: statsData.businesses.total, change: 5 },
          { label: 'Products', value: statsData.products.total, change: 12 },
          { label: 'Revenue', value: statsData.carts.totalValue, change: 8 },
        ]);
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
    color = "blue",
    onClick
  }: { 
    title: string; 
    value: string | number; 
    icon: React.ElementType; 
    subtitle?: string; 
    trend?: number;
    color?: string;
    onClick?: () => void;
  }) => {
    const colorClasses: Record<string, string> = {
      blue: 'bg-blue-500 group-hover:bg-blue-600',
      green: 'bg-green-500 group-hover:bg-green-600',
      purple: 'bg-purple-500 group-hover:bg-purple-600',
      orange: 'bg-orange-500 group-hover:bg-orange-600',
      red: 'bg-red-500 group-hover:bg-red-600',
      indigo: 'bg-indigo-500 group-hover:bg-indigo-600',
      pink: 'bg-pink-500 group-hover:bg-pink-600',
      yellow: 'bg-yellow-500 group-hover:bg-yellow-600',
    };

    return (
      <button
        onClick={onClick}
        className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all text-left w-full relative overflow-hidden"
      >
        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="flex items-start justify-between relative z-10">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
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
          <div className={`${colorClasses[color]} p-3 rounded-lg transition-colors`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </button>
    );
  };

  const AlertCard = ({ 
    title, 
    count, 
    color, 
    onClick 
  }: { 
    title: string; 
    count: number; 
    color: string; 
    onClick: () => void;
  }) => {
    if (count === 0) return null;
    
    return (
      <button
        onClick={onClick}
        className="flex items-center justify-between p-4 bg-white border-l-4 border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        style={{ borderLeftColor: color }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
            <AlertCircle className="h-5 w-5" style={{ color }} />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">Needs attention</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">{count}</span>
          <ArrowUpRight className="h-4 w-4 text-gray-400" />
        </div>
      </button>
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

      {/* Alerts Section - Things that need attention */}
      {((stats?.comments.pending || 0) > 0 || (stats?.reviews.pending || 0) > 0 || (stats?.businesses.draft || 0) > 0) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-amber-900">Pending Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AlertCard
              title="Pending Comments"
              count={stats?.comments.pending || 0}
              color="#f59e0b"
              onClick={() => router.push('/admin/comments')}
            />
            <AlertCard
              title="Pending Reviews"
              count={stats?.reviews.pending || 0}
              color="#f59e0b"
              onClick={() => router.push('/admin/reviews')}
            />
            <AlertCard
              title="Draft Businesses"
              count={stats?.businesses.draft || 0}
              color="#6366f1"
              onClick={() => router.push('/admin/businesses')}
            />
          </div>
        </div>
      )}

      {/* Main Stats Grid - Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.users.total.toLocaleString() || '0'}
          icon={Users}
          subtitle={`${stats?.users.activeToday || 0} active today`}
          trend={stats?.users.trend}
          color="blue"
          onClick={() => router.push('/admin/users')}
        />
        
        <StatCard
          title="Businesses"
          value={stats?.businesses.total || '0'}
          icon={Building}
          subtitle={`${stats?.businesses.published || 0} published`}
          color="purple"
          onClick={() => router.push('/admin/businesses')}
        />
        
        <StatCard
          title="Products"
          value={stats?.products.total.toLocaleString() || '0'}
          icon={ShoppingCart}
          subtitle={`Avg: KES ${stats?.products.averagePrice.toLocaleString() || 0}`}
          color="green"
          onClick={() => router.push('/admin/products')}
        />
        
        <StatCard
          title="Total Cart Value"
          value={`KES ${stats?.carts.totalValue.toLocaleString() || 0}`}
          icon={DollarSign}
          subtitle={`${stats?.carts.total || 0} active carts`}
          color="orange"
          onClick={() => router.push('/admin')}
        />
      </div>

      {/* Secondary Stats Grid - Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Requirements"
          value={stats?.requirements.total || '0'}
          icon={Eye}
          subtitle={`${stats?.requirements.required || 0} required`}
          color="indigo"
          onClick={() => router.push('/admin/requirements')}
        />
        
        <StatCard
          title="Reviews"
          value={stats?.reviews.total || '0'}
          icon={Star}
          subtitle={`Avg rating: ${stats?.reviews.averageRating.toFixed(1) || '0.0'} stars`}
          color="yellow"
          onClick={() => router.push('/admin/reviews')}
        />
        
        <StatCard
          title="Comments"
          value={stats?.comments.total || '0'}
          icon={MessageSquare}
          subtitle={`${stats?.comments.pending || 0} pending approval`}
          color="pink"
          onClick={() => router.push('/admin/comments')}
        />
        
        <StatCard
          title="Searches"
          value={stats?.searches.total.toLocaleString() || '0'}
          icon={TrendingUp}
          subtitle={`Top: ${stats?.searches.topKeyword || 'N/A'}`}
          color="red"
          onClick={() => router.push('/admin')}
        />
      </div>

      {/* Quick Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{stat.label}</span>
              <div className={`flex items-center text-xs font-medium ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className={`h-3 w-3 mr-1 ${stat.change < 0 ? 'rotate-180' : ''}`} />
                {stat.change >= 0 ? '+' : ''}{stat.change}%
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                <p className="text-sm text-gray-500 mt-1">Latest admin actions across the platform</p>
              </div>
              <button
                onClick={() => router.push('/admin/audit')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View All
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
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
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </div>
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
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-4">Content Overview</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/admin/businesses')}
                className="w-full flex justify-between items-center hover:bg-blue-200 p-2 rounded transition-colors"
              >
                <span className="text-sm text-blue-700">Businesses</span>
                <span className="text-sm font-bold text-blue-900">{stats?.businesses.total || 0}</span>
              </button>
              <button
                onClick={() => router.push('/admin/requirements')}
                className="w-full flex justify-between items-center hover:bg-blue-200 p-2 rounded transition-colors"
              >
                <span className="text-sm text-blue-700">Requirements</span>
                <span className="text-sm font-bold text-blue-900">{stats?.requirements.total || 0}</span>
              </button>
              <button
                onClick={() => router.push('/admin/products')}
                className="w-full flex justify-between items-center hover:bg-blue-200 p-2 rounded transition-colors"
              >
                <span className="text-sm text-blue-700">Products</span>
                <span className="text-sm font-bold text-blue-900">{stats?.products.total || 0}</span>
              </button>
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
              <button
                onClick={() => router.push('/admin/comments')}
                className="w-full flex justify-between items-center hover:bg-purple-200 p-2 rounded transition-colors"
              >
                <span className="text-sm text-purple-700">Pending Comments</span>
                <span className={`text-sm font-bold ${stats?.comments.pending ? 'text-purple-900' : 'text-purple-600'}`}>
                  {stats?.comments.pending || 0}
                </span>
              </button>
              <button
                onClick={() => router.push('/admin/reviews')}
                className="w-full flex justify-between items-center hover:bg-purple-200 p-2 rounded transition-colors"
              >
                <span className="text-sm text-purple-700">Pending Reviews</span>
                <span className={`text-sm font-bold ${stats?.reviews.pending ? 'text-purple-900' : 'text-purple-600'}`}>
                  {stats?.reviews.pending || 0}
                </span>
              </button>
              <button
                onClick={() => router.push('/admin/businesses')}
                className="w-full flex justify-between items-center hover:bg-purple-200 p-2 rounded transition-colors"
              >
                <span className="text-sm text-purple-700">Draft Businesses</span>
                <span className={`text-sm font-bold ${stats?.businesses.draft ? 'text-purple-900' : 'text-purple-600'}`}>
                  {stats?.businesses.draft || 0}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}