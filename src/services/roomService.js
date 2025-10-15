// services/roomService.js
import { supabaseClient } from './supabase'

export const roomService = {
  // Obtener usuarios en la sala
  async getOnlineUsers() {
    const { data, error } = await supabaseClient
      .from('room_users')
      .select('*')
      .eq('is_online', true)
      .order('joined_at', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Entrar a la sala
  async enterRoom(userData) {
    const { data: existingUser } = await supabaseClient
      .from('room_users')
      .select('*')
      .eq('user_id', userData.user_id)
      .single()

    if (existingUser) {
      // Actualizar si ya existe
      const { data, error } = await supabaseClient
        .from('room_users')
        .update({
          is_online: true,
          last_activity: new Date().toISOString(),
          x: 0,
          y: 0,
          direction: 'down'
        })
        .eq('user_id', userData.user_id)
        .select()
      
      if (error) throw error
      return data[0]
    } else {
      // Crear nuevo registro
      const { data, error } = await supabaseClient
        .from('room_users')
        .insert([userData])
        .select()
      
      if (error) throw error
      return data[0]
    }
  },

  // Salir de la sala
  async leaveRoom(userId) {
    const { error } = await supabaseClient
      .from('room_users')
      .update({ 
        is_online: false,
        last_activity: new Date().toISOString()
      })
      .eq('user_id', userId)
    
    if (error) throw error
  },

  // Actualizar posición del usuario
  async updateUserPosition(userId, x, y, direction = 'down') {
    const { error } = await supabaseClient
      .from('room_users')
      .update({ 
        x, 
        y, 
        direction,
        last_activity: new Date().toISOString()
      })
      .eq('user_id', userId)
    
    if (error) throw error
  },

  // Suscribirse a cambios en tiempo real
  subscribeToRoomChanges(callback) {
    return supabaseClient
      .channel('room_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_users'
        },
        callback
      )
      .subscribe()
  },

  // Enviar mensaje al chat de la sala
  async sendMessage(userId, content) {
    const { data, error } = await supabaseClient
      .from('room_messages')
      .insert([{
        user_id: userId,
        content: content
      }])
      .select(`
        *,
        user:user_id(username)
      `)
    
    if (error) throw error
    return data[0]
  },

  // Obtener mensajes del chat
  async getRoomMessages() {
    const { data, error } = await supabaseClient
      .from('room_messages')
      .select(`
        *,
        user:user_id(username)
      `)
      .order('created_at', { ascending: true })
      .limit(50)
    
    if (error) throw error
    return data
  }
}