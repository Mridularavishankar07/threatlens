import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Send, Zap, AlertCircle, Link2, Paperclip,
  ChevronDown, ChevronUp, X, Plus, Shield
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const QUICK_SAMPLES = [
  {
    label: '🚨 SBI Phishing',
    sender: 'security-alert@sbi-banking-secure.tk',
    subject: 'URGENT: Your SBI Account Has Been Suspended',
    body: `Dear Valued Customer,\n\nWe have detected suspicious activity on your State Bank of India account. Your account has been temporarily suspended.\n\nTo reactivate immediately, verify your credentials within 24 hours:\nhttp://sbi-secure-verify.tk/login\n\nProvide: Account number, Password, OTP, Debit card details.\n\nFailure to respond will result in permanent closure.\n\nSBI Security Team`,
    urls: ['http://sbi-secure-verify.tk/login']
  },
  {
    label: '✅ Legit Library Email',
    sender: 'library@university.edu',
    subject: 'Library Membership Renewal Confirmation',
    body: `Dear Student,\n\nYour college library membership has been successfully renewed for the academic year 2024-25.\n\nMembership ID: LIB-2024-4872\nValid until: May 31, 2025\n\nVisit us at: https://library.university.edu/portal\n\nLibrary Administration`,
    urls: ['https://library.university.edu/portal']
  },
  {
    label: '⚠️ Fake Job Offer',
    sender: 'hr@jobs-global-hiring.xyz',
    subject: 'Congratulations! ₹50,000/month WFH Position',
    body: `Dear Candidate,\n\nCongratulations! You have been selected for a Work From Home opportunity.\n\nSalary: ₹50,000/month, only 2-3 hours/day.\n\nPay a refundable registration fee of ₹2,999 and provide Aadhaar and PAN card details.\n\nSend payment: UPI ID: hiring@scam — Limited seats!`,
    urls: []
  },
];

export default function ScanEmail() {
  const [form, setForm] = useState({
    sender: '', subject: '', emailBody: '', attachmentName: ''
  });
  const [urls, setUrls] = useState(['']);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const loadSample = (sample) => {
    setError('');
    setForm({ sender: sample.sender, subject: sample.subject, emailBody: sample.body, attachmentName: '' });
    setUrls(sample.urls.length > 0 ? sample.urls : ['']);
    if (sample.urls.length > 0) {
      setShowAdvanced(true);
    }
    toast.info(`Loaded "${sample.label}" sample template!`);
  };

  const addUrl = () => setUrls(p => [...p, '']);
  const removeUrl = (i) => setUrls(p => p.filter((_, idx) => idx !== i));
  const updateUrl = (i, val) => setUrls(p => p.map((u, idx) => idx === i ? val : u));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.subject?.trim() || !form.emailBody?.trim()) {
      const msg = 'Please fill in Subject and Email Body.';
      setError(msg);
      toast.error(msg);
      return;
    }
    setLoading(true);
    try {
      const cleanUrls = urls.map(u => u.trim()).filter(Boolean);
      const res = await api.post('/scans', {
        sender: form.sender?.trim() || 'unknown@unverified.email',
        subject: form.subject.trim(),
        emailBody: form.emailBody.trim(),
        urls: cleanUrls,
        attachmentName: form.attachmentName?.trim() || ''
      });
      toast.success('Email analyzed successfully!');
      navigate(`/scan/result/${res.data.scan._id}`);
    } catch (err) {
      const errorMsg = err.response?.data?.details
        ? err.response.data.details.map(d => d.message).join('. ')
        : (err.response?.data?.error || err.message || 'Analysis failed. Please try again.');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="section-title flex items-center gap-2">
          <Shield size={24} className="text-primary-400" /> Scan Email
        </h1>
        <p className="section-subtitle">Paste an email below. Our 5-module AI engine will analyze it and explain every risk indicator.</p>
      </div>

      {/* Quick samples */}
      <div>
        <p className="text-xs text-dark-400 font-semibold uppercase tracking-wider mb-3">Try a sample email</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_SAMPLES.map(s => (
            <button
              key={s.label}
              type="button"
              onClick={() => loadSample(s)}
              className="text-xs bg-dark-800 hover:bg-dark-700 active:scale-95 border border-dark-700 hover:border-dark-600 text-dark-300 hover:text-white px-3 py-2 rounded-lg transition-all cursor-pointer">
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="glass-card-dark rounded-2xl p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-danger-900/20 border border-danger-500/30 text-danger-300 text-sm">
            <AlertCircle size={16} className="flex-shrink-0" />{error}
          </div>
        )}

        {/* Sender */}
        <div>
          <label className="block text-sm font-semibold text-dark-200 mb-2">
            Sender Email Address <span className="text-dark-500 font-normal text-xs">(optional if analyzing body only)</span>
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              value={form.sender}
              onChange={e => setForm(p => ({ ...p, sender: e.target.value }))}
              placeholder="sender@example.com (optional)"
              className="input-field pl-11"
            />
          </div>
          <p className="text-xs text-dark-500 mt-1">The From: address from email headers (leave blank to analyze content only)</p>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-semibold text-dark-200 mb-2">
            Subject Line <span className="text-danger-400">*</span>
          </label>
          <input value={form.subject}
            onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
            placeholder="Email subject line"
            className="input-field" required />
        </div>

        {/* Email body */}
        <div>
          <label className="block text-sm font-semibold text-dark-200 mb-2">
            Email Body <span className="text-danger-400">*</span>
          </label>
          <textarea rows={8} value={form.emailBody}
            onChange={e => setForm(p => ({ ...p, emailBody: e.target.value }))}
            placeholder="Paste the full email content here..."
            className="input-field resize-y font-mono text-sm" required />
          <div className="flex justify-between mt-1">
            <p className="text-xs text-dark-500">Include the full email text for best analysis accuracy</p>
            <p className="text-xs text-dark-600">{form.emailBody.length.toLocaleString()} chars</p>
          </div>
        </div>

        {/* Advanced options */}
        <div>
          <button type="button" onClick={() => setShowAdvanced(p => !p)}
            className="flex items-center gap-2 text-sm text-dark-400 hover:text-dark-200 transition-colors">
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Advanced options (URLs, attachment)
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4 p-4 bg-dark-900/50 rounded-xl border border-dark-700/50">
              {/* URLs */}
              <div>
                <label className="block text-sm font-semibold text-dark-200 mb-2 flex items-center gap-1.5">
                  <Link2 size={14} /> URLs found in email
                </label>
                <div className="space-y-2">
                  {urls.map((url, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={url} onChange={e => updateUrl(i, e.target.value)}
                        placeholder="https://example.com/suspicious-link"
                        className="input-field font-mono text-xs flex-1" />
                      {urls.length > 1 && (
                        <button type="button" onClick={() => removeUrl(i)} className="text-dark-400 hover:text-danger-400 transition-colors p-2">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addUrl} className="text-primary-400 text-xs flex items-center gap-1 hover:text-primary-300">
                    <Plus size={12} /> Add URL
                  </button>
                </div>
              </div>

              {/* Attachment */}
              <div>
                <label className="block text-sm font-semibold text-dark-200 mb-2 flex items-center gap-1.5">
                  <Paperclip size={14} /> Attachment filename (if any)
                </label>
                <input value={form.attachmentName}
                  onChange={e => setForm(p => ({ ...p, attachmentName: e.target.value }))}
                  placeholder="invoice.pdf or document.exe"
                  className="input-field font-mono text-sm" />
                <p className="text-xs text-dark-500 mt-1">Enter the filename. Dangerous extensions like .exe, .bat, .zip increase risk score.</p>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4 text-base">
          {loading ? (
            <span className="flex items-center gap-3">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing email...
            </span>
          ) : (
            <>
              <Zap size={18} />
              Analyze Email
            </>
          )}
        </button>
      </form>

      {/* How it works */}
      <div className="glass-card p-5 rounded-2xl">
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2"><Zap size={14} className="text-primary-400" />How the analysis works</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { n: '1', label: 'Sender Analysis', desc: 'Domain, TLD, typosquatting' },
            { n: '2', label: 'URL Analysis', desc: 'Shorteners, IP URLs, TLDs' },
            { n: '3', label: 'Content Analysis', desc: 'Urgency & fear language' },
            { n: '4', label: 'Social Engineering', desc: 'Authority, scarcity, pretexting' },
            { n: '5', label: 'Credential/Financial', desc: 'Harvesting & fraud patterns' },
          ].map(m => (
            <div key={m.n} className="text-center">
              <div className="w-8 h-8 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-300 text-xs font-bold flex items-center justify-center mx-auto mb-2">{m.n}</div>
              <p className="text-dark-200 text-xs font-semibold">{m.label}</p>
              <p className="text-dark-500 text-xs mt-0.5">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
