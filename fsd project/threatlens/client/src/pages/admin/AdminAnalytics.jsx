import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart2, TrendingUp, AlertTriangle, Users, Activity } from 'lucide-react';
import api from '../../services/api';

const TOOLTIP_STYLE = { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 };
const LABEL_STYLE = { color: '#94a3b8' };

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  useEffect(() => {
    api.get('/admin/analytics')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-dark-800 rounded-2xl animate-pulse" />)}
    </div>
  );

  const dailyTrend = (data?.dailyTrend || []).map(d => ({ ...d, date: d._id?.slice(5) || d._id }));
  const threatDist = (data?.threatDistribution || []).map(d => ({
    name: d._id.charAt(0).toUpperCase() + d._id.slice(1),
    count: d.count,
    avgScore: Math.round(d.avgScore)
  }));
  const scoreDistRaw = data?.userScoreDistribution || [];
  const scoreDist = scoreDistRaw.map(b => ({
    range: `${b._id}–${b._id + 25}`,
    users: b.count
  }));

  const pieColors = { Phishing: '#f43f5e', Suspicious: '#fbbf24', Safe: '#10b981' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title flex items-center gap-2"><BarChart2 size={22} className="text-primary-400" />Threat Analytics</h1>
          <p className="section-subtitle">30-day system-wide threat intelligence</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {threatDist.map(t => (
          <div key={t.name} className="stat-card">
            <div className="text-2xl font-black text-white mb-1">{t.count}</div>
            <div className="text-sm text-dark-300 font-medium">{t.name}</div>
            <div className="text-xs text-dark-500 mt-0.5">Avg score: {t.avgScore}/100</div>
          </div>
        ))}
      </div>

      {/* 30-day trend */}
      <div className="glass-card-dark rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
          <TrendingUp size={16} className="text-primary-400" />30-Day Daily Threat Trend
        </h3>
        {dailyTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} interval={4} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} />
              <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
              <Line type="monotone" dataKey="phishing" stroke="#f43f5e" strokeWidth={2.5} dot={false} name="Phishing" />
              <Line type="monotone" dataKey="suspicious" stroke="#fbbf24" strokeWidth={2} dot={false} name="Suspicious" />
              <Line type="monotone" dataKey="safe" stroke="#10b981" strokeWidth={2} dot={false} name="Safe" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-dark-500">No data for this period</div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Distribution pie */}
        <div className="glass-card-dark rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-5">Overall Classification Split</h3>
          {threatDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={threatDist} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                  dataKey="count" paddingAngle={4} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {threatDist.map((entry, i) => (
                    <Cell key={i} fill={pieColors[entry.name] || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-dark-500">No data</div>}
        </div>

        {/* User score distribution */}
        <div className="glass-card-dark rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            <Users size={16} className="text-cyber-400" />User Security Score Distribution
          </h3>
          {scoreDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={scoreDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} />
                <Bar dataKey="users" fill="#6366f1" radius={[4, 4, 0, 0]} name="Users" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-dark-500">No data</div>}
        </div>
      </div>

      {/* Top phishing threats */}
      {data?.topThreats?.length > 0 && (
        <div className="glass-card-dark rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-danger-400" />Top Phishing Threats (Highest Risk Scores)
          </h3>
          <div className="space-y-3">
            {data.topThreats.map((t, i) => (
              <div key={t._id} className="flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl border border-danger-500/10">
                <div className="w-8 h-8 rounded-lg bg-danger-500/20 flex items-center justify-center text-danger-400 font-black text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{t.subject}</p>
                  <p className="text-dark-500 text-xs font-mono truncate">{t.sender}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-danger-400 font-black text-lg">{t.riskScore}</span>
                  <span className="text-dark-600 text-xs">/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
