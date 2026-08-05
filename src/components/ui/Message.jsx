import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export const toast = {
  success: (msg) => document.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'success', msg } })),
  error: (msg) => document.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'error', msg } })),
  info: (msg) => document.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'info', msg } })),
};

export default function MessageContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, ...e.detail }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };

    document.addEventListener('app-toast', handleToast);
    return () => document.removeEventListener('app-toast', handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 999999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none'
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--glass-border)',
          borderLeft: `4px solid ${t.type === 'error' ? 'var(--danger-text)' : t.type === 'success' ? 'var(--success-text)' : 'var(--accent-primary)'}`,
          padding: '14px 18px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.05)',
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          minWidth: '280px',
          color: 'var(--text-primary)',
          pointerEvents: 'auto'
        }}>
          {t.type === 'success' && <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '6px', borderRadius: '50%', display: 'flex' }}><CheckCircle size={20} color="var(--success-text)" /></div>}
          {t.type === 'error' && <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '6px', borderRadius: '50%', display: 'flex' }}><AlertCircle size={20} color="var(--danger-text)" /></div>}
          {t.type === 'info' && <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '6px', borderRadius: '50%', display: 'flex' }}><Info size={20} color="var(--accent-primary)" /></div>}
          <span style={{ fontSize: '0.95rem', fontWeight: 500, flex: 1, textShadow: '0 1px 2px rgba(255,255,255,0.1)' }}>{t.msg}</span>
          <button 
            type="button" 
            onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '4px', 
              display: 'flex', 
              color: 'var(--text-muted)',
              outline: 'none'
            }}
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
