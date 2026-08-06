import React, { useState, useRef } from 'react';
import { useOrderDetail } from '../../hooks/useOrderDetail';
import { orderService } from '../../services/orderService';
import { Store, Clock, Lock, LockOpen, Image as ImageIcon, FileText, Trash2, Copy } from 'lucide-react';
import QRSection from './QRSection';
import RegisterDrinkForm from './RegisterDrinkForm';
import OrderItemList from './OrderItemList';
import OrderExport from './OrderExport';
import { toast } from '../ui/Message';
import ConfirmModal from '../ui/ConfirmModal';

export default function OrderDetailModal({ orderId, user, onClose }) {
  const { order, items, loading, error, refresh } = useOrderDetail(orderId);
  const [editingItem, setEditingItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [isLocking, setIsLocking] = useState(false);
  const exportRef = useRef(null);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`Đã copy ${type}!`);
    }).catch(() => {
      toast.error(`Lỗi copy ${type}`);
    });
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={(e) => { e.stopPropagation(); onClose(e); }}>
        <div className="glass-panel modal-content" style={{ textAlign: 'center', padding: '40px' }} onClick={(e) => e.stopPropagation()}>
          Đang tải chi tiết...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="modal-overlay" onClick={(e) => { e.stopPropagation(); onClose(e); }}>
        <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
          <h2 className="modal-title">Lỗi</h2>
          <p>{error || 'Không tìm thấy order'}</p>
          <button className="btn-secondary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    );
  }

  const isOwner = order.created_by === user.userName;
  const isLocked = order.status === 'locked' || order.status === 'completed';

  const handleRegisterSubmit = async (data) => {
    setActionLoading(true);
    try {
      if (editingItem) {
        await orderService.updateOrderItem(editingItem.id, data, orderId);
        setEditingItem(null);
      } else {
        const existingItem = items.find(i => 
          i.user_id === user.userName &&
          i.drink_name === data.drink_name &&
          i.size === data.size &&
          i.sugar_level === data.sugar_level &&
          i.ice_level === data.ice_level &&
          i.price === data.price &&
          (i.note || '') === (data.note || '')
        );

        if (existingItem) {
          await orderService.updateOrderItem(existingItem.id, {
            quantity: existingItem.quantity + data.quantity
          }, orderId);
        } else {
          await orderService.addOrderItem({
            ...data,
            order_id: orderId,
            user_id: user.userName,
            user_name: user.fullName || user.userName
          });
        }
      }
      toast.success('Lưu đăng ký thành công!');
      refresh(false); // Manually refresh in background
    } catch (err) {
      toast.error('Lỗi lưu đăng ký: ' + err.message);
    }
    setActionLoading(false);
  };

  const handleDeleteItem = async (item) => {
    setConfirmState({
      isOpen: true,
      title: 'Xóa đăng ký',
      message: `Xóa phần đăng ký món của ${item.user_name}?`,
      onConfirm: async () => {
        try {
          await orderService.removeOrderItem(item.id, orderId);
          toast.success('Đã xóa món!');
          setConfirmState({ isOpen: false });
          refresh(false); // Manually refresh in background
        } catch (err) {
          toast.error('Lỗi xóa: ' + err.message);
        }
      }
    });
  };


  const handleToggleLock = async () => {
    setIsLocking(true);
    try {
      const newStatus = isLocked ? 'open' : 'locked';
      await orderService.updateOrderStatus(orderId, newStatus);
      toast.success(isLocked ? 'Đã mở lại order' : 'Đã khóa order');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setIsLocking(false);
    }
  };

  const handleDeleteOrder = async () => {
    setConfirmState({
      isOpen: true,
      title: 'Xóa Order',
      message: 'Bạn có chắc chắn muốn xóa toàn bộ order này? Thao tác không thể hoàn tác.',
      confirmText: 'Xóa vĩnh viễn',
      onConfirm: async () => {
        try {
          await orderService.deleteOrder(orderId);
          toast.success('Đã xóa order');
          setConfirmState({ isOpen: false });
          onClose(); // Parent sẽ tự gọi fetchOrders
        } catch (err) {
          toast.error('Lỗi xóa order: ' + err.message);
        }
      }
    });
  };

  return (
    <>
    <div className="modal-overlay" onClick={(e) => { e.stopPropagation(); onClose(e); }}>
      <div className="glass-panel modal-content order-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 className="modal-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              📋 
              {order.code && (
                <span 
                  onClick={() => handleCopy(order.code, 'mã order')}
                  style={{ color: 'var(--accent-primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 6px', borderRadius: '4px', transition: 'background 0.2s' }}
                  title="Copy mã order"
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-border)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  [{order.code}] <Copy size={14} style={{ opacity: 0.8 }} />
                </span>
              )}
              <span 
                onClick={() => handleCopy(order.title, 'tên order')}
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 6px', borderRadius: '4px', transition: 'background 0.2s' }}
                title="Copy tên order"
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-border)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {order.title} <Copy size={14} style={{ opacity: 0.8 }} />
              </span>
              {order.status === 'locked' && <span className="order-status-badge order-status-locked">Đã khóa</span>}
              {order.status === 'completed' && <span className="order-status-badge order-status-completed">Hoàn thành</span>}
              {order.status === 'open' && <span className="order-status-badge order-status-open">Đang mở</span>}
            </h2>
            <div style={{ display: 'flex', gap: '15px', marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {order.shop_name && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Store size={14} /> {order.shop_name}</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> Tạo: {new Date(order.created_at).toLocaleString('vi-VN')}</span>
              <span>Bởi: <strong>{order.created_by_name}</strong></span>
            </div>
            {order.description && <div style={{ marginTop: '8px', fontSize: '0.85rem' }}><em>"{order.description}"</em></div>}
          </div>
          <button className="btn-icon" onClick={onClose}>&times;</button>
        </div>

        <div className="order-detail-grid">
          <QRSection order={order} isOwner={isOwner} />
          
          <div className="order-register-section">
            <RegisterDrinkForm 
              shopId={order.shop_id} 
              onSubmit={handleRegisterSubmit} 
              loading={actionLoading}
              isLocked={isLocked}
              initialData={editingItem}
              onCancelEdit={() => setEditingItem(null)}
            />
          </div>
        </div>

        <div style={{ margin: '20px 0', borderTop: '1px solid var(--glass-border)' }}></div>

        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
            👥 Danh sách đăng ký <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>({order.total_items} món · {new Intl.NumberFormat('vi-VN').format(order.total_amount)}đ)</span>
          </h3>
        </div>

        <OrderItemList 
          items={items} 
          user={user} 
          isOwner={isOwner}
          isLocked={isLocked}
          onEdit={setEditingItem}
          onDelete={handleDeleteItem}
        />

        {isOwner && (
          <div style={{ marginTop: '20px', padding: '15px', background: 'var(--btn-secondary-bg)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className={isLocked ? "btn-primary" : "btn-secondary"} onClick={handleToggleLock} style={isLocked ? { background: 'var(--warning-bg)', color: 'var(--warning-text)', opacity: isLocking ? 0.7 : 1 } : { opacity: isLocking ? 0.7 : 1 }} disabled={isLocking}>
                {isLocked ? <><LockOpen size={16} /> Mở Lại Order</> : <><Lock size={16} /> Khóa Order</>}
              </button>
              
              <button className="btn-secondary" onClick={() => exportRef.current?.exportImage()}>
                <ImageIcon size={16} /> Xuất Ảnh
              </button>
              
              <button className="btn-secondary" onClick={() => exportRef.current?.exportPDF()}>
                <FileText size={16} /> Xuất PDF
              </button>
            </div>
            
            <button className="btn-secondary" style={{ color: 'var(--danger-text)', border: '1px solid var(--danger-border)' }} onClick={handleDeleteOrder}>
              <Trash2 size={16} /> Xóa Order
            </button>
          </div>
        )}

        <OrderExport ref={exportRef} order={order} items={items} />
      </div>
    </div>
    
    <ConfirmModal 
      isOpen={confirmState.isOpen}
      title={confirmState.title}
      message={confirmState.message}
      confirmText={confirmState.confirmText || 'Xác nhận'}
      onConfirm={confirmState.onConfirm}
      onCancel={() => setConfirmState({ isOpen: false })}
    />
    </>
  );
}
