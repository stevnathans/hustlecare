/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';
import { X, ShoppingCart, MessageSquare, Star, Search, Calendar, TrendingUp } from 'lucide-react';

type UserActivity = {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  carts: Array<{
    id: string;
    name: string;
    totalCost: number;
    createdAt: Date;
    business: {
      name: string;
    };
  }>;
  comments: Array<{
    id: number;
    content: string;
    createdAt: Date;
    requirement: {
      name: string;
      business: {
        name: string;
      };
    };
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: Date;
    product: {
      name: string;
    };
  }>;
  searches: Array<{
    id: string;
    keyword: string;
    createdAt: Date;
  }>;
};

type Props = {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function UserActivityModal({ userId, isOpen, onClose }: Props) {
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'carts' | 'comments' | 'reviews' | 'searches'>('carts');

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserActivity();
    }
  }, [isOpen, userId]);

  const fetchUserActivity = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/activity`);
      if (res.ok) {
        const data = await res.json();
        setActivity(data);
      }
    } catch (error) {
      console.error('Error fetching user activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl w-full max-w-4xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">User Activity</h2>
              {activity && (
                <p className="text-sm text-gray-500 mt-1">
                  {activity.name} ({activity.email})
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : activity ? (
            <>
              <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{activity.carts.length}</p>
                  <p className="text-xs text-gray-600">Carts</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{activity.comments.length}</p>
                  <p className="text-xs text-gray-600">Comments</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{activity.reviews.length}</p>
                  <p className="text-xs text-gray-600">Reviews</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Search className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{activity.searches.length}</p>
                  <p className="text-xs text-gray-600">Searches</p>
                </div>
              </div>

              <div className="flex border-b border-gray-200 px-6">
                <button
                  onClick={() => setActiveTab('carts')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'carts'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Carts ({activity.carts.length})
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'comments'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Comments ({activity.comments.length})
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'reviews'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Reviews ({activity.reviews.length})
                </button>
                <button
                  onClick={() => setActiveTab('searches')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'searches'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Searches ({activity.searches.length})
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'carts' && (
                  <div className="space-y-4">
                    {activity.carts.length > 0 ? (
                      activity.carts.map((cart) => (
                        <div key={cart.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{cart.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">Business: {cart.business.name}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                Total: KES {cart.totalCost?.toLocaleString() || 0}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {new Date(cart.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">No carts yet</p>
                    )}
                  </div>
                )}

                {activeTab === 'comments' && (
                  <div className="space-y-4">
                    {activity.comments.length > 0 ? (
                      activity.comments.map((comment) => (
                        <div key={comment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{comment.requirement.name}</h4>
                            <p className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{comment.content}</p>
                          <p className="text-xs text-gray-500">
                            Business: {comment.requirement.business.name}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">No comments yet</p>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    {activity.reviews.length > 0 ? (
                      activity.reviews.map((review) => (
                        <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">{review.product.name}</h4>
                              <div className="flex items-center gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600">{review.comment}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">No reviews yet</p>
                    )}
                  </div>
                )}

                {activeTab === 'searches' && (
                  <div className="space-y-3">
                    {activity.searches.length > 0 ? (
                      activity.searches.map((search) => (
                        <div key={search.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Search className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{search.keyword}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(search.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">No searches yet</p>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-gray-500">
              Failed to load user activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
}