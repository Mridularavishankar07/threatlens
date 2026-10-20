import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History, Search, ChevronRight, AlertTriangle,
  CheckCircle, Activity, Trash2, Mail
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

function RiskBadge({ c }) {
  if (c === 'phishing') return <span className="badge-phishing">⚠ Phishing</span>;
  if (c === 'suspicious') return <span className="badge-suspicious">~ Suspicious</span>;
  return <span className="badge-safe">✓ Safe</span>;
}

export default function ScanHistory() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, total: 1, count: 0 });
  const [filters, setFilters] = useState({ classification: '', search: '', sortBy: 'createdAt', order: 'desc' });
  const [page, setPage] = useState(1);
  const toast = useToast();

  const fetchScans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, ...filters });
      Object.keys(filters).forEach(k => !filters[k] && params.delete(k));
      const res = await api.get(`/scans?${params}`);
      setScans(res.data.scans || []);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load history'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchScans(); }, [page, filters]);

  const deleteOne = async (id, e) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm('Delete this scan?')) return;
    try {
      await api.delete(`/scans/${id}`);
      toast.success('Scan deleted');
      fetchScans();
    } catch { toast.error('Delete failed'); }
  };

  const classCount = { safe: 0, suspicious: 0, phishing: 0 };
  scans.forEach(s => classCount[s.classification]++);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Scan History</h1>
          <p className="section-subtitle">{pagination.count} total scans</p>
        </div>
        <Link to="/scan" className="btn-primary text-sm py-2">Scan Email</Link>
      </div>

      {/* Filters */}
      <div className="glass-card-dark rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input value={filters.search}
            onChange={e => { setFilters(p => ({ ...p, search: e.target.value })); setPage(1); }}
            placeholder="Search by subject or sender..."
            className="input-field pl-9 py-2 text-sm" />
        </div>
        <div className="flex gap-2">
          <select value={filters.classification}
            onChange={e => { setFilters(p => ({ ...p, classification: e.target.value })); setPage(1); }}
            className="input-field py-2 text-sm w-36">
            <option value="">All types</option>
            <option value="phishing">Phishing</option>
            <option value="suspicious">Suspicious</option>
            <option value="safe">Safe</option>
          </select>
          <select value={`${filters.sortBy}-${filters.order}`}
            onChange={e => {
              const [sortBy, order] = e.target.value.split('-');
              setFilters(p => ({ ...p, sortBy, order })); setPage(1);
            }}
            className="input-field py-2 text-sm w-36">
            <option value="createdAt-desc">Newest first</option>
            <option value="createdAt-asc">Oldest first</option>
            <option value="riskScore-desc">Highest risk</option>
            <option value="riskScore-asc">Lowest risk</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card-dark rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 bg-dark-800 rounded-xl animate-pulse" />
          ))}</div>
        ) : scans.length === 0 ? (
          <div className="p-16 text-center">
            <History size={48} className="text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400 font-medium">No scans found</p>
            <p className="text-dark-500 text-sm mt-1">Try scanning an email or adjusting filters</p>
            <Link to="/scan" className="btn-primary mt-4 inline-flex text-sm">Scan Email</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Sender</th>
                  <th>Classification</th>
                  <th>Risk Score</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {scans.map(scan => (
                  <tr key={scan._id} className="cursor-pointer" onClick={() => {}}>
                    <td className="max-w-[200px]">
                      <Link to={`/scan/result/${scan._id}`} className="text-white font-medium hover:text-primary-300 truncate block">
                        {scan.subject}
                      </Link>
                      {scan.isQuarantined && <span className="text-xs text-warning-400 font-medium">🔒 Quarantined</span>}
                    </td>
                    <td className="text-dark-400 text-xs font-mono max-w-[160px] truncate">{scan.sender}</td>
                    <td><RiskBadge c={scan.classification} /></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${scan.riskScore >= 70 ? 'text-danger-400' : scan.riskScore >= 40 ? 'text-warning-400' : 'text-emerald-400'}`}>
                          {scan.riskScore}
                        </span>
                        <span className="text-dark-600 text-xs">/100</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs bg-dark-800 text-dark-400 px-2 py-0.5 rounded-full font-mono">{scan.analysisMethod}</span>
                    </td>
                    <td className="text-dark-500 text-xs whitespace-nowrap">{new Date(scan.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link to={`/scan/result/${scan._id}`} className="text-primary-400 hover:text-primary-300 p-1.5 rounded-lg hover:bg-primary-900/20 transition-colors">
                          <ChevronRight size={14} />
                        </Link>
                        <button onClick={(e) => deleteOne(scan._id, e)} className="text-dark-600 hover:text-danger-400 p-1.5 rounded-lg hover:bg-danger-900/20 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-dark-700/50">
            <p className="text-dark-500 text-sm">Page {pagination.current} of {pagination.total}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="btn-secondary text-sm py-1.5 px-4 disabled:opacity-40">Previous</button>
              <button disabled={page >= pagination.total} onClick={() => setPage(p => p + 1)}
                className="btn-secondary text-sm py-1.5 px-4 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
