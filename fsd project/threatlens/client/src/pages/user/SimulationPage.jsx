import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Mail, AlertTriangle, CheckCircle, XCircle, Clock,
  ChevronLeft, Paperclip, Eye, EyeOff, ArrowRight, Star, Brain
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const DIFF_COLORS = { beginner: 'text-emerald-400', intermediate: 'text-warning-400', advanced: 'text-danger-400' };

export default function SimulationPage() {
  const { id } = useParams();
  const [sim, setSim] = useState(null);
  const [selected, setSelected] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showBody, setShowBody] = useState(false);
  const timerRef = useRef(null);
  const startRef = useRef(Date.now());
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/training/${id}`)
      .then(res => setSim(res.data.simulation))
      .catch(() => toast.error('Scenario not found'))
      .finally(() => setLoading(false));
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(timerRef.current);
  }, [id]);

  const handleSubmit = async () => {
    if (!selected) return toast.warning('Please choose an action');
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const res = await api.post(`/training/${id}/attempt`, { selectedAction: selected, timeSpent: elapsed });
      setResult(res.data);
    } catch { toast.error('Submission failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!sim) return (
    <div className="text-center py-20">
      <AlertTriangle size={48} className="text-danger-400 mx-auto mb-4" />
      <h2 className="text-white font-bold text-xl mb-4">Scenario not found</h2>
      <Link to="/training" className="btn-primary inline-flex">Back to Training</Link>
    </div>
  );

  const formatTime = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back + meta */}
      <div className="flex items-center justify-between">
        <Link to="/training" className="btn-ghost text-sm"><ChevronLeft size={16} />Back to Training</Link>
        <div className="flex items-center gap-4">
          <span className={`text-sm font-semibold ${DIFF_COLORS[sim.difficulty]}`}>{sim.difficulty}</span>
          {!result && (
            <div className="flex items-center gap-1.5 text-sm text-dark-400 bg-dark-800 border border-dark-700 rounded-xl px-3 py-1.5">
              <Clock size={14} />
              <span className="font-mono">{formatTime(elapsed)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-warning-400">
            <Star size={14} className="fill-warning-400" />
            <span className="text-sm font-semibold">{sim.points} pts</span>
          </div>
        </div>
      </div>

      <h1 className="section-title">{sim.title}</h1>

      {/* Simulated email */}
      <div className="glass-card-dark rounded-2xl overflow-hidden border border-dark-700/50">
        {/* Email header bar */}
        <div className="bg-dark-800/60 px-5 py-3 flex items-center gap-3 border-b border-dark-700/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-danger-500/60" />
            <div className="w-3 h-3 rounded-full bg-warning-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
          </div>
          <span className="text-dark-400 text-xs font-medium ml-2">Email Preview</span>
          <span className="ml-auto text-xs text-dark-500 bg-dark-900/50 px-2 py-0.5 rounded">🔒 Analysis Mode</span>
        </div>

        {/* Email meta */}
        <div className="p-5 space-y-2 border-b border-dark-700/30">
          <div className="flex items-start gap-2">
            <span className="text-dark-500 text-xs w-16 flex-shrink-0 pt-0.5">From:</span>
            <span className="text-danger-300 font-mono text-sm break-all">{sim.emailContent?.sender}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-dark-500 text-xs w-16 flex-shrink-0 pt-0.5">Subject:</span>
            <span className="text-white font-semibold text-sm">{sim.emailContent?.subject}</span>
          </div>
          {sim.emailContent?.hasAttachment && (
            <div className="flex items-center gap-2 text-warning-400 text-xs">
              <Paperclip size={12} />
              <span>{sim.emailContent.attachmentName || 'attachment.pdf'}</span>
            </div>
          )}
        </div>

        {/* Body toggle */}
        <div className="p-5">
          <button onClick={() => setShowBody(p => !p)}
            className="flex items-center gap-2 text-xs text-dark-400 hover:text-dark-200 mb-3 transition-colors">
            {showBody ? <EyeOff size={12} /> : <Eye size={12} />}
            {showBody ? 'Hide' : 'Show'} email body
          </button>
          {showBody && (
            <div className="bg-dark-900/40 rounded-xl border border-dark-700/50 p-4">
              <pre className="text-dark-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">{sim.emailContent?.body}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Choose action */}
      {!result ? (
        <div className="glass-card-dark rounded-2xl p-6">
          <h2 className="text-white font-bold mb-1">What would you do with this email?</h2>
          <p className="text-dark-400 text-sm mb-5">Choose the most appropriate action:</p>
          <div className="space-y-3 mb-6">
            {sim.options?.map(opt => (
              <button key={opt.key} onClick={() => setSelected(opt.action)}
                className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border transition-all
                  ${selected === opt.action
                    ? 'bg-primary-600/20 border-primary-500/40 text-white'
                    : 'bg-dark-800/40 border-dark-700 text-dark-300 hover:border-dark-600 hover:text-dark-100'}`}>
                <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all
                  ${selected === opt.action ? 'bg-primary-500 border-primary-400 text-white' : 'border-dark-600 text-dark-500'}`}>
                  {opt.key}
                </div>
                <span className="font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
          <button onClick={handleSubmit} disabled={submitting || !selected} className="btn-primary w-full justify-center py-3.5">
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...
              </span>
            ) : <>Submit Answer <ArrowRight size={16} /></>}
          </button>
        </div>
      ) : (
        /* Result panel */
        <div className="space-y-4 animate-slide-up">
          {/* Pass/fail */}
          <div className={`rounded-2xl border p-6 ${result.correct ? 'bg-emerald-900/15 border-emerald-500/30' : 'bg-danger-900/15 border-danger-500/30'}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${result.correct ? 'bg-emerald-500/20' : 'bg-danger-500/20'}`}>
                {result.correct ? <CheckCircle size={28} className="text-emerald-400" /> : <XCircle size={28} className="text-danger-400" />}
              </div>
              <div>
                <h2 className={`text-2xl font-black ${result.correct ? 'text-emerald-400' : 'text-danger-400'}`}>
                  {result.correct ? '✓ Correct!' : '✗ Incorrect'}
                </h2>
                <p className="text-dark-300 text-sm mt-0.5">{result.message}</p>
              </div>
              <div className="ml-auto text-center">
                <div className={`text-3xl font-black ${result.correct ? 'text-warning-400' : 'text-dark-400'}`}>+{result.points}</div>
                <div className="text-dark-500 text-xs">points</div>
              </div>
            </div>
            {!result.correct && (
              <div className="text-sm text-dark-300 bg-dark-900/40 rounded-xl px-4 py-3">
                Correct action: <span className="text-emerald-300 font-semibold">{result.correctAction}</span>
              </div>
            )}
          </div>

          {/* Explanation */}
          <div className="glass-card-dark rounded-2xl p-6">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Brain size={16} className="text-primary-400" />Explanation</h3>
            <p className="text-dark-300 text-sm leading-relaxed">{result.explanation}</p>
          </div>

          {/* Warning signs */}
          {result.warningSigns?.length > 0 && (
            <div className="glass-card-dark rounded-2xl p-6">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-warning-400" />Warning Signs in This Email
              </h3>
              <ul className="space-y-2">
                {result.warningSigns.map((sign, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-warning-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-warning-400 text-xs font-bold">{i + 1}</span>
                    </div>
                    <span className="text-dark-300">{sign}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            <Link to="/training" className="btn-secondary flex-1 justify-center">Back to Training</Link>
            <button onClick={() => { setResult(null); setSelected(''); setElapsed(0); startRef.current = Date.now(); clearInterval(timerRef.current); timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000); }}
              className="btn-primary flex-1 justify-center">
              Try Again <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
