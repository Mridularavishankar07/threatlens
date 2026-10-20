import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Shield, LayoutDashboard, Users, Mail, BarChart3,
  GraduationCap, FileText, LogOut, AlertTriangle,
  Activity, Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/analytics', icon: BarChart3, label: 'Threat Analytics' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/scans', icon: Mail, label: 'Incident Queue' },
  { to: '/admin/reports', icon: FileText, label: 'Reports' },
  { to: '/admin/simulations', icon: GraduationCap, label: 'Simulations' },
  { to: '/admin/audit-logs', icon: Activity, label: 'Audit Logs' },
  { to: '/admin/settings', icon: Settings, label: 'Security Settings' },
];

function AdminLayout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <div className="min-h-screen cyber-bg flex">
      {/* Admin Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-dark-900/95 border-r border-dark-700/50 backdrop-blur-xl flex flex-col sticky top-0 h-screen overflow-y-auto">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-dark-700/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-danger-500 to-primary-600 flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-white">ThreatLens</span>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 bg-danger-400 rounded-full" />
                <span className="text-danger-400 text-xs font-medium">Security Command</span>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Badge */}
        <div className="px-4 py-3 border-b border-dark-700/50 flex-shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-danger-900/20 border border-danger-500/20">
            <AlertTriangle size={16} className="text-danger-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-danger-400 text-xs">Administrator</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {adminNav.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}>
              {({ isActive }) => (
                <div className={isActive ? 'nav-item-active' : 'nav-item'}>
                  <Icon size={18} className="flex-shrink-0" />
                  <span>{label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-dark-700/50 space-y-1 flex-shrink-0">
          <NavLink to="/dashboard">
            <div className="nav-item text-cyber-400 mb-1">
              <Shield size={18} />
              <span>User View</span>
            </div>
          </NavLink>
          <button
            onClick={handleLogout}
            className="nav-item w-full text-danger-400 hover:bg-danger-900/20"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto animate-fade-in min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
