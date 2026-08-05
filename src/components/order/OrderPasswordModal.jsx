import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { Input } from '../ui/Input';

export default function OrderPasswordModal({ order, onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const isValid = await orderService.verifyPassword(order.id, password);
      if (isValid) {
        onSuccess();
      } else {
        setError('Mật khẩu không chính xác');
      }
    } catch (err) {
      setError('Lỗi kiểm tra mật khẩu: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel modal-content" style={{ maxWidth: '360px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div style={{ margin: '0 auto 15px', width: '50px', height: '50px', background: 'var(--warning-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning-text)' }}>
          <Lock size={24} />
        </div>
        
        <h3 className="modal-title" style={{ marginBottom: '10px' }}>Order Được Bảo Vệ</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Vui lòng nhập mật khẩu để tham gia order này.
        </p>

        <form onSubmit={handleSubmit}>
          <Input 
            type="password" 
            placeholder="Nhập mật khẩu..." 
            value={password}
            onChange={e => setPassword(e.target.value)}
            maxLength={50}
            style={{ textAlign: 'center', letterSpacing: '2px' }}
            containerStyle={{ marginBottom: '10px' }}
            autoFocus
          />
          
          {error && <div style={{ color: 'var(--danger-text)', fontSize: '0.8rem', marginBottom: '10px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Đang ktra...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
