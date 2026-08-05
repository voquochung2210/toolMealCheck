import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { orderService } from '../services/orderService';

export function useOrderDetail(orderId) {
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrderData = useCallback(async (showLoading = true) => {
    if (!orderId) return;
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const [orderData, itemsData] = await Promise.all([
        orderService.fetchOrderById(orderId),
        orderService.fetchOrderItems(orderId)
      ]);
      setOrder(orderData);
      setItems(itemsData);
    } catch (err) {
      console.error("Error fetching order detail:", err);
      setError(err.message || 'Lỗi tải chi tiết order');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  useEffect(() => {
    if (!orderId) return;

    const channelItems = supabase
      .channel(`public:order_items:${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            if (payload.new.order_id === orderId) {
              setItems((prev) => {
                if (prev.some(i => i.id === payload.new.id)) return prev;
                return [...prev, payload.new];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.order_id === orderId) {
              setItems((prev) =>
                prev.map((i) => (i.id === payload.new.id ? payload.new : i))
              );
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setItems((prev) => prev.filter((i) => i.id !== deletedId));
            } else {
              // Fallback
              fetchOrderData(false);
            }
          }
        }
      )
      .subscribe();

    const channelOrder = supabase
      .channel(`public:orders:${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          setOrder((prev) => ({
            ...prev,
            ...payload.new,
            // Supabase Realtime might omit or nullify large TOAST columns (like base64 images) 
            // if they weren't modified in the UPDATE. We preserve the existing one.
            qr_image_base64: payload.new.qr_image_base64 || prev?.qr_image_base64
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelItems);
      supabase.removeChannel(channelOrder);
    };
  }, [orderId]);

  return {
    order,
    items,
    loading,
    error,
    refresh: fetchOrderData
  };
}
