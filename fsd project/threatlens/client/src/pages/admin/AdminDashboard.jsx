import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Users, Mail, AlertTriangle, CheckCircle, Activity,
  TrendingUp, ArrowRight, ChevronRight, BarChart2, Zap
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../services/api';

function RiskBadge({ c }) {
  if (c === 'phishing') return <span className="badge-phishing">⚠ Phishing</span>;
  if (c === 'suspicious') return <span className="badge-suspicious">~ Suspicious</span>;
  return <span className="badge-safe">✓ Safe</span>;
}

const PIE_COLORS = { phishing: '#f43f5e', suspicious: '#fbbf24', safe: '#10b981' };

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(7)].map((_, i) => <div key={i} className="h-28 bg-dark-800 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  );

  const stats = data?.stats || {};

  // Build chart data from threatTrend
  const trendMap = {};
  (data?.threatTrend || []).forEach(({ _id, count }) => {
    const date = _id.date;
    if (!trendMap[date]) trendMap[date] = { date, phishing: 0, suspicious: 0, safe: 0 };
    trendMap[date][_id.classification] = count;
  });
  const trendData = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
    ...d, date: d.date.slice(5)
  }));

  const pieData = [
    { name: 'Phishing', value: stats.phishingCount || 0 },
    { name: 'Suspicious', value: stats.suspiciousCount || 0 },
    { name: 'Safe', value: stats.safeCount || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title flex items-center gap-2"><Shield size={22} className="text-danger-400" />Security Command Center</h1>
          <p className="section-subtitle">System-wide threat intelligence overview</p>
        </div>
        <Link to="/admin/analytics" className="btn-secondary text-sm py-2"><BarChart2 size={14} />Full Analytics</Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-primary-400', bg: 'bg-primary-500/10', link: '/admin/users' },
          { label: 'Total Scans', value: stats.totalScans, icon: Mail, color: 'text-cyber-400', bg: 'bg-cyber-500/10', link: '/admin/scans' },
          { label: 'Phishing Detected', value: stats.phishingCount, icon: AlertTriangle, color: 'text-danger-400', bg: 'bg-danger-500/10', link: '/admin/scans' },
          { label: 'Avg Risk Score', value: `${stats.avgRiskScore}/100`, icon: Activity, color: 'text-warning-400', bg: 'bg-warning-500/10', link: '/admin/analytics' },
        ].map(s => (
          <Link key={s.label} to={s.link} className="stat-card group">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div className="text-2xl font-bold text-white">{s.value ?? '—'}</div>
            <div className="text-dark-400 text-sm mt-0.5 flex items-center justify-between">
              {s.label}
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
            <CheckCircle size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.safeCount ?? '—'}</div>
          <div className="text-dark-400 text-sm mt-0.5">Safe Emails</div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-warning-500/10 flex items-center justify-center mb-3">
            <AlertTriangle size={18} className="text-warning-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.suspiciousCount ?? '—'}</div>
          <div className="text-dark-400 text-sm mt-0.5">Suspicious</div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-cyber-500/10 flex items-center justify-center mb-3">
            <Zap size={18} className="text-cyber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.trainingCompletion ?? 0}</div>
          <div className="text-dark-400 text-sm mt-0.5">Avg Training Done</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Threat trend chart */}
        <div className="glass-card-dark rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-primary-400" />7-Day Threat Trend</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }} labelStyle={{ color: '#94a3b8' }} />
                <Line type="monotone" dataKey="phishing" stroke="#f43f5e" strokeWidth={2} dot={false} name="Phishing" />
                <Line type="monotone" dataKey="suspicious" stroke="#fbbf24" strokeWidth={2} dot={false} name="Suspicious" />
                <Line type="monotone" dataKey="safe" stroke="#10b981" strokeWidth={2} dot={false} name="Safe" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-dark-500 text-sm">No threat data in last 7 days</div>
          )}
        </div>

        {/* Pie distribution */}
        <div className="glass-card-dark rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Threat Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[entry.name.toLowerCase()] || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }} />
                <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-dark-500 text-sm">No scan data yet</div>
          )}
        </div>
      </div>

      {/* Recent scans */}
      <div className="glass-card-dark rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700/50">
          <h3 className="text-white font-semibold">Recent Scans</h3>
          <Link to="/admin/scans" className="text-primary-400 text-sm hover:text-primary-300 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Sender</th>
                <th>User</th>
                <th>Classification</th>
                <th>Risk</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentScans || []).map(scan => (
                <tr key={scan._id}>
                  <td className="text-white font-medium max-w-[180px] truncate">{scan.subject}</td>
                  <td className="text-dark-400 text-xs font-mono max-w-[160px] truncate">{scan.sender}</td>
                  <td className="text-dark-300 text-xs">{scan.userId?.name || '—'}</td>
                  <td><RiskBadge c={scan.classification} /></td>
                  <td>
                    <span className={`font-bold text-sm ${scan.riskScore >= 70 ? 'text-danger-400' : scan.riskScore >= 40 ? 'text-warning-400' : 'text-emerald-400'}`}>
                      {scan.riskScore}
                    </span>
                  </td>
                  <td className="text-dark-500 text-xs">{new Date(scan.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {(!data?.recentScans?.length) && (
                <tr><td colSpan={6} className="text-center text-dark-500 py-8">No scans yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
