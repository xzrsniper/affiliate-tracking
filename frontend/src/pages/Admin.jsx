import { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../config/api.js';
import {
  Search,
  Edit,
  Ban,
  Eye,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [linkLimit, setLinkLimit] = useState('');
  const [updating, setUpdating] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/admin/users', {
        params: { search: searchTerm }
      });
      console.log('Users response:', response.data);
      if (response.data.success && response.data.users) {
        setUsers(response.data.users);
      } else if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      console.error('Error response:', err.response);
      console.error('Error request:', err.request);
      console.error('Error message:', err.message);
      
      let errorMessage = 'Failed to load users';
      
      if (err.response) {
        // Server responded with error
        errorMessage = err.response?.data?.error || `Server error: ${err.response.status}`;
        // If 401 or 403, redirect to login
        if (err.response.status === 401 || err.response.status === 403) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'Network error: Cannot connect to server. Please make sure the backend is running on http://localhost:3000';
      } else {
        // Something else happened
        errorMessage = err.message || 'Failed to load users';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId, isBanned) => {
    try {
      await api.post(`/api/admin/users/${userId}/ban`, {
        ban: !isBanned
      });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleUpdateLinkLimit = async (userId) => {
    if (!linkLimit || linkLimit < 0) {
      setError('Please enter a valid link limit (>= 0)');
      return;
    }

    setUpdating(true);
    try {
      await api.patch(`/api/admin/users/${userId}/limit`, {
        link_limit: parseInt(linkLimit)
      });
      setLinkLimit('');
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update link limit');
    } finally {
      setUpdating(false);
    }
  };

  const handleViewUser = async (userId) => {
    try {
      const response = await api.get(`/api/admin/users/${userId}/impersonate`);
      setViewingUser(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load user data');
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage users and their tracking links</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search users by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-0 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Users List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">Loading users...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{user.email}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          {user.role === 'super_admin' && (
                            <span className="px-2 py-1 text-xs font-semibold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-lg">
                              Admin
                            </span>
                          )}
                          {user.is_banned && (
                            <span className="px-2 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
                              Banned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Link Limit</p>
                        <p className="font-semibold text-slate-800 dark:text-white">{user.link_limit}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Links Created</p>
                        <p className="font-semibold text-slate-800 dark:text-white">{user.link_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Joined</p>
                        <p className="font-semibold text-slate-800 dark:text-white">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-6">
                    <button
                      onClick={() => {
                        setSelectedUser(user.id);
                        setLinkLimit(user.link_limit);
                      }}
                      className="p-2 bg-violet-100 text-violet-600 rounded-xl hover:bg-violet-200 transition-colors"
                      title="Edit Limit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleViewUser(user.id)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
                      title="View Stats"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleBanUser(user.id, user.is_banned)}
                      disabled={user.role === 'super_admin'}
                      className={`p-2 rounded-xl transition-colors ${
                        user.is_banned
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={user.is_banned ? 'Unban' : 'Ban'}
                    >
                      {user.is_banned ? <Check className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Edit Limit Form */}
                {selectedUser === user.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        min="0"
                        value={linkLimit}
                        onChange={(e) => setLinkLimit(e.target.value)}
                        placeholder="New link limit"
                        className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-xl border-0 focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-slate-600 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                      />
                      <button
                        onClick={() => handleUpdateLinkLimit(user.id)}
                        disabled={updating}
                        className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                      >
                        {updating ? 'Updating...' : 'Update'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(null);
                          setLinkLimit('');
                        }}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* View User Modal */}
        {viewingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                    Links for {viewingUser.user.email}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    {viewingUser.links?.length || 0} total links
                  </p>
                </div>
                <button
                  onClick={() => setViewingUser(null)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                {viewingUser.links.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 dark:text-slate-400">No links created yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {viewingUser.links.map((link) => (
                      <div
                        key={link.id}
                        className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600"
                      >
                        <p className="font-semibold text-slate-800 dark:text-white mb-3 break-all">{link.original_url}</p>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500 dark:text-slate-400">Unique Clicks</p>
                            <p className="font-bold text-slate-800 dark:text-white">{link.stats.unique_clicks}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400">Total Clicks</p>
                            <p className="font-bold text-slate-800 dark:text-white">{link.stats.total_clicks}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400">Conversions</p>
                            <p className="font-bold text-green-600 dark:text-green-400">{link.stats.conversions}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400">Revenue</p>
                            <p className="font-bold text-emerald-600 dark:text-emerald-400">
                              ${link.stats.total_revenue}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}