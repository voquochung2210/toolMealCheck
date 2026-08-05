import React, { useState, useRef } from 'react';
import { QrCode, Upload, Eye } from 'lucide-react';
import ImagePreviewModal from '../ui/ImagePreviewModal';
import { orderService } from '../../services/orderService';
import { toast } from '../ui/Message';

export default function QRSection({ order, isOwner }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pendingQr, setPendingQr] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef(null);

  const handleQrUpdate = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return toast.error('Vui lòng chỉ chọn file hình ảnh!');
    }
    if (file.size > 30 * 1024 * 1024) {
      return toast.error('Kích thước ảnh vượt quá 30MB!');
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPendingQr(reader.result);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmUpdate = async () => {
    setIsUpdating(true);
    try {
      await orderService.updateOrderQr(order.id, pendingQr);
      toast.success('Cập nhật QR thành công!');
      setPendingQr(null);
    } catch (err) {
      toast.error('Lỗi cập nhật QR: ' + err.message);
    }
    setIsUpdating(false);
  };

  if (pendingQr) {
    return (
      <div className="order-qr-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
          <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Xác nhận mã QR mới</h4>
        </div>
        <div style={{ padding: '10px', background: 'white', border: '2px dashed var(--primary-color)', display: 'inline-block', width: '100%', borderRadius: '8px' }}>
          <img src={pendingQr} alt="Preview QR" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px' }} />
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleConfirmUpdate} disabled={isUpdating}>
            {isUpdating ? 'Đang lưu...' : 'Lưu QR này'}
          </button>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setPendingQr(null)} disabled={isUpdating}>
            Hủy
          </button>
        </div>
      </div>
    );
  }
  if (!order.qr_image_base64) {
    return (
      <div className="order-qr-section">
        <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--glass-border)', color: 'var(--text-muted)' }}>
          <QrCode size={40} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
          <div style={{ fontSize: '0.85rem', marginBottom: isOwner ? '10px' : 0 }}>Order này chưa có QR chuyển khoản.</div>
          {isOwner && (
            <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => fileInputRef.current?.click()}>
              <Upload size={14} /> Thêm QR
            </button>
          )}
          <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleQrUpdate} />
        </div>
      </div>
    );
  }

  return (
    <div className="order-qr-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>QR Chuyển Khoản</h4>
        {isOwner && (
          <span 
            style={{ fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={12} /> Cập nhật
          </span>
        )}
      </div>
      
      <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleQrUpdate} />
      
      <div 
        className="image-preview-wrapper"
        style={{ padding: '10px', background: 'white', border: '1px solid var(--glass-border)', display: 'inline-block', width: '100%' }}
        onClick={() => setIsPreviewOpen(true)}
      >
        <img 
          src={order.qr_image_base64} 
          alt="QR Code" 
          className="order-qr-img" 
          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px' }}
        />
        <div className="image-preview-overlay">
          <div className="image-preview-icon">
            <Eye size={32} />
          </div>
        </div>
      </div>
      
      {order.bank_info && (
        <div style={{ fontSize: '0.8rem', textAlign: 'center', color: 'var(--text-primary)', background: 'var(--btn-secondary-bg)', padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
          {order.bank_info}
        </div>
      )}

      <ImagePreviewModal 
        isOpen={isPreviewOpen}
        src={order.qr_image_base64}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
}
