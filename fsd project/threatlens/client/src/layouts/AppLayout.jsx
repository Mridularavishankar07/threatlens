import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Shield, LayoutDashboard, Mail, History, GraduationCap,
  Star, User, LogOut, Menu, X, ChevronRight, Zap,
  Inbox, Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inbox', icon: Inbox, label: 'Email Inbox' },
  { to: '/scan', icon: Mail, label: 'Scan Email' },
  { to: '/history', icon: History, label: 'Scan History' },
  { to: '/training', icon: GraduationCap, label: 'Training Center' },
  { to: '/security-score', icon: Star, label: 'Security Score' },
  { to: '/profile', icon: User, label: 'Profile' },
];

function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const scoreColor = (s) => s >= 75 ? 'from-emerald-500 to-cyber-500' : s >= 50 ? 'from-warning-500 to-primary-500' : 'from-danger-500 to-warning-500';

  return (
    <aside className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} bg-dark-900/95 border-r border-dark-700/50 backdrop-blur-xl`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-dark-700/50">
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-cyber-500 flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-dark-900" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-bold text-white text-lg tracking-tight">ThreatLens</span>
            <p className="text-dark-400 text-xs">Cyber Platform</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto text-dark-400 hover:text-white transition-colors p-1"
        >
          {collapsed ? <ChevronRight size={16} /> : <X size={16} />}
        </button>
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="px-4 py-4 border-b border-dark-700/50">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${scoreColor(user?.securityScore || 50)} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white font-bold text-sm">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium text-sm truncate">{user?.name}</p>
              <p className="text-dark-400 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-dark-400">Security Score</span>
              <span className="text-primary-400 font-semibold">{user?.securityScore || 50}/100</span>
            </div>
            <div className="progress-bar">
              <div
                className={`progress-fill bg-gradient-to-r ${scoreColor(user?.securityScore || 50)}`}
                style={{ width: `${user?.securityScore || 50}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} title={collapsed ? label : ''}>
            {({ isActive }) => (
              <div className={isActive ? 'nav-item-active' : 'nav-item'}>
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
                {isActive && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-dark-700/50 space-y-1">
        {!collapsed && (
          <Link to="/scan" className="glass-card p-3 mb-3 rounded-xl block hover:border-primary-500/50 transition-all cursor-pointer group">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap size={13} className="text-warning-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-white group-hover:text-primary-300">Quick Scan</span>
            </div>
            <p className="text-dark-400 text-xs leading-relaxed">Paste any email to detect phishing instantly</p>
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="nav-item w-full text-danger-400 hover:text-danger-300 hover:bg-danger-900/20"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen cyber-bg">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed top-0 left-0 h-full z-40 lg:hidden transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
      </div>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-4 px-4 py-4 bg-dark-900/90 border-b border-dark-700/50 sticky top-0 z-20 backdrop-blur-xl">
          <button onClick={() => setMobileOpen(true)} className="text-dark-400 hover:text-white transition-colors">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-primary-400" />
            <span className="font-bold text-white">ThreatLens</span>
          </div>
        </div>

        <div className="p-4 md:p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
