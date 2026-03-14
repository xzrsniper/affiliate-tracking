import { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../config/api.js';
import {
  Search,
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
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [limitEdits, setLimitEdits] = useState({});
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
        setLimitEdits(
          Object.fromEntries((response.data.users || []).map((u) => [u.id, String(u.link_limit ?? 0)]))
        );
      } else if (Array.isArray(response.data)) {
        setUsers(response.data);
        setLimitEdits(
          Object.fromEntries((response.data || []).map((u) => [u.id, String(u.link_limit ?? 0)]))
        );
      } else {
        setUsers([]);
        setLimitEdits({});
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
    const nextLimit = limitEdits[userId];
    if (nextLimit === '' || Number(nextLimit) < 0 || Number.isNaN(Number(nextLimit))) {
      setError('Please enter a valid link limit (>= 0)');
      return;
    }

    setUpdating(true);
    try {
      await api.patch(`/api/admin/users/${userId}/limit`, {
        link_limit: parseInt(nextLimit, 10)
      });
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

  const getDisplayName = (user) => {
    if (user.name && String(user.name).trim()) return user.name;
    const emailPrefix = String(user.email || '').split('@')[0] || 'User';
    return emailPrefix
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const getInitials = (user) => {
    const name = getDisplayName(user);
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getUserStatus = (user) => {
    if (user.is_banned) return 'banned';
    if (user.email_verified === false || user.is_verified === false) return 'unverified';
    return 'active';
  };

  const filteredUsers = users.filter((user) => {
    const roleOk = roleFilter === 'all' || user.role === roleFilter;
    const status = getUserStatus(user);
    const statusOk = statusFilter === 'all' || status === statusFilter;
    const q = searchTerm.trim().toLowerCase();
    const name = getDisplayName(user).toLowerCase();
    const searchOk = !q || name.includes(q) || String(user.email || '').toLowerCase().includes(q);
    return roleOk && statusOk && searchOk;
  });

  return (
    <Layout>
      <div className="max-w-none">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/80 dark:bg-slate-900/70 px-5 py-4 backdrop-blur">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900 mb-1">Admin Panel</h1>
            <p className="text-sm text-slate-600">Manage users, roles, and platform settings</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors">Export CSV</button>
            <button className="px-3 py-2 text-sm font-semibold rounded-lg bg-violet-700 text-white hover:bg-violet-800 transition-colors">Invite User</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center text-lg">👥</div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{users.length}</p>
              <p className="text-xs text-slate-500 mt-1">Total Users</p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-lg">✅</div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{users.filter(u => !u.is_banned).length}</p>
              <p className="text-xs text-slate-500 mt-1">Active</p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-lg">🔗</div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{users.reduce((sum, u) => sum + (u.link_count || 0), 0)}</p>
              <p className="text-xs text-slate-500 mt-1">Total Links</p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center text-lg">🚫</div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{users.filter(u => u.is_banned).length}</p>
              <p className="text-xs text-slate-500 mt-1">Banned</p>
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 text-sm text-slate-900 placeholder-slate-400"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700"
          >
            <option value="all">All roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="user">Affiliate</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="unverified">Unverified</option>
            <option value="banned">Banned</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white/90 backdrop-blur rounded-2xl border border-violet-100 p-10 text-center text-slate-500 text-sm">
            Loading users...
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <p className="text-2xl font-bold text-slate-900">Users</p>
              <p className="text-sm text-slate-500">Showing {filteredUsers.length} of {users.length}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600">
                    <th className="text-left px-5 py-3 font-semibold uppercase text-xs tracking-wider">User</th>
                    <th className="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider">Links</th>
                    <th className="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider">Limit</th>
                    <th className="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider">Joined</th>
                    <th className="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/70 align-top">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center">
                            {getInitials(user)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 leading-none">{getDisplayName(user)}</p>
                            <p className="text-sm text-slate-500 mt-1">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {user.role === 'super_admin' ? (
                          <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-violet-100 text-violet-700 border border-violet-200">Super Admin</span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Affiliate</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {getUserStatus(user) === 'banned' && <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-200">Banned</span>}
                        {getUserStatus(user) === 'unverified' && <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-200">Unverified</span>}
                        {getUserStatus(user) === 'active' && <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-200">Active</span>}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-800">{user.link_count || 0}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={limitEdits[user.id] ?? user.link_limit ?? 0}
                            onChange={(e) => setLimitEdits((prev) => ({ ...prev, [user.id]: e.target.value }))}
                            className="w-16 px-2 py-1.5 bg-white rounded-lg border border-slate-200 text-slate-800 text-sm"
                          />
                          <button
                            onClick={() => handleUpdateLinkLimit(user.id)}
                            disabled={updating}
                            className="px-3 py-1.5 bg-violet-700 text-white rounded-lg text-sm font-semibold hover:bg-violet-800 disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleViewUser(user.id)}
                            className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                            title="View Stats"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              setLimitEdits((prev) => ({ ...prev, [user.id]: String(user.link_limit ?? 0) }));
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleBanUser(user.id, user.is_banned)}
                            disabled={user.role === 'super_admin'}
                            className={`px-3 py-1.5 rounded-lg transition-colors text-sm border ${
                              user.is_banned
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={user.is_banned ? 'Unban' : 'Ban'}
                          >
                            {user.is_banned ? 'Unban' : 'Ban'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-4 border-t border-slate-200 text-sm text-slate-500">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>
        )}

        {/* View User Modal */}
        {viewingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-violet-100">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Links for {viewingUser.user.email}
                  </h2>
                  <p className="text-slate-500 mt-1">
                    {viewingUser.links?.length || 0} total links
                  </p>
                </div>
                <button
                  onClick={() => setViewingUser(null)}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                {viewingUser.links.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500">No links created yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {viewingUser.links.map((link) => (
                      <div
                        key={link.id}
                        className="bg-slate-50 rounded-xl p-4 border border-slate-200"
                      >
                        <p className="font-semibold text-slate-900 mb-3 break-all">{link.original_url}</p>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Unique Clicks</p>
                            <p className="font-bold text-slate-900">{link.stats.unique_clicks}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Total Clicks</p>
                            <p className="font-bold text-slate-900">{link.stats.total_clicks}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Conversions</p>
                            <p className="font-bold text-green-600">{link.stats.conversions}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Revenue</p>
                            <p className="font-bold text-emerald-600">
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
