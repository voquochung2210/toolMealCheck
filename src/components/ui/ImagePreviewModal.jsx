import React from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

export default function ImagePreviewModal({ isOpen, src, alt = 'Image Preview', onClose }) {
  if (!isOpen || !src) return null;

  const modalContent = (
    <div 
      className="modal-overlay" 
      onClick={(e) => { e.stopPropagation(); onClose(e); }}
      style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div 
        style={{ 
          position: 'relative', 
          display: 'inline-block',
          maxWidth: '90vw', 
          maxHeight: '90vh', 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="btn-icon" 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '12px', 
            right: '12px', 
            background: 'rgba(255, 255, 255, 0.2)', 
            backdropFilter: 'blur(8px)',
            color: 'white',
            borderRadius: '50%',
            padding: '8px',
            zIndex: 10,
            border: '1px solid rgba(255,255,255,0.3)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
          }}
        >
          <X size={24} />
        </button>
        <img 
          src={src} 
          alt={alt} 
          style={{ 
            display: 'block',
            maxWidth: '100%', 
            maxHeight: '90vh', 
            width: 'auto',
            height: 'auto',
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)'
          }} 
        />
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
