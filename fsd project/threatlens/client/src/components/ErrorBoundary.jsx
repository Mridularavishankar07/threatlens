import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ThreatLens UI caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen cyber-bg flex items-center justify-center p-6">
          <div className="glass-card-dark max-w-lg w-full p-8 rounded-2xl text-center space-y-4 border border-danger-500/30">
            <div className="w-14 h-14 bg-danger-900/30 border border-danger-500/40 rounded-2xl flex items-center justify-center mx-auto text-danger-400">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-xl font-bold text-white">Something went wrong</h2>
            <p className="text-dark-400 text-sm">
              An unexpected interface error occurred. You can reload the page or return to the dashboard.
            </p>
            {this.state.error && (
              <div className="p-3 bg-dark-900/80 rounded-xl text-left border border-dark-700/50">
                <p className="text-xs font-mono text-danger-400 truncate">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <RefreshCw size={14} /> Reload Page
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = '/dashboard';
                }}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Home size={14} /> Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
