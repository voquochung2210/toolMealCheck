import React from 'react';
import { X, Calendar, MapPin, DollarSign, CheckCircle, AlertCircle, Utensils, Lock } from 'lucide-react';

export default function MealDetailModal({ dayItem, locationName, onClose }) {
  if (!dayItem) return null;

  const getRegisteredMeal = () => {
    if (!dayItem.lst_MonAns || !Array.isArray(dayItem.lst_MonAns)) return null;
    return dayItem.lst_MonAns.find((m) => m.isDangKy === true) || null;
  };

  const registeredMeal = getRegisteredMeal();
  const dateStr = dayItem.ngay ? dayItem.ngay.split('T')[0] : '';
  const formattedDate = dateStr
    ? new Date(dateStr).toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  const getImageUrl = (rawPath) => {
    if (!rawPath) return null;
    const cleanPath = String(rawPath).trim().replace(/\s+/g, '');
    return `https://storageapi.thacochulai.vn/${cleanPath}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel modal-content"
        style={{ maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Chi Tiết Thực Đơn</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              {dayItem.thu} ({formattedDate || dateStr})
            </p>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Registered Status Banner */}
        <div style={{ marginBottom: 20 }}>
          {registeredMeal ? (
            <div
              className="glass-panel"
              style={{
                padding: 16,
                borderColor: 'var(--success-border)',
                background: 'var(--success-bg)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success-text)', fontWeight: 600, fontSize: '0.9rem', marginBottom: 12 }}>
                <CheckCircle size={18} /> Bạn đã đăng ký suất ăn ngày này
              </div>

              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                {getImageUrl(registeredMeal.thumb_File_Url) ? (
                  <img
                    src={getImageUrl(registeredMeal.thumb_File_Url)}
                    alt={registeredMeal.tenMonAn}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 'var(--radius-sm)',
                      objectFit: 'cover',
                      border: '1px solid var(--glass-border)',
                    }}
                    onError={(e) => (e.target.style.display = 'none')}
                  />
                ) : (
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Utensils size={28} />
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                    {registeredMeal.tenMonAn}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    {registeredMeal.moTa || 'Món ăn dinh dưỡng phục vụ CBNV THACO.'}
                  </p>
                  {registeredMeal.gia && (
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                      {registeredMeal.gia.toLocaleString('vi-VN')} VNĐ
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="glass-panel"
              style={{
                padding: 16,
                borderColor: 'var(--warning-border)',
                background: 'var(--warning-bg)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: 'var(--warning-text)',
              }}
            >
              <AlertCircle size={20} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Chưa đăng ký món</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                  Bạn không có suất ăn được đăng ký cho ngày {dayItem.thu}.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Menu list for the day */}
        {dayItem.lst_MonAns && dayItem.lst_MonAns.length > 0 && (
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 10 }}>
              Danh Sách Món Ăn Trong Ngày ({dayItem.lst_MonAns.length} món)
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {dayItem.lst_MonAns.map((dish, i) => {
                const isSelected = dish.isDangKy === true;
                const imgUrl = getImageUrl(dish.thumb_File_Url);

                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--btn-secondary-hover)' : 'var(--btn-secondary-bg)',
                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                    }}
                  >
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={dish.tenMonAn}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 6,
                          objectFit: 'cover',
                        }}
                        onError={(e) => (e.target.style.display = 'none')}
                      />
                    ) : (
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 6,
                          background: 'var(--input-bg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <Utensils size={20} />
                      </div>
                    )}

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {dish.tenMonAn}
                        </span>
                        {isSelected && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: 'var(--success-text)',
                              background: 'var(--success-bg)',
                              border: '1px solid var(--success-border)',
                              padding: '2px 8px',
                              borderRadius: 12,
                            }}
                          >
                            Đã Đăng Ký
                          </span>
                        )}
                      </div>
                      {dish.moTa && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          {dish.moTa}
                        </div>
                      )}
                      {dish.gia && (
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-secondary)', marginTop: 4 }}>
                          {dish.gia.toLocaleString('vi-VN')} đ
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info Meta */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            paddingTop: 12,
            borderTop: '1px solid var(--glass-border)',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={15} color="var(--accent-secondary)" />
            <span>Địa điểm: <strong style={{ color: 'var(--text-primary)' }}>{locationName || 'N/A'}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={15} color={dayItem.isKhoa ? 'var(--warning-text)' : 'var(--success-text)'} />
            <span>Trạng thái: <strong style={{ color: dayItem.isKhoa ? 'var(--warning-text)' : 'var(--success-text)' }}>
              {dayItem.isKhoa ? 'Đã khóa lịch' : 'Đang mở'}
            </strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={onClose} style={{ minWidth: 100, justifyContent: 'center' }}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
