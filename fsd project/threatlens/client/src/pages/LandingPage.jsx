import { Link } from 'react-router-dom';
import {
  Shield, Zap, Eye, AlertTriangle, CheckCircle, ArrowRight,
  Lock, BarChart3, GraduationCap, Globe, ChevronRight, Star
} from 'lucide-react';

const features = [
  {
    icon: Eye,
    color: 'text-primary-400',
    bg: 'bg-primary-500/10 border-primary-500/20',
    title: 'Explainable AI Detection',
    desc: 'Every result shows exactly WHY an email is suspicious — sender mismatch, malicious URLs, urgency tactics, credential harvesting and more.'
  },
  {
    icon: BarChart3,
    color: 'text-cyber-400',
    bg: 'bg-cyber-500/10 border-cyber-500/20',
    title: '0–100 Risk Score',
    desc: 'A weighted multi-module analysis engine produces a precise risk score with a 7-dimension Phishing DNA breakdown.'
  },
  {
    icon: Lock,
    color: 'text-warning-400',
    bg: 'bg-warning-500/10 border-warning-500/20',
    title: 'Quarantine & Incident Response',
    desc: 'Quarantine suspicious emails, mark false positives safe, and track every incident through the admin response queue.'
  },
  {
    icon: Globe,
    color: 'text-danger-400',
    bg: 'bg-danger-500/10 border-danger-500/20',
    title: 'Blocklist & Allowlist',
    desc: 'Admin-managed domain, email, and URL blocklists/allowlists with hit-count tracking and audit trails.'
  },
  {
    icon: GraduationCap,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    title: 'Cyber Awareness Training',
    desc: 'Interactive phishing simulations across 8 attack categories with scoring, explanations, and progress tracking.'
  },
  {
    icon: Shield,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
    title: 'Full Audit Logs',
    desc: 'Every scan, quarantine, report, and admin action is logged with timestamps, IP addresses, and severity levels.'
  },
];

const exampleResult = {
  subject: 'URGENT: Your SBI Account Has Been Suspended',
  sender: 'security@sbi-banking-secure.tk',
  classification: 'PHISHING',
  score: 87,
  reasons: [
    { label: 'Sender domain mismatch', sev: 'critical' },
    { label: 'Suspicious TLD detected (.tk)', sev: 'high' },
    { label: 'Urgent account suspension language', sev: 'high' },
    { label: 'Credential harvesting request', sev: 'critical' },
  ]
};

export default function LandingPage() {
  return (
    <div className="min-h-screen cyber-bg text-dark-100 font-sans">
      {/* Nav */}
      <nav className="border-b border-dark-800/60 backdrop-blur-xl sticky top-0 z-50 bg-dark-950/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-cyber-500 flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">ThreatLens</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-dark-300 hover:text-white text-sm font-medium transition-colors px-4 py-2">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-5">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm font-medium mb-8">
          <Zap size={14} className="text-primary-400" />
          AI-Powered • Explainable • Real-time
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
          Detect. Understand.{' '}
          <span className="text-gradient">Defend.</span>
        </h1>
        <p className="text-xl text-dark-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          ThreatLens analyzes emails with a multi-module AI engine and tells you <strong className="text-white">exactly why</strong> an email is dangerous — not just that it is.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="btn-primary text-base py-3.5 px-8 justify-center">
            Start Free <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn-secondary text-base py-3.5 px-8 justify-center">
            Sign In
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[
            { v: '5 Modules', l: 'Analysis Engine' },
            { v: '7 Dimensions', l: 'Phishing DNA' },
            { v: '0–100', l: 'Risk Score' },
            { v: 'Real-time', l: 'Detection' },
          ].map(s => (
            <div key={s.l} className="glass-card p-5 text-center">
              <div className="text-2xl font-black text-white">{s.v}</div>
              <div className="text-dark-400 text-xs mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Explainability showcase */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">The Power of Explainable Detection</h2>
          <p className="text-dark-400">Other tools show you PHISHING. ThreatLens shows you WHY.</p>
        </div>
        <div className="max-w-2xl mx-auto glass-card-dark p-6 rounded-2xl border border-dark-700">
          {/* Email header */}
          <div className="flex items-start gap-3 pb-4 border-b border-dark-700/60 mb-4">
            <div className="w-10 h-10 rounded-full bg-danger-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} className="text-danger-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{exampleResult.subject}</p>
              <p className="text-dark-400 text-xs mt-0.5">From: {exampleResult.sender}</p>
            </div>
          </div>
          {/* Result */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="badge-phishing text-sm px-4 py-1.5">⚠ {exampleResult.classification}</span>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-danger-400">{exampleResult.score}<span className="text-lg text-dark-400">/100</span></div>
              <div className="text-xs text-dark-400">Risk Score</div>
            </div>
          </div>
          {/* Reasons */}
          <div className="space-y-2">
            <p className="text-xs text-dark-400 font-semibold uppercase tracking-wider mb-3">Why this email is dangerous:</p>
            {exampleResult.reasons.map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-danger-500/5 border border-danger-500/15">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.sev === 'critical' ? 'bg-danger-400' : 'bg-warning-400'}`} />
                <span className="text-dark-200 text-sm flex-1">{r.label}</span>
                <span className={`text-xs font-semibold ${r.sev === 'critical' ? 'text-danger-400' : 'text-warning-400'}`}>{r.sev}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Everything You Need</h2>
          <p className="text-dark-400">A complete cybersecurity platform, not just a scanner.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(f => (
            <div key={f.title} className={`glass-card-dark p-6 border hover:border-opacity-60 transition-all duration-300 ${f.bg}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.bg} border`}>
                <f.icon size={20} className={f.color} />
              </div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-dark-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="glass-card p-12 rounded-3xl border border-primary-500/20">
          <Shield size={48} className="text-primary-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Start protecting your inbox today</h2>
          <p className="text-dark-400 mb-8">Create a free account and scan your first email in under 30 seconds.</p>
          <Link to="/register" className="btn-primary text-base py-3.5 px-10 inline-flex">
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800/60 py-8 text-center text-dark-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield size={16} className="text-primary-500" />
          <span className="text-white font-semibold">ThreatLens</span>
        </div>
        <p>AI-Powered Phishing Detection & Cyber Awareness Platform</p>
      </footer>
    </div>
  );
}
