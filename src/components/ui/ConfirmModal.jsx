import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Xác nhận', cancelText = 'Hủy' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '400px', width: '90%', position: 'relative' }}>
        <button className="btn-icon close-btn" onClick={onCancel} style={{ position: 'absolute', top: '15px', right: '15px' }}>
          <X size={20} />
        </button>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px 10px 10px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '50%', marginBottom: '16px', color: 'var(--danger-text)' }}>
            <AlertTriangle size={32} />
          </div>
          
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
            {title || 'Xác nhận'}
          </h3>
          <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            {message}
          </p>
          
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button 
              className="btn btn-secondary" 
              onClick={onCancel} 
              style={{ flex: 1, padding: '10px', display: 'flex', justifyContent: 'center' }}
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm} 
              style={{ flex: 1, padding: '10px', background: 'var(--danger-text)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
