import React from 'react';
import { Calendar, MapPin, DollarSign, Utensils, CheckCircle, AlertCircle } from 'lucide-react';

export default function TodayMealCard({ todayMeal, locationName, lastUpdated }) {
  const getImageUrl = (item) => {
    if (!item) return null;
    let rawPath = item.thumb_File_Url;
    if (!rawPath && item.lst_MonAns && Array.isArray(item.lst_MonAns)) {
      const reg = item.lst_MonAns.find((m) => m.isDangKy) || item.lst_MonAns[0];
      rawPath = reg ? reg.thumb_File_Url : null;
    }
    if (!rawPath) return null;
    const cleanPath = String(rawPath).trim().replace(/\s+/g, '');
    return `https://storageapi.thacochulai.vn/${cleanPath}`;
  };

  const imageUrl = todayMeal ? getImageUrl(todayMeal) : null;
  const todayDateStr = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="glass-panel hero-section">
      <div className="hero-image-container">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={todayMeal?.tenMonAn || 'Ảnh món ăn'}
            className="hero-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="hero-image-placeholder"
          style={{ display: imageUrl ? 'none' : 'flex' }}
        >
          <Utensils size={40} opacity={0.4} />
          <span style={{ fontSize: '0.75rem' }}>Bento THACO</span>
        </div>
      </div>

      <div className="hero-content">
        {todayMeal ? (
          <div className="badge-status badge-success">
            <CheckCircle size={14} /> Đã đăng ký suất ăn
          </div>
        ) : (
          <div className="badge-status badge-warning">
            <AlertCircle size={14} /> Không có suất ăn hôm nay
          </div>
        )}

        <h2 className="hero-title">
          {todayMeal ? todayMeal.tenMonAn : 'Hôm nay bạn chưa đăng ký cơm'}
        </h2>

        <p className="hero-desc">
          {todayMeal
            ? todayMeal.moTa || 'Món ăn dinh dưỡng phục vụ CBNV THACO.'
            : 'Hãy kiểm tra trên hệ thống Portal THACO nếu bạn muốn đăng ký hoặc đổi món.'}
        </p>

        <div className="meta-grid">
          <div className="meta-item">
            <Calendar size={16} />
            <span>Ngày:</span>
            <span className="meta-value">{todayDateStr}</span>
          </div>

          <div className="meta-item">
            <MapPin size={16} />
            <span>Địa điểm:</span>
            <span className="meta-value">{locationName || 'N/A'}</span>
          </div>

          {todayMeal && todayMeal.gia && (
            <div className="meta-item">
              <DollarSign size={16} />
              <span>Đơn giá:</span>
              <span className="meta-value">
                {todayMeal.gia.toLocaleString('vi-VN')} VNĐ
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
