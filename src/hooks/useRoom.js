// hooks/useRoom.js
import { useState, useEffect, useCallback } from 'react'
import { roomService } from '../services/roomService'
import { supabaseClient } from '../services/supabase'

export const useRoom = (user) => {
  const [onlineUsers, setOnlineUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  // Entrar a la sala
  const enterRoom = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const userData = {
        user_id: user.id,
        name: user.user_metadata?.username || user.email?.split('@')[0] || 'Usuario',
        color: '#2E8B57',
        x: Math.floor(Math.random() * 10) * 50,
        y: Math.floor(Math.random() * 8) * 50,
        avatar_url: user.user_metadata?.avatar_url || '',
        sport: user.user_metadata?.sport || 'fútbol'
      }

      const roomUser = await roomService.enterRoom(userData)
      setCurrentUser(roomUser)
      
      // Cargar usuarios online y mensajes
      const [users, roomMessages] = await Promise.all([
        roomService.getOnlineUsers(),
        roomService.getRoomMessages()
      ])
      
      setOnlineUsers(users)
      setMessages(roomMessages)
    } catch (error) {
      console.error('Error al entrar a la sala:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Salir de la sala
  const leaveRoom = useCallback(async () => {
    if (user) {
      await roomService.leaveRoom(user.id)
    }
    setCurrentUser(null)
    setOnlineUsers([])
    setMessages([])
  }, [user])

  // Actualizar posición
  const updatePosition = useCallback(async (x, y, direction) => {
    if (user && currentUser) {
      await roomService.updateUserPosition(user.id, x, y, direction)
    }
  }, [user, currentUser])

  // Enviar mensaje
  const sendMessage = useCallback(async (content) => {
    if (user && content.trim()) {
      const newMessage = await roomService.sendMessage(user.id, content.trim())
      setMessages(prev => [...prev, newMessage])
    }
  }, [user])

  // Efecto para suscripción en tiempo real
  useEffect(() => {
    if (!user) return

    const subscription = roomService.subscribeToRoomChanges((payload) => {
      if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
        setOnlineUsers(prev => {
          const existing = prev.find(u => u.id === payload.new.id)
          if (existing) {
            return prev.map(u => u.id === payload.new.id ? payload.new : u)
          } else {
            return [...prev, payload.new]
          }
        })
      } else if (payload.eventType === 'DELETE') {
        setOnlineUsers(prev => prev.filter(u => u.id !== payload.old.id))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  // Suscripción a mensajes en tiempo real
  useEffect(() => {
    const subscription = supabaseClient
      .channel('room_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages'
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    onlineUsers,
    messages,
    currentUser,
    isLoading,
    enterRoom,
    leaveRoom,
    updatePosition,
    sendMessage
  }
}