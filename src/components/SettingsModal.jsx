import React, { useState, useEffect } from 'react';
import { X, Clock, Power, Minimize2, Bell, Save, Sun, Moon, Palette, Plus, AlertCircle, RefreshCw } from 'lucide-react';

export default function SettingsModal({ config, onClose, onSave }) {
  const getInitialScheduleTimes = () => {
    if (Array.isArray(config?.scheduleTimes) && config.scheduleTimes.length > 0) {
      return config.scheduleTimes;
    }
    if (config?.scheduleTime && typeof config.scheduleTime === 'string') {
      return config.scheduleTime.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return ['10:30'];
  };

  const getNowTimeStr = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const [scheduleTimes, setScheduleTimes] = useState(getInitialScheduleTimes);
  const [customTime, setCustomTime] = useState('');
  const [timeError, setTimeError] = useState('');
  const [autoStart, setAutoStart] = useState(config?.autoStart !== false);
  const [minimizeToTray, setMinimizeToTray] = useState(config?.minimizeToTray !== false);
  const [notifyEnabled, setNotifyEnabled] = useState(config?.notifyEnabled !== false);
  const [theme, setTheme] = useState(config?.theme || 'dark');
  const [currentTime, setCurrentTime] = useState(getNowTimeStr);
  const [appVersion, setAppVersion] = useState('');
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getNowTimeStr());
    }, 1000);
    if (window.electronAPI?.getAppVersion) {
      window.electronAPI.getAppVersion().then((v) => setAppVersion(v));
    }
    return () => clearInterval(timer);
  }, []);

  const handleCheckUpdate = async () => {
    if (!window.electronAPI?.checkUpdate) return;
    setCheckingUpdate(true);
    setUpdateMsg('');
    try {
      const res = await window.electronAPI.checkUpdate();
      if (res.success) {
        setUpdateMsg('🔍 Đang kiểm tra bản mới trên server...');
      } else {
        setUpdateMsg(res.message || res.error || 'Chưa thể kiểm tra bản cập nhật.');
      }
    } catch (e) {
      setUpdateMsg('Lỗi kiểm tra cập nhật: ' + e.message);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleClose = () => {
    document.documentElement.setAttribute('data-theme', config?.theme || 'dark');
    onClose();
  };

  const handleToggleTime = (timeStr) => {
    setTimeError('');

    if (scheduleTimes.includes(timeStr)) {
      if (scheduleTimes.length === 1) {
        setTimeError('Phải giữ ít nhất 1 khung giờ tự động báo món!');
        return;
      }
      setScheduleTimes(scheduleTimes.filter((t) => t !== timeStr));
    } else {
      setScheduleTimes([...scheduleTimes, timeStr].sort());
    }
  };

  const handleAddCustomTime = () => {
    if (!customTime) return;

    if (scheduleTimes.includes(customTime)) {
      setTimeError(`Khung giờ ${customTime} đã có trong danh sách!`);
      return;
    }

    setTimeError('');
    setScheduleTimes([...scheduleTimes, customTime].sort());
    setCustomTime('');
  };

  const handleRemoveTime = (timeStr) => {
    setTimeError('');
    if (scheduleTimes.length === 1) {
      setTimeError('Phải giữ ít nhất 1 khung giờ tự động báo món!');
      return;
    }
    setScheduleTimes(scheduleTimes.filter((t) => t !== timeStr));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (scheduleTimes.length === 0) {
      setTimeError('Vui lòng chọn ít nhất 1 khung giờ báo món!');
      return;
    }

    onSave({
      scheduleTimes,
      scheduleTime: scheduleTimes.join(','),
      autoStart,
      minimizeToTray,
      notifyEnabled,
      theme,
    });
  };

  const themeOptions = [
    { id: 'dark', label: 'Giao Diện Tối', icon: Moon },
    { id: 'light', label: 'Giao Diện Sáng', icon: Sun },
    { id: 'indie', label: 'Indie Retro', icon: Palette },
  ];

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="glass-panel modal-content" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Cài Đặt Hệ Thống</h3>
          <button type="button" className="btn-icon" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Theme Selector */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Palette size={16} /> Chủ Đề Giao Diện (Theme)
            </label>
            <div className="theme-selector-grid">
              {themeOptions.map((item) => {
                const IconComp = item.icon;
                const isSelected = theme === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`theme-option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleThemeChange(item.id)}
                  >
                    <IconComp size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notification Schedule Times */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={16} /> Các Khung Giờ Báo Món Hàng Ngày
              </span>
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                Hiện tại: {currentTime}
              </span>
            </label>

            {/* Selected Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {scheduleTimes.map((t) => (
                <span
                  key={t}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 16,
                    background: 'var(--accent-primary)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    boxShadow: 'var(--accent-glow)',
                  }}
                >
                  {t}
                  <X
                    size={14}
                    style={{ cursor: 'pointer', opacity: 0.8 }}
                    onClick={() => handleRemoveTime(t)}
                    title={`Xóa khung giờ ${t}`}
                  />
                </span>
              ))}
            </div>

            {/* Add Custom Time */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                type="time"
                className="form-input"
                style={{ flex: 1, padding: '6px 12px' }}
                value={customTime}
                onChange={(e) => {
                  setCustomTime(e.target.value);
                  setTimeError('');
                }}
              />
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.82rem', gap: 4 }}
                onClick={handleAddCustomTime}
              >
                <Plus size={15} /> Thêm Giờ
              </button>
            </div>

            {/* Quick Presets */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['09:00', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '16:00'].map((time) => {
                const isSelected = scheduleTimes.includes(time);
                return (
                  <button
                    type="button"
                    key={time}
                    className="btn-secondary"
                    style={{
                      padding: '3px 9px',
                      fontSize: '0.76rem',
                      background: isSelected ? 'var(--accent-primary)' : undefined,
                      color: isSelected ? 'white' : undefined,
                    }}
                    onClick={() => handleToggleTime(time)}
                  >
                    {time}
                  </button>
                );
              })}
            </div>

            {/* Validation Error Banner */}
            {timeError && (
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  color: 'var(--danger-text)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <AlertCircle size={15} />
                <span>{timeError}</span>
              </div>
            )}
          </div>

          <div className="form-switch">
            <div>
              <div className="switch-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Power size={16} /> Tự Khởi Động Cùng Windows
              </div>
              <div className="switch-subtext">Khởi chạy ngầm ở Khay Taskbar khi bật máy</div>
            </div>
            <input
              type="checkbox"
              style={{ width: 18, height: 18, cursor: 'pointer' }}
              checked={autoStart}
              onChange={(e) => setAutoStart(e.target.checked)}
            />
          </div>

          <div className="form-switch">
            <div>
              <div className="switch-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Minimize2 size={16} /> Ẩn Xuống Khay Khi Đóng Cửa Sổ
              </div>
              <div className="switch-subtext">Nhấn nút [X] cửa sổ sẽ thu nhỏ ngầm vào Tray</div>
            </div>
            <input
              type="checkbox"
              style={{ width: 18, height: 18, cursor: 'pointer' }}
              checked={minimizeToTray}
              onChange={(e) => setMinimizeToTray(e.target.checked)}
            />
          </div>

          <div className="form-switch">
            <div>
              <div className="switch-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bell size={16} /> Bật Thông Báo Windows Toast
              </div>
              <div className="switch-subtext">Hiện ô thông báo kèm hình ảnh món ăn góc màn hình</div>
            </div>
            <input
              type="checkbox"
              style={{ width: 18, height: 18, cursor: 'pointer' }}
              checked={notifyEnabled}
              onChange={(e) => setNotifyEnabled(e.target.checked)}
            />
          </div>

          {/* Version & Auto Update Section */}
          <div className="form-group" style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Phiên Bản Ứng Dụng {appVersion ? `v${appVersion}` : ''}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Tự động kiểm tra bản cập nhật mới
                </div>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', gap: 6 }}
                onClick={handleCheckUpdate}
                disabled={checkingUpdate}
              >
                <RefreshCw size={14} className={checkingUpdate ? 'spin' : ''} />
                {checkingUpdate ? 'Đang Check...' : 'Kiểm Tra Cập Nhật'}
              </button>
            </div>
            {updateMsg && (
              <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 500 }}>
                {updateMsg}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <button type="button" className="btn-secondary" onClick={handleClose}>
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              <Save size={16} /> Lưu Cài Đặt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
