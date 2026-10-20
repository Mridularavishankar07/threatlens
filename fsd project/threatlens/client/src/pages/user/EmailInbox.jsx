import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Shield, AlertTriangle, CheckCircle, Trash2, Lock,
  RefreshCw, Star, Eye, Zap, ChevronRight, Inbox,
  PlusCircle, X, Send
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

function ClassBadge({ status }) {
  if (status === 'phishing') return <span className="badge-phishing text-xs">⚠ Phishing</span>;
  if (status === 'suspicious') return <span className="badge-suspicious text-xs">~ Suspicious</span>;
  if (status === 'safe') return <span className="badge-safe text-xs">✓ Safe</span>;
  return <span className="text-xs text-dark-500 bg-dark-800 border border-dark-700 px-2 py-0.5 rounded-full">Unscanned</span>;
}

function ComposeModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ fromName: '', fromAddress: '', subject: '', body: '', urls: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const urls = form.urls.split('\n').map(u => u.trim()).filter(Boolean);
    await onSubmit({ ...form, urls });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card-dark rounded-2xl w-full max-w-2xl animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-dark-700/50">
          <h3 className="text-white font-bold text-lg flex items-center gap-2"><PlusCircle size={18} className="text-primary-400" />Add Email to Inbox</h3>
          <button onClick={onClose} className="text-dark-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Sender Name</label>
              <input value={form.fromName} onChange={e => setForm(p => ({ ...p, fromName: e.target.value }))} placeholder="John Doe" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Sender Email *</label>
              <input type="email" value={form.fromAddress} onChange={e => setForm(p => ({ ...p, fromAddress: e.target.value }))} placeholder="sender@domain.com" className="input-field" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Subject *</label>
            <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Email subject line" className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Email Body *</label>
            <textarea rows={5} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="Paste the full email content here..." className="input-field resize-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">URLs (one per line)</label>
            <textarea rows={2} value={form.urls} onChange={e => setForm(p => ({ ...p, urls: e.target.value }))} placeholder="https://example.com/link1" className="input-field resize-none font-mono text-xs" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={16} />Add to Inbox</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmailInbox() {
  const [emails, setEmails] = useState([]);
  const [selected, setSelected] = useState(null);
  const [folder, setFolder] = useState('inbox');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [unread, setUnread] = useState(0);
  const toast = useToast();
  const navigate = useNavigate();

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/emails?folder=${folder}`);
      setEmails(res.data.emails || []);
      setUnread(res.data.unreadCount || 0);
    } catch { toast.error('Failed to load inbox'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEmails(); }, [folder]);

  const openEmail = async (email) => {
    try {
      const res = await api.get(`/emails/${email._id}`);
      setSelected(res.data.email);
      setEmails(prev => prev.map(e => e._id === email._id ? { ...e, isRead: true } : e));
    } catch { toast.error('Failed to load email'); }
  };

  const scanEmail = async () => {
    if (!selected) return;
    setScanning(true);
    try {
      const res = await api.post(`/emails/${selected._id}/scan`);
      toast.success('Scan complete!');
      setSelected(res.data.email);
      fetchEmails();
      // Navigate to result
      navigate(`/scan/result/${res.data.scan._id}`);
    } catch { toast.error('Scan failed'); }
    finally { setScanning(false); }
  };

  const doAction = async (emailId, action) => {
    try {
      await api.patch(`/emails/${emailId}/action`, { action });
      toast.success(`Email ${action.replace('_', ' ')} successfully`);
      setSelected(null);
      fetchEmails();
    } catch { toast.error('Action failed'); }
  };

  const addEmail = async (data) => {
    try {
      await api.post('/emails', data);
      toast.success('Email added to inbox');
      setShowCompose(false);
      fetchEmails();
    } catch { toast.error('Failed to add email'); }
  };

  const folders = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, badge: unread },
    { id: 'quarantine', label: 'Quarantine', icon: Lock },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Email Inbox</h1>
          <p className="section-subtitle">Simulated inbox — scan emails to detect phishing</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchEmails} className="btn-secondary text-sm py-2"><RefreshCw size={14} /></button>
          <button onClick={() => setShowCompose(true)} className="btn-primary text-sm py-2"><PlusCircle size={14} />Add Email</button>
        </div>
      </div>

      <div className="glass-card-dark rounded-2xl overflow-hidden flex" style={{ minHeight: '600px' }}>
        {/* Folder sidebar */}
        <div className="w-48 border-r border-dark-700/50 p-3 space-y-1 flex-shrink-0">
          {folders.map(f => (
            <button key={f.id} onClick={() => { setFolder(f.id); setSelected(null); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${folder === f.id ? 'bg-primary-600/20 border border-primary-500/30 text-white' : 'text-dark-400 hover:text-white hover:bg-dark-800'}`}>
              <f.icon size={15} />
              <span className="flex-1 text-left">{f.label}</span>
              {f.badge > 0 && <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{f.badge}</span>}
            </button>
          ))}
        </div>

        {/* Email list */}
        <div className="w-72 border-r border-dark-700/50 flex-shrink-0 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-dark-800 rounded-xl animate-pulse" />)}</div>
          ) : emails.length === 0 ? (
            <div className="p-8 text-center text-dark-500">
              <Mail size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No emails in {folder}</p>
            </div>
          ) : (
            <div>
              {emails.map(email => (
                <button key={email._id} onClick={() => openEmail(email)}
                  className={`w-full text-left p-4 border-b border-dark-800/50 transition-all hover:bg-dark-800/50 ${selected?._id === email._id ? 'bg-dark-800/70 border-l-2 border-l-primary-500' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={`text-sm truncate flex-1 ${!email.isRead ? 'font-semibold text-white' : 'text-dark-300'}`}>{email.subject}</p>
                    {email.isStarred && <Star size={12} className="text-warning-400 flex-shrink-0 fill-warning-400" />}
                  </div>
                  <p className="text-xs text-dark-500 truncate mb-2">{email.fromAddress}</p>
                  <div className="flex items-center justify-between">
                    <ClassBadge status={email.scanStatus} />
                    <span className="text-xs text-dark-600">{new Date(email.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Email reader */}
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-dark-500">
              <Mail size={48} className="mb-3 opacity-20" />
              <p>Select an email to read</p>
            </div>
          ) : (
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white mb-2">{selected.subject}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-dark-400">From: <span className="text-dark-200 font-mono">{selected.fromAddress}</span></span>
                    <span className="text-dark-600">•</span>
                    <span className="text-dark-500">{new Date(selected.receivedAt).toLocaleString()}</span>
                  </div>
                </div>
                <ClassBadge status={selected.scanStatus} />
              </div>

              {/* Action bar */}
              <div className="flex flex-wrap gap-2 mb-6 p-3 bg-dark-900/50 rounded-xl border border-dark-700/50">
                {selected.scanStatus === 'unscanned' ? (
                  <button onClick={scanEmail} disabled={scanning} className="btn-primary text-sm py-2">
                    {scanning ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Scanning...</> : <><Zap size={14} />Scan This Email</>}
                  </button>
                ) : (
                  <button onClick={() => selected.scanId && navigate(`/scan/result/${selected.scanId._id || selected.scanId}`)} className="btn-primary text-sm py-2">
                    <Eye size={14} />View Scan Result
                  </button>
                )}
                <button onClick={() => doAction(selected._id, 'quarantine')} className="btn-secondary text-sm py-2">
                  <Lock size={14} />Quarantine
                </button>
                <button onClick={() => doAction(selected._id, 'mark_safe')} className="btn-secondary text-sm py-2 text-emerald-400">
                  <CheckCircle size={14} />Mark Safe
                </button>
                <button onClick={() => doAction(selected._id, 'trash')} className="btn-secondary text-sm py-2 text-danger-400">
                  <Trash2 size={14} />Delete
                </button>
              </div>

              {/* Phishing warning banner */}
              {selected.scanStatus === 'phishing' && (
                <div className="flex items-start gap-3 p-4 mb-5 rounded-xl bg-danger-900/20 border border-danger-500/30">
                  <AlertTriangle size={18} className="text-danger-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-danger-300 font-semibold text-sm">⚠ Phishing Email Detected</p>
                    <p className="text-danger-400/70 text-xs mt-0.5">Do NOT click any links or provide any information. This email has been flagged as a phishing attempt.</p>
                  </div>
                </div>
              )}
              {selected.scanStatus === 'suspicious' && (
                <div className="flex items-start gap-3 p-4 mb-5 rounded-xl bg-warning-900/20 border border-warning-500/30">
                  <AlertTriangle size={18} className="text-warning-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-warning-300 font-semibold text-sm">Suspicious Email</p>
                    <p className="text-warning-400/70 text-xs mt-0.5">This email has suspicious characteristics. Exercise caution before clicking any links.</p>
                  </div>
                </div>
              )}

              {/* URLs */}
              {selected.urls?.length > 0 && (
                <div className="mb-4 p-3 bg-dark-900/50 rounded-xl border border-dark-700/50">
                  <p className="text-xs text-dark-400 font-semibold uppercase tracking-wider mb-2">Links in this email</p>
                  <div className="space-y-1">
                    {selected.urls.map((url, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-mono text-dark-300 bg-dark-800 rounded-lg px-3 py-2">
                        <Globe size={12} className="text-dark-500 flex-shrink-0" />
                        <span className="truncate">{url}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Body */}
              <div className="bg-dark-900/30 rounded-xl border border-dark-700/50 p-5">
                <pre className="text-dark-200 text-sm whitespace-pre-wrap font-sans leading-relaxed">{selected.body}</pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} onSubmit={addEmail} />}
    </div>
  );
}

// Missing import fix
function Globe({ size, className }) {
  return (
    <svg width={size} height={size} className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
