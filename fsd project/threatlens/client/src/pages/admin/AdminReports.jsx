import { useState, useEffect } from 'react';
import { FileText, Eye } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const STATUS_STYLES = {
  pending: 'text-warning-400 bg-warning-900/20 border-warning-500/30',
  reviewed: 'text-primary-400 bg-primary-900/20 border-primary-500/30',
  resolved: 'text-emerald-400 bg-emerald-900/20 border-emerald-500/30',
  dismissed: 'text-dark-400 bg-dark-800 border-dark-700',
};

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports');
      setReports(res.data.reports || []);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const updateStatus = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/reports/${selected._id}/status`, { status, adminNotes: notes });
      toast.success('Report updated');
      setSelected(null);
      fetchReports();
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const counts = { pending: 0, reviewed: 0, resolved: 0, dismissed: 0 };
  reports.forEach(r => counts[r.status]++);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title flex items-center gap-2"><FileText size={22} className="text-primary-400" />User Reports</h1>
        <p className="section-subtitle">Reports submitted by users for review</p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(counts).map(([k, v]) => (
          <div key={k} className="stat-card text-center py-4">
            <div className="text-2xl font-bold text-white">{v}</div>
            <div className={`text-xs mt-1 px-2 py-0.5 rounded-full border inline-block ${STATUS_STYLES[k]}`}>{k}</div>
          </div>
        ))}
      </div>

      {/* Reports table */}
      <div className="glass-card-dark rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-dark-800 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reporter</th>
                  <th>Subject</th>
                  <th>Classification</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r._id}>
                    <td className="text-dark-200 text-sm">{r.userId?.name || '—'}</td>
                    <td className="max-w-[150px]">
                      <p className="text-white text-sm font-medium truncate">{r.scanId?.subject || '—'}</p>
                    </td>
                    <td>
                      {r.scanId?.classification === 'phishing' && <span className="badge-phishing">Phishing</span>}
                      {r.scanId?.classification === 'suspicious' && <span className="badge-suspicious">Suspicious</span>}
                      {r.scanId?.classification === 'safe' && <span className="badge-safe">Safe</span>}
                    </td>
                    <td className="text-dark-400 text-xs max-w-[200px] truncate">{r.reason}</td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[r.status]}`}>{r.status}</span>
                    </td>
                    <td className="text-dark-500 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => { setSelected(r); setStatus(r.status); setNotes(r.adminNotes || ''); }}
                        className="text-primary-400 hover:text-primary-300 p-1.5 rounded-lg hover:bg-primary-900/20 transition-colors">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-dark-500 py-10">No reports yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card-dark rounded-2xl w-full max-w-lg animate-slide-up">
            <div className="p-6 border-b border-dark-700/50">
              <h3 className="text-white font-bold">Review Report</h3>
              <p className="text-dark-400 text-sm">From: {selected.userId?.name} ({selected.userId?.email})</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-dark-800/50 rounded-xl p-4">
                <p className="text-dark-400 text-xs mb-1">User Reason</p>
                <p className="text-dark-200 text-sm">{selected.reason}</p>
              </div>
              <div>
                <p className="text-dark-400 text-xs mb-1">Scan: {selected.scanId?.subject}</p>
                <p className="text-dark-500 text-xs">Risk: {selected.scanId?.riskScore}/100 · {selected.scanId?.classification}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="input-field">
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Admin Notes</label>
                <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Notes visible to admin only..." className="input-field resize-none text-sm" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelected(null)} className="btn-secondary flex-1 justify-center text-sm">Cancel</button>
                <button onClick={updateStatus} disabled={saving} className="btn-primary flex-1 justify-center text-sm">
                  {saving ? 'Saving...' : 'Update Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
