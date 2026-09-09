import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-md shadow-lg border transition-all duration-300 transform translate-x-0 opacity-100 ${
              toast.type === 'success' ? 'bg-green-900/80 border-green-500 text-green-100' :
              toast.type === 'error' ? 'bg-red-900/80 border-red-500 text-red-100' :
              toast.type === 'warning' ? 'bg-yellow-900/80 border-yellow-500 text-yellow-100' :
              'bg-[var(--card-bg)] border-[var(--gold-primary)] text-[var(--text-primary)]'
            }`}
            style={{ backdropFilter: 'blur(8px)' }}
          >
            {toast.type === 'success' && <CheckCircle size={20} className="text-green-400" />}
            {toast.type === 'error' && <AlertCircle size={20} className="text-red-400" />}
            {toast.type === 'warning' && <AlertTriangle size={20} className="text-yellow-400" />}
            {toast.type === 'info' && <Info size={20} className="text-[var(--gold-primary)]" />}
            
            <p className="text-sm font-medium mr-4">{toast.message}</p>
            
            <button onClick={() => removeToast(toast.id)} className="ml-auto opacity-70 hover:opacity-100 transition-opacity">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
