import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { orderService } from '../services/orderService';

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('open'); // 'open' | 'locked' | 'mine'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Lưu tham số truy vấn hiện tại để realtime refetch đúng filter/search/page
  const paramsRef = useRef({ filter: 'open', userId: '', searchTerm: '', page: 1 });
  const refreshTimerRef = useRef(null);

  const fetchOrders = useCallback(async (currentFilter, userId, searchTerm = '', currentPage = 1, { background = false } = {}) => {
    paramsRef.current = { filter: currentFilter, userId, searchTerm, page: currentPage };
    try {
      if (!background) setLoading(true);
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
      if (!background) setLoading(false);
    }
  }, []);

  // Debounce refetch khi có thay đổi realtime, áp dụng đúng filter/search/page hiện tại
  const refreshFromRealtime = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      const { filter: f, userId, searchTerm, page: p } = paramsRef.current;
      fetchOrders(f, userId, searchTerm, p, { background: true });
    }, 300);
  }, [fetchOrders]);

  useEffect(() => () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, []);

  useEffect(() => {
    // Setup Real-time subscription cho bảng orders
    const channel = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          // Thay đổi bất kỳ (INSERT/UPDATE/DELETE) đều refetch theo filter/search/page hiện tại
          refreshFromRealtime();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshFromRealtime]);

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
