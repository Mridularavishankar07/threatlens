import { useState, useEffect } from 'react';
import { Settings, Shield, Plus, Trash2, Lock, CheckCircle, X, Globe, Mail } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

function BlocklistTab() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listType, setListType] = useState('blocklist');
  const [form, setForm] = useState({ type: 'domain', value: '', listType: 'blocklist', reason: '' });
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const toast = useToast();

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/blocklist?listType=${listType}${search ? `&search=${search}` : ''}`);
      setEntries(res.data.entries || []);
    } catch { toast.error('Failed to load list'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEntries(); }, [listType, search]);

  const addEntry = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post('/admin/blocklist', { ...form, listType });
      toast.success('Entry added');
      setShowForm(false);
      setForm({ type: 'domain', value: '', listType: 'blocklist', reason: '' });
      fetchEntries();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setAdding(false); }
  };

  const removeEntry = async (id) => {
    try {
      await api.delete(`/admin/blocklist/${id}`);
      toast.success('Entry removed');
      fetchEntries();
    } catch { toast.error('Failed'); }
  };

  const TYPE_ICONS = { domain: <Globe size={12} />, email: <Mail size={12} />, ip: '🌐', url: '🔗' };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex rounded-xl overflow-hidden border border-dark-700">
          {['blocklist', 'allowlist'].map(t => (
            <button key={t} onClick={() => setListType(t)}
              className={`px-4 py-2 text-sm font-medium transition-all ${listType === t ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-400 hover:text-white'}`}>
              {t === 'blocklist' ? '🚫 Blocklist' : '✅ Allowlist'}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input-field py-2 text-sm flex-1 max-w-xs" />
        <button onClick={() => setShowForm(p => !p)} className="btn-primary text-sm py-2 ml-auto"><Plus size={14} />Add Entry</button>
      </div>

      {showForm && (
        <form onSubmit={addEntry} className="bg-dark-800/50 border border-dark-700 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-dark-400 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="input-field text-sm py-2">
                <option value="domain">Domain</option>
                <option value="email">Email</option>
                <option value="ip">IP Address</option>
                <option value="url">URL</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-dark-400 mb-1">Value *</label>
              <input value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder="e.g. malicious-domain.tk" className="input-field text-sm py-2" required />
            </div>
          </div>
          <div>
            <label className="block text-xs text-dark-400 mb-1">Reason</label>
            <input value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="Why is this blocked?" className="input-field text-sm py-2" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm py-1.5 flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={adding} className="btn-primary text-sm py-1.5 flex-1 justify-center">{adding ? 'Adding...' : 'Add'}</button>
          </div>
        </form>
      )}

      <div className="glass-card-dark rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-dark-800 rounded animate-pulse" />)}</div>
        ) : entries.length === 0 ? (
          <div className="p-10 text-center text-dark-500 text-sm">No entries in {listType}</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Value</th>
                <th>Reason</th>
                <th>Hits</th>
                <th>Added By</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e._id}>
                  <td><span className="text-xs bg-dark-800 border border-dark-700 px-2 py-0.5 rounded-full text-dark-300 font-mono">{e.type}</span></td>
                  <td className="font-mono text-sm text-dark-200">{e.value}</td>
                  <td className="text-dark-400 text-xs max-w-[160px] truncate">{e.reason || '—'}</td>
                  <td className="text-dark-300 text-sm font-semibold">{e.hitCount}</td>
                  <td className="text-dark-400 text-xs">{e.addedBy?.name || 'Admin'}</td>
                  <td className="text-dark-600 text-xs">{new Date(e.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => removeEntry(e._id)} className="text-dark-500 hover:text-danger-400 p-1.5 rounded-lg transition-colors"><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PolicyTab() {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api.get('/admin/policy').then(res => setPolicy(res.data.policy)).catch(() => toast.error('Failed to load policy')).finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/admin/policy', policy);
      setPolicy(res.data.policy);
      toast.success('Policy saved');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="h-64 bg-dark-800 rounded-2xl animate-pulse" />;
  if (!policy) return null;

  return (
    <form onSubmit={save} className="space-y-6">
      {/* Quarantine */}
      <div className="glass-card-dark rounded-2xl p-6">
        <h4 className="text-white font-semibold mb-4 flex items-center gap-2"><Lock size={14} className="text-warning-400" />Auto-Quarantine</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-200 text-sm font-medium">Auto-quarantine high-risk emails</p>
              <p className="text-dark-500 text-xs">Automatically quarantine emails above the threshold</p>
            </div>
            <button type="button" onClick={() => setPolicy(p => ({ ...p, autoQuarantineEnabled: !p.autoQuarantineEnabled }))}
              className={`w-12 h-6 rounded-full transition-all ${policy.autoQuarantineEnabled ? 'bg-primary-500' : 'bg-dark-700'}`}>
              <div className={`w-5 h-5 rounded-full bg-white transition-all mx-0.5 ${policy.autoQuarantineEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Quarantine Threshold: <span className="text-primary-400 font-bold">{policy.autoQuarantineThreshold}</span>/100</label>
            <input type="range" min={50} max={95} step={5} value={policy.autoQuarantineThreshold}
              onChange={e => setPolicy(p => ({ ...p, autoQuarantineThreshold: +e.target.value }))}
              className="w-full accent-primary-500" />
            <div className="flex justify-between text-xs text-dark-600 mt-1"><span>50</span><span>95</span></div>
          </div>
        </div>
      </div>

      {/* Risk thresholds */}
      <div className="glass-card-dark rounded-2xl p-6">
        <h4 className="text-white font-semibold mb-4 flex items-center gap-2"><Shield size={14} className="text-primary-400" />Risk Classification Thresholds</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-dark-300 mb-2">Safe → Suspicious boundary: <span className="text-emerald-400 font-bold">{policy.riskThresholds?.safe}</span></label>
            <input type="range" min={15} max={40} step={1} value={policy.riskThresholds?.safe || 29}
              onChange={e => setPolicy(p => ({ ...p, riskThresholds: { ...p.riskThresholds, safe: +e.target.value } }))}
              className="w-full accent-emerald-500" />
          </div>
          <div>
            <label className="block text-sm text-dark-300 mb-2">Suspicious → Phishing boundary: <span className="text-warning-400 font-bold">{policy.riskThresholds?.suspicious}</span></label>
            <input type="range" min={40} max={80} step={1} value={policy.riskThresholds?.suspicious || 59}
              onChange={e => setPolicy(p => ({ ...p, riskThresholds: { ...p.riskThresholds, suspicious: +e.target.value } }))}
              className="w-full accent-warning-500" />
          </div>
        </div>
      </div>

      {/* Analysis weights */}
      <div className="glass-card-dark rounded-2xl p-6">
        <h4 className="text-white font-semibold mb-4">Analysis Module Weights</h4>
        <p className="text-dark-500 text-xs mb-4">Total should equal 100. Adjust to tune detection sensitivity.</p>
        <div className="space-y-3">
          {Object.entries(policy.analysisWeights || {}).map(([key, val]) => (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-dark-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="text-white font-bold">{val}%</span>
              </div>
              <input type="range" min={5} max={40} step={1} value={val}
                onChange={e => setPolicy(p => ({ ...p, analysisWeights: { ...p.analysisWeights, [key]: +e.target.value } }))}
                className="w-full accent-primary-500" />
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={saving} className="btn-primary py-3 px-8">
        {saving ? 'Saving...' : <><CheckCircle size={16} />Save Policy</>}
      </button>
    </form>
  );
}

export default function AdminSettings() {
  const [tab, setTab] = useState('blocklist');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title flex items-center gap-2"><Settings size={22} className="text-primary-400" />Security Settings</h1>
        <p className="section-subtitle">Blocklist, allowlist, and security policy configuration</p>
      </div>

      <div className="flex gap-3 border-b border-dark-800 pb-1">
        {[
          { id: 'blocklist', label: '🚫 Blocklist & Allowlist' },
          { id: 'policy', label: '⚙️ Security Policy' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-sm font-medium px-4 py-2 rounded-t-lg transition-all border-b-2 -mb-[1px]
              ${tab === t.id ? 'text-white border-primary-500' : 'text-dark-400 border-transparent hover:text-dark-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'blocklist' ? <BlocklistTab /> : <PolicyTab />}
    </div>
  );
}
