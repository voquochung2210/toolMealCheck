import React, { useState, useEffect } from 'react';
import { useOrders } from '../../hooks/useOrders';
import { Plus, Store, Lock, Users, Clock, CheckCircle, RefreshCw, Search } from 'lucide-react';
import OrderCard from './OrderCard';
import CreateOrderModal from './CreateOrderModal';
import OrderDetailModal from './OrderDetailModal';
import ShopMenuManager from './ShopMenuManager';
import OrderPasswordModal from './OrderPasswordModal';
import Pagination from '../ui/Pagination';

export default function DrinkOrderPage({ user }) {
  const { orders, loading, error, filter, setFilter, page, setPage, totalPages, fetchOrders } = useOrders();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShopManager, setShowShopManager] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [passwordModalOrder, setPasswordModalOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(filter, user.userName, searchTerm, page);
    }, 500);
    return () => clearTimeout(timer);
  }, [filter, user.userName, searchTerm, page, fetchOrders]);

  const handleOrderClick = (order) => {
    if (order.password && order.created_by !== user.userName) {
      setPasswordModalOrder(order);
    } else {
      setSelectedOrder(order);
    }
  };

  const handlePasswordSuccess = () => {
    const order = passwordModalOrder;
    setPasswordModalOrder(null);
    setSelectedOrder(order);
  };

  return (
    <div>
      <div className="order-page-header">
        <div className="order-filter-bar">
          <button 
            className={`btn-secondary ${filter === 'open' ? 'active' : ''}`}
            onClick={() => { setFilter('open'); setPage(1); }}
            style={filter === 'open' ? { background: 'var(--accent-primary)', color: 'white', borderColor: 'var(--accent-primary)' } : {}}
          >
            Đang mở
          </button>
          <button 
            className={`btn-secondary ${filter === 'locked' ? 'active' : ''}`}
            onClick={() => { setFilter('locked'); setPage(1); }}
            style={filter === 'locked' ? { background: 'var(--accent-primary)', color: 'white', borderColor: 'var(--accent-primary)' } : {}}
          >
            Đã khóa
          </button>
          <button 
            className={`btn-secondary ${filter === 'mine' ? 'active' : ''}`}
            onClick={() => { setFilter('mine'); setPage(1); }}
            style={filter === 'mine' ? { background: 'var(--accent-primary)', color: 'white', borderColor: 'var(--accent-primary)' } : {}}
          >
            Của tôi
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 auto' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', zIndex: 1, color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input 
              type="text" 
              className="form-input"
              placeholder="Tìm kiếm mã, tên order..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              style={{
                paddingLeft: '36px',
                width: '100%',
                minWidth: '150px',
                maxWidth: '240px',
                margin: 0
              }}
            />
          </div>
          <button className="btn-secondary" onClick={() => setShowShopManager(true)} style={{ whiteSpace: 'nowrap' }}>
            <Store size={16} /> Tiệm & Menu
          </button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ whiteSpace: 'nowrap' }}>
            <Plus size={16} /> Tạo Order
          </button>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '20px' }}><div className="spin" style={{ display: 'inline-block' }}><RefreshCw size={24} /></div></div>}
      
      {error && (
        <div style={{ padding: '15px', background: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Không có order nào.
        </div>
      )}

      <div className="order-grid">
        {orders.map((order) => (
          <OrderCard 
            key={order.id} 
            order={order} 
            onClick={() => handleOrderClick(order)} 
          />
        ))}
      </div>

      <Pagination 
        currentPage={page} 
        totalPages={totalPages} 
        onPageChange={(newPage) => {
          setPage(newPage);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} 
      />

      {showCreateModal && (
        <CreateOrderModal 
          user={user} 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => {
            setShowCreateModal(false);
            setPage(1);
            fetchOrders(filter, user.userName, searchTerm, 1);
          }}
        />
      )}

      {showShopManager && (
        <ShopMenuManager 
          user={user} 
          onClose={() => setShowShopManager(false)} 
        />
      )}

      {selectedOrder && (
        <OrderDetailModal 
          orderId={selectedOrder.id} 
          user={user} 
          onClose={() => {
            setSelectedOrder(null);
            fetchOrders(filter, user.userName, searchTerm, page);
          }} 
        />
      )}

      {passwordModalOrder && (
        <OrderPasswordModal 
          order={passwordModalOrder} 
          onClose={() => setPasswordModalOrder(null)} 
          onSuccess={handlePasswordSuccess} 
        />
      )}
    </div>
  );
}
