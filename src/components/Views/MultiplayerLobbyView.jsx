// src/components/Views/MultiplayerLobbyView.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import LoadingScreen from '../UI/LoadingScreen';
import '../styles/MultiplayerLobby.css';

const MultiplayerLobbyView = ({ currentUser, setView, supabaseClient, playerData, showMessage }) => {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState({});
  const [equippedAvatar, setEquippedAvatar] = useState(null);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [activeChatBubbles, setActiveChatBubbles] = useState({});
  const [isChatFocused, setIsChatFocused] = useState(false);
  
  // Referencias
  const playerPositionRef = useRef({ x: 0, y: 0 });
  const channelRef = useRef(null);
  const cleanupIntervalRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const moveTimeoutRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const chatInputRef = useRef(null);
  const initializationRef = useRef(false);

  // Determinar usuario actual
  const userToUse = currentUser || playerData;

  // Detectar si es móvil
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Obtener avatar equipado
  useEffect(() => {
    const fetchEquippedAvatar = async () => {
      if (!userToUse?.id) return;
      
      try {
        const { data, error } = await supabaseClient
          .from('player_avatars')
          .select(`
            avatar_id,
            avatars (
              image_url,
              name
            )
          `)
          .eq('player_id', userToUse.id)
          .eq('is_equipped', true)
          .single();

        if (!error && data) {
          setEquippedAvatar(data.avatars);
        }
      } catch (error) {
        console.error('Error fetching avatar:', error);
      }
    };

    fetchEquippedAvatar();
  }, [supabaseClient, userToUse]);

  // Función para mostrar burbuja de chat - MEJORADA
  const showChatBubble = useCallback((userId, message, username) => {
    const bubbleId = `${userId}-${Date.now()}`;
    const player = players[userId]?.[0];
    
    if (!player) return;

    setActiveChatBubbles(prev => ({
      ...prev,
      [bubbleId]: {
        userId,
        message,
        username,
        timestamp: Date.now(),
        position: { x: player.x, y: player.y }
      }
    }));

    // Auto-remover la burbuja después de 5 segundos
    setTimeout(() => {
      setActiveChatBubbles(prev => {
        const newBubbles = { ...prev };
        delete newBubbles[bubbleId];
        return newBubbles;
      });
    }, 5000);
  }, [players]);

  // Función para mover al jugador
  const movePlayer = useCallback(async (dx, dy) => {
    if (!userToUse?.id) return;

    const currentPos = playerPositionRef.current;
    let newX = Math.max(0, Math.min(14, currentPos.x + dx));
    let newY = Math.max(0, Math.min(14, currentPos.y + dy));

    if (newX === currentPos.x && newY === currentPos.y) return;

    playerPositionRef.current = { x: newX, y: newY };

    try {
      const { error } = await supabaseClient
        .from('room_players')
        .update({ 
          x: newX, 
          y: newY,
          last_activity: new Date().toISOString()
        })
        .eq('user_id', userToUse.id);

      if (error) {
        console.error('Move error:', error);
        return;
      }

      // Actualizar el estado local
      setPlayers(prev => {
        const currentPlayer = prev[userToUse.id]?.[0];
        if (!currentPlayer) return prev;

        return {
          ...prev,
          [userToUse.id]: [{
            ...currentPlayer,
            x: newX,
            y: newY,
            last_activity: new Date().toISOString()
          }]
        };
      });

    } catch (error) {
      console.error('Move error:', error);
    }
  }, [supabaseClient, userToUse]);

  // Movimiento con teclado - MEJORADO
  const handleKeyDown = useCallback((e) => {
    // Si está escribiendo en el chat, no mover al jugador
    if (isChatFocused) {
      // Solo permitir Escape para salir del chat
      if (e.key === 'Escape') {
        chatInputRef.current?.blur();
        setIsChatFocused(false);
      }
      return;
    }

    // Activar chat con Enter o T
    if (e.key === 'Enter' || e.key === 't' || e.key === 'T') {
      e.preventDefault();
      chatInputRef.current?.focus();
      setIsChatFocused(true);
      return;
    }

    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) return;
    e.preventDefault();

    if (moveTimeoutRef.current) return;

    let dx = 0, dy = 0;

    switch (e.key.toLowerCase()) {
      case 'arrowup':
      case 'w':
        dy = -1;
        break;
      case 'arrowdown':
      case 's':
        dy = 1;
        break;
      case 'arrowleft':
      case 'a':
        dx = -1;
        break;
      case 'arrowright':
      case 'd':
        dx = 1;
        break;
    }

    movePlayer(dx, dy);

    moveTimeoutRef.current = setTimeout(() => {
      moveTimeoutRef.current = null;
    }, 150);
  }, [movePlayer, isChatFocused]);

  // Enviar mensaje de chat - MEJORADO
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !userToUse?.id) {
      console.log('No message to send or no user');
      return;
    }

    console.log('Sending message:', newMessage.trim());

    try {
      const { error } = await supabaseClient
        .from('room_messages')
        .insert({
          user_id: userToUse.id,
          username: userToUse.username || 'Jugador',
          content: newMessage.trim()
        });

      if (error) {
        console.error('Error sending message:', error);
        showMessage('Error al enviar el mensaje: ' + error.message);
        return;
      }

      console.log('Message sent successfully');
      
      // Mostrar burbuja local inmediatamente
      showChatBubble(userToUse.id, newMessage.trim(), userToUse.username);
      
      // Limpiar input
      setNewMessage('');
      
      // Mantener el foco en el input para seguir escribiendo
      setTimeout(() => {
        if (chatInputRef.current) {
          chatInputRef.current.focus();
        }
      }, 10);

    } catch (error) {
      console.error('Error sending message:', error);
      showMessage('Error al enviar el mensaje');
    }
  }, [newMessage, userToUse, supabaseClient, showMessage, showChatBubble]);

  // Manejar envío con Enter - MEJORADO
  const handleKeyDownChat = useCallback((e) => {
    console.log('Key pressed in chat:', e.key);
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Enter pressed, sending message...');
      sendMessage();
    }
    
    // Permitir Escape para salir del chat
    if (e.key === 'Escape') {
      e.preventDefault();
      chatInputRef.current?.blur();
      setIsChatFocused(false);
    }
  }, [sendMessage]);

  // Manejar focus del chat
  const handleChatFocus = useCallback(() => {
    setIsChatFocused(true);
  }, []);

  const handleChatBlur = useCallback(() => {
    setIsChatFocused(false);
  }, []);

  // Configurar Realtime para mensajes
  const setupMessagesRealtime = useCallback(() => {
    console.log('Setting up messages realtime...');

    // Remover canal existente si existe
    if (channelRef.current?.messagesChannel) {
      supabaseClient.removeChannel(channelRef.current.messagesChannel);
    }

    const messagesChannel = supabaseClient.channel('room-messages-realtime');

    messagesChannel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
        },
        (payload) => {
          console.log('New message received via realtime:', payload.new);
          
          // Mostrar burbuja de chat para el mensaje recibido (excepto nuestros propios mensajes)
          if (payload.new.user_id !== userToUse?.id) {
            console.log('Showing chat bubble for other player');
            showChatBubble(
              payload.new.user_id, 
              payload.new.content, 
              payload.new.username
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Messages channel subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to messages realtime');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Messages channel error');
        }
      });

    return messagesChannel;
  }, [supabaseClient, userToUse, showChatBubble]);

  // Controles táctiles para móvil
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const minSwipeDistance = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        movePlayer(deltaX > 0 ? 1 : -1, 0);
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        movePlayer(0, deltaY > 0 ? 1 : -1);
      }
    }

    touchStartRef.current = null;
  }, [movePlayer]);

  // Joystick virtual para móvil
  const renderMobileControls = () => {
    if (!isMobile || !showMobileControls) return null;

    return (
      <div className="mobile-controls-overlay">
        <div className="joystick-container">
          <div className="joystick-area">
            <div className="joystick-background">
              <button 
                className="joystick-btn up"
                onTouchStart={() => movePlayer(0, -1)}
                aria-label="Mover arriba"
              >
                ↑
              </button>
              <div className="joystick-middle-row">
                <button 
                  className="joystick-btn left"
                  onTouchStart={() => movePlayer(-1, 0)}
                  aria-label="Mover izquierda"
                >
                  ←
                </button>
                <div className="joystick-center"></div>
                <button 
                  className="joystick-btn right"
                  onTouchStart={() => movePlayer(1, 0)}
                  aria-label="Mover derecha"
                >
                  →
                </button>
              </div>
              <button 
                className="joystick-btn down"
                onTouchStart={() => movePlayer(0, 1)}
                aria-label="Mover abajo"
              >
                ↓
              </button>
            </div>
          </div>

          <div className="action-buttons-game">
            <button 
              className="action-btn-game menu-btn"
              onClick={() => setShowMobileControls(false)}
              aria-label="Ocultar controles"
            >
              🎮
            </button>
            <button 
              className="action-btn-game exit-btn"
              onClick={() => setView('dashboard')}
              aria-label="Salir"
            >
              🏠
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar burbujas de chat - MEJORADO
  const renderChatBubbles = () => {
    return Object.entries(activeChatBubbles).map(([bubbleId, bubble]) => {
      const player = players[bubble.userId]?.[0];
      if (!player) return null;

      // Posición más precisa cerca de la cabeza del personaje
      return (
        <div
          key={bubbleId}
          className={`chat-bubble ${bubble.userId === userToUse?.id ? 'own-chat-bubble' : 'other-chat-bubble'}`}
          style={{
            left: `${(player.x + 0.5) * 6.66}%`, // Centrado en la celda
            top: `${player.y * 6.66 - 8}%`, // Más cerca de la cabeza
          }}
        >
          <div className="chat-bubble-content">
            {bubble.userId !== userToUse?.id && (
              <div className="chat-bubble-username">{bubble.username}</div>
            )}
            <div className="chat-bubble-message">{bubble.message}</div>
          </div>
          <div className="chat-bubble-tail"></div>
        </div>
      );
    });
  };

  // ... (el resto de las funciones remain igual: joinRoom, leaveRoom, startHeartbeat, startCleanup, setupRealtime)

  // Efecto principal
  useEffect(() => {
    if (!userToUse?.id) {
      showMessage('Error: Usuario no disponible');
      setTimeout(() => setView('dashboard'), 2000);
      return;
    }

    if (initializationRef.current) {
      console.log('Already initializing, skipping...');
      return;
    }

    initializationRef.current = true;
    console.log('Starting room initialization...');

    const initializeRoom = async () => {
      setLoading(true);

      try {
        // 1. Limpiar jugadores desconectados
        const cutoffTime = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        await supabaseClient
          .from('room_players')
          .delete()
          .lt('last_activity', cutoffTime);

        // 2. Unirse a la sala
        const joined = await joinRoom();
        if (!joined) {
          console.log('Failed to join room');
          setLoading(false);
          return;
        }

        // 3. Configurar suscripción en tiempo real
        setupRealtime();

        // 4. Configurar chat en tiempo real
        const messagesChannel = setupMessagesRealtime();
        if (channelRef.current) {
          channelRef.current.messagesChannel = messagesChannel;
        }

        setLoading(false);
        console.log('Room initialization completed');

      } catch (error) {
        console.error('Error initializing room:', error);
        showMessage('Error al inicializar la sala: ' + error.message);
        setLoading(false);
      }
    };

    initializeRoom();

    // Limpieza al desmontar
    return () => {
      console.log('Component unmounting, cleaning up...');
      initializationRef.current = false;
      leaveRoom();
    };
  }, []);

  // Event listeners para teclado y touch - MEJORADO
  useEffect(() => {
    const handleKeyDownWrapper = (e) => handleKeyDown(e);
    
    window.addEventListener('keydown', handleKeyDownWrapper);
    
    if (isMobile) {
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
      window.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDownWrapper);
      if (isMobile) {
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [handleKeyDown, handleTouchStart, handleTouchEnd, isMobile]);

  // Clasificar jugadores
  const classifyPlayers = useCallback(() => {
    const now = new Date();
    const allPlayers = Object.values(players).flat();
    
    const activePlayers = allPlayers.filter(player => {
      if (!player.last_activity) return false;
      return (now - new Date(player.last_activity)) < 60 * 1000;
    });
    
    const inactivePlayers = allPlayers.filter(player => {
      if (!player.last_activity) return false;
      const diff = now - new Date(player.last_activity);
      return diff >= 60 * 1000 && diff < 2 * 60 * 1000;
    });
    
    return { activePlayers, inactivePlayers };
  }, [players]);

  // Renderizar celda del mapa
  const renderMapCell = (x, y) => {
    const { activePlayers } = classifyPlayers();
    const playersInCell = activePlayers.filter(player => 
      player.x === x && player.y === y
    );
    
    return (
      <div 
        key={`${x}-${y}`} 
        className={`lobby-map-cell ${playersInCell.length > 0 ? 'occupied' : ''}`}
      >
        {playersInCell.length > 0 && (
          <div className="lobby-players-in-cell">
            {playersInCell.map(player => (
              <div 
                key={player.user_id}
                className={`lobby-player-marker ${player.user_id === userToUse?.id ? 'my-player' : 'other-player'}`}
                title={`${player.username} (${player.x}, ${player.y})`}
              >
                {player.avatar_url ? (
                  <img 
                    src={player.avatar_url} 
                    alt={player.username}
                    className="lobby-player-avatar"
                    onError={(e) => {
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                ) : (
                  <div className="lobby-player-initial">
                    {player.username?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="lobby-player-name-tag">
                  {player.username}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <LoadingScreen message="Conectando al Mundo Lupi..." />;
  }

  if (!userToUse) {
    return (
      <div className="lobby-error-container">
        <h2>Error</h2>
        <p>No se pudo cargar la información del usuario.</p>
        <button onClick={() => setView('dashboard')} className="lobby-back-btn">
          Volver al Dashboard
        </button>
      </div>
    );
  }

  const { activePlayers } = classifyPlayers();

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>🏟️ Mundo Lupi</h1>
        <p>¡Muévete con las flechas del teclado y chatea con otros jugadores!</p>
        <div className="lobby-info">
          <span>Jugadores activos: {activePlayers.length}</span>
          <span>Tu posición: ({playerPositionRef.current.x}, {playerPositionRef.current.y})</span>
          
          <div className="lobby-control-buttons">
            {isMobile && (
              <button 
                onClick={() => setShowMobileControls(!showMobileControls)}
                className="lobby-mobile-controls-btn"
              >
                {showMobileControls ? '❌ Controles' : '🎮 Controles'}
              </button>
            )}
            
            <button onClick={() => setView('dashboard')} className="lobby-back-btn">
              🏠 Salir
            </button>
          </div>
        </div>
      </div>

      <div className="lobby-map-container">
        <div className="lobby-game-map">
          {renderChatBubbles()}
          
          {Array.from({ length: 15 }, (_, y) => (
            <div key={y} className="lobby-map-row">
              {Array.from({ length: 15 }, (_, x) => renderMapCell(x, y))}
            </div>
          ))}
        </div>
      </div>

      {/* Input de chat fijo - MEJORADO */}
      <div className="lobby-chat-input-container">
        <input
          ref={chatInputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDownChat}
          onFocus={handleChatFocus}
          onBlur={handleChatBlur}
          placeholder={isChatFocused ? "Escribe tu mensaje..." : "Presiona Enter o T para chatear..."}
          className="lobby-chat-input"
          maxLength={100}
        />
        <button 
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          className="lobby-chat-send-btn"
        >
          💬
        </button>
      </div>

      {renderMobileControls()}

      <div className="lobby-players-panel">
        <h3>👥 Jugadores en Línea ({activePlayers.length})</h3>
        <div className="lobby-players-list">
          {activePlayers.map(player => (
            <div 
              key={player.user_id} 
              className={`lobby-player-item ${player.user_id === userToUse.id ? 'current-player' : ''}`}
            >
              <div className="lobby-player-info">
                {player.avatar_url && (
                  <img 
                    src={player.avatar_url} 
                    alt="Avatar"
                    className="lobby-player-avatar-small"
                  />
                )}
                <span className="lobby-player-name">{player.username}</span>
                {player.user_id === userToUse.id && <span className="lobby-you-badge">(Tú)</span>}
              </div>
              <div className="lobby-player-position">
                ({player.x}, {player.y})
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lobby-controls-help">
        <p>
          {isMobile 
            ? '🕹️ Desliza para moverte | 💬 Toca abajo para chatear' 
            : `🕹️ Flechas/WASD para moverte | 💬 ${isChatFocused ? 'Enter para enviar, Escape para salir' : 'Enter o T para chatear'}`}
        </p>
      </div>
    </div>
  );
};

export default MultiplayerLobbyView;