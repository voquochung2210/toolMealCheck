import { supabase } from '../lib/supabaseClient';

export const qrService = {
  async getMyQRProfile(userId) {
    const { data, error } = await supabase
      .from('user_qr_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Tránh lỗi throw nếu không tìm thấy
      
    if (error) throw error;
    return data;
  },

  async saveQRProfile(profileData) {
    // Dùng upsert dựa trên user_id (unique constraint)
    const { data, error } = await supabase
      .from('user_qr_profiles')
      .upsert(
        { ...profileData, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async deleteQRProfile(userId) {
    const { error } = await supabase
      .from('user_qr_profiles')
      .delete()
      .eq('user_id', userId);
      
    if (error) throw error;
  }
};
