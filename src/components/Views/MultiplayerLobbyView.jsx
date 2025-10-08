import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import LoadingScreen from '../UI/LoadingScreen';
import '../styles/MultiplayerLobby.css';

const MultiplayerLobbyView = ({ currentUser, setView, supabaseClient, playerData, showMessage }) => {
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [player, setPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [newMessage, setNewMessage] = useState('');
  const [activeChatBubbles, setActiveChatBubbles] = useState({});
  const [showMobileControls, setShowMobileControls] = useState(false);
  
  // Referencias
  const keys = useRef({});
  const movementInterval = useRef(null);
  const chatInputRef = useRef(null);
  const gameContainerRef = useRef(null);
  const initializationRef = useRef(false);

  // Determinar usuario actual
  const userToUse = currentUser || playerData;

  // Detectar si es móvil
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Función para mostrar burbuja de chat
  const showChatBubble = useCallback((userId, message, username) => {
    const bubbleId = `${userId}-${Date.now()}`;
    
    const playerData = players.find(p => p.userId === userId);
    if (!playerData) return;

    setActiveChatBubbles(prev => ({
      ...prev,
      [bubbleId]: {
        userId,
        message,
        username,
        timestamp: Date.now(),
        position: { x: playerData.x, y: playerData.y }
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

  // Conectar al servidor Socket.IO - AJUSTADO PARA TU BACKEND
  useEffect(() => {
    if (!userToUse?.id) {
      showMessage('Error: Usuario no disponible');
      setTimeout(() => setView('dashboard'), 2000);
      return;
    }

    if (initializationRef.current) {
      console.log('⚠️ Ya está inicializando, omitiendo...');
      return;
    }

    initializationRef.current = true;
    console.log('🔗 Iniciando conexión al servidor MMORPG...');

    const connectToServer = async () => {
      try {
        console.log('🔗 Conectando al servidor MMORPG...');
        
        // Health check simplificado para tu backend
        try {
          const healthCheck = await fetch('https://lupirpgbackend.onrender.com/');
          if (healthCheck.ok) {
            console.log('✅ Servidor backend disponible');
          }
        } catch (error) {
          console.warn('⚠️ Health check falló, pero intentando conectar de todos modos:', error.message);
        }

        // Configuración de Socket.IO para tu backend
        const newSocket = io('https://lupirpgbackend.onrender.com', {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          forceNew: true
        });

        setSocket(newSocket);

        // Listeners de conexión
        newSocket.on('connect', () => {
          console.log('✅ Conectado al servidor MMORPG, Socket ID:', newSocket.id);
          setConnectionStatus('connected');
          
          // Unirse al juego usando el evento que tu backend espera: "newPlayer"
          const userData = {
            userId: userToUse.id,
            username: userToUse.username || userToUse.email?.split('@')[0] || `Jugador_${Date.now()}`,
            x: Math.floor(Math.random() * 400) + 100, // Posición inicial aleatoria
            y: Math.floor(Math.random() * 400) + 100,
            avatar_url: userToUse.avatar_url || null
          };
          
          console.log('🎮 Enviando newPlayer:', userData);
          newSocket.emit('newPlayer', userData);
        });

        newSocket.on('disconnect', (reason) => {
          console.log('❌ Desconectado del servidor:', reason);
          setConnectionStatus('disconnected');
          showMessage('Desconectado del servidor');
          if (reason === 'io server disconnect') {
            newSocket.connect();
          }
        });

        newSocket.on('connect_error', (error) => {
          console.error('❌ Error de conexión:', error);
          setConnectionStatus('error');
          showMessage('Error de conexión con el servidor: ' + error.message);
        });

        newSocket.on('reconnect', (attemptNumber) => {
          console.log('🔁 Reconectado al servidor, intento:', attemptNumber);
          setConnectionStatus('connected');
          showMessage('Reconectado al servidor');
        });

        // LISTENERS ESPECÍFICOS PARA TU BACKEND

        // Actualización de jugadores - Tu backend emite "updatePlayers"
        newSocket.on('updatePlayers', (playersData) => {
          console.log('👥 Lista de jugadores actualizada:', Object.values(playersData).length);
          const playersArray = Object.values(playersData);
          setPlayers(playersArray);
          
          // Encontrar nuestro jugador actual
          const currentPlayer = playersArray.find(p => p.userId === userToUse.id);
          if (currentPlayer && !player) {
            console.log('✅ Jugador identificado:', currentPlayer);
            setPlayer(currentPlayer);
            setConnectionStatus('ready');
            setLoading(false);
            showMessage(`¡Bienvenido a LupiRPG, ${currentPlayer.username}!`);
          }
        });

        // Mensajes de chat - Tu backend emite "chatMessage"
        newSocket.on('chatMessage', (messageData) => {
          console.log('💬 Mensaje recibido:', messageData);
          setChatMessages(prev => {
            const newMessages = [...prev, {
              user: messageData.user,
              message: messageData.message,
              timestamp: new Date().toLocaleTimeString(),
              level: 0
            }];
            return newMessages.slice(-50);
          });
          
          // Mostrar burbuja de chat
          const sender = Object.values(players).find(p => p.username === messageData.user);
          if (sender && sender.userId !== userToUse.id) {
            showChatBubble(sender.userId, messageData.message, messageData.user);
          }
        });

        // Timeout para conexión inicial
        const connectionTimeout = setTimeout(() => {
          if (loading) {
            console.log('⏰ Timeout de conexión');
            setConnectionStatus('error');
            showMessage('Timeout al conectar con el servidor');
            setLoading(false);
          }
        }, 15000);

        return () => clearTimeout(connectionTimeout);

      } catch (error) {
        console.error('❌ Error en la conexión:', error);
        setConnectionStatus('error');
        showMessage('Error al conectar con el servidor MMORPG');
        setLoading(false);
      }
    };

    connectToServer();

    // Limpieza al desmontar
    return () => {
      console.log('🧹 Componente desmontándose, limpiando...');
      initializationRef.current = false;
      
      if (movementInterval.current) {
        clearInterval(movementInterval.current);
        movementInterval.current = null;
      }
      
      if (socket) {
        console.log('🔌 Desconectando socket...');
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [userToUse?.id, setView, showMessage, loading]);

  // Sistema de movimiento - AJUSTADO PARA TU BACKEND
  const handleKeyDown = useCallback((e) => {
    if (document.activeElement === chatInputRef.current) {
      return;
    }

    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
      e.preventDefault();
    }

    keys.current[key] = true;
  }, []);

  const handleKeyUp = useCallback((e) => {
    const key = e.key.toLowerCase();
    keys.current[key] = false;
  }, []);

  // Loop de movimiento - ENVIANDO SOLO X,Y COMO TU BACKEND ESPERA
  useEffect(() => {
    if (!socket || !player) return;

    const handleMovement = () => {
      if (!keys.current || !player) return;

      let newX = player.x;
      let newY = player.y;
      let isMoving = false;

      // Movimiento con WASD o flechas
      if (keys.current['w'] || keys.current['arrowup']) {
        newY -= 5;
        isMoving = true;
      }
      if (keys.current['s'] || keys.current['arrowdown']) {
        newY += 5;
        isMoving = true;
      }
      if (keys.current['a'] || keys.current['arrowleft']) {
        newX -= 5;
        isMoving = true;
      }
      if (keys.current['d'] || keys.current['arrowright']) {
        newX += 5;
        isMoving = true;
      }

      // Limitar al mundo (ajusta según necesites)
      const worldWidth = 800;
      const worldHeight = 600;
      newX = Math.max(0, Math.min(worldWidth - 50, newX));
      newY = Math.max(0, Math.min(worldHeight - 50, newY));

      if (newX !== player.x || newY !== player.y) {
        const updatedPlayer = { ...player, x: newX, y: newY, isMoving };
        setPlayer(updatedPlayer);
        
        // Enviar movimiento - SOLO X,Y como tu backend espera
        socket.emit('move', {
          x: newX,
          y: newY
        });
      }
    };

    movementInterval.current = setInterval(handleMovement, 16);

    return () => {
      if (movementInterval.current) {
        clearInterval(movementInterval.current);
        movementInterval.current = null;
      }
    };
  }, [socket, player]);

  // Event listeners para teclado
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Enviar mensaje de chat - AJUSTADO PARA TU BACKEND
  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !socket) {
      console.log('No message to send or no socket');
      return;
    }

    console.log('Enviando mensaje:', newMessage.trim());
    
    // Mostrar burbuja local inmediatamente
    if (player) {
      showChatBubble(player.userId, newMessage.trim(), player.username);
    }

    // Tu backend espera solo el mensaje como string
    socket.emit('chatMessage', newMessage.trim());
    setNewMessage('');
    
    if (chatInputRef.current) {
      setTimeout(() => {
        chatInputRef.current.focus();
      }, 100);
    }
  }, [newMessage, socket, player, showChatBubble]);

  // Manejar envío con Enter
  const handleKeyDownChat = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Función para salir correctamente
  const handleExit = useCallback(() => {
    console.log('🚪 Saliendo del MMORPG...');
    
    if (movementInterval.current) {
      clearInterval(movementInterval.current);
      movementInterval.current = null;
    }
    
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    setView('dashboard');
  }, [socket, setView]);

  // Joystick virtual para móvil
  const renderMobileControls = () => {
    if (!isMobile || !showMobileControls) return null;

    const move = (dx, dy) => {
      if (!player || !socket) return;
      
      const newX = Math.max(0, Math.min(800 - 50, player.x + dx * 25));
      const newY = Math.max(0, Math.min(600 - 50, player.y + dy * 25));
      
      setPlayer(prev => ({ ...prev, x: newX, y: newY, isMoving: true }));
      
      socket.emit('move', {
        x: newX,
        y: newY
      });

      setTimeout(() => {
        if (socket && player) {
          setPlayer(prev => ({ ...prev, isMoving: false }));
        }
      }, 200);
    };

    return (
      <div className="mobile-controls-overlay">
        <div className="joystick-container">
          <div className="joystick-area">
            <div className="joystick-background">
              <button 
                className="joystick-btn up"
                onTouchStart={() => move(0, -1)}
                onTouchEnd={() => {}}
                aria-label="Mover arriba"
              >
                ↑
              </button>
              <div className="joystick-middle-row">
                <button 
                  className="joystick-btn left"
                  onTouchStart={() => move(-1, 0)}
                  onTouchEnd={() => {}}
                  aria-label="Mover izquierda"
                >
                  ←
                </button>
                <div className="joystick-center"></div>
                <button 
                  className="joystick-btn right"
                  onTouchStart={() => move(1, 0)}
                  onTouchEnd={() => {}}
                  aria-label="Mover derecha"
                >
                  →
                </button>
              </div>
              <button 
                className="joystick-btn down"
                onTouchStart={() => move(0, 1)}
                onTouchEnd={() => {}}
                aria-label="Mover abajo"
              >
                ↓
              </button>
            </div>
          </div>

          <div className="action-buttons-game">
            <button 
              className="action-btn-game exit-btn"
              onClick={() => setShowMobileControls(false)}
              aria-label="Ocultar controles"
            >
              🎮
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar burbujas de chat
  const renderChatBubbles = () => {
    if (!gameContainerRef.current) return null;

    return Object.entries(activeChatBubbles).map(([bubbleId, bubble]) => {
      const playerData = players.find(p => p.userId === bubble.userId);
      if (!playerData) return null;

      return (
        <div
          key={bubbleId}
          className={`chat-bubble ${bubble.userId === player?.userId ? 'own-chat-bubble' : 'other-chat-bubble'}`}
          style={{
            left: `${playerData.x}px`,
            top: `${playerData.y - 60}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="chat-bubble-content">
            {bubble.userId !== player?.userId && (
              <div className="chat-bubble-username">{bubble.username}</div>
            )}
            <div className="chat-bubble-message">{bubble.message}</div>
          </div>
          <div className="chat-bubble-tail"></div>
        </div>
      );
    });
  };

  // Renderizar el mundo del juego - SIMPLIFICADO
  const renderGameWorld = () => {
    if (!player) return null;

    const viewportWidth = 800;
    const viewportHeight = 600;
    
    // Calcular offset para que el jugador esté centrado
    const offsetX = player.x - viewportWidth / 2;
    const offsetY = player.y - viewportHeight / 2;

    return (
      <div className="game-container">
        <div className="game-ui">
          <div className="player-info-card">
            <h3>{player.username}</h3>
            <div className="player-stats">
              <div className="stat-item">
                <span className="stat-label">Posición:</span>
                <span className="stat-value">{Math.floor(player.x)}, {Math.floor(player.y)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Jugadores:</span>
                <span className="stat-value">{players.length}</span>
              </div>
            </div>
          </div>
          
          <div className="action-buttons">
            <button 
              onClick={() => setShowMobileControls(!showMobileControls)}
              className="btn-mobile-controls"
            >
              {showMobileControls ? '❌ Controles' : '🎮 Controles'}
            </button>
          </div>
        </div>

        <div 
          ref={gameContainerRef}
          className="game-world"
          style={{
            width: viewportWidth,
            height: viewportHeight,
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #87CEEB, #98FB98)',
            border: '3px solid #2E8B57',
            borderRadius: '10px',
            boxShadow: '0 0 20px rgba(46, 139, 87, 0.5)'
          }}
        >
          {/* Zona central */}
          <div
            className="zone"
            style={{
              position: 'absolute',
              left: 200 - offsetX,
              top: 200 - offsetY,
              width: 400,
              height: 200,
              border: '2px dashed rgba(255,255,255,0.4)',
              background: 'rgba(144, 238, 144, 0.3)',
              pointerEvents: 'none'
            }}
            title="Plaza Central"
          >
            <div className="zone-label" style={{
              position: 'absolute',
              top: '5px',
              left: '5px',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '10px',
              pointerEvents: 'none'
            }}>
              Plaza Central
            </div>
          </div>

          {/* Renderizar otros jugadores */}
          {players.filter(p => p.userId !== player?.userId).map(otherPlayer => (
            <div
              key={otherPlayer.userId}
              className="other-player"
              style={{
                position: 'absolute',
                left: otherPlayer.x - offsetX,
                top: otherPlayer.y - offsetY,
                width: 35,
                height: 35,
                background: '#FF6B6B',
                borderRadius: '50%',
                border: '2px solid #fff',
                boxShadow: '0 0 5px rgba(0,0,0,0.5)',
                transform: `scale(${otherPlayer.isMoving ? 1.1 : 1})`,
                transition: 'transform 0.2s'
              }}
              title={`${otherPlayer.username}`}
            >
              <div className="player-name-tag" style={{
                position: 'absolute',
                bottom: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '1px 4px',
                borderRadius: '2px',
                fontSize: '9px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none'
              }}>
                {otherPlayer.username}
              </div>
            </div>
          ))}

          {/* Renderizar jugador actual */}
          {player && (
            <div
              className="current-player"
              style={{
                position: 'absolute',
                left: viewportWidth / 2 - 22,
                top: viewportHeight / 2 - 22,
                width: 44,
                height: 44,
                background: '#4ECDC4',
                borderRadius: '50%',
                border: '3px solid #fff',
                boxShadow: '0 0 15px rgba(255,255,255,0.8)',
                animation: player.isMoving ? 'pulse 0.5s infinite alternate' : 'none'
              }}
            >
              <div className="player-glow" style={{
                position: 'absolute',
                top: '-5px',
                left: '-5px',
                right: '-5px',
                bottom: '-5px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />
            </div>
          )}

          {/* Renderizar burbujas de chat */}
          {renderChatBubbles()}
        </div>
      </div>
    );
  };

  // Componente de estado de conexión
  const ConnectionStatus = () => {
    const statusConfig = {
      connecting: { 
        message: '🔄 Conectando al servidor...', 
        className: 'connecting' 
      },
      connected: { 
        message: '✅ Conectado, uniéndose al juego...', 
        className: 'connected' 
      },
      ready: { 
        message: '🎮 Conectado al MMORPG', 
        className: 'ready' 
      },
      disconnected: { 
        message: '❌ Desconectado del servidor', 
        className: 'disconnected' 
      },
      error: { 
        message: '❌ Error de conexión', 
        className: 'error' 
      }
    };

    const currentStatus = statusConfig[connectionStatus] || statusConfig.connecting;

    return (
      <div className={`connection-status ${currentStatus.className}`}>
        {currentStatus.message}
        {connectionStatus === 'error' && (
          <button 
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <h2>🎮 Cargando LupiRPG Multiplayer</h2>
          <ConnectionStatus />
          {connectionStatus === 'error' && (
            <div className="troubleshooting">
              <p>Solucionar problemas:</p>
              <ol>
                <li>Verifica que el servidor backend esté funcionando</li>
                <li>Revisa tu conexión a internet</li>
                <li>Intenta recargar la página</li>
              </ol>
              <button 
                onClick={() => window.location.reload()}
                className="retry-button-large"
              >
                🔄 Reintentar Conexión
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="lobby-error-container">
        <h2>❌ Error</h2>
        <p>No se pudo cargar la información del jugador.</p>
        <ConnectionStatus />
        <button onClick={handleExit} className="lobby-back-btn">
          🏠 Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <div className="lobby-title">
          <h1>🎮 LupiRPG Multiplayer</h1>
          <p>¡Explora el mundo y chatea con otros jugadores!</p>
        </div>
        <div className="lobby-info">
          <div className="lobby-stats">
            <span className="stat-badge">👥 Jugadores: {players.length}</span>
            <ConnectionStatus />
          </div>
          
          <div className="lobby-control-buttons">
            {isMobile && (
              <button 
                onClick={() => setShowMobileControls(!showMobileControls)}
                className="lobby-mobile-controls-btn"
              >
                {showMobileControls ? '❌ Ocultar Controles' : '🎮 Mostrar Controles'}
              </button>
            )}
            
            <button onClick={handleExit} className="lobby-back-btn">
              🏠 Salir al Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Mundo del juego */}
      {renderGameWorld()}

      {/* Panel de chat */}
      <div className="lobby-chat-panel">
        <div className="chat-header">
          <h4>💬 Chat Global</h4>
          <span className="chat-count">{chatMessages.length} mensajes</span>
        </div>
        <div className="chat-messages" id="chat-messages">
          {chatMessages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.user === player.username ? 'own-message' : ''}`}>
              <div className="message-header">
                <span className="message-username">{msg.user}</span>
                <span className="message-time">{msg.timestamp}</span>
              </div>
              <div className="message-content">{msg.message}</div>
            </div>
          ))}
        </div>
        <div className="chat-input-container">
          <input
            ref={chatInputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDownChat}
            placeholder="Escribe un mensaje... (Enter para enviar)"
            className="chat-input"
            maxLength={200}
          />
          <button 
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="chat-send-btn"
          >
            ➤
          </button>
        </div>
      </div>

      {/* Panel de jugadores */}
      <div className="lobby-players-panel">
        <h3>👥 Jugadores en Línea ({players.length})</h3>
        <div className="lobby-players-list">
          {players.map(otherPlayer => (
            <div 
              key={otherPlayer.userId} 
              className={`lobby-player-item ${otherPlayer.userId === player.userId ? 'current-player' : ''}`}
            >
              <div className="lobby-player-info">
                <div 
                  className="lobby-player-avatar"
                  style={{ backgroundColor: otherPlayer.userId === player.userId ? '#4ECDC4' : '#FF6B6B' }}
                >
                  {otherPlayer.username.charAt(0).toUpperCase()}
                </div>
                <div className="lobby-player-details">
                  <span className="lobby-player-name">
                    {otherPlayer.username}
                    {otherPlayer.userId === player.userId && <span className="lobby-you-badge">(Tú)</span>}
                  </span>
                  <span className="lobby-player-position">
                    Pos: {Math.floor(otherPlayer.x)}, {Math.floor(otherPlayer.y)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controles móviles */}
      {renderMobileControls()}

      <div className="lobby-controls-help">
        <p>
          {isMobile 
            ? '🕹️ Usa los controles táctiles para moverte | 💬 Toca el chat para escribir' 
            : '🕹️ WASD o Flechas para moverte | 💬 Escribe para chatear'
          }
        </p>
      </div>
    </div>
  );
};

export default MultiplayerLobbyView;