import React, { useState } from 'react';
import { Lock, User, Key, LogIn, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function LoginModal({ onLogin, error }) {
  const [domainType, setDomainType] = useState('employeeId'); // 'employeeId' | 'email'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    const domain = domainType === 'email' ? 'thaco.com.vn' : '';
    await onLogin({ username: username.trim(), password, domain });
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={{ maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            className="brand-logo"
            style={{ margin: '0 auto 12px auto', width: 52, height: 52 }}
          >
            <ShieldCheck size={28} />
          </div>
          <h2 className="modal-title">Đăng Nhập THACO Portal</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Nhập tài khoản nhân viên THACO để tự động tra cứu món cơm
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              color: 'var(--danger-text)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Loại Đăng Nhập</label>
            <select
              className="form-select"
              value={domainType}
              onChange={(e) => setDomainType(e.target.value)}
            >
              <option value="employeeId">Mã nhân viên (VD: 0012345)</option>
              <option value="email">Email THACO (@thaco.com.vn)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={15} /> Tài Khoản / Mã Nhân Viên
            </label>
            <input
              type="text"
              className="form-input"
              placeholder={domainType === 'employeeId' ? 'Nhập mã nhân viên...' : 'Nhập tên email (không gồm @thaco.com.vn)...'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Key size={15} /> Mật Khẩu
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: 12 }}
            disabled={loading}
          >
            {loading ? (
              'Đang xác thực...'
            ) : (
              <>
                <LogIn size={18} /> Đăng Nhập
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
