import React, { forwardRef } from 'react';

export const Select = forwardRef(({ label, error, children, className = '', containerStyle = {}, ...props }, ref) => {
  const selectElement = (
    <select ref={ref} className={`form-select ${error ? 'error' : ''} ${className}`} {...props}>
      {children}
    </select>
  );

  if (!label && !error) return selectElement;

  return (
    <div className="form-group" style={containerStyle}>
      {label && <label className="form-label">{label}</label>}
      {selectElement}
      {error && <span className="form-error" style={{ fontSize: '0.75rem', color: 'var(--danger-text)', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
});
