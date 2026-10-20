import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const SEV_STYLES = {
  info: 'text-primary-400 bg-primary-900/20 border-primary-500/30',
  warning: 'text-warning-400 bg-warning-900/20 border-warning-500/30',
  critical: 'text-danger-400 bg-danger-900/20 border-danger-500/30',
};

const CAT_ICONS = {
  scan: '📧', auth: '🔐', report: '📋', training: '🎯', admin: '⚙️', blocklist: '🚫'
};

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', severity: '' });
  const [pagination, setPagination] = useState({ current: 1, total: 1, count: 0 });
  const [page, setPage] = useState(1);
  const toast = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 50 });
      if (filters.category) params.set('category', filters.category);
      if (filters.severity) params.set('severity', filters.severity);
      const res = await api.get(`/admin/audit-logs?${params}`);
      setLogs(res.data.logs || []);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [page, filters]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title flex items-center gap-2"><Activity size={22} className="text-primary-400" />Audit Logs</h1>
        <p className="section-subtitle">Complete record of all system actions</p>
      </div>

      {/* Filters */}
      <div className="glass-card-dark rounded-2xl p-4 flex gap-3">
        <select value={filters.category} onChange={e => { setFilters(p => ({ ...p, category: e.target.value })); setPage(1); }}
          className="input-field py-2 text-sm w-40">
          <option value="">All categories</option>
          {['auth','scan','report','training','admin','blocklist'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.severity} onChange={e => { setFilters(p => ({ ...p, severity: e.target.value })); setPage(1); }}
          className="input-field py-2 text-sm w-36">
          <option value="">All severity</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Log table */}
      <div className="glass-card-dark rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-2">{[...Array(10)].map((_, i) => <div key={i} className="h-12 bg-dark-800 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Category</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id}>
                    <td className="text-dark-500 text-xs whitespace-nowrap font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="text-dark-300 text-xs">
                      <p>{log.userId?.name || '—'}</p>
                      <p className="text-dark-600">{log.userId?.email}</p>
                    </td>
                    <td>
                      <span className="text-xs bg-dark-800 border border-dark-700 px-2 py-0.5 rounded-full text-dark-300">
                        {CAT_ICONS[log.category]} {log.category}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-dark-400">{log.action}</td>
                    <td className="text-dark-300 text-xs max-w-[260px] truncate" title={log.description}>{log.description}</td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SEV_STYLES[log.severity]}`}>
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-dark-500 py-10">No audit logs yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {pagination.total > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-dark-700/50">
            <p className="text-dark-500 text-sm">Page {pagination.current} of {pagination.total} · {pagination.count} entries</p>
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
