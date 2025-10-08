import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
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
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const initializationRef = useRef(false);
  const socketRef = useRef(null);

  // Constantes del juego
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PLAYER_SIZE = 40;
  const OTHER_PLAYER_SIZE = 35;
  const MOVEMENT_SPEED = 5;

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

    setTimeout(() => {
      setActiveChatBubbles(prev => {
        const newBubbles = { ...prev };
        delete newBubbles[bubbleId];
        return newBubbles;
      });
    }, 5000);
  }, [players]);

  // CONEXIÓN AL SERVIDOR
  useEffect(() => {
    if (!userToUse?.id) {
      showMessage('Error: Usuario no disponible');
      setTimeout(() => setView('dashboard'), 2000);
      return;
    }

    if (initializationRef.current) {
      return;
    }

    initializationRef.current = true;
    console.log('🔗 Iniciando conexión al servidor MMORPG...');

    const connectToServer = () => {
      try {
        console.log('🔗 Conectando al servidor...');

        const newSocket = io('https://lupirpgbackend.onrender.com', {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        // Listeners de conexión
        newSocket.on('connect', () => {
          console.log('✅ Conectado al servidor, Socket ID:', newSocket.id);
          setConnectionStatus('connected');
          
          const userData = {
            userId: userToUse.id,
            username: userToUse.username || userToUse.email?.split('@')[0] || `Jugador_${Date.now()}`,
            x: Math.floor(Math.random() * (CANVAS_WIDTH - 100)) + 50,
            y: Math.floor(Math.random() * (CANVAS_HEIGHT - 100)) + 50,
            avatar_url: userToUse.avatar_url || null
          };
          
          console.log('🎮 Enviando newPlayer:', userData);
          newSocket.emit('newPlayer', userData);
        });

        newSocket.on('disconnect', (reason) => {
          console.log('❌ Desconectado:', reason);
          setConnectionStatus('disconnected');
          if (reason === 'io server disconnect') {
            setTimeout(() => newSocket.connect(), 2000);
          }
        });

        newSocket.on('connect_error', (error) => {
          console.error('❌ Error de conexión:', error);
          setConnectionStatus('error');
        });

        newSocket.on('reconnect', () => {
          console.log('🔁 Reconectado al servidor');
          setConnectionStatus('connected');
        });

        // Listeners del juego
        newSocket.on('updatePlayers', (playersData) => {
          console.log('👥 Jugadores actualizados:', Object.values(playersData).length);
          const playersArray = Object.values(playersData);
          setPlayers(playersArray);
          
          const currentPlayer = playersArray.find(p => p.userId === userToUse.id);
          if (currentPlayer && !player) {
            console.log('✅ Jugador identificado:', currentPlayer);
            setPlayer(currentPlayer);
            setConnectionStatus('ready');
            setLoading(false);
            showMessage(`¡Bienvenido a LupiRPG, ${currentPlayer.username}!`);
          }
        });

        newSocket.on('chatMessage', (messageData) => {
          console.log('💬 Mensaje recibido:', messageData);
          setChatMessages(prev => {
            const newMessages = [...prev, {
              user: messageData.user,
              message: messageData.message,
              timestamp: new Date().toLocaleTimeString(),
            }];
            return newMessages.slice(-50);
          });
          
          const playersArray = Object.values(players);
          const sender = playersArray.find(p => p.username === messageData.user);
          if (sender && sender.userId !== userToUse.id) {
            showChatBubble(sender.userId, messageData.message, messageData.user);
          }
        });

        // Timeout de conexión
        const connectionTimeout = setTimeout(() => {
          if (loading && connectionStatus === 'connecting') {
            console.log('⏰ Timeout de conexión');
            setConnectionStatus('error');
            setLoading(false);
          }
        }, 10000);

        return () => clearTimeout(connectionTimeout);

      } catch (error) {
        console.error('❌ Error en la conexión:', error);
        setConnectionStatus('error');
        setLoading(false);
      }
    };

    connectToServer();

    // Limpieza
    return () => {
      console.log('🧹 Limpiando componente...');
      initializationRef.current = false;
      
      if (movementInterval.current) {
        clearInterval(movementInterval.current);
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (socketRef.current) {
        console.log('🔌 Desconectando socket...');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userToUse?.id]);

  // SISTEMA DE MOVIMIENTO CON CANVAS
  const handleKeyDown = useCallback((e) => {
    if (document.activeElement === chatInputRef.current) return;

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

  // Loop de movimiento con requestAnimationFrame
  useEffect(() => {
    if (!socket || !player) return;

    const movePlayer = () => {
      if (!keys.current || !player) return;

      let newX = player.x;
      let newY = player.y;
      let moved = false;

      if (keys.current['w'] || keys.current['arrowup']) {
        newY -= MOVEMENT_SPEED;
        moved = true;
      }
      if (keys.current['s'] || keys.current['arrowdown']) {
        newY += MOVEMENT_SPEED;
        moved = true;
      }
      if (keys.current['a'] || keys.current['arrowleft']) {
        newX -= MOVEMENT_SPEED;
        moved = true;
      }
      if (keys.current['d'] || keys.current['arrowright']) {
        newX += MOVEMENT_SPEED;
        moved = true;
      }

      // Limitar al canvas
      newX = Math.max(PLAYER_SIZE/2, Math.min(CANVAS_WIDTH - PLAYER_SIZE/2, newX));
      newY = Math.max(PLAYER_SIZE/2, Math.min(CANVAS_HEIGHT - PLAYER_SIZE/2, newY));

      if (moved && (newX !== player.x || newY !== player.y)) {
        const updatedPlayer = { ...player, x: newX, y: newY };
        setPlayer(updatedPlayer);
        socket.emit('move', { x: newX, y: newY });
      }
    };

    const gameLoop = () => {
      movePlayer();
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [socket, player]);

  // Event listeners de teclado
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // DIBUJAR EN EL CANVAS
  useEffect(() => {
    if (!canvasRef.current || !player) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      // Limpiar canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Dibujar fondo
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Dibujar suelo
      ctx.fillStyle = '#98FB98';
      ctx.fillRect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);

      // Dibujar zona central
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(200, 200, 400, 200);
      ctx.setLineDash([]);
      
      ctx.fillStyle = 'rgba(144, 238, 144, 0.3)';
      ctx.fillRect(200, 200, 400, 200);

      // Dibujar etiqueta de zona
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(205, 205, 80, 20);
      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      ctx.fillText('Plaza Central', 210, 218);

      // Dibujar otros jugadores
      players.filter(p => p.userId !== player.userId).forEach(otherPlayer => {
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(otherPlayer.x, otherPlayer.y, OTHER_PLAYER_SIZE/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Nombre del jugador
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(otherPlayer.x - 20, otherPlayer.y - 25, 40, 12);
        ctx.fillStyle = 'white';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(otherPlayer.username, otherPlayer.x, otherPlayer.y - 15);
        ctx.textAlign = 'left';
      });

      // Dibujar jugador actual
      ctx.fillStyle = '#4ECDC4';
      ctx.beginPath();
      ctx.arc(player.x, player.y, PLAYER_SIZE/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Efecto de brillo del jugador
      const gradient = ctx.createRadialGradient(
        player.x, player.y, PLAYER_SIZE/2,
        player.x, player.y, PLAYER_SIZE
      );
      gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fill();

      // Nombre del jugador actual
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(player.x - 25, player.y - 30, 50, 14);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(player.username, player.x, player.y - 20);
      ctx.textAlign = 'left';

      // Dibujar burbujas de chat
      Object.values(activeChatBubbles).forEach(bubble => {
        const bubblePlayer = players.find(p => p.userId === bubble.userId);
        if (!bubblePlayer) return;

        const bubbleX = bubblePlayer.x;
        const bubbleY = bubblePlayer.y - 50;

        // Fondo de burbuja
        ctx.fillStyle = bubble.userId === player.userId ? '#4CAF50' : 'white';
        ctx.beginPath();
        ctx.roundRect(bubbleX - 60, bubbleY - 30, 120, 25, 10);
        ctx.fill();

        // Triángulo de la burbuja
        ctx.beginPath();
        ctx.moveTo(bubbleX - 5, bubbleY);
        ctx.lineTo(bubbleX + 5, bubbleY);
        ctx.lineTo(bubbleX, bubbleY + 5);
        ctx.fill();

        // Texto de la burbuja
        ctx.fillStyle = bubble.userId === player.userId ? 'white' : 'black';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        
        // Nombre de usuario (solo para otros jugadores)
        if (bubble.userId !== player.userId) {
          ctx.fillText(bubble.username, bubbleX, bubbleY - 15);
        }
        
        // Mensaje
        ctx.fillText(
          bubble.message.length > 15 ? bubble.message.substring(0, 15) + '...' : bubble.message,
          bubbleX,
          bubble.userId === player.userId ? bubbleY - 10 : bubbleY - 5
        );
        ctx.textAlign = 'left';
      });
    };

    draw();
  }, [player, players, activeChatBubbles]);

  // Enviar mensaje de chat
  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !socket) return;

    console.log('Enviando mensaje:', newMessage.trim());
    
    if (player) {
      showChatBubble(player.userId, newMessage.trim(), player.username);
    }

    socket.emit('chatMessage', newMessage.trim());
    setNewMessage('');
    
    if (chatInputRef.current) {
      setTimeout(() => chatInputRef.current.focus(), 100);
    }
  }, [newMessage, socket, player, showChatBubble]);

  const handleKeyDownChat = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Función para salir
  const handleExit = useCallback(() => {
    console.log('🚪 Saliendo del MMORPG...');
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    setView('dashboard');
  }, [setView]);

  // Joystick virtual para móvil
  const renderMobileControls = () => {
    if (!isMobile || !showMobileControls) return null;

    const move = (dx, dy) => {
      if (!player || !socket) return;
      
      const newX = Math.max(PLAYER_SIZE/2, Math.min(CANVAS_WIDTH - PLAYER_SIZE/2, player.x + dx * 25));
      const newY = Math.max(PLAYER_SIZE/2, Math.min(CANVAS_HEIGHT - PLAYER_SIZE/2, player.y + dy * 25));
      
      const updatedPlayer = { ...player, x: newX, y: newY };
      setPlayer(updatedPlayer);
      socket.emit('move', { x: newX, y: newY });
    };

    return (
      <div className="mobile-controls-overlay">
        <div className="joystick-container">
          <div className="joystick-area">
            <div className="joystick-background">
              <button 
                className="joystick-btn up"
                onTouchStart={() => move(0, -1)}
                aria-label="Mover arriba"
              >
                ↑
              </button>
              <div className="joystick-middle-row">
                <button 
                  className="joystick-btn left"
                  onTouchStart={() => move(-1, 0)}
                  aria-label="Mover izquierda"
                >
                  ←
                </button>
                <div className="joystick-center"></div>
                <button 
                  className="joystick-btn right"
                  onTouchStart={() => move(1, 0)}
                  aria-label="Mover derecha"
                >
                  →
                </button>
              </div>
              <button 
                className="joystick-btn down"
                onTouchStart={() => move(0, 1)}
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

  // Componente de estado de conexión
  const ConnectionStatus = () => {
    const statusConfig = {
      connecting: { message: '🔄 Conectando...', className: 'connecting' },
      connected: { message: '✅ Conectado...', className: 'connected' },
      ready: { message: '🎮 Conectado', className: 'ready' },
      disconnected: { message: '❌ Desconectado', className: 'disconnected' },
      error: { message: '❌ Error', className: 'error' }
    };

    const currentStatus = statusConfig[connectionStatus] || statusConfig.connecting;

    return (
      <div className={`connection-status ${currentStatus.className}`}>
        {currentStatus.message}
        {connectionStatus === 'error' && (
          <button onClick={() => window.location.reload()} className="retry-button">
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
                {showMobileControls ? '❌ Ocultar' : '🎮 Controles'}
              </button>
            )}
            <button onClick={handleExit} className="lobby-back-btn">
              🏠 Salir
            </button>
          </div>
        </div>
      </div>

      {/* CANVAS DEL JUEGO */}
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

        <div className="game-world-container">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="game-canvas"
          />
        </div>
      </div>

      <div className="lobby-chat-panel">
        <div className="chat-header">
          <h4>💬 Chat Global</h4>
          <span className="chat-count">{chatMessages.length} mensajes</span>
        </div>
        <div className="chat-messages">
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
          />
          <button onClick={sendMessage} className="chat-send-btn">
            ➤
          </button>
        </div>
      </div>

      <div className="lobby-players-panel">
        <h3>👥 Jugadores ({players.length})</h3>
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
                    {Math.floor(otherPlayer.x)}, {Math.floor(otherPlayer.y)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {renderMobileControls()}
    </div>
  );
};

export default MultiplayerLobbyView;