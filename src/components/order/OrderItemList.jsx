import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

export default function OrderItemList({ items, user, isOwner, onEdit, onDelete, isLocked }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  if (!items || items.length === 0) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--btn-secondary-bg)', borderRadius: '8px' }}>
        Chưa có ai đăng ký.
      </div>
    );
  }

  return (
    <div className="order-items-container">
      <table className="order-items-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}>#</th>
            <th>Người Đặt</th>
            <th>Món</th>
            <th>Size</th>
            <th>Đường/Đá</th>
            <th style={{ textAlign: 'center' }}>SL</th>
            <th style={{ textAlign: 'right' }}>Thành Tiền</th>
            <th style={{ width: '60px', textAlign: 'center' }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const isMine = item.user_id === user.userName;
            const canEdit = !isLocked && (isMine || isOwner);
            const canDelete = !isLocked && (isMine || isOwner);
            
            return (
              <tr key={item.id} style={isMine ? { background: 'rgba(255, 255, 255, 0.05)' } : {}}>
                <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                <td>
                  <div style={{ fontWeight: isMine ? 600 : 500 }}>{item.user_name}</div>
                  {item.note && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📝 {item.note}</div>}
                </td>
                <td style={{ fontWeight: 500 }}>{item.drink_name}</td>
                <td>{item.size}</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {item.sugar_level} / {item.ice_level}
                </td>
                <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-primary)' }}>
                  {formatCurrency(item.price * item.quantity)}đ
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
                    {canEdit && (
                      <button className="btn-icon" onClick={() => onEdit(item)} style={{ padding: '4px' }}>
                        <Edit2 size={14} />
                      </button>
                    )}
                    {canDelete && (
                      <button className="btn-icon" onClick={() => onDelete(item)} style={{ padding: '4px', color: 'var(--danger-text)' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
