import { useState, useEffect } from 'react';
import {
  Mail, Search, ChevronRight, AlertTriangle,
  CheckCircle, Lock, Eye, Activity
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

function RiskBadge({ c }) {
  if (c === 'phishing') return <span className="badge-phishing">⚠ Phishing</span>;
  if (c === 'suspicious') return <span className="badge-suspicious">~ Suspicious</span>;
  return <span className="badge-safe">✓ Safe</span>;
}

const INCIDENT_COLORS = {
  open: 'text-danger-400 bg-danger-900/20 border-danger-500/30',
  investigating: 'text-warning-400 bg-warning-900/20 border-warning-500/30',
  resolved: 'text-emerald-400 bg-emerald-900/20 border-emerald-500/30',
  false_positive: 'text-dark-400 bg-dark-800 border-dark-700',
};

export default function AdminScans() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ classification: '', search: '' });
  const [pagination, setPagination] = useState({ current: 1, total: 1, count: 0 });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [incidentStatus, setIncidentStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const toast = useToast();

  const fetchScans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filters.classification) params.set('classification', filters.classification);
      if (filters.search) params.set('search', filters.search);
      const res = await api.get(`/admin/scans?${params}`);
      setScans(res.data.scans || []);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load scans'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchScans(); }, [page, filters]);

  const updateIncident = async (scanId) => {
    if (!incidentStatus) return;
    setUpdating(true);
    try {
      await api.patch(`/admin/scans/${scanId}/incident`, { incidentStatus, adminNotes });
      toast.success('Incident updated');
      setSelected(null);
      fetchScans();
    } catch { toast.error('Update failed'); }
    finally { setUpdating(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title flex items-center gap-2"><Mail size={22} className="text-primary-400" />Incident Investigation Queue</h1>
        <p className="section-subtitle">{pagination.count} total scans across all users</p>
      </div>

      {/* Filters */}
      <div className="glass-card-dark rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input value={filters.search} onChange={e => { setFilters(p => ({ ...p, search: e.target.value })); setPage(1); }}
            placeholder="Search subject or sender..." className="input-field pl-9 py-2 text-sm" />
        </div>
        <select value={filters.classification} onChange={e => { setFilters(p => ({ ...p, classification: e.target.value })); setPage(1); }}
          className="input-field py-2 text-sm w-40">
          <option value="">All types</option>
          <option value="phishing">Phishing</option>
          <option value="suspicious">Suspicious</option>
          <option value="safe">Safe</option>
        </select>
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
                  <th>Subject</th>
                  <th>Sender</th>
                  <th>User</th>
                  <th>Classification</th>
                  <th>Risk</th>
                  <th>Incident</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scans.map(scan => (
                  <tr key={scan._id}>
                    <td className="max-w-[160px]">
                      <p className="text-white font-medium text-sm truncate">{scan.subject}</p>
                      {scan.isQuarantined && <span className="text-xs text-warning-400">🔒 Quarantined</span>}
                    </td>
                    <td className="text-dark-400 text-xs font-mono max-w-[140px] truncate">{scan.sender}</td>
                    <td className="text-dark-300 text-xs">{scan.userId?.name || '—'}</td>
                    <td><RiskBadge c={scan.classification} /></td>
                    <td>
                      <span className={`font-bold text-sm ${scan.riskScore >= 70 ? 'text-danger-400' : scan.riskScore >= 40 ? 'text-warning-400' : 'text-emerald-400'}`}>
                        {scan.riskScore}
                      </span>
                    </td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${INCIDENT_COLORS[scan.incidentStatus] || INCIDENT_COLORS.open}`}>
                        {scan.incidentStatus || 'open'}
                      </span>
                    </td>
                    <td className="text-dark-500 text-xs">{new Date(scan.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => { setSelected(scan); setIncidentStatus(scan.incidentStatus || 'open'); setAdminNotes(scan.adminNotes || ''); }}
                        className="text-primary-400 hover:text-primary-300 p-1.5 rounded-lg hover:bg-primary-900/20 transition-colors">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {scans.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-dark-500 py-10">No scans found</td></tr>
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

      {/* Incident detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card-dark rounded-2xl w-full max-w-lg animate-slide-up">
            <div className="p-6 border-b border-dark-700/50">
              <h3 className="text-white font-bold">Update Incident Status</h3>
              <p className="text-dark-400 text-sm mt-1 truncate">{selected.subject}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-dark-400 text-xs mb-1">Sender</p>
                <p className="text-dark-200 font-mono text-sm">{selected.sender}</p>
              </div>
              <div>
                <p className="text-dark-400 text-xs mb-1">Classification</p>
                <div className="flex items-center gap-3">
                  <RiskBadge c={selected.classification} />
                  <span className="text-white font-bold">{selected.riskScore}/100</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Incident Status</label>
                <select value={incidentStatus} onChange={e => setIncidentStatus(e.target.value)} className="input-field">
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="false_positive">False Positive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Admin Notes</label>
                <textarea rows={3} value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Investigation notes..." className="input-field resize-none text-sm" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelected(null)} className="btn-secondary flex-1 justify-center text-sm">Cancel</button>
                <button onClick={() => updateIncident(selected._id)} disabled={updating} className="btn-primary flex-1 justify-center text-sm">
                  {updating ? 'Saving...' : 'Update Incident'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
