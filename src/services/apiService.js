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
      .from('avatars')
      .select('*')
      .eq('player_id', userId);
    return { data, error };
  },

  getClub: async (userId) => {
    const { data, error } = await supabaseClient
      .from('club_members')
      .select('clubs(*)')
      .eq('player_id', userId)
      .single();
    return { data: data?.clubs, error };
  },

  // === INVENTORY ===
  getInventory: async (userId) => {
    const { data, error } = await supabaseClient
      .from('player_inventory')
      .select('*, items(*)')
      .eq('player_id', userId);
    return { data, error };
  },

  addItem: async (player_id, item_id) => {
    const { data, error } = await supabaseClient
      .from('player_inventory')
      .insert([{ player_id, item_id }])
      .select();
    return { data, error };
  },

  equipItem: async (player_item_id, equip) => {
    const { data, error } = await supabaseClient
      .from('player_inventory')
      .update({ equipped: equip })
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