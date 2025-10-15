// src/services/avatarService.js - Versión corregida
import { supabaseClient } from './supabase';

export const avatarService = {
  // Obtener avatar equipado (versión corregida)
  getEquippedAvatar: async (playerId) => {
    try {
      // Primero verifica si existe la relación
      const { data, error } = await supabaseClient
        .from('player_avatars')
        .select(`
          *,
          avatars (*)
        `)
        .eq('player_id', playerId)
        .eq('is_equipped', true)
        .maybeSingle(); // Usa maybeSingle en lugar de single
        
      if (error) {
        console.warn('Error fetching equipped avatar:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getEquippedAvatar:', error);
      return null;
    }
  },

  // Obtener avatares de jugador (versión corregida)
  getPlayerAvatars: async (playerId) => {
    try {
      const { data, error } = await supabaseClient
        .from('player_avatars')
        .select(`
          *,
          avatars (*)
        `)
        .eq('player_id', playerId);
        
      if (error) {
        console.warn('Error fetching player avatars:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getPlayerAvatars:', error);
      return [];
    }
  },

  // Obtener todos los avatares (versión simple)
  getAllAvatars: async () => {
    try {
      const { data, error } = await supabaseClient
        .from('avatars')
        .select('*')
        .order('price', { ascending: true });
        
      if (error) {
        console.warn('Error fetching all avatars:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getAllAvatars:', error);
      return [];
    }
  },

  // Comprar avatar (con mejor manejo de errores)
  purchaseAvatar: async (playerId, avatarId) => {
    try {
      // Verificar si el avatar existe
      const { data: avatar, error: avatarError } = await supabaseClient
        .from('avatars')
        .select('price, required_level')
        .eq('id', avatarId)
        .maybeSingle();
        
      if (avatarError || !avatar) {
        throw new Error('Avatar no encontrado');
      }

      // Verificar nivel del jugador
      const { data: player, error: playerError } = await supabaseClient
        .from('players')
        .select('lupi_coins, level')
        .eq('id', playerId)
        .single();
        
      if (playerError) throw playerError;

      if (player.level < avatar.required_level) {
        throw new Error(`Nivel requerido: ${avatar.required_level}`);
      }

      if (player.lupi_coins < avatar.price) {
        throw new Error('LupiCoins insuficientes');
      }

      // Insertar en player_avatars
      const { data, error } = await supabaseClient
        .from('player_avatars')
        .insert([{ 
          player_id: playerId, 
          avatar_id: avatarId 
        }])
        .select()
        .maybeSingle();
        
      if (error) throw error;

      // Actualizar LupiCoins
      await supabaseClient
        .from('players')
        .update({ lupi_coins: player.lupi_coins - avatar.price })
        .eq('id', playerId);

      return data;
    } catch (error) {
      console.error('Error in purchaseAvatar:', error);
      throw error;
    }
  },

  // Equipar avatar (versión robusta)
  equipAvatar: async (playerId, avatarId) => {
    try {
      // Primero verificar que el jugador posee el avatar
      const { data: ownership, error: ownershipError } = await supabaseClient
        .from('player_avatars')
        .select('id')
        .eq('player_id', playerId)
        .eq('avatar_id', avatarId)
        .maybeSingle();
        
      if (ownershipError || !ownership) {
        throw new Error('No posees este avatar');
      }

      // Transacción: desequipar todos, luego equipar el seleccionado
      const { error: unequipError } = await supabaseClient
        .from('player_avatars')
        .update({ is_equipped: false })
        .eq('player_id', playerId);
        
      if (unequipError) throw unequipError;

      const { data, error } = await supabaseClient
        .from('player_avatars')
        .update({ is_equipped: true })
        .eq('player_id', playerId)
        .eq('avatar_id', avatarId)
        .select()
        .maybeSingle();
        
      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error in equipAvatar:', error);
      throw error;
    }
  }
};