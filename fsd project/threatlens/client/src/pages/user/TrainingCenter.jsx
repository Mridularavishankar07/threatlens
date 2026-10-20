import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, Star, CheckCircle, XCircle, ChevronRight,
  Trophy, Target, Zap, BookOpen, BarChart2
} from 'lucide-react';
import api from '../../services/api';

const CATEGORY_LABELS = {
  'banking-scam': '🏦 Banking Scam',
  'fake-job-offer': '💼 Fake Job',
  'password-reset': '🔑 Password Reset',
  'delivery-scam': '📦 Delivery Scam',
  'college-notice': '🎓 College Notice',
  'scholarship-scam': '📚 Scholarship Scam',
  'account-suspension': '🚫 Account Suspension',
  'payment-request': '💳 Payment Request',
};

const DIFF_COLORS = { beginner: 'text-emerald-400 bg-emerald-500/10', intermediate: 'text-warning-400 bg-warning-500/10', advanced: 'text-danger-400 bg-danger-500/10' };

export default function TrainingCenter() {
  const [simulations, setSimulations] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    Promise.all([api.get('/training'), api.get('/training/progress')])
      .then(([simRes, progRes]) => {
        setSimulations(simRes.data.simulations || []);
        setProgress(progRes.data);
      }).finally(() => setLoading(false));
  }, []);

  const filtered = filter ? simulations.filter(s => s.category === filter) : simulations;
  const categories = [...new Set(simulations.map(s => s.category))];

  const attempted = simulations.filter(s => s.attempted).length;
  const correct = simulations.filter(s => s.correct).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title flex items-center gap-2"><GraduationCap size={24} className="text-primary-400" />Training Center</h1>
        <p className="section-subtitle">Interactive phishing simulations — identify threats, earn points, improve your security score</p>
      </div>

      {/* Progress stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Scenarios', value: simulations.length, icon: BookOpen, color: 'text-primary-400', bg: 'bg-primary-500/10' },
          { label: 'Attempted', value: attempted, icon: Target, color: 'text-cyber-400', bg: 'bg-cyber-500/10' },
          { label: 'Correct', value: correct, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Total Points', value: progress?.totalPoints || 0, icon: Trophy, color: 'text-warning-400', bg: 'bg-warning-500/10' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div className="text-2xl font-bold text-white">{loading ? '—' : s.value}</div>
            <div className="text-dark-400 text-sm mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {!loading && simulations.length > 0 && (
        <div className="glass-card-dark rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-primary-400" />
              <span className="text-white font-semibold text-sm">Overall Progress</span>
            </div>
            <span className="text-primary-400 font-bold">{Math.round((attempted / simulations.length) * 100)}%</span>
          </div>
          <div className="progress-bar h-3">
            <div className="progress-fill bg-gradient-to-r from-primary-500 to-cyber-500"
              style={{ width: `${(attempted / simulations.length) * 100}%` }} />
          </div>
          <div className="flex justify-between text-xs text-dark-500 mt-2">
            <span>{attempted} of {simulations.length} completed</span>
            <span>Accuracy: {progress?.accuracy || 0}%</span>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter('')}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${!filter ? 'bg-primary-600/20 border-primary-500/30 text-white' : 'bg-dark-800 border-dark-700 text-dark-400 hover:text-white'}`}>
          All
        </button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filter === cat ? 'bg-primary-600/20 border-primary-500/30 text-white' : 'bg-dark-800 border-dark-700 text-dark-400 hover:text-white'}`}>
            {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Simulation cards */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-dark-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-dark-500">
          <GraduationCap size={48} className="mx-auto mb-3 opacity-30" />
          <p>No simulations in this category yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(sim => (
            <div key={sim._id} className={`glass-card-dark rounded-2xl p-5 border transition-all hover:border-primary-500/30
              ${sim.correct ? 'border-emerald-500/20' : sim.attempted ? 'border-warning-500/20' : 'border-dark-700/50'}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">{sim.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-dark-400">{CATEGORY_LABELS[sim.category] || sim.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFF_COLORS[sim.difficulty]}`}>
                      {sim.difficulty}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {sim.correct ? (
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <CheckCircle size={18} className="text-emerald-400" />
                    </div>
                  ) : sim.attempted ? (
                    <div className="w-9 h-9 rounded-full bg-warning-500/20 border border-warning-500/30 flex items-center justify-center">
                      <XCircle size={18} className="text-warning-400" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-dark-700 flex items-center justify-center">
                      <Target size={18} className="text-dark-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1 text-xs text-warning-400">
                  <Star size={12} className="fill-warning-400" />
                  <span>{sim.points} pts</span>
                </div>
                {sim.correct && <span className="text-xs text-emerald-400 font-medium">✓ Completed</span>}
                {sim.attempted && !sim.correct && <span className="text-xs text-warning-400 font-medium">Try again</span>}
              </div>

              <Link to={`/training/${sim._id}`} className="btn-primary w-full justify-center text-sm py-2.5">
                {sim.attempted ? (sim.correct ? 'Review' : 'Try Again') : 'Start'}
                <ChevronRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
