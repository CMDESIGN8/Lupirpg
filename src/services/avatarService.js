import { supabaseClient } from './supabase';

export const avatarService = {
  // Obtener todos los avatares disponibles
  getAllAvatars: async () => {
    const { data, error } = await supabaseClient
      .from('avatars')
      .select('*')
      .order('price', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Obtener avatares de un jugador
  getPlayerAvatars: async (playerId) => {
    const { data, error } = await supabaseClient
      .from('player_avatars')
      .select(`
        *,
        avatars (*)
      `)
      .eq('player_id', playerId);
    
    if (error) throw error;
    return data;
  },

  // Comprar un avatar
  purchaseAvatar: async (playerId, avatarId) => {
    const { data: avatar, error: avatarError } = await supabaseClient
      .from('avatars')
      .select('price')
      .eq('id', avatarId)
      .single();
    
    if (avatarError) throw avatarError;

    // Verificar si el jugador tiene suficientes LupiCoins
    const { data: player, error: playerError } = await supabaseClient
      .from('players')
      .select('lupi_coins')
      .eq('id', playerId)
      .single();
    
    if (playerError) throw playerError;

    if (player.lupi_coins < avatar.price) {
      throw new Error('No tienes suficientes LupiCoins');
    }

    // Realizar la compra
    const { data, error } = await supabaseClient
      .from('player_avatars')
      .insert([{ player_id: playerId, avatar_id: avatarId }])
      .select(`
        *,
        avatars (*)
      `)
      .single();
    
    if (error) throw error;

    // Descontar los LupiCoins
    await supabaseClient
      .from('players')
      .update({ lupi_coins: player.lupi_coins - avatar.price })
      .eq('id', playerId);

    return data;
  },

  // Equipar un avatar
  equipAvatar: async (playerId, avatarId) => {
    // Primero, desequipar todos los avatares
    await supabaseClient
      .from('player_avatars')
      .update({ is_equipped: false })
      .eq('player_id', playerId);

    // Luego, equipar el avatar seleccionado
    const { data, error } = await supabaseClient
      .from('player_avatars')
      .update({ is_equipped: true })
      .eq('player_id', playerId)
      .eq('avatar_id', avatarId)
      .select(`
        *,
        avatars (*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Obtener avatar equipado
  getEquippedAvatar: async (playerId) => {
    const { data, error } = await supabaseClient
      .from('player_avatars')
      .select(`
        *,
        avatars (*)
      `)
      .eq('player_id', playerId)
      .eq('is_equipped', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // Ignorar si no encuentra
    return data;
  }
};