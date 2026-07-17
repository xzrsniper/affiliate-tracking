import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Percent } from 'lucide-react';
import api from '../../config/api.js';

const ROLE_LABELS = {
  user: { label: 'User', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  affiliate: { label: 'Афілейт', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  moderator: { label: 'Модератор', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  super_admin: { label: 'Super Admin', cls: 'bg-violet-100 text-violet-700 border-violet-200' }
};

function RoleBadge({ role }) {
  const r = ROLE_LABELS[role] || { label: role, cls: 'bg-slate-100 text-slate-700 border-slate-200' };
  return (
    <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full border ${r.cls}`}>
      {r.label}
    </span>
  );
}

export default function ModeratorUsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [error, setError] = useState('');
  const [assigning, setAssigning] = useState(null); // userId being assigned
  const [commEdits, setCommEdits] = useState({}); // { [userId]: percent string }
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/admin/users/summary', {
        params: { search, role: roleFilter }
      });
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка завантаження');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const handleAssign = async (user) => {
    const pct = parseFloat(commEdits[user.id] ?? 10);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) return;
    setAssigning(user.id);
    setError('');
    try {
      await api.patch(`/api/admin/users/${user.id}/affiliate`, {
        role: 'affiliate',
        commission_percent: pct
      });
      setSuccessMsg(`✓ ${user.email} тепер афілейт (${pct}%)`);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка');
    } finally {
      setAssigning(null);
    }
  };

  const handleRevoke = async (user) => {
    setAssigning(user.id);
    setError('');
    try {
      await api.patch(`/api/admin/users/${user.id}/affiliate`, { role: 'user' });
      setSuccessMsg(`✓ Роль афілейта знято з ${user.email}`);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка');
    } finally {
      setAssigning(null);
    }
  };

  const money = (v) => `${Number(v || 0).toLocaleString('uk-UA')} ₴`;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Користувачі</h2>
            <p className="text-xs text-slate-500 mt-0.5">Пошук і призначення ролі афілейта</p>
          </div>
          <button onClick={fetchUsers} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              placeholder="Пошук за email..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700"
          >
            <option value="all">Всі ролі</option>
            <option value="user">User</option>
            <option value="affiliate">Афілейт</option>
            <option value="moderator">Модератор</option>
          </select>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700"
          >
            Знайти
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-red-700 text-sm">{error}</div>}
      {successMsg && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-green-700 text-sm font-medium">{successMsg}</div>}

      <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
        {loading ? (
          <p className="p-6 text-sm text-slate-400 text-center">Завантаження…</p>
        ) : users.length === 0 ? (
          <p className="p-6 text-sm text-slate-400 text-center">Нічого не знайдено</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-center px-3 py-3">Роль</th>
                <th className="text-right px-3 py-3">Баланс</th>
                <th className="text-right px-3 py-3">Кліки</th>
                <th className="text-right px-3 py-3">Замовлення</th>
                <th className="text-right px-3 py-3">Продажі</th>
                <th className="text-right px-3 py-3">Дії</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-800">{u.email}</p>
                      {u.affiliate_commission_percent != null && (
                        <p className="text-xs text-slate-400">Комісія: {u.affiliate_commission_percent}%</p>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-slate-800">{money(u.affiliate_balance)}</td>
                  <td className="px-3 py-3 text-right text-slate-600">{u.clicks.toLocaleString('uk-UA')}</td>
                  <td className="px-3 py-3 text-right text-slate-600">{u.orders}</td>
                  <td className="px-3 py-3 text-right font-semibold text-emerald-700">{money(u.sales_revenue)}</td>
                  <td className="px-3 py-3 text-right">
                    {u.role === 'super_admin' ? (
                      <span className="text-xs text-slate-300">—</span>
                    ) : u.role === 'affiliate' ? (
                      <button
                        onClick={() => handleRevoke(u)}
                        disabled={assigning === u.id}
                        className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 whitespace-nowrap"
                      >
                        {assigning === u.id ? '…' : 'Зняти роль'}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 justify-end">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={commEdits[u.id] ?? '10'}
                            onChange={(e) => setCommEdits((p) => ({ ...p, [u.id]: e.target.value }))}
                            className="w-16 text-right px-2 py-1 pr-6 border border-slate-200 rounded-lg text-xs"
                          />
                          <Percent className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                        </div>
                        <button
                          onClick={() => handleAssign(u)}
                          disabled={assigning === u.id}
                          className="px-3 py-1.5 text-xs rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 whitespace-nowrap"
                        >
                          {assigning === u.id ? '…' : 'Афілейт'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
