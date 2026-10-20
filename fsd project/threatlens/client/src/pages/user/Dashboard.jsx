import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Mail, AlertTriangle, CheckCircle, TrendingUp,
  ArrowRight, Zap, Clock, Star, Activity, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function RiskBadge({ c }) {
  if (c === 'phishing') return <span className="badge-phishing">⚠ Phishing</span>;
  if (c === 'suspicious') return <span className="badge-suspicious">~ Suspicious</span>;
  return <span className="badge-safe">✓ Safe</span>;
}

function ScoreRing({ score }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const color = score >= 70 ? '#f43f5e' : score >= 40 ? '#fbbf24' : '#10b981';
  const dash = circ - (score / 100) * circ;
  return (
    <svg width="100" height="100" className="rotate-[-90deg]">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={dash}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
    </svg>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/scans/stats'),
      api.get('/scans?limit=5&sortBy=createdAt&order=desc')
    ]).then(([statsRes, scansRes]) => {
      setStats(statsRes.data);
      setRecentScans(scansRes.data.scans || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const secScore = user?.securityScore || 50;
  const secColor = secScore >= 75 ? 'text-emerald-400' : secScore >= 50 ? 'text-warning-400' : 'text-danger-400';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="section-subtitle">Here's your security overview</p>
        </div>
        <Link to="/scan" className="btn-primary self-start sm:self-auto">
          <Zap size={16} /> Scan Email
        </Link>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Scans', value: stats?.totalScans ?? '—', icon: Mail, color: 'text-primary-400', bg: 'bg-primary-500/10' },
          { label: 'Phishing Caught', value: stats?.distribution?.phishing ?? '—', icon: AlertTriangle, color: 'text-danger-400', bg: 'bg-danger-500/10' },
          { label: 'Suspicious', value: stats?.distribution?.suspicious ?? '—', icon: Activity, color: 'text-warning-400', bg: 'bg-warning-500/10' },
          { label: 'Safe', value: stats?.distribution?.safe ?? '—', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon size={20} className={s.color} />
            </div>
            <div className="text-2xl font-bold text-white">{loading ? '—' : s.value}</div>
            <div className="text-dark-400 text-sm mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Security Score card */}
        <div className="stat-card flex flex-col items-center text-center">
          <div className="relative mb-3">
            <ScoreRing score={secScore} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-black ${secColor}`}>{secScore}</span>
            </div>
          </div>
          <p className="text-white font-semibold">Security Score</p>
          <p className="text-dark-400 text-xs mt-1 mb-4">
            {secScore >= 75 ? 'Excellent cyber awareness' : secScore >= 50 ? 'Room for improvement' : 'Needs attention'}
          </p>
          <Link to="/security-score" className="text-primary-400 text-sm flex items-center gap-1 hover:text-primary-300">
            View details <ChevronRight size={14} />
          </Link>
        </div>

        {/* Quick actions */}
        <div className="stat-card space-y-3">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Zap size={16} className="text-primary-400" />Quick Actions</h3>
          {[
            { to: '/scan', icon: Mail, label: 'Scan an Email', desc: 'Check if an email is phishing', color: 'text-primary-400' },
            { to: '/inbox', icon: Shield, label: 'Open Inbox', desc: 'View simulated email inbox', color: 'text-cyber-400' },
            { to: '/training', icon: Star, label: 'Training Center', desc: 'Improve your security score', color: 'text-warning-400' },
            { to: '/history', icon: Clock, label: 'Scan History', desc: 'Review past scan results', color: 'text-dark-300' },
          ].map(a => (
            <Link key={a.to} to={a.to} className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-800/60 transition-colors group">
              <div className={`w-8 h-8 rounded-lg bg-dark-800 flex items-center justify-center`}>
                <a.icon size={16} className={a.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-dark-100 text-sm font-medium">{a.label}</p>
                <p className="text-dark-500 text-xs">{a.desc}</p>
              </div>
              <ChevronRight size={14} className="text-dark-600 group-hover:text-dark-400 transition-colors" />
            </Link>
          ))}
        </div>

        {/* Threat summary */}
        <div className="stat-card">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-danger-400" />Threat Summary</h3>
          {stats ? (
            <div className="space-y-4">
              {[
                { label: 'Phishing', val: stats.distribution?.phishing || 0, total: stats.totalScans || 1, color: 'bg-danger-500' },
                { label: 'Suspicious', val: stats.distribution?.suspicious || 0, total: stats.totalScans || 1, color: 'bg-warning-500' },
                { label: 'Safe', val: stats.distribution?.safe || 0, total: stats.totalScans || 1, color: 'bg-emerald-500' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-dark-300">{item.label}</span>
                    <span className="text-white font-semibold">{item.val}</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${item.color}`}
                      style={{ width: `${stats.totalScans > 0 ? (item.val / stats.totalScans) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
              {stats.totalScans === 0 && (
                <p className="text-dark-500 text-sm text-center py-4">No scans yet. Scan your first email!</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-8 bg-dark-800 rounded-lg animate-pulse" />)}
            </div>
          )}
        </div>
      </div>

      {/* Recent Scans */}
      <div className="glass-card-dark rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700/50">
          <h3 className="text-white font-semibold">Recent Scans</h3>
          <Link to="/history" className="text-primary-400 text-sm hover:text-primary-300 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-dark-800 rounded-xl animate-pulse" />)}
          </div>
        ) : recentScans.length === 0 ? (
          <div className="p-12 text-center">
            <Mail size={40} className="text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400">No scans yet. Go to Scan Email to get started.</p>
            <Link to="/scan" className="btn-primary mt-4 inline-flex text-sm">
              <Zap size={14} /> Scan Now
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Sender</th>
                  <th>Classification</th>
                  <th>Risk</th>
                  <th>Time</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentScans.map(scan => (
                  <tr key={scan._id}>
                    <td className="font-medium text-white max-w-[200px] truncate">{scan.subject}</td>
                    <td className="text-dark-400 text-xs max-w-[160px] truncate">{scan.sender}</td>
                    <td><RiskBadge c={scan.classification} /></td>
                    <td>
                      <span className={`font-bold ${scan.riskScore >= 70 ? 'text-danger-400' : scan.riskScore >= 40 ? 'text-warning-400' : 'text-emerald-400'}`}>
                        {scan.riskScore}/100
                      </span>
                    </td>
                    <td className="text-dark-500 text-xs">{new Date(scan.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/scan/result/${scan._id}`} className="text-primary-400 hover:text-primary-300 text-xs flex items-center gap-1">
                        View <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Threats */}
      {stats?.recentThreats?.length > 0 && (
        <div className="glass-card-dark rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-danger-400" /> Recent Threats Caught
          </h3>
          <div className="space-y-2">
            {stats.recentThreats.map(t => (
              <Link key={t._id} to={`/scan/result/${t._id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-800/50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-danger-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-dark-100 text-sm font-medium truncate">{t.subject}</p>
                  <p className="text-dark-500 text-xs truncate">{t.sender}</p>
                </div>
                <span className="text-danger-400 font-bold text-sm flex-shrink-0">{t.riskScore}/100</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
