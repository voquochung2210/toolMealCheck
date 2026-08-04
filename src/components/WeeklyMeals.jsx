import React, { useState } from 'react';
import { CalendarDays, Check, X, Lock, Info } from 'lucide-react';
import MealDetailModal from './MealDetailModal';

export default function WeeklyMeals({ days, locationName }) {
  const [selectedDay, setSelectedDay] = useState(null);

  if (!days || days.length === 0) {
    return null;
  }

  const getRegisteredMeal = (dayItem) => {
    if (!dayItem || !Array.isArray(dayItem.lst_MonAns)) return null;
    return dayItem.lst_MonAns.find((m) => m.isDangKy === true) || null;
  };

  return (
    <section>
      <div className="section-header">
        <h3 className="section-title">
          <CalendarDays size={20} color="var(--accent-secondary)" />
          Thực Đơn Đã Đặt Trong Tuần
        </h3>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Info size={14} /> Nhấp chọn món để xem chi tiết
        </span>
      </div>

      <div className="weekly-grid">
        {days.map((dayItem, idx) => {
          const registered = getRegisteredMeal(dayItem);
          const dateStr = dayItem.ngay ? dayItem.ngay.split('T')[0] : '';
          const isToday =
            new Date().toISOString().split('T')[0] === dateStr;

          return (
            <div
              key={idx}
              className="glass-panel meal-card"
              onClick={() => setSelectedDay(dayItem)}
              title="Nhấn để xem chi tiết thực đơn"
              style={{
                borderColor: isToday ? 'var(--accent-primary)' : undefined,
                background: isToday ? 'var(--btn-secondary-hover)' : undefined,
                cursor: 'pointer',
              }}
            >
              <div className="meal-card-header">
                <div className="meal-date">
                  {dateStr}
                  {isToday && (
                    <span
                      style={{
                        marginLeft: '8px',
                        fontSize: '0.7rem',
                        color: 'var(--accent-secondary)',
                        fontWeight: 700,
                      }}
                    >
                      (Hôm nay)
                    </span>
                  )}
                </div>
                <span className="meal-day-tag">{dayItem.thu || 'N/A'}</span>
              </div>

              {registered ? (
                <>
                  <div className="meal-dish-name">{registered.tenMonAn}</div>
                  <div className="meal-dish-desc">
                    {registered.moTa || 'Không có ghi chú.'}
                  </div>
                  <div className="meal-card-footer">
                    <span style={{ color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={14} /> Đã đăng ký
                    </span>
                    <span className="meal-price">
                      {registered.gia ? `${registered.gia.toLocaleString('vi-VN')} đ` : ''}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="meal-dish-name"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Chưa đăng ký món
                  </div>
                  <div className="meal-dish-desc">
                    Bạn không có lịch đăng ký ăn cơm vào ngày này.
                  </div>
                  <div className="meal-card-footer">
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <X size={14} /> Không ăn
                    </span>
                    {dayItem.isKhoa && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--warning-text)' }}>
                        <Lock size={12} /> Đã khóa
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {selectedDay && (
        <MealDetailModal
          dayItem={selectedDay}
          locationName={locationName}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </section>
  );
}
