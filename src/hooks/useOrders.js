import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { orderService } from '../services/orderService';

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('open'); // 'open' | 'locked' | 'mine'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async (currentFilter, userId, searchTerm = '', currentPage = 1) => {
    try {
      setLoading(true);
      setError(null);
      const result = await orderService.fetchOrdersList({
        filter: currentFilter,
        userId,
        searchTerm,
        limit: 16,
        page: currentPage
      });
      setOrders(result.data);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.message || 'Lỗi tải danh sách order');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Không fetch tự động ở đây nếu không có userId, component gọi sẽ gọi fetchOrders truyền userId vào
  }, []);

  useEffect(() => {
    // Setup Real-time subscription cho bảng orders
    const channel = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => {
              if (prev.some(o => o.id === payload.new.id)) return prev;
              return [payload.new, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? payload.new : o))
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    orders,
    loading,
    error,
    filter,
    setFilter,
    page,
    setPage,
    totalPages,
    fetchOrders,
  };
}
