import { useState } from 'react';
import { User, Mail, Lock, Shield, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  const saveName = async (e) => {
    e.preventDefault();
    if (!name.trim() || name === user?.name) return;
    setSavingName(true);
    try {
      const res = await api.put('/auth/profile', { name });
      updateUser({ name: res.data.user.name });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally { setSavingName(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPassword !== pwForm.confirm) return setPwError('Passwords do not match.');
    if (pwForm.newPassword.length < 6) return setPwError('Password must be at least 6 characters.');
    setSavingPw(true);
    try {
      await api.put('/auth/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setPwError(err.response?.data?.error || 'Password change failed');
    } finally { setSavingPw(false); }
  };

  const scoreColor = user?.securityScore >= 75 ? 'text-emerald-400' : user?.securityScore >= 50 ? 'text-warning-400' : 'text-danger-400';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="section-title">Profile</h1>
        <p className="section-subtitle">Manage your account settings</p>
      </div>

      {/* Account overview */}
      <div className="glass-card-dark rounded-2xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-cyber-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-black text-2xl">{user?.name?.[0]?.toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-white text-xl font-bold">{user?.name}</h2>
          <p className="text-dark-400 text-sm">{user?.email}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
              ${user?.role === 'admin' ? 'bg-danger-500/20 text-danger-300 border border-danger-500/30' : 'bg-primary-500/20 text-primary-300 border border-primary-500/30'}`}>
              {user?.role}
            </span>
            <span className="text-dark-500 text-xs">Member since {new Date(user?.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="text-center">
          <div className={`text-3xl font-black ${scoreColor}`}>{user?.securityScore}</div>
          <div className="text-dark-500 text-xs">Security Score</div>
        </div>
      </div>

      {/* Update name */}
      <div className="glass-card-dark rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><User size={16} className="text-primary-400" />Personal Information</h3>
        <form onSubmit={saveName} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Display Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input-field" minLength={2} maxLength={50} />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
              <input value={user?.email} disabled className="input-field pl-10 opacity-50 cursor-not-allowed" />
            </div>
            <p className="text-xs text-dark-600 mt-1">Email cannot be changed</p>
          </div>
          <button type="submit" disabled={savingName || name === user?.name} className="btn-primary text-sm py-2.5 disabled:opacity-40">
            {savingName ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="glass-card-dark rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Lock size={16} className="text-warning-400" />Change Password</h3>
        {pwError && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-danger-900/20 border border-danger-500/30 text-danger-300 text-sm">
            <AlertCircle size={14} />{pwError}
          </div>
        )}
        <form onSubmit={changePassword} className="space-y-4">
          {[
            { key: 'currentPassword', label: 'Current Password', placeholder: 'Your current password' },
            { key: 'newPassword', label: 'New Password', placeholder: 'Min. 6 characters' },
            { key: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-dark-300 mb-2">{f.label}</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={pwForm[f.key]}
                  onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} className="input-field pr-11" required />
                {f.key === 'confirm' && (
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
                {f.key === 'confirm' && pwForm.confirm && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    {pwForm.newPassword === pwForm.confirm
                      ? <CheckCircle size={14} className="text-emerald-400" />
                      : <AlertCircle size={14} className="text-danger-400" />}
                  </div>
                )}
              </div>
            </div>
          ))}
          <button type="submit" disabled={savingPw} className="btn-primary text-sm py-2.5">
            {savingPw ? 'Changing...' : <><Lock size={14} />Change Password</>}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="glass-card-dark rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Shield size={16} className="text-cyber-400" />Account Details</h3>
        <dl className="space-y-3">
          {[
            { label: 'Account ID', value: user?._id?.slice(-8) || '—' },
            { label: 'Role', value: user?.role || '—' },
            { label: 'Last Login', value: user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A' },
            { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' },
            { label: 'Training Completed', value: `${user?.trainingCompleted?.length || 0} modules` },
          ].map(item => (
            <div key={item.label} className="flex justify-between py-2 border-b border-dark-800/50">
              <dt className="text-dark-500 text-sm">{item.label}</dt>
              <dd className="text-dark-200 text-sm font-medium font-mono">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
