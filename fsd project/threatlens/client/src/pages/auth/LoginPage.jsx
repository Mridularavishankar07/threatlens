import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen cyber-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-cyber-500 flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white">ThreatLens</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-dark-400 mt-1">Sign in to your security dashboard</p>
        </div>

        {/* Demo creds */}
        <div className="glass-card p-3 mb-6 rounded-xl">
          <p className="text-xs text-dark-400 text-center font-medium mb-2">Demo Credentials</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setForm({ email: 'arjun@student.college.edu', password: 'User@123' })}
              className="text-xs bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-lg px-3 py-2 transition-colors text-left">
              <span className="block text-primary-400 font-semibold">User</span>
              arjun@student...
            </button>
            <button type="button" onClick={() => setForm({ email: 'admin@threatlens.io', password: 'Admin@123' })}
              className="text-xs bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-lg px-3 py-2 transition-colors text-left">
              <span className="block text-danger-400 font-semibold">Admin</span>
              admin@threatlens...
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="glass-card-dark p-8 rounded-2xl">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 rounded-xl bg-danger-900/20 border border-danger-500/30 text-danger-300 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="input-field pl-11"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Your password"
                  className="input-field pl-11 pr-11"
                  required
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-dark-400 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
