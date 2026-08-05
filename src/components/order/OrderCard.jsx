import React from 'react';
import { Lock, Store, Users, Clock, CheckCircle, Unlock } from 'lucide-react';

export default function OrderCard({ order, onClick }) {
  const isLocked = order.status === 'locked';
  const isCompleted = order.status === 'completed';

  const getStatusBadge = () => {
    if (isCompleted) return <span className="order-status-badge order-status-completed"><CheckCircle size={13} strokeWidth={2.5} /> Hoàn thành</span>;
    if (isLocked) return <span className="order-status-badge order-status-locked"><Lock size={13} strokeWidth={2.5} /> Đã khóa</span>;
    return <span className="order-status-badge order-status-open"><Unlock size={13} strokeWidth={2.5} /> Đang mở</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate()}/${d.getMonth() + 1}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  return (
    <div className="glass-panel order-card" onClick={onClick}>
      <div className="order-card-header">
        <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
          {order.password && <Lock size={14} color="var(--warning-text)" />}
          {order.code ? `[${order.code}] ${order.title}` : order.title}
        </h3>
        {getStatusBadge()}
      </div>
      
      <div className="order-card-meta">
        {order.shop_name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Store size={14} /> {order.shop_name}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={14} /> Tạo bởi: {order.created_by_name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={14} /> {formatDate(order.created_at)}
        </div>
      </div>

      <div style={{ marginTop: '15px', paddingTop: '12px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
        <span>{order.total_items} món</span>
        <span style={{ color: 'var(--accent-primary)' }}>{formatCurrency(order.total_amount)}</span>
      </div>
    </div>
  );
}
