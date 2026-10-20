import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Shield, AlertTriangle, CheckCircle, ChevronLeft,
  Lock, Flag, Eye, Activity, Link2, User, FileText,
  Brain, Zap, ExternalLink, Copy, CheckCheck, Trash2,
  BarChart2, Info, ChevronDown, ChevronUp, Mail
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip as RechartsTooltip
} from 'recharts';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

function RiskScoreRing({ score }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? '#f43f5e' : score >= 40 ? '#fbbf24' : '#10b981';
  const bgColor = score >= 70 ? 'rgba(244,63,94,0.1)' : score >= 40 ? 'rgba(251,191,36,0.1)' : 'rgba(16,185,129,0.1)';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ background: bgColor, borderRadius: '50%', padding: 8 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease-out', filter: `drop-shadow(0 0 8px ${color}60)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black" style={{ color }}>{score}</span>
        <span className="text-dark-400 text-xs font-medium">/100</span>
      </div>
    </div>
  );
}

function DNABar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-dark-300">{label}</span>
        <span className="font-semibold text-white">{value}%</span>
      </div>
      <div className="progress-bar h-2.5">
        <div className="dna-bar" style={{ width: `${value}%`, background: color, boxShadow: value > 50 ? `0 0 8px ${color}60` : 'none' }} />
      </div>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const classes = {
    critical: 'severity-critical',
    high: 'severity-high',
    medium: 'severity-medium',
    low: 'severity-low'
  };
  return <span className={classes[severity] || 'severity-low'}>{severity}</span>;
}

function CollapsibleSection({ title, icon: Icon, iconColor = 'text-primary-400', count, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card-dark rounded-xl overflow-hidden">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-dark-800/30 transition-colors">
        <div className="flex items-center gap-3">
          <Icon size={16} className={iconColor} />
          <span className="text-white font-semibold text-sm">{title}</span>
          {count !== undefined && (
            <span className="bg-dark-700 text-dark-300 text-xs px-2 py-0.5 rounded-full">{count}</span>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-dark-400" /> : <ChevronDown size={16} className="text-dark-400" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-dark-700/50 pt-4">{children}</div>}
    </div>
  );
}

export default function ScanResult() {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showReport, setShowReport] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/scans/${id}`)
      .then(res => setScan(res.data.scan))
      .catch(() => toast.error('Scan not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAction = async (action) => {
    try {
      const res = await api.patch(`/scans/${id}/action`, { action });
      setScan(res.data.scan);
      toast.success(action === 'quarantine' ? 'Email quarantined' : 'Email marked as safe');
    } catch { toast.error('Action failed'); }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    setReporting(true);
    try {
      await api.post('/reports', { scanId: id, reason: reportReason });
      toast.success('Report submitted to admin');
      setShowReport(false);
      setReportReason('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit report');
    } finally { setReporting(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this scan? This cannot be undone.')) return;
    try {
      await api.delete(`/scans/${id}`);
      toast.success('Scan deleted');
      navigate('/history');
    } catch { toast.error('Delete failed'); }
  };

  const copyId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="text-center py-20">
        <AlertTriangle size={48} className="text-danger-400 mx-auto mb-4" />
        <h2 className="text-white text-xl font-bold mb-2">Scan Not Found</h2>
        <Link to="/history" className="btn-primary inline-flex">Back to History</Link>
      </div>
    );
  }

  const classKey = (scan.classification || 'safe').toLowerCase();
  const isPhishing = classKey === 'phishing';
  const isSuspicious = classKey === 'suspicious';
  const isSafe = classKey === 'safe';

  const classConfig = {
    phishing: { label: 'PHISHING', color: 'text-danger-400', bg: 'bg-danger-900/20', border: 'border-danger-500/30', icon: AlertTriangle, glow: 'glow-danger' },
    suspicious: { label: 'SUSPICIOUS', color: 'text-warning-400', bg: 'bg-warning-900/20', border: 'border-warning-500/30', icon: AlertTriangle, glow: '' },
    safe: { label: 'SAFE', color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-500/30', icon: CheckCircle, glow: 'glow-success' },
  };
  const cfg = classConfig[classKey] || classConfig.safe;
  const ClassIcon = cfg.icon;

  const dnaColors = {
    impersonation: '#f43f5e',
    credentialTheft: '#ef4444',
    maliciousURL: '#f97316',
    urgency: '#fbbf24',
    financialBait: '#eab308',
    attachmentRisk: '#8b5cf6',
    socialEngineering: '#ec4899',
  };

  const dnaLabels = {
    impersonation: 'Impersonation',
    credentialTheft: 'Credential Theft',
    maliciousURL: 'Malicious URL',
    urgency: 'Urgency Tactics',
    financialBait: 'Financial Bait',
    attachmentRisk: 'Attachment Risk',
    socialEngineering: 'Social Engineering',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost text-sm">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2 text-dark-500 text-xs font-mono">
          Scan ID: {id.slice(-8)}
          <button onClick={copyId} className="text-dark-500 hover:text-dark-300 transition-colors">
            {copied ? <CheckCheck size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      {/* Hero result card */}
      <div className={`rounded-2xl border ${cfg.bg} ${cfg.border} p-6`}>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Risk score */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <RiskScoreRing score={scan.riskScore} />
            <p className="text-dark-400 text-xs mt-2 text-center">Risk Score</p>
          </div>

          {/* Classification + email meta */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <ClassIcon size={24} className={cfg.color} />
              <h1 className={`text-3xl font-black ${cfg.color}`}>{cfg.label}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase border ${cfg.border} ${cfg.color}`}>
                {scan.riskLevel} risk
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border flex items-center gap-1 ${
                scan.analysisMethod === 'hybrid'
                  ? 'bg-purple-950/60 text-purple-300 border-purple-500/40 shadow-sm'
                  : 'bg-dark-800 text-dark-300 border-dark-600'
              }`}>
                {scan.analysisMethod === 'hybrid' ? '🤖 Hybrid AI (Gemini)' : '⚡ Rule Engine'}
              </span>
            </div>

            <div className="space-y-1 mb-4">
              <p className="text-white font-semibold text-lg leading-tight truncate">{scan.subject}</p>
              <p className="text-dark-400 text-sm font-mono">{scan.sender}</p>
              <p className="text-dark-600 text-xs">{new Date(scan.createdAt).toLocaleString()}</p>
            </div>

            {/* Explanation */}
            <div className={`p-4 rounded-xl border ${cfg.bg} ${cfg.border}`}>
              <div className="flex items-start gap-2">
                <Brain size={16} className={`${cfg.color} flex-shrink-0 mt-0.5`} />
                <p className="text-dark-200 text-sm leading-relaxed whitespace-pre-line">{scan.explanation}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-dark-700/30">
          {scan.userAction !== 'quarantined' ? (
            <button onClick={() => handleAction('quarantine')} className="btn-secondary text-sm py-2 text-warning-400 border-warning-500/30 hover:bg-warning-900/20">
              <Lock size={14} /> Quarantine
            </button>
          ) : (
            <button onClick={() => handleAction('mark_safe')} className="btn-secondary text-sm py-2 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/20">
              <CheckCircle size={14} /> Mark Safe
            </button>
          )}
          <button onClick={() => setShowReport(p => !p)} className="btn-secondary text-sm py-2">
            <Flag size={14} /> Report
          </button>
          <Link to="/scan" className="btn-secondary text-sm py-2">
            <Zap size={14} /> Scan Another
          </Link>
          <button onClick={handleDelete} className="btn-secondary text-sm py-2 text-danger-400 border-danger-500/20 hover:bg-danger-900/20 ml-auto">
            <Trash2 size={14} />
          </button>
        </div>

        {/* Status badges */}
        {(scan.userAction === 'quarantined' || scan.isQuarantined) && (
          <div className="mt-3 flex items-center gap-2 text-warning-300 text-sm bg-warning-900/15 border border-warning-500/20 rounded-xl px-4 py-2">
            <Lock size={14} /> This email has been quarantined
          </div>
        )}

        {/* Report form */}
        {showReport && (
          <form onSubmit={handleReport} className="mt-4 p-4 bg-dark-900/50 rounded-xl border border-dark-700 space-y-3">
            <p className="text-white text-sm font-semibold">Submit report to admin</p>
            <textarea rows={3} value={reportReason} onChange={e => setReportReason(e.target.value)}
              placeholder="Why are you reporting this scan? (false positive, incorrect classification, etc.)"
              className="input-field resize-none text-sm" required />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowReport(false)} className="btn-secondary text-sm py-2 flex-1 justify-center">Cancel</button>
              <button type="submit" disabled={reporting} className="btn-primary text-sm py-2 flex-1 justify-center">
                {reporting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Why section - Explainable AI */}
      {scan.threatIndicators?.length > 0 && (
        <div className="glass-card-dark rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
            <Eye size={18} className="text-primary-400" />
            Why this email is{' '}
            <span className={cfg.color}>{isPhishing ? 'dangerous' : isSuspicious ? 'suspicious' : 'safe'}</span>
          </h2>
          <p className="text-dark-400 text-sm mb-5">Each indicator below contributed to the final risk score of {scan.riskScore}/100</p>

          <div className="space-y-3">
            {scan.threatIndicators.map((ind, i) => (
              <div key={i} className={`flex items-start gap-4 p-4 rounded-xl border transition-all
                ${ind.severity === 'critical' ? 'bg-danger-900/15 border-danger-500/25' :
                  ind.severity === 'high' ? 'bg-warning-900/15 border-warning-500/25' :
                  'bg-dark-800/50 border-dark-700/50'}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                  ${ind.severity === 'critical' ? 'bg-danger-500/20' :
                    ind.severity === 'high' ? 'bg-warning-500/20' : 'bg-dark-700'}`}>
                  <AlertTriangle size={16} className={
                    ind.severity === 'critical' ? 'text-danger-400' :
                    ind.severity === 'high' ? 'text-warning-400' : 'text-dark-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-semibold text-sm">{ind.name}</p>
                    <SeverityBadge severity={ind.severity} />
                  </div>
                  <p className="text-dark-300 text-sm">{ind.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-lg font-black ${ind.severity === 'critical' ? 'text-danger-400' : ind.severity === 'high' ? 'text-warning-400' : 'text-dark-300'}`}>
                    {ind.score}
                  </div>
                  <div className="text-dark-600 text-xs">score</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phishing DNA */}
      {scan.phishingDNA && (
        <div className="glass-card-dark rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <BarChart2 size={18} className="text-cyber-400" /> Phishing DNA Radar & Vector Profile
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-dark-800 text-dark-300 border border-dark-700">
              7-Axis Model
            </span>
          </div>
          <p className="text-dark-400 text-sm mb-6">Visual threat signature across all 7 behavioral attack dimensions</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Interactive Radar Chart */}
            <div className="w-full h-72 flex items-center justify-center bg-dark-900/40 rounded-xl p-2 border border-dark-800">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  data={[
                    { subject: 'Impersonation', value: scan.phishingDNA.impersonation || 0, fullMark: 100 },
                    { subject: 'Credential Theft', value: scan.phishingDNA.credentialTheft || 0, fullMark: 100 },
                    { subject: 'Malicious URL', value: scan.phishingDNA.maliciousURL || 0, fullMark: 100 },
                    { subject: 'Urgency', value: scan.phishingDNA.urgency || 0, fullMark: 100 },
                    { subject: 'Financial Bait', value: scan.phishingDNA.financialBait || 0, fullMark: 100 },
                    { subject: 'Attachment Risk', value: scan.phishingDNA.attachmentRisk || 0, fullMark: 100 },
                    { subject: 'Social Eng.', value: scan.phishingDNA.socialEngineering || 0, fullMark: 100 },
                  ]}
                  outerRadius="75%"
                >
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Radar
                    name="Threat Score"
                    dataKey="value"
                    stroke={isPhishing ? '#f43f5e' : isSuspicious ? '#fbbf24' : '#10b981'}
                    fill={isPhishing ? '#f43f5e' : isSuspicious ? '#fbbf24' : '#10b981'}
                    fillOpacity={0.4}
                  />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    formatter={(val) => [`${val}/100`, 'Threat Intensity']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Dimensional DNA Bars */}
            <div className="space-y-3.5">
              {Object.entries(scan.phishingDNA).map(([key, val]) => (
                <DNABar key={key} label={dnaLabels[key] || key} value={val} color={dnaColors[key] || '#6366f1'} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {scan.recommendations?.length > 0 && (
        <div className="glass-card-dark rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Shield size={18} className="text-emerald-400" /> Recommendations
          </h2>
          <div className="space-y-2">
            {scan.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/40">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-emerald-400 text-xs font-bold">{i + 1}</span>
                </div>
                <p className="text-dark-200 text-sm leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed analysis breakdown */}
      {scan.detailedAnalysis && (
        <div className="space-y-3">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Activity size={18} className="text-primary-400" /> Detailed Analysis
          </h2>

          {[
            { key: 'senderAnalysis', label: 'Sender Analysis', icon: User, color: 'text-primary-400' },
            { key: 'urlAnalysis', label: 'URL Analysis', icon: Link2, color: 'text-cyber-400' },
            { key: 'contentAnalysis', label: 'Content Analysis', icon: FileText, color: 'text-warning-400' },
            { key: 'socialEngineering', label: 'Social Engineering', icon: Brain, color: 'text-danger-400' },
            { key: 'credentialFinancial', label: 'Credential & Financial', icon: Zap, color: 'text-violet-400' },
          ].map(({ key, label, icon, color }) => {
            const data = scan.detailedAnalysis[key];
            if (!data) return null;
            return (
              <CollapsibleSection key={key} title={label} icon={icon} iconColor={color}
                count={`Score: ${data.score}/100`} defaultOpen={data.suspicious}>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="progress-bar flex-1">
                      <div className="progress-fill bg-primary-500" style={{ width: `${data.score}%` }} />
                    </div>
                    <span className={`text-sm font-bold ${data.suspicious ? 'text-danger-400' : 'text-emerald-400'}`}>
                      {data.suspicious ? '⚠ Suspicious' : '✓ Normal'}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {data.findings?.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${data.suspicious ? 'bg-warning-400' : 'bg-emerald-400'}`} />
                        <span className="text-dark-300">{f}</span>
                      </li>
                    ))}
                  </ul>
                  {/* URL details */}
                  {key === 'urlAnalysis' && data.urls?.length > 0 && (
                    <div>
                      <p className="text-xs text-dark-500 font-semibold uppercase tracking-wider mb-2">Extracted URLs</p>
                      <div className="space-y-1">
                        {data.urls.map((url, i) => (
                          <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono
                            ${data.suspiciousUrls?.includes(url) ? 'bg-danger-900/20 border border-danger-500/20 text-danger-300' : 'bg-dark-800 text-dark-400'}`}>
                            <ExternalLink size={10} className="flex-shrink-0" />
                            <span className="truncate">{url}</span>
                            {data.suspiciousUrls?.includes(url) && <span className="text-danger-400 font-semibold flex-shrink-0">SUSPICIOUS</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            );
          })}
        </div>
      )}

      {/* Email content */}
      <CollapsibleSection title="Original Email Content" icon={Mail} iconColor="text-dark-400">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-dark-800/50 rounded-lg p-3">
              <p className="text-dark-500 text-xs mb-1">FROM</p>
              <p className="text-dark-200 font-mono text-xs break-all">{scan.sender}</p>
            </div>
            {scan.attachmentName && (
              <div className="bg-dark-800/50 rounded-lg p-3">
                <p className="text-dark-500 text-xs mb-1">ATTACHMENT</p>
                <p className="text-dark-200 font-mono text-xs">{scan.attachmentName}</p>
              </div>
            )}
          </div>
          <div className="bg-dark-900/50 rounded-xl border border-dark-700/50 p-4 max-h-64 overflow-y-auto">
            <pre className="text-dark-300 text-xs whitespace-pre-wrap font-mono leading-relaxed">{scan.emailBody}</pre>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
