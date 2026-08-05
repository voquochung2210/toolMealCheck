import React, { forwardRef } from 'react';

export const Input = forwardRef(({ label, error, rightElement, className = '', containerStyle = {}, ...props }, ref) => {
  const inputElement = (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
      <input ref={ref} className={`form-input ${error ? 'error' : ''} ${className}`} style={rightElement ? { paddingRight: '40px' } : {}} {...props} />
      {rightElement && (
        <div style={{ position: 'absolute', right: '12px', display: 'flex', alignItems: 'center' }}>
          {rightElement}
        </div>
      )}
    </div>
  );
  
  if (!label && !error) return inputElement;

  return (
    <div className="form-group" style={containerStyle}>
      {label && <label className="form-label">{label}</label>}
      {inputElement}
      {error && <span className="form-error" style={{ fontSize: '0.75rem', color: 'var(--danger-text)', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
});
