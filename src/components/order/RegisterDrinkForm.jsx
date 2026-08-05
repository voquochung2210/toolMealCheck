import React, { useState, useEffect } from 'react';
import { shopService } from '../../services/shopService';
import { Plus } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { toast } from '../ui/Message';

export default function RegisterDrinkForm({ shopId, onSubmit, loading, isLocked, initialData = null, onCancelEdit = null }) {
  const [menuItems, setMenuItems] = useState([]);
  
  // Form state
  const [drinkName, setDrinkName] = useState('');
  const [size, setSize] = useState('M');
  const [sugar, setSugar] = useState('100%');
  const [ice, setIce] = useState('BT');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [note, setNote] = useState('');

  const [isCustomMode, setIsCustomMode] = useState(false);

  useEffect(() => {
    if (shopId) {
      loadMenuItems();
    }
  }, [shopId]);

  useEffect(() => {
    if (initialData) {
      setDrinkName(initialData.drink_name);
      setSize(initialData.size);
      setSugar(initialData.sugar_level);
      setIce(initialData.ice_level);
      setQuantity(initialData.quantity);
      setPrice(initialData.price);
      setNote(initialData.note || '');
      
      // Nếu món không có trong menu, bật custom mode
      if (menuItems.length > 0 && !menuItems.find(i => i.name === initialData.drink_name)) {
        setIsCustomMode(true);
      } else {
        setIsCustomMode(false);
      }
    } else {
      setDrinkName('');
      setSize('M');
      setSugar('100%');
      setIce('BT');
      setQuantity(1);
      setPrice(0);
      setNote('');
      setIsCustomMode(false);
    }
  }, [initialData, menuItems]);

  const loadMenuItems = async () => {
    try {
      const data = await shopService.fetchMenuItems(shopId);
      setMenuItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDrinkChange = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomMode(true);
      setDrinkName('');
      setPrice(0);
    } else {
      setIsCustomMode(false);
      setDrinkName(val);
      const item = menuItems.find(i => i.name === val);
      if (item) setPrice(item.default_price || 0);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!drinkName) return toast.error('Vui lòng chọn hoặc nhập tên món!');
    if (price < 0) return toast.error('Giá không hợp lệ!');
    
    onSubmit({
      drink_name: drinkName,
      size,
      sugar_level: sugar,
      ice_level: ice,
      quantity,
      price: parseInt(price, 10) || 0,
      note
    });

    if (!initialData) {
      // Reset form sau khi đăng ký mới (giữ lại 1 số cấu hình tùy ý)
      setDrinkName('');
      setPrice(0);
      setQuantity(1);
      setNote('');
      setIsCustomMode(false);
    }
  };

  const quickAddCustomToMenu = async () => {
    if (!drinkName) return;
    try {
      await shopService.createMenuItem({
        shop_id: shopId,
        name: drinkName,
        default_price: parseInt(price, 10) || 0,
        category: 'Thêm nhanh'
      });
      setIsCustomMode(false);
      await loadMenuItems();
      toast.success('Đã thêm món vào menu!');
    } catch (err) {
      toast.error('Lỗi thêm món: ' + err.message);
    }
  };

  if (isLocked) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', background: 'var(--warning-bg)', color: 'var(--warning-text)', borderRadius: '8px', border: '1px solid var(--warning-border)' }}>
        Order đã khóa, không thể đăng ký thêm.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: 'var(--btn-secondary-bg)', padding: '15px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
      {initialData && (
        <div style={{ marginBottom: '15px', fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', justifyContent: 'space-between' }}>
          <span>✏️ Chỉnh sửa đăng ký</span>
          <button type="button" className="btn-icon" onClick={onCancelEdit} style={{ fontSize: '0.8rem', padding: '2px 6px', width: 'auto' }}>Hủy sửa</button>
        </div>
      )}

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: 'var(--text-secondary)' }}>Món nước *</label>
        
        {!isCustomMode && menuItems.length > 0 ? (
          <Select value={drinkName} onChange={handleDrinkChange} required>
            <option value="">-- Chọn món --</option>
            {menuItems.map(item => (
              <option key={item.id} value={item.name}>{item.name} ({new Intl.NumberFormat('vi-VN').format(item.default_price)}đ)</option>
            ))}
            <option value="__custom__">+ Khác (Nhập tay)...</option>
          </Select>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Input 
              value={drinkName} 
              onChange={e => setDrinkName(e.target.value)} 
              placeholder="Tên món..." 
              maxLength={100}
              required
              containerStyle={{ flex: 1, margin: 0 }}
            />
            {menuItems.length > 0 && (
              <button type="button" className="btn-secondary" onClick={() => setIsCustomMode(false)} style={{ padding: '0 10px', fontSize: '0.8rem' }}>
                Hủy
              </button>
            )}
          </div>
        )}
      </div>

      {isCustomMode && shopId && (
        <div style={{ marginBottom: '12px', fontSize: '0.8rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={quickAddCustomToMenu} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
            <Plus size={12} /> Lưu vào Menu tiệm
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '15px', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: 'var(--text-secondary)' }}>Giá (1 ly)</label>
          <Input 
            type="number" 
            value={price} 
            onChange={e => setPrice(e.target.value)} 
            min="0"
            required
            disabled={!isCustomMode && menuItems.length > 0}
            containerStyle={{ margin: 0 }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: 'var(--text-secondary)' }}>Số lượng</label>
          <div className="quantity-stepper">
            <button type="button" className="quantity-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
            <span style={{ width: '20px', textAlign: 'center', fontWeight: 600 }}>{quantity}</span>
            <button type="button" className="quantity-btn" onClick={() => setQuantity(Math.min(20, quantity + 1))}>+</button>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: 'var(--text-secondary)' }}>Size</label>
        <div className="btn-group">
          {['S', 'M', 'L'].map(s => (
            <button key={s} type="button" className={`btn-group-item ${size === s ? 'active' : ''}`} onClick={() => setSize(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: 'var(--text-secondary)' }}>Đường</label>
          <div className="btn-group">
            {['0%', '30%', '50%', '70%', '100%'].map(s => (
              <button key={s} type="button" className={`btn-group-item ${sugar === s ? 'active' : ''}`} onClick={() => setSugar(s)}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: 'var(--text-secondary)' }}>Đá</label>
        <div className="btn-group">
          {['Không', 'Ít', 'BT', 'Nhiều'].map(i => (
            <button key={i} type="button" className={`btn-group-item ${ice === i ? 'active' : ''}`} onClick={() => setIce(i)}>{i}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: 'var(--text-secondary)' }}>Ghi chú</label>
          <Input 
            value={note} 
            onChange={e => setNote(e.target.value)} 
            placeholder="Thêm trân châu, trân châu trắng..." 
            maxLength={200}
            containerStyle={{ margin: 0 }}
          />
      </div>

      <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
        {loading ? 'Đang xử lý...' : (initialData ? 'Cập Nhật Đăng Ký' : 'Đăng Ký')}
      </button>
    </form>
  );
}
