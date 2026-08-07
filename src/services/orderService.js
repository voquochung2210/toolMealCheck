import { supabase } from '../lib/supabaseClient';

export const orderService = {
  // === ORDERS ===

  async fetchOrdersList({ filter, userId, searchTerm, limit = 16, page = 1 }) {
    let query = supabase.from('orders').select('*', { count: 'exact' });

    if (filter === 'mine' && userId) {
      query = query.eq('created_by', userId);
    } else if (filter === 'open' || filter === 'locked') {
      query = query.eq('status', filter);
    } else {
      query = query.in('status', ['open', 'locked']);
    }

    if (!searchTerm) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.order('created_at', { ascending: false }).range(from, to);
      const { data, count, error } = await query;
      if (error) throw error;
      return { data, totalPages: Math.ceil((count || 0) / limit), totalCount: count || 0 };
    }

    // When searching, fetch all and filter in JS to support Vietnamese without accents
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;

    const removeAccents = (str) => {
      if (!str) return '';
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };

    const term = removeAccents(searchTerm.toLowerCase());
    const filtered = data.filter(order => {
      const title = removeAccents((order.title || '').toLowerCase());
      const code = (order.code || '').toLowerCase();
      return title.includes(term) || code.includes(term);
    });

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / limit);
    const start = (page - 1) * limit;
    const pagedData = filtered.slice(start, start + limit);

    return { data: pagedData, totalPages, totalCount };
  },

  async fetchActiveOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['open', 'locked'])
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async fetchMyOrders(userId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async fetchOrderById(id) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async createOrder(orderData) {
    try {
      // Gọi hàm DB atomic (advisory lock) để tránh race condition về
      // giới hạn 5 order và tên trùng khi nhiều người tạo cùng lúc.
      const { data, error } = await supabase.rpc('create_order', {
        p_title: orderData.title,
        p_description: orderData.description ?? null,
        p_shop_id: orderData.shop_id ?? null,
        p_shop_name: orderData.shop_name ?? null,
        p_password: orderData.password ?? null,
        p_created_by: orderData.created_by,
        p_created_by_name: orderData.created_by_name ?? null,
        p_qr_image_base64: orderData.qr_image_base64 ?? null,
        p_bank_info: orderData.bank_info ?? null,
      });
      if (error) throw error;
      return data;
    } catch (err) {
      const msg = String(err?.message || err || '');
      // Nếu hàm create_order chưa được tạo trên Supabase (chưa apply migration),
      // fallback về logic cũ (kém atomic nhưng vẫn dùng được).
      const functionMissing =
        msg.includes('does not exist') ||
        msg.includes('Could not find the function') ||
        msg.includes('PGRST116');
      if (!functionMissing) throw err;
      return this._createOrderLegacy(orderData);
    }
  },

  async _createOrderLegacy(orderData) {
    // Check maximum active orders limit per user
    const { count: activeOrdersCount, error: countError } = await supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('created_by', orderData.created_by)
      .in('status', ['open', 'locked']);

    if (countError) throw countError;
    if (activeOrdersCount >= 5) {
      throw new Error('Bạn chỉ được tạo tối đa 5 order đang hoạt động cùng lúc. Vui lòng hoàn thành hoặc xóa bớt order cũ để tạo thêm.');
    }
    if (orderData.title) {
      // Check if an active order with the same title exists
      const { data: existing } = await supabase
        .from('orders')
        .select('id')
        .in('status', ['open', 'locked'])
        .ilike('title', orderData.title.trim())
        .maybeSingle();

      if (existing) {
        throw new Error(`Đã có Order đang hoạt động mang tên "${orderData.title}". Vui lòng chọn tên khác.`);
      }
    }

    // Generate standard order code (e.g. ORD-A1B2C3) and ensure it's unique
    if (!orderData.code) {
      let isCodeUnique = false;
      let code = '';
      while (!isCodeUnique) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        code = 'ORD-';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        const { data: existingCode } = await supabase
          .from('orders')
          .select('id')
          .eq('code', code)
          .maybeSingle();
          
        if (!existingCode) {
          isCodeUnique = true;
        }
      }
      orderData.code = code;
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateOrderQr(id, qrBase64) {
    const { data, error } = await supabase
      .from('orders')
      .update({ qr_image_base64: qrBase64 })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateOrderStatus(id, status) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteOrder(id) {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async verifyPassword(id, password) {
    const { data, error } = await supabase
      .from('orders')
      .select('password')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data.password === password;
  },
  
  async updateOrderTotals(id) {
     const { data: items, error: fetchError } = await supabase
      .from('order_items')
      .select('quantity, price')
      .eq('order_id', id);
      
     if (fetchError) throw fetchError;
     
     let total_items = 0;
     let total_amount = 0;
     
     items.forEach(item => {
         total_items += item.quantity;
         total_amount += (item.price * item.quantity);
     });
     
     const { error: updateError } = await supabase
      .from('orders')
      .update({ total_items, total_amount })
      .eq('id', id);
      
     if (updateError) throw updateError;
  },

  // === ORDER ITEMS ===

  async fetchOrderItems(orderId) {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async addOrderItem(itemData) {
    const { data, error } = await supabase
      .from('order_items')
      .insert([itemData])
      .select()
      .single();
    if (error) throw error;
    await this.updateOrderTotals(itemData.order_id);
    return data;
  },

  async updateOrderItem(id, updates, orderId) {
    const { data, error } = await supabase
      .from('order_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    await this.updateOrderTotals(orderId);
    return data;
  },

  async removeOrderItem(id, orderId) {
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await this.updateOrderTotals(orderId);
  }
};
