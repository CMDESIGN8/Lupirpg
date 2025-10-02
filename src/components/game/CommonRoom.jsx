// components/CommonRoom/CommonRoom.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useRoom } from '../../hooks/useRoom'
import '../styles/CommonRoom.css'

const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  const {
    onlineUsers,
    messages,
    currentUser: roomUser,
    isLoading,
    enterRoom,
    leaveRoom,
    updatePosition,
    sendMessage
  } = useRoom(currentUser)

  const [messageInput, setMessageInput] = useState('')
  const [keys, setKeys] = useState({})
  const messagesEndRef = useRef(null)

  useEffect(() => {
    enterRoom()
    return () => {
      leaveRoom()
    }
  }, [])

  // Efectos para movimiento, mensajes, etc. (igual que antes)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const handleKeyDown = (e) => {
      setKeys(prev => ({ ...prev, [e.key]: true }))
    }

    const handleKeyUp = (e) => {
      setKeys(prev => ({ ...prev, [e.key]: false }))
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useEffect(() => {
    if (!roomUser || !keys.ArrowUp && !keys.ArrowDown && !keys.ArrowLeft && !keys.ArrowRight) return

    const moveSpeed = 5
    const moveInterval = setInterval(() => {
      let newX = roomUser.x
      let newY = roomUser.y
      let direction = roomUser.direction

      if (keys.ArrowUp) {
        newY -= moveSpeed
        direction = 'up'
      }
      if (keys.ArrowDown) {
        newY += moveSpeed
        direction = 'down'
      }
      if (keys.ArrowLeft) {
        newX -= moveSpeed
        direction = 'left'
      }
      if (keys.ArrowRight) {
        newX += moveSpeed
        direction = 'right'
      }

      newX = Math.max(0, Math.min(newX, 800))
      newY = Math.max(0, Math.min(newY, 600))

      if (newX !== roomUser.x || newY !== roomUser.y) {
        updatePosition(newX, newY, direction)
      }
    }, 50)

    return () => clearInterval(moveInterval)
  }, [keys, roomUser, updatePosition])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (messageInput.trim()) {
      sendMessage(messageInput)
      setMessageInput('')
    }
  }

  if (isLoading) {
    return (
      <div className="common-room-fullscreen">
        <div className="common-room-loading">
          <div className="loading-spinner"></div>
          <p>Entrando a la sala común...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="common-room-fullscreen">
      <div className="common-room-container">
        {/* Header */}
        <div className="common-room-header">
          <h2>Sala Común - LUPI SPORTS RPG</h2>
          <button className="close-button" onClick={onClose}>
            ← Volver al Dashboard
          </button>
        </div>

        <div className="common-room-content">
          {/* Área del juego - ahora más grande */}
          <div className="game-area">
            <div className="game-map">
              {/* Renderizar usuarios */}
              {onlineUsers.map(user => (
                <div
                  key={user.id}
                  className={`player-character ${user.id === roomUser?.id ? 'current-player' : ''}`}
                  style={{
                    left: user.x,
                    top: user.y,
                    backgroundColor: user.color
                  }}
                  data-direction={user.direction}
                >
                  <div className="player-name">{user.name}</div>
                  <div className="player-avatar">👤</div>
                </div>
              ))}

              {/* Elementos del mapa */}
              <div className="map-object npc" style={{ left: 200, top: 150 }}>
                <div className="npc-avatar">🧙</div>
                <div className="npc-name">NPC 1</div>
              </div>

              <div className="map-object game-machine" style={{ left: 400, top: 300 }}>
                <div className="machine-avatar">🎮</div>
                <div className="machine-name">Mini Juego</div>
              </div>
            </div>
          </div>

          {/* Panel lateral */}
          <div className="side-panel">
            <div className="online-users">
              <h3>Usuarios Online ({onlineUsers.length})</h3>
              <div className="users-list">
                {onlineUsers.map(user => (
                  <div key={user.id} className="user-item">
                    <div 
                      className="user-color" 
                      style={{ backgroundColor: user.color }}
                    ></div>
                    <span className="user-name">{user.name}</span>
                    <span className="user-sport">{user.sport}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="room-chat">
              <h3>Chat de la Sala</h3>
              <div className="chat-messages">
                {messages.map(message => (
                  <div key={message.id} className="chat-message">
                    <strong>{message.user?.username || 'Usuario'}:</strong>
                    <span>{message.content}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  maxLength={200}
                />
                <button type="submit">Enviar</button>
              </form>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="room-controls">
          <div className="controls-info">
            <p>Usa las flechas para moverte • Espacio para interactuar</p>
          </div>
          <div className="user-info">
            {roomUser && (
              <span>
                Conectado como: <strong>{roomUser.name}</strong>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommonRoom