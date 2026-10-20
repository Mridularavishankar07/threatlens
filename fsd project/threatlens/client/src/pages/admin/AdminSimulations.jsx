import { useState, useEffect } from 'react';
import { GraduationCap, Plus, Pencil, Trash2, CheckCircle, X, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const CATEGORIES = ['banking-scam','fake-job-offer','password-reset','delivery-scam','college-notice','scholarship-scam','account-suspension','payment-request'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const ACTIONS = ['report', 'ignore', 'open-link', 'reply'];

const defaultForm = {
  title: '', category: 'banking-scam', difficulty: 'beginner',
  emailContent: { sender: '', subject: '', body: '', hasAttachment: false, attachmentName: '' },
  correctAction: 'report', explanation: '', points: 15,
  warningSigns: [''], options: [
    { key: 'A', label: '', action: 'open-link' },
    { key: 'B', label: '', action: 'report' },
    { key: 'C', label: '', action: 'ignore' },
    { key: 'D', label: '', action: 'reply' },
  ]
};

const DIFF_COLORS = { beginner: 'text-emerald-400', intermediate: 'text-warning-400', advanced: 'text-danger-400' };

export default function AdminSimulations() {
  const [sims, setSims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetchSims = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/simulations');
      setSims(res.data.simulations || []);
    } catch { toast.error('Failed to load simulations'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSims(); }, []);

  const openCreate = () => { setEditing(null); setForm(defaultForm); setShowModal(true); };
  const openEdit = (sim) => {
    setEditing(sim._id);
    setForm({
      title: sim.title, category: sim.category, difficulty: sim.difficulty,
      emailContent: sim.emailContent || defaultForm.emailContent,
      correctAction: sim.correctAction, explanation: sim.explanation, points: sim.points,
      warningSigns: sim.warningSigns?.length ? sim.warningSigns : [''],
      options: sim.options?.length ? sim.options : defaultForm.options
    });
    setShowModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        warningSigns: form.warningSigns.filter(Boolean),
        options: form.options.filter(o => o.label)
      };
      if (editing) {
        await api.put(`/admin/simulations/${editing}`, payload);
        toast.success('Simulation updated');
      } else {
        await api.post('/admin/simulations', payload);
        toast.success('Simulation created');
      }
      setShowModal(false);
      fetchSims();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const deleteSim = async (id) => {
    if (!confirm('Delete this simulation?')) return;
    try {
      await api.delete(`/admin/simulations/${id}`);
      toast.success('Simulation deleted');
      fetchSims();
    } catch { toast.error('Delete failed'); }
  };

  const setWarnSign = (i, v) => setForm(p => ({ ...p, warningSigns: p.warningSigns.map((w, idx) => idx === i ? v : w) }));
  const addWarnSign = () => setForm(p => ({ ...p, warningSigns: [...p.warningSigns, ''] }));
  const removeWarnSign = (i) => setForm(p => ({ ...p, warningSigns: p.warningSigns.filter((_, idx) => idx !== i) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title flex items-center gap-2"><GraduationCap size={22} className="text-primary-400" />Training Simulations</h1>
          <p className="section-subtitle">{sims.length} phishing scenarios</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm py-2"><Plus size={14} />New Simulation</button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-dark-800 rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {sims.map(sim => (
            <div key={sim._id} className="glass-card-dark rounded-2xl p-5 border border-dark-700/50">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm truncate">{sim.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-dark-500 text-xs">{sim.category}</span>
                    <span className={`text-xs font-semibold ${DIFF_COLORS[sim.difficulty]}`}>{sim.difficulty}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(sim)} className="p-2 text-dark-400 hover:text-primary-400 hover:bg-primary-900/20 rounded-lg transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteSim(sim._id)} className="p-2 text-dark-400 hover:text-danger-400 hover:bg-danger-900/20 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="text-xs text-dark-500 space-y-1">
                <p>Correct: <span className="text-emerald-400 font-medium">{sim.correctAction}</span></p>
                <p>Points: <span className="text-warning-400 font-medium">{sim.points}</span></p>
                <p>Created by: <span className="text-dark-300">{sim.createdBy?.name || 'Admin'}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card-dark rounded-2xl w-full max-w-2xl my-8 animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-dark-700/50">
              <h3 className="text-white font-bold text-lg">{editing ? 'Edit' : 'Create'} Simulation</h3>
              <button onClick={() => setShowModal(false)} className="text-dark-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Title *</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Category *</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input-field">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Difficulty</label>
                  <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))} className="input-field">
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Correct Action *</label>
                  <select value={form.correctAction} onChange={e => setForm(p => ({ ...p, correctAction: e.target.value }))} className="input-field">
                    {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Points</label>
                  <input type="number" min={5} max={50} value={form.points} onChange={e => setForm(p => ({ ...p, points: +e.target.value }))} className="input-field" />
                </div>
              </div>

              {/* Email content */}
              <div className="border border-dark-700 rounded-xl p-4 space-y-3">
                <p className="text-white font-semibold text-sm">Email Content</p>
                <input value={form.emailContent.sender} onChange={e => setForm(p => ({ ...p, emailContent: { ...p.emailContent, sender: e.target.value } }))} placeholder="Sender email" className="input-field text-sm" />
                <input value={form.emailContent.subject} onChange={e => setForm(p => ({ ...p, emailContent: { ...p.emailContent, subject: e.target.value } }))} placeholder="Subject" className="input-field text-sm" />
                <textarea rows={4} value={form.emailContent.body} onChange={e => setForm(p => ({ ...p, emailContent: { ...p.emailContent, body: e.target.value } }))} placeholder="Email body" className="input-field text-sm resize-none" />
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Explanation *</label>
                <textarea rows={3} value={form.explanation} onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))} className="input-field resize-none text-sm" required />
              </div>

              {/* Warning signs */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Warning Signs</label>
                {form.warningSigns.map((w, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={w} onChange={e => setWarnSign(i, e.target.value)} placeholder={`Warning sign ${i + 1}`} className="input-field text-sm flex-1" />
                    <button type="button" onClick={() => removeWarnSign(i)} className="text-dark-400 hover:text-danger-400 p-2"><X size={14} /></button>
                  </div>
                ))}
                <button type="button" onClick={addWarnSign} className="text-primary-400 text-xs hover:text-primary-300">+ Add warning sign</button>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center text-sm">
                  {saving ? 'Saving...' : (editing ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
