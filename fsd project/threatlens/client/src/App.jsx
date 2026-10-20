import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Layouts
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './layouts/AuthLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// User Pages
import Dashboard from './pages/user/Dashboard';
import EmailInbox from './pages/user/EmailInbox';
import ScanEmail from './pages/user/ScanEmail';
import ScanResult from './pages/user/ScanResult';
import ScanHistory from './pages/user/ScanHistory';
import TrainingCenter from './pages/user/TrainingCenter';
import SimulationPage from './pages/user/SimulationPage';
import SecurityScore from './pages/user/SecurityScore';
import ProfilePage from './pages/user/ProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminScans from './pages/admin/AdminScans';
import AdminSimulations from './pages/admin/AdminSimulations';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminReports from './pages/admin/AdminReports';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminSettings from './pages/admin/AdminSettings';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* User Protected Routes */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inbox" element={<EmailInbox />} />
              <Route path="/scan" element={<ScanEmail />} />
              <Route path="/scan/result/:id" element={<ScanResult />} />
              <Route path="/history" element={<ScanHistory />} />
              <Route path="/training" element={<TrainingCenter />} />
              <Route path="/training/:id" element={<SimulationPage />} />
              <Route path="/security-score" element={<SecurityScore />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Admin Protected Routes */}
            <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/scans" element={<AdminScans />} />
              <Route path="/admin/simulations" element={<AdminSimulations />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
}

export default App;
