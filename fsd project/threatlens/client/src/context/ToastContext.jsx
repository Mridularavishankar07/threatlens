import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const icons = {
  success: <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />,
  error: <XCircle size={18} className="text-danger-400 flex-shrink-0" />,
  warning: <AlertTriangle size={18} className="text-warning-400 flex-shrink-0" />,
  info: <Info size={18} className="text-primary-400 flex-shrink-0" />,
};

const bgColors = {
  success: 'border-emerald-500/30 bg-emerald-900/20',
  error: 'border-danger-500/30 bg-danger-900/20',
  warning: 'border-warning-500/30 bg-warning-900/20',
  info: 'border-primary-500/30 bg-primary-900/20',
};

function ToastItem({ toast, onRemove }) {
  return (
    <div className={`toast-enter flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md max-w-sm w-full ${bgColors[toast.type]}`}>
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        {toast.title && <p className="font-semibold text-white text-sm">{toast.title}</p>}
        <p className="text-dark-300 text-sm mt-0.5">{toast.message}</p>
      </div>
      <button onClick={() => onRemove(toast.id)} className="text-dark-400 hover:text-white transition-colors flex-shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
