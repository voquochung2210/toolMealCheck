import { supabase } from '../lib/supabaseClient';

export const shopService = {
  // === SHOPS ===
  
  async fetchShops() {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data;
  },

  async createShop(shopData) {
    // Check for duplicate name
    if (shopData.name) {
      const { data: existing } = await supabase
        .from('shops')
        .select('id')
        .eq('is_active', true)
        .ilike('name', shopData.name.trim())
        .maybeSingle();
        
      if (existing) {
        throw new Error(`Tiệm "${shopData.name}" đã tồn tại.`);
      }
    }

    // Check for duplicate code
    if (shopData.code) {
      const { data: existingCode } = await supabase
        .from('shops')
        .select('id')
        .eq('is_active', true)
        .ilike('code', shopData.code.trim())
        .maybeSingle();
        
      if (existingCode) {
        throw new Error(`Mã tiệm "${shopData.code}" đã tồn tại.`);
      }
    }

    const { data, error } = await supabase
      .from('shops')
      .insert([shopData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateShop(id, updates) {
    // Check for duplicate name if name is being updated
    if (updates.name) {
      const { data: existing } = await supabase
        .from('shops')
        .select('id')
        .eq('is_active', true)
        .ilike('name', updates.name.trim())
        .neq('id', id)
        .maybeSingle();
        
      if (existing) {
        throw new Error(`Tiệm "${updates.name}" đã tồn tại.`);
      }
    }

    // Check for duplicate code if code is being updated
    if (updates.code) {
      const { data: existingCode } = await supabase
        .from('shops')
        .select('id')
        .eq('is_active', true)
        .ilike('code', updates.code.trim())
        .neq('id', id)
        .maybeSingle();
        
      if (existingCode) {
        throw new Error(`Mã tiệm "${updates.code}" đã tồn tại.`);
      }
    }

    const { data, error } = await supabase
      .from('shops')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteShop(id) {
    // Check if shop is used in any active order
    const { data: activeOrders, error: checkError } = await supabase
      .from('orders')
      .select('id')
      .eq('shop_id', id)
      .in('status', ['open', 'locked'])
      .limit(1);
      
    if (checkError) throw checkError;
    if (activeOrders && activeOrders.length > 0) {
      throw new Error('Không thể xóa tiệm vì đang có order hoạt động sử dụng tiệm này.');
    }

    const { data, error } = await supabase
      .from('shops')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // === MENU ITEMS ===
  
  async fetchMenuItems(shopId) {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .order('category')
      .order('name');
    if (error) throw error;
    return data;
  },

  async createMenuItem(itemData) {
    // Check duplicate name
    if (itemData.name) {
      const { data: existing } = await supabase
        .from('menu_items')
        .select('id')
        .eq('shop_id', itemData.shop_id)
        .eq('is_active', true)
        .ilike('name', itemData.name.trim())
        .maybeSingle();
        
      if (existing) {
        throw new Error(`Món "${itemData.name}" đã tồn tại trong menu.`);
      }
    }

    // Check duplicate code
    if (itemData.code) {
      const { data: existingCode } = await supabase
        .from('menu_items')
        .select('id')
        .eq('shop_id', itemData.shop_id)
        .eq('is_active', true)
        .ilike('code', itemData.code.trim())
        .maybeSingle();
        
      if (existingCode) {
        throw new Error(`Mã món "${itemData.code}" đã tồn tại trong menu.`);
      }
    }

    const { data, error } = await supabase
      .from('menu_items')
      .insert([itemData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateMenuItem(id, updates, shopId) {
    // Check duplicate name if name is being updated
    let currentShopId = shopId;
    if (!currentShopId) {
      const { data: currentItem } = await supabase.from('menu_items').select('shop_id').eq('id', id).single();
      if (currentItem) currentShopId = currentItem.shop_id;
    }

    if (updates.name && currentShopId) {
      const { data: existing } = await supabase
        .from('menu_items')
        .select('id')
        .eq('shop_id', currentShopId)
        .eq('is_active', true)
        .ilike('name', updates.name.trim())
        .neq('id', id)
        .maybeSingle();
        
      if (existing) {
        throw new Error(`Món "${updates.name}" đã tồn tại trong menu.`);
      }
    }

    // Check duplicate code if code is being updated
    if (updates.code && currentShopId) {
      const { data: existingCode } = await supabase
        .from('menu_items')
        .select('id')
        .eq('shop_id', currentShopId)
        .eq('is_active', true)
        .ilike('code', updates.code.trim())
        .neq('id', id)
        .maybeSingle();
        
      if (existingCode) {
        throw new Error(`Mã món "${updates.code}" đã tồn tại trong menu.`);
      }
    }

    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteMenuItem(id) {
    // 1. Get the menu item to find its shop_id and name
    const { data: menuItem, error: fetchError } = await supabase
      .from('menu_items')
      .select('shop_id, name')
      .eq('id', id)
      .single();
      
    if (fetchError) throw fetchError;

    // 2. Check if there are active orders for this shop
    const { data: activeOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('shop_id', menuItem.shop_id)
      .in('status', ['open', 'locked']);
      
    if (ordersError) throw ordersError;
    
    if (activeOrders && activeOrders.length > 0) {
      const activeOrderIds = activeOrders.map(o => o.id);
      // 3. Check if any order_item in these active orders uses this drink_name
      const { data: activeOrderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('id')
        .in('order_id', activeOrderIds)
        .eq('drink_name', menuItem.name)
        .limit(1);
        
      if (itemsError) throw itemsError;
      
      if (activeOrderItems && activeOrderItems.length > 0) {
         throw new Error(`Không thể xóa món "${menuItem.name}" vì đang được người khác đăng ký trong một order hoạt động.`);
      }
    }

    const { data, error } = await supabase
      .from('menu_items')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
