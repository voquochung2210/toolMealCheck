import React, { useState, useEffect } from 'react';
import { Utensils, RefreshCw, Settings, ExternalLink, LogOut, AlertTriangle } from 'lucide-react';

export default function Header({ user, onRefresh, onOpenSettings, onLogout, loading }) {
  const [cooldown, setCooldown] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleOpenPortal = () => {
    if (window.electronAPI) {
      window.electronAPI.openExternalUrl(import.meta.env.VITE_THACO_PORTAL_URL || 'https://portal.thaco.com.vn/suat-an-chu-lai/lich-su');
    }
  };

  const handleRefreshClick = () => {
    if (cooldown > 0 || loading) return;
    setCooldown(30);
    onRefresh();
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  return (
    <>
      <header className="glass-panel header">
        <div className="brand-section">
          <div className="brand-logo">
            <Utensils size={22} />
          </div>
          <div>
            <h1 className="brand-title">Cơm THACO</h1>
            <p className="brand-subtitle">
              {user ? `${user.fullName || user.userName} (${user.userName})` : 'Tool Tự Động Tra Cứu Suất Ăn'}
            </p>
          </div>
        </div>

        <div className="header-actions">
          {cooldown > 0 ? (
            <button
              className="btn-icon"
              disabled
              title={`Vui lòng đợi ${cooldown}s để làm mới tiếp`}
              style={{
                width: 'auto',
                padding: '0 10px',
                gap: 5,
                opacity: 0.7,
                cursor: 'not-allowed',
              }}
            >
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{cooldown}s</span>
            </button>
          ) : (
            <button
              className="btn-icon"
              onClick={handleRefreshClick}
              disabled={loading}
              title="Làm mới thực đơn"
            >
              <RefreshCw size={18} className={loading ? 'spin' : ''} />
            </button>
          )}

          <button
            className="btn-icon"
            onClick={handleOpenPortal}
            title="Mở Lịch Sử Suất Ăn THACO Web"
          >
            <ExternalLink size={18} />
          </button>

          <button
            className="btn-icon"
            onClick={onOpenSettings}
            title="Cài đặt hệ thống"
          >
            <Settings size={18} />
          </button>

          {user && (
            <button
              className="btn-icon"
              onClick={() => setShowLogoutConfirm(true)}
              title="Đăng xuất tài khoản"
              style={{ color: 'var(--danger-text)' }}
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </header>

      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div
            className="glass-panel modal-content"
            style={{ maxWidth: 360, textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                margin: '0 auto 14px auto',
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--danger-text)',
              }}
            >
              <AlertTriangle size={26} />
            </div>
            <h3 className="modal-title" style={{ marginBottom: 8 }}>Xác Nhận Đăng Xuất</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 22, lineHeight: 1.4 }}>
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản <strong>{user?.fullName || user?.userName}</strong> không?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setShowLogoutConfirm(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{
                  flex: 1,
                  background: 'var(--danger-text)',
                  boxShadow: 'none',
                  justifyContent: 'center',
                }}
                onClick={handleConfirmLogout}
              >
                Đăng Xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
