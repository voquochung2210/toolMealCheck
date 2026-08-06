import React, { useState, useEffect } from 'react';
import { Store, Plus, Trash2, Edit2, Check, X, ChevronRight } from 'lucide-react';
import { shopService } from '../../services/shopService';
import { Input } from '../ui/Input';
import { toast } from '../ui/Message';
import ConfirmModal from '../ui/ConfirmModal';

export default function ShopMenuManager({ user, onClose }) {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);

  // States for inline forms
  const [addingShop, setAddingShop] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopCode, setNewShopCode] = useState('');
  
  const [editingShop, setEditingShop] = useState(false);
  const [editShopName, setEditShopName] = useState('');
  const [editShopCode, setEditShopCode] = useState('');
  const [confirmState, setConfirmState] = useState({ isOpen: false });

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    setLoading(true);
    try {
      const data = await shopService.fetchShops();
      setShops(data);
      // If we have a selected shop, update its data or clear if deleted
      if (selectedShop) {
        const stillExists = data.find(s => s.id === selectedShop.id);
        setSelectedShop(stillExists || null);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi tải danh sách tiệm: ' + err.message);
    }
    setLoading(false);
  };

  const validateCode = (code) => {
    if (!code) return false;
    const regex = /^[A-Z0-9_-]+$/;
    return regex.test(code);
  };

  const submitCreateShop = async () => {
    if (!newShopName.trim()) return toast.error('Vui lòng nhập tên tiệm');
    if (!newShopCode.trim()) return toast.error('Vui lòng nhập mã tiệm');
    if (!validateCode(newShopCode)) return toast.error('Mã tiệm chỉ gồm chữ không dấu, số, gạch ngang hoặc gạch dưới (VD: THE-COFFEE-HOUSE)');
    
    setIsSubmitting(true);
    try {
      await shopService.createShop({ 
        name: newShopName.trim(), 
        code: newShopCode.trim().toUpperCase(),
        created_by: user.userName 
      });
      setAddingShop(false);
      setNewShopName('');
      setNewShopCode('');
      await loadShops();
      toast.success('Đã tạo tiệm thành công');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitEditShop = async (shopId) => {
    if (!editShopName.trim()) return toast.error('Vui lòng nhập tên tiệm');
    if (!editShopCode.trim()) return toast.error('Vui lòng nhập mã tiệm');
    if (!validateCode(editShopCode)) return toast.error('Mã tiệm không hợp lệ');

    setIsSubmitting(true);
    try {
      await shopService.updateShop(shopId, { 
        name: editShopName.trim(),
        code: editShopCode.trim().toUpperCase()
      });
      setEditingShop(false);
      setEditShopName('');
      setEditShopCode('');
      await loadShops();
      toast.success('Đã cập nhật tiệm');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteShop = async (shopId) => {
    setConfirmState({
      isOpen: true,
      title: 'Xóa tiệm',
      message: 'Bạn có chắc muốn xóa tiệm này? Các menu item cũng sẽ bị ẩn.',
      confirmText: 'Xóa tiệm',
      onConfirm: async () => {
        try {
          await shopService.deleteShop(shopId);
          if (selectedShop?.id === shopId) setSelectedShop(null);
          await loadShops();
          toast.success('Đã xóa tiệm!');
          setConfirmState({ isOpen: false });
        } catch (err) {
          toast.error('Lỗi: ' + err.message);
        }
      }
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => { e.stopPropagation(); onClose(e); }}>
      <div className="glass-panel modal-content manager-modal" style={{ padding: 0, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-secondary)' }}>
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Store size={20} /> Quản Lý Tiệm & Menu
          </h2>
          <button className="btn-icon" onClick={onClose}>&times;</button>
        </div>

        {/* Master Detail Layout */}
        <div className="master-detail-layout" style={{ padding: '20px', height: 'calc(100% - 65px)', overflow: 'hidden' }}>
          
          {/* Cột Trái: Danh sách Tiệm */}
          <div className="shop-list-sidebar">
            <button 
              className={`btn-primary ${addingShop ? 'active' : ''}`} 
              style={{ marginBottom: '15px', width: '100%', justifyContent: 'center' }} 
              onClick={() => { setAddingShop(true); setSelectedShop(null); setEditingShop(false); }}
            >
              <Plus size={16} /> Thêm Tiệm Mới
            </button>

            {loading && !shops.length ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</div>
            ) : shops.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Chưa có tiệm nào.</div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
                {shops.map(shop => (
                  <div 
                    key={shop.id} 
                    className={`shop-table-row ${selectedShop?.id === shop.id && !addingShop ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedShop(shop);
                      setAddingShop(false);
                      setEditingShop(false);
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--accent-primary)', display: 'block', fontSize: '0.85rem' }}>{shop.code}</strong>
                      <span style={{ fontWeight: 500 }}>{shop.name}</span>
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cột Phải: Chi tiết Tiệm / Form */}
          <div className="shop-detail-main" style={{ overflowY: 'auto' }}>
            {addingShop ? (
              <div style={{ maxWidth: '500px' }}>
                <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={18}/> Thêm Tiệm Mới</h3>
                <div className="shop-form-grid">
                  <div>
                    <label className="form-label">Mã Tiệm (Viết liền, không dấu)</label>
                    <Input placeholder="VD: TCH" value={newShopCode} onChange={(e) => setNewShopCode(e.target.value.toUpperCase())} maxLength={20} autoFocus />
                  </div>
                  <div>
                    <label className="form-label">Tên Tiệm</label>
                    <Input placeholder="VD: The Coffee House" value={newShopName} onChange={(e) => setNewShopName(e.target.value)} maxLength={100} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button className="btn-primary" onClick={submitCreateShop} disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.7 : 1 }}><Check size={16} /> Tạo Tiệm</button>
                    <button className="btn-secondary" onClick={() => setAddingShop(false)} disabled={isSubmitting}>Hủy</button>
                  </div>
                </div>
              </div>
            ) : selectedShop ? (
              editingShop ? (
                <div style={{ maxWidth: '500px' }}>
                  <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><Edit2 size={18}/> Sửa Thông Tin Tiệm</h3>
                  <div className="shop-form-grid">
                    <div>
                      <label className="form-label">Mã Tiệm</label>
                      <Input placeholder="Mã (VD: TCH)" value={editShopCode} onChange={(e) => setEditShopCode(e.target.value.toUpperCase())} maxLength={20} />
                    </div>
                    <div>
                      <label className="form-label">Tên Tiệm</label>
                      <Input placeholder="Tên tiệm" value={editShopName} onChange={(e) => setEditShopName(e.target.value)} maxLength={100} autoFocus />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button className="btn-primary" onClick={() => submitEditShop(selectedShop.id)} disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.7 : 1 }}><Check size={16} /> Lưu Thay Đổi</button>
                      <button className="btn-secondary" onClick={() => setEditingShop(false)} disabled={isSubmitting}>Hủy</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid var(--glass-border)' }}>
                    <div>
                      <h3 style={{ margin: 0, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {selectedShop.code ? `[${selectedShop.code}]` : ''} {selectedShop.name}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-secondary" onClick={() => { setEditingShop(true); setEditShopName(selectedShop.name); setEditShopCode(selectedShop.code || ''); }}>
                        <Edit2 size={14} /> Sửa
                      </button>
                      <button className="btn-secondary" onClick={() => handleDeleteShop(selectedShop.id)} style={{ color: 'var(--danger-text)' }}>
                        <Trash2 size={14} /> Xóa
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    <MenuItemsList shopId={selectedShop.id} />
                  </div>
                </div>
              )
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                <div style={{ textAlign: 'center' }}>
                  <Store size={48} style={{ opacity: 0.2, marginBottom: '15px' }} />
                  <p>Vui lòng chọn một tiệm từ danh sách bên trái<br/>hoặc "Thêm tiệm mới" để bắt đầu.</p>
                </div>
              </div>
            )}
          </div>
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
    </div>
  );
}

function MenuItemsList({ shopId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addingItem, setAddingItem] = useState(false);
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [confirmState, setConfirmState] = useState({ isOpen: false });

  useEffect(() => {
    setAddingItem(false);
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await shopService.fetchMenuItems(shopId);
      setItems(data);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi tải menu: ' + err.message);
    }
    setLoading(false);
  };

  const validateCode = (code) => {
    if (!code) return false;
    const regex = /^[A-Z0-9_-]+$/;
    return regex.test(code);
  };

  const submitAddItem = async () => {
    if (!newItemCode.trim()) return toast.error('Vui lòng nhập mã món');
    if (!validateCode(newItemCode)) return toast.error('Mã món chỉ gồm chữ không dấu, số, gạch ngang hoặc gạch dưới');
    if (!newItemName.trim()) return toast.error('Vui lòng nhập tên món');
    
    const priceNum = parseInt(newItemPrice.replace(/,/g, ''), 10) || 0;
    
    setIsSubmitting(true);
    try {
      await shopService.createMenuItem({
        shop_id: shopId,
        code: newItemCode.trim().toUpperCase(),
        name: newItemName.trim(),
        default_price: priceNum,
        category: newItemCategory.trim() || null
      });
      setAddingItem(false);
      setNewItemCode('');
      setNewItemName('');
      setNewItemPrice('');
      setNewItemCategory('');
      loadItems();
      toast.success('Đã thêm món');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    setConfirmState({
      isOpen: true,
      title: 'Xóa món',
      message: 'Xóa món này khỏi menu?',
      confirmText: 'Xóa',
      onConfirm: async () => {
        try {
          await shopService.deleteMenuItem(itemId);
          await loadItems();
          toast.success('Đã xóa món!');
          setConfirmState({ isOpen: false });
        } catch (err) {
          toast.error('Lỗi: ' + err.message);
        }
      }
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  if (loading) return <div style={{ fontSize: '0.85rem' }}>Đang tải menu...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <strong style={{ fontSize: '1.1rem' }}>Danh sách món</strong>
        {!addingItem && (
          <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setAddingItem(true)}>
            <Plus size={14} /> Thêm món mới
          </button>
        )}
      </div>

      {addingItem && (
        <div style={{ background: 'var(--btn-secondary-bg)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--glass-border)' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: 'var(--accent-primary)' }}>Thông tin món mới</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label className="form-label">Mã món (VD: SP01)</label>
              <Input placeholder="Mã món" value={newItemCode} onChange={e => setNewItemCode(e.target.value.toUpperCase())} maxLength={20} autoFocus containerStyle={{ margin: 0 }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Tên món</label>
              <Input placeholder="Tên món" value={newItemName} onChange={e => setNewItemName(e.target.value)} maxLength={100} containerStyle={{ margin: 0 }} />
            </div>
            <div>
              <label className="form-label">Giá bán (đ)</label>
              <Input type="number" placeholder="VD: 35000" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} containerStyle={{ margin: 0 }} />
            </div>
            <div>
              <label className="form-label">Phân loại (Tùy chọn)</label>
              <Input placeholder="VD: Đồ uống" value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} maxLength={50} containerStyle={{ margin: 0 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-primary" onClick={submitAddItem} disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.7 : 1 }}><Check size={16} /> Thêm Món</button>
            <button className="btn-secondary" onClick={() => setAddingItem(false)} disabled={isSubmitting}>Hủy</button>
          </div>
        </div>
      )}
      
      {items.length === 0 && !addingItem ? (
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', padding: '30px', background: 'var(--btn-secondary-bg)', borderRadius: '8px' }}>
          Menu trống. Hãy thêm món mới cho tiệm này.
        </div>
      ) : (
        <div style={{ paddingBottom: '20px' }}>
          {/* Header Row for clarity */}
          {items.length > 0 && (
            <div className="menu-item-list-row hide-on-mobile" style={{ background: 'transparent', borderBottom: '2px solid var(--glass-border)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', paddingBottom: '8px', paddingTop: 0 }}>
              <span>Mã SP</span>
              <span>Tên món</span>
              <span>Giá</span>
              <span>Loại</span>
              <span></span>
            </div>
          )}
          {items.map(item => (
            <div key={item.id} className="menu-item-list-row">
              <span className="item-code" style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{item.code}</span>
              <span className="item-name" style={{ fontWeight: 500 }}>{item.name}</span>
              <span className="item-price" style={{ color: 'var(--text-secondary)' }}>{formatPrice(item.default_price)}đ</span>
              <span className="item-category" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.category || '-'}</span>
              <button className="btn-icon item-action" onClick={() => handleDeleteItem(item.id)} style={{ color: 'var(--danger-text)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText || 'Xác nhận'}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ isOpen: false })}
      />
    </div>
  );
}
