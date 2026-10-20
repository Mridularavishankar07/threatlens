import { useState, useEffect } from 'react';
import { Users, Search, UserCheck, UserX } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ current: 1, total: 1, count: 0 });
  const [page, setPage] = useState(1);
  const toast = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set('search', search);
      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data.users || []);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const toggleUser = async (id, currentState) => {
    if (!confirm(`${currentState ? 'Deactivate' : 'Activate'} this user?`)) return;
    try {
      const res = await api.patch(`/admin/users/${id}/toggle`);
      toast.success(res.data.message);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const scoreColor = (s) => s >= 75 ? 'text-emerald-400' : s >= 50 ? 'text-warning-400' : 'text-danger-400';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title flex items-center gap-2"><Users size={22} className="text-primary-400" />User Management</h1>
          <p className="section-subtitle">{pagination.count} registered users</p>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card-dark rounded-2xl p-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="input-field pl-9 py-2 text-sm" />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card-dark rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-dark-800 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Security Score</th>
                  <th>Scans</th>
                  <th>Phishing Found</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-cyber-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-xs">{u.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{u.name}</p>
                          <p className="text-dark-500 text-xs">{u._id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-dark-400 text-xs font-mono">{u.email}</td>
                    <td>
                      <span className={`font-bold ${scoreColor(u.securityScore)}`}>{u.securityScore}/100</span>
                    </td>
                    <td className="text-dark-300 text-sm font-semibold">{u.scanCount || 0}</td>
                    <td>
                      {u.phishingFound > 0 ? (
                        <span className="text-danger-400 font-semibold text-sm">{u.phishingFound}</span>
                      ) : (
                        <span className="text-dark-600">0</span>
                      )}
                    </td>
                    <td className="text-dark-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      {u.isActive
                        ? <span className="badge-safe">Active</span>
                        : <span className="badge-phishing">Inactive</span>}
                    </td>
                    <td>
                      <button onClick={() => toggleUser(u._id, u.isActive)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all
                          ${u.isActive
                            ? 'text-danger-400 border-danger-500/30 hover:bg-danger-900/20'
                            : 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/20'}`}>
                        {u.isActive ? <><UserX size={12} />Deactivate</> : <><UserCheck size={12} />Activate</>}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-dark-500 py-10">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {pagination.total > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-dark-700/50">
            <p className="text-dark-500 text-sm">Page {pagination.current} of {pagination.total}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-sm py-1.5 px-4 disabled:opacity-40">Previous</button>
              <button disabled={page >= pagination.total} onClick={() => setPage(p => p + 1)} className="btn-secondary text-sm py-1.5 px-4 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
