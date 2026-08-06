import React, { useState, useEffect, useMemo } from 'react';
import { shopService } from '../../services/shopService';
import { Plus } from 'lucide-react';
import { Input } from '../ui/Input';
import { SearchableSelect } from '../ui/SearchableSelect';
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

  const menuOptions = useMemo(() =>
    menuItems.map(item => ({
      value: item.name,
      label: `${item.name} (${new Intl.NumberFormat('vi-VN').format(item.default_price)}đ)`,
    })),
    [menuItems]
  );

  const handleDrinkChange = (val) => {
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
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '40px 20px', 
        background: 'var(--btn-secondary-bg)', 
        borderRadius: '12px', 
        border: '1px solid var(--glass-border)',
        height: '100%',
        minHeight: '350px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '200px',
          height: '200px',
          background: 'var(--warning-bg)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          opacity: 0.8,
          zIndex: 0
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '150px',
          height: '150px',
          background: 'var(--accent-primary)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          opacity: 0.15,
          zIndex: 0
        }}></div>

        {/* Main Content */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ 
            position: 'relative', 
            marginBottom: '20px',
            width: '140px',
            height: '140px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img src="/locked_order.png" alt="Order Locked" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.12))' }} />
          </div>
          
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', fontSize: '1.3rem', fontWeight: 600 }}>
            Order Đã Khóa
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', maxWidth: '260px' }}>
            Không thể đăng ký thêm món lúc này. Vui lòng liên hệ người tạo order nếu bạn cần hỗ trợ.
          </p>
        </div>
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
          <SearchableSelect
            options={menuOptions}
            value={drinkName}
            onChange={handleDrinkChange}
            placeholder="Chọn món nước..."
            searchPlaceholder="Tìm món..."
            customOption={{ value: '__custom__', label: 'Khác (Nhập tay)...' }}
            required
          />
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
