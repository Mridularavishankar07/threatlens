import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Star, Shield, TrendingUp, GraduationCap, Mail, CheckCircle,
  AlertTriangle, Target, BarChart2, ChevronRight, Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function ScoreGauge({ score }) {
  const r = 64;
  const circ = 2 * Math.PI * r;
  const half = circ / 2;
  const fill = (score / 100) * half;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#fbbf24' : '#f43f5e';
  return (
    <svg width="200" height="110" viewBox="0 0 200 110">
      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1e293b" strokeWidth="14" />
      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="14"
        strokeDasharray={`${(score / 100) * 251.2} 251.2`} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 8px ${color}60)`, transition: 'stroke-dasharray 1.2s ease-out' }} />
      <text x="100" y="90" textAnchor="middle" fill={color} fontSize="36" fontWeight="900" fontFamily="Inter">{score}</text>
      <text x="100" y="108" textAnchor="middle" fill="#475569" fontSize="10" fontFamily="Inter">/100</text>
    </svg>
  );
}

const TIPS = [
  { title: 'Complete Training Modules', desc: 'Each correctly answered simulation adds to your score', link: '/training', action: 'Go to Training' },
  { title: 'Scan Suspicious Emails', desc: 'Actively reviewing emails shows awareness and builds habits', link: '/scan', action: 'Scan Email' },
  { title: 'Review False Positives', desc: 'Mark safe emails correctly to refine your threat recognition', link: '/history', action: 'View History' },
];

export default function SecurityScore() {
  const { user } = useAuth();
  const [scanStats, setScanStats] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/scans/stats'), api.get('/training/progress')])
      .then(([s, p]) => { setScanStats(s.data); setProgress(p.data); })
      .finally(() => setLoading(false));
  }, []);

  const score = user?.securityScore || 50;
  const scoreLabel = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Average' : 'Needs Work';
  const scoreColor = score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-warning-400' : 'text-danger-400';

  const factors = [
    {
      label: 'Training Accuracy',
      value: progress ? `${progress.accuracy}%` : '—',
      score: progress?.accuracy || 0,
      max: 100,
      icon: GraduationCap,
      color: 'bg-primary-500',
      desc: `${progress?.correct || 0} correct out of ${progress?.attempted || 0} attempts`
    },
    {
      label: 'Simulations Completed',
      value: `${user?.trainingCompleted?.length || 0}`,
      score: Math.min((user?.trainingCompleted?.length || 0) * 12.5, 100),
      max: 100,
      icon: Target,
      color: 'bg-cyber-500',
      desc: `${user?.trainingCompleted?.length || 0} of ${progress?.totalSimulations || 8} scenarios`
    },
    {
      label: 'Emails Scanned',
      value: scanStats?.totalScans ?? '—',
      score: Math.min((scanStats?.totalScans || 0) * 5, 100),
      max: 100,
      icon: Mail,
      color: 'bg-warning-500',
      desc: 'Active threat monitoring'
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="section-title flex items-center gap-2"><Star size={22} className="text-warning-400 fill-warning-400" />Security Score</h1>
        <p className="section-subtitle">Your personal cybersecurity awareness rating</p>
      </div>

      {/* Score card */}
      <div className="glass-card-dark rounded-2xl p-8 text-center">
        <ScoreGauge score={score} />
        <h2 className={`text-3xl font-black mt-4 mb-1 ${scoreColor}`}>{scoreLabel}</h2>
        <p className="text-dark-400 text-sm">
          {score >= 85 ? 'Outstanding! You have strong cyber awareness.' :
           score >= 70 ? 'Good awareness. A few more training modules will push you higher.' :
           score >= 50 ? 'Average score. Complete more training to improve.' :
           'Your score needs improvement. Start with the training center.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/training" className="btn-primary text-sm py-2.5 px-6"><GraduationCap size={14} />Improve Score</Link>
        </div>
      </div>

      {/* Score factors */}
      <div className="glass-card-dark rounded-2xl p-6">
        <h3 className="text-white font-bold mb-5 flex items-center gap-2"><BarChart2 size={16} className="text-primary-400" />Score Factors</h3>
        <div className="space-y-5">
          {factors.map(f => (
            <div key={f.label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <f.icon size={15} className="text-dark-400" />
                  <span className="text-dark-200 text-sm font-medium">{f.label}</span>
                </div>
                <span className="text-white font-bold text-sm">{loading ? '—' : f.value}</span>
              </div>
              <div className="progress-bar h-2.5 mb-1">
                <div className={`progress-fill ${f.color}`} style={{ width: `${loading ? 0 : f.score}%` }} />
              </div>
              <p className="text-dark-500 text-xs">{loading ? '...' : f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How to improve */}
      <div className="glass-card-dark rounded-2xl p-6">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-cyber-400" />How to Improve Your Score</h3>
        <div className="space-y-3">
          {TIPS.map(tip => (
            <div key={tip.title} className="flex items-center gap-4 p-4 bg-dark-800/40 rounded-xl">
              <div className="flex-1">
                <p className="text-dark-100 font-medium text-sm">{tip.title}</p>
                <p className="text-dark-500 text-xs mt-0.5">{tip.desc}</p>
              </div>
              <Link to={tip.link} className="text-primary-400 hover:text-primary-300 text-xs flex items-center gap-1 flex-shrink-0">
                {tip.action} <ChevronRight size={12} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement badges */}
      <div className="glass-card-dark rounded-2xl p-6">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Zap size={16} className="text-warning-400" />Achievements</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '🛡️', label: 'First Scan', earned: (scanStats?.totalScans || 0) >= 1 },
            { icon: '🎯', label: 'First Training', earned: (progress?.attempted || 0) >= 1 },
            { icon: '⚡', label: '5 Scans', earned: (scanStats?.totalScans || 0) >= 5 },
            { icon: '🏆', label: '5 Training', earned: (progress?.correct || 0) >= 5 },
            { icon: '🔍', label: 'Phishing Hunter', earned: (scanStats?.distribution?.phishing || 0) >= 3 },
            { icon: '🎖️', label: 'Security Pro', earned: score >= 80 },
          ].map(a => (
            <div key={a.label} className={`text-center p-4 rounded-xl border transition-all ${a.earned ? 'bg-warning-900/20 border-warning-500/30' : 'bg-dark-800/40 border-dark-700/50 opacity-40'}`}>
              <div className="text-2xl mb-1.5">{a.icon}</div>
              <p className={`text-xs font-semibold ${a.earned ? 'text-warning-300' : 'text-dark-500'}`}>{a.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
