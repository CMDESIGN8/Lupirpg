import { supabaseClient } from './supabase.js';

export const apiService = {
  // === PLAYER ===
  getPlayer: async (userId) => {
    const { data, error } = await supabaseClient
      .from('players')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  getAvatars: async (userId) => {
    const { data, error } = await supabaseClient
      .from('player_avatars')
      .select('*, avatars(*)')
      .eq('player_id', userId);
    return { data, error };
  },

  getClub: async (userId) => {
    const { data, error } = await supabaseClient
      .from('players')
      .select('club_id')
      .eq('id', userId)
      .single();
    
    if (error || !data?.club_id) return { data: null, error };
    
    const { data: clubData, error: clubError } = await supabaseClient
      .from('clubs')
      .select('*')
      .eq('id', data.club_id)
      .single();
    
    return { data: clubData, error: clubError };
  },

  // === INVENTORY ===
  getInventory: async (userId) => {
    const { data, error } = await supabaseClient
      .from('player_items')
      .select('*, items(*)')
      .eq('player_id', userId);
    return { data, error };
  },

  addItem: async (player_id, item_id) => {
    const { data, error } = await supabaseClient
      .from('player_items')
      .insert([{ player_id, item_id }])
      .select();
    return { data, error };
  },

  equipItem: async (player_item_id, equip) => {
    const { data, error } = await supabaseClient
      .from('player_items')
      .update({ is_equipped: equip })
      .eq('id', player_item_id)
      .select();
    return { data, error };
  },

  // === MISSIONS ===
  getPlayerMissions: async (userId) => {
    const { data, error } = await supabaseClient
      .from('player_missions')
      .select('*, missions(*)')
      .eq('player_id', userId);
    return { data, error };
  },

  getAllMissions: async () => {
    const { data, error } = await supabaseClient
      .from('missions')
      .select('*');
    return { data, error };
  },

  // === ITEMS ===
  getAllItems: async () => {
    const { data, error } = await supabaseClient
      .from('items')
      .select('*');
    return { data, error };
  },
};