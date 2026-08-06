import React from 'react';

export default function OrderCardSkeleton() {
  return (
    <div className="glass-panel order-card skeleton-card">
      <div className="order-card-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '70%' }}>
          <div className="skeleton-box" style={{ height: '22px', width: '100%', borderRadius: '6px' }}></div>
          <div className="skeleton-box" style={{ height: '14px', width: '30%', borderRadius: '4px' }}></div>
        </div>
        <div className="skeleton-box" style={{ height: '26px', width: '85px', borderRadius: '14px' }}></div>
      </div>
      
      <div className="order-card-meta" style={{ marginTop: '10px' }}>
        <div className="skeleton-box" style={{ height: '16px', width: '60%', borderRadius: '4px', marginBottom: '8px' }}></div>
        <div className="skeleton-box" style={{ height: '16px', width: '80%', borderRadius: '4px', marginBottom: '8px' }}></div>
        <div className="skeleton-box" style={{ height: '16px', width: '40%', borderRadius: '4px' }}></div>
      </div>

      <div style={{ marginTop: '15px', paddingTop: '12px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton-box" style={{ height: '18px', width: '50px', borderRadius: '4px' }}></div>
        <div className="skeleton-box" style={{ height: '18px', width: '80px', borderRadius: '4px' }}></div>
      </div>
    </div>
  );
}
