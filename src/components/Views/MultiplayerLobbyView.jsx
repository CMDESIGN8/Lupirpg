import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import LoadingScreen from '../UI/LoadingScreen';
import '../styles/MultiplayerLobby.css';

const MultiplayerLobbyView = ({ currentUser, setView, supabaseClient, playerData, showMessage }) => {
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [player, setPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameWorld, setGameWorld] = useState(null);
  const [npcs, setNpcs] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentZone, setCurrentZone] = useState('');
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

  // Conectar al servidor Socket.IO
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
        
        // Primero verificar que el servidor esté disponible
        try {
          const healthCheck = await fetch('https://lupirpgbackend.onrender.com/api/health');
          if (!healthCheck.ok) {
            throw new Error('Servidor no disponible');
          }
          console.log('✅ Servidor backend disponible');
        } catch (error) {
          console.error('❌ Servidor no disponible:', error);
          setConnectionStatus('error');
          showMessage('Error: Servidor MMORPG no disponible. Asegúrate de que el servidor esté corriendo en puerto 5000.');
          setLoading(false);
          return;
        }

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
          
          // Unirse al juego después de conectar
          const userData = {
            userId: userToUse.id,
            username: userToUse.username || userToUse.email?.split('@')[0] || `Jugador_${Date.now()}`
          };
          
          console.log('🎮 Enviando joinGame:', userData);
          setTimeout(() => {
            newSocket.emit('joinGame', userData);
          }, 500);
        });

        newSocket.on('disconnect', (reason) => {
          console.log('❌ Desconectado del servidor:', reason);
          setConnectionStatus('disconnected');
          showMessage('Desconectado del servidor');
          if (reason === 'io server disconnect') {
            // El servidor forzó la desconexión, reconectar
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

        newSocket.on('reconnect_attempt', (attemptNumber) => {
          console.log('🔄 Intentando reconectar, intento:', attemptNumber);
          setConnectionStatus('connecting');
        });

        // Listeners del juego
        newSocket.on('joinSuccess', (playerData) => {
          console.log('✅ Unido al juego exitosamente:', playerData);
          setPlayer(playerData);
          setConnectionStatus('ready');
          setLoading(false);
          showMessage(`¡Bienvenido a Deportes MMORPG, ${playerData.username}!`);
        });

        newSocket.on('joinError', (error) => {
          console.error('❌ Error al unirse:', error);
          setConnectionStatus('error');
          showMessage('Error al unirse al juego: ' + (error.error || 'Error desconocido'));
          setLoading(false);
        });

        newSocket.on('gameWorld', (world) => {
          console.log('🗺️ Mundo recibido:', world);
          setGameWorld(world);
        });

        newSocket.on('npcsList', (npcsList) => {
          console.log('👥 NPCs recibidos:', npcsList.length);
          setNpcs(npcsList);
        });

        newSocket.on('playersList', (playersList) => {
          console.log('👥 Lista de jugadores actualizada:', playersList.length);
          setPlayers(playersList);
        });

        newSocket.on('playerMoved', (data) => {
          setPlayers(prev => prev.map(p => 
            p.id === data.id ? { ...p, x: data.x, y: data.y, direction: data.direction, isMoving: data.isMoving } : p
          ));
        });

        newSocket.on('chatMessage', (messageData) => {
          console.log('💬 Mensaje recibido:', messageData);
          setChatMessages(prev => {
            const newMessages = [...prev, messageData];
            // Mantener solo los últimos 50 mensajes
            return newMessages.slice(-50);
          });
          
          // Mostrar burbuja de chat
          const sender = Array.from(players.values()).find(p => p.username === messageData.user);
          if (sender && sender.userId !== player?.userId) {
            showChatBubble(sender.userId, messageData.message, messageData.user);
          }
        });

        newSocket.on('zoneChanged', (data) => {
          console.log('🗺️ Cambio de zona:', data.zone);
          setCurrentZone(data.zone);
          showMessage(`Entraste a: ${data.zone}`);
        });

        newSocket.on('trainingResult', (result) => {
          console.log('🎯 Resultado de entrenamiento:', result);
          if (result.leveledUp) {
            showMessage(`🎉 ¡Subiste al nivel ${result.newLevel}! Ganaste 100 LupiCoins y 5 puntos de habilidad`);
            setPlayer(prev => ({
              ...prev,
              level: result.newLevel,
              experience: result.newExperience,
              lupiCoins: prev.lupiCoins + (result.rewards?.lupiCoins || 0),
              skillPoints: (prev.skillPoints || 0) + (result.rewards?.skillPoints || 0)
            }));
          } else {
            showMessage(`➕ Ganaste ${result.xpGained} EXP`);
            setPlayer(prev => ({
              ...prev,
              experience: result.newExperience
            }));
          }
        });

        newSocket.on('playerLevelUp', (data) => {
          showMessage(`🎊 ${data.username} subió al nivel ${data.newLevel}!`);
        });

        newSocket.on('npcDialog', (dialogData) => {
          console.log('💬 Diálogo de NPC:', dialogData);
          showMessage(`${dialogData.npcName}: ${dialogData.dialog[0]}`);
          
          // Mostrar diálogo completo en el chat
          const npcMessages = dialogData.dialog.map((text, index) => ({
            user: dialogData.npcName,
            message: text,
            timestamp: new Date().toLocaleTimeString(),
            level: 0,
            isNPC: true
          }));
          
          setChatMessages(prev => [...prev, ...npcMessages]);
        });

        newSocket.on('interactionError', (error) => {
          showMessage(`❌ ${error.error}`);
        });

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
      
      // Limpiar keys
      keys.current = {};
      
      // Desconectar socket solo si existe
      if (socket) {
        console.log('🔌 Desconectando socket...');
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [userToUse?.id, setView, showMessage]);

  // Sistema de movimiento
  const handleKeyDown = useCallback((e) => {
    // Si está escribiendo en el chat, no mover al jugador
    if (document.activeElement === chatInputRef.current) {
      return;
    }

    // Prevenir comportamiento por defecto para teclas de movimiento
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
      e.preventDefault();
    }

    keys.current[key] = true;
  }, []);

  const handleKeyUp = useCallback((e) => {
    const key = e.key.toLowerCase();
    keys.current[key] = false;
    
    // Detener movimiento si no hay teclas presionadas
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
      const movingKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'];
      const isStillMoving = movingKeys.some(k => keys.current[k]);
      
      if (!isStillMoving && socket && player) {
        socket.emit('move', {
          x: player.x,
          y: player.y,
          direction: player.direction,
          isMoving: false
        });
      }
    }
  }, [socket, player]);

  // Loop de movimiento
  useEffect(() => {
    if (!socket || !player) return;

    const handleMovement = () => {
      if (!keys.current || !player) return;

      let newX = player.x;
      let newY = player.y;
      let direction = player.direction;
      let isMoving = false;

      // Movimiento con WASD o flechas
      if (keys.current['w'] || keys.current['arrowup']) {
        newY -= 5;
        direction = 'up';
        isMoving = true;
      }
      if (keys.current['s'] || keys.current['arrowdown']) {
        newY += 5;
        direction = 'down';
        isMoving = true;
      }
      if (keys.current['a'] || keys.current['arrowleft']) {
        newX -= 5;
        direction = 'left';
        isMoving = true;
      }
      if (keys.current['d'] || keys.current['arrowright']) {
        newX += 5;
        direction = 'right';
        isMoving = true;
      }

      // Limitar al mundo
      if (gameWorld) {
        newX = Math.max(0, Math.min(gameWorld.width - 50, newX));
        newY = Math.max(0, Math.min(gameWorld.height - 50, newY));
      }

      if (newX !== player.x || newY !== player.y || isMoving !== player.isMoving) {
        const updatedPlayer = { ...player, x: newX, y: newY, direction, isMoving };
        setPlayer(updatedPlayer);
        
        socket.emit('move', {
          x: newX,
          y: newY,
          direction: direction,
          isMoving: isMoving
        });
      }
    };

    movementInterval.current = setInterval(handleMovement, 16); // ~60 FPS

    return () => {
      if (movementInterval.current) {
        clearInterval(movementInterval.current);
        movementInterval.current = null;
      }
    };
  }, [socket, player, gameWorld]);

  // Event listeners para teclado
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Enviar mensaje de chat
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

    socket.emit('chatMessage', { message: newMessage.trim() });
    setNewMessage('');
    
    // Enfocar el input de nuevo para seguir escribiendo
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

  // Interacción con NPCs
  const handleInteractWithNPC = useCallback((npcId) => {
    if (!socket || !player) return;
    
    // Verificar distancia con el NPC
    const npc = npcs.find(n => n.id === npcId);
    if (npc) {
      const distance = Math.sqrt(
        Math.pow(player.x - npc.x, 2) + Math.pow(player.y - npc.y, 2)
      );
      
      if (distance <= 100) {
        socket.emit('interactWithNPC', { npcId });
      } else {
        showMessage('Acércate más al NPC para interactuar');
      }
    }
  }, [socket, player, npcs, showMessage]);

  // Acciones del jugador
  const handlePlayerAction = useCallback((actionType, data = {}) => {
    if (!socket) return;
    socket.emit('playerAction', { type: actionType, ...data });
  }, [socket]);

  // Función para salir correctamente
  const handleExit = useCallback(() => {
    console.log('🚪 Saliendo del MMORPG...');
    
    // Limpiar intervalos
    if (movementInterval.current) {
      clearInterval(movementInterval.current);
      movementInterval.current = null;
    }
    
    // Desconectar socket
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    // Cambiar vista
    setView('dashboard');
  }, [socket, setView]);

  // Joystick virtual para móvil
  const renderMobileControls = () => {
    if (!isMobile || !showMobileControls) return null;

    const move = (dx, dy) => {
      if (!player || !socket) return;
      
      const newX = Math.max(0, Math.min(gameWorld?.width - 50 || 1950, player.x + dx * 25));
      const newY = Math.max(0, Math.min(gameWorld?.height - 50 || 1950, player.y + dy * 25));
      
      const direction = 
        dx > 0 ? 'right' : 
        dx < 0 ? 'left' : 
        dy > 0 ? 'down' : 'up';
      
      const isMoving = true;
      
      setPlayer(prev => ({ ...prev, x: newX, y: newY, direction, isMoving }));
      
      socket.emit('move', {
        x: newX,
        y: newY,
        direction: direction,
        isMoving: isMoving
      });

      // Detener movimiento después de un tiempo
      setTimeout(() => {
        if (socket && player) {
          socket.emit('move', {
            x: newX,
            y: newY,
            direction: direction,
            isMoving: false
          });
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
              className="action-btn-game train-btn"
              onClick={() => handlePlayerAction('train')}
              aria-label="Entrenar"
            >
              🏋️
            </button>
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

  // Renderizar el mundo del juego
  const renderGameWorld = () => {
    if (!gameWorld || !player) return null;

    const viewportWidth = 800;
    const viewportHeight = 600;
    
    // Calcular offset para que el jugador esté centrado
    const offsetX = player.x - viewportWidth / 2;
    const offsetY = player.y - viewportHeight / 2;

    return (
      <div className="game-container">
        <div className="game-ui">
          <div className="player-info-card">
            <h3>{player.username} {player.isTemporary && '(Temporal)'}</h3>
            <div className="player-stats">
              <div className="stat-item">
                <span className="stat-label">Nivel:</span>
                <span className="stat-value">{player.level}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">EXP:</span>
                <span className="stat-value">{player.experience}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">LupiCoins:</span>
                <span className="stat-value">{player.lupiCoins}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Zona:</span>
                <span className="stat-value">{currentZone}</span>
              </div>
            </div>
          </div>
          
          <div className="action-buttons">
            <button 
              onClick={() => handlePlayerAction('train')} 
              className="btn-training"
              disabled={!socket}
            >
              🏋️ Entrenar
            </button>
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
          {/* Renderizar zonas */}
          {gameWorld.zones.map(zone => (
            <div
              key={zone.name}
              className="zone"
              style={{
                position: 'absolute',
                left: zone.x - offsetX,
                top: zone.y - offsetY,
                width: zone.width,
                height: zone.height,
                border: '2px dashed rgba(255,255,255,0.4)',
                background: getZoneColor(zone.type),
                pointerEvents: 'none'
              }}
              title={zone.name}
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
                {zone.name}
              </div>
            </div>
          ))}

          {/* Renderizar NPCs */}
          {npcs.map(npc => (
            <div
              key={npc.id}
              className="npc"
              style={{
                position: 'absolute',
                left: npc.x - offsetX,
                top: npc.y - offsetY,
                width: 45,
                height: 45,
                background: getNPCColor(npc.type),
                borderRadius: '50%',
                border: '3px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '20px',
                boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                transform: 'scale(1)',
                transition: 'transform 0.2s'
              }}
              onClick={() => handleInteractWithNPC(npc.id)}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              title={`${npc.name} (${getNPCTypeName(npc.type)})`}
            >
              {getNPCSymbol(npc.type)}
              <div className="npc-name-tag" style={{
                position: 'absolute',
                bottom: '-25px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '10px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none'
              }}>
                {npc.name}
              </div>
            </div>
          ))}

          {/* Renderizar otros jugadores */}
          {players.filter(p => p.id !== player?.id).map(otherPlayer => (
            <div
              key={otherPlayer.id}
              className="other-player"
              style={{
                position: 'absolute',
                left: otherPlayer.x - offsetX,
                top: otherPlayer.y - offsetY,
                width: 35,
                height: 35,
                background: otherPlayer.color,
                borderRadius: '50%',
                border: '2px solid #fff',
                boxShadow: '0 0 5px rgba(0,0,0,0.5)',
                transform: `scale(${otherPlayer.isMoving ? 1.1 : 1})`,
                transition: 'transform 0.2s'
              }}
              title={`${otherPlayer.username} (Nvl ${otherPlayer.level}) - ${otherPlayer.position}`}
            >
              <div 
                className="player-direction"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderBottom: `12px solid #333`,
                  transform: `rotate(${getRotation(otherPlayer.direction)}deg)`,
                  position: 'absolute',
                  top: '-10px',
                  left: '12px'
                }}
              />
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
                background: player.color,
                borderRadius: '50%',
                border: '3px solid #fff',
                boxShadow: '0 0 15px rgba(255,255,255,0.8)',
                animation: player.isMoving ? 'pulse 0.5s infinite alternate' : 'none'
              }}
            >
              <div 
                className="player-direction"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '7px solid transparent',
                  borderRight: '7px solid transparent',
                  borderBottom: `14px solid #333`,
                  transform: `rotate(${getRotation(player.direction)}deg)`,
                  position: 'absolute',
                  top: '-12px',
                  left: '15px'
                }}
              />
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

  // Funciones auxiliares de renderizado
  const getZoneColor = (type) => {
    const colors = {
      starter: 'rgba(144, 238, 144, 0.3)',
      training: 'rgba(255, 215, 0, 0.3)',
      arena: 'rgba(255, 99, 71, 0.3)',
      market: 'rgba(135, 206, 250, 0.3)',
      quest: 'rgba(147, 112, 219, 0.3)',
      club: 'rgba(50, 205, 50, 0.3)'
    };
    return colors[type] || 'rgba(128, 128, 128, 0.3)';
  };

  const getNPCColor = (type) => {
    const colors = {
      trainer: '#FFD700',
      merchant: '#FF6347',
      quest_giver: '#9370DB'
    };
    return colors[type] || '#666';
  };

  const getNPCTypeName = (type) => {
    const names = {
      trainer: 'Entrenador',
      merchant: 'Comerciante',
      quest_giver: 'Dador de Misiones'
    };
    return names[type] || 'NPC';
  };

  const getNPCSymbol = (type) => {
    const symbols = {
      trainer: '🏆',
      merchant: '🏪',
      quest_giver: '📜'
    };
    return symbols[type] || '👤';
  };

  const getRotation = (direction) => {
    const rotations = {
      up: 0,
      right: 90,
      down: 180,
      left: 270
    };
    return rotations[direction] || 180;
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
          <h2>🎮 Cargando MMORPG Deportivo</h2>
          <ConnectionStatus />
          {connectionStatus === 'error' && (
            <div className="troubleshooting">
              <p>Solucionar problemas:</p>
              <ol>
                <li>Asegúrate de que el servidor esté corriendo en puerto 5000</li>
                <li>Verifica que no haya errores en la consola del servidor</li>
                <li>Revisa la conexión a internet</li>
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
          <h1>🎮 MMORPG Deportivo</h1>
          <p>¡Explora el mundo, interactúa con otros jugadores y mejora tus habilidades!</p>
        </div>
        <div className="lobby-info">
          <div className="lobby-stats">
            <span className="stat-badge">👥 Jugadores: {players.length}</span>
            <span className="stat-badge">🗺️ Zona: {currentZone}</span>
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
            <div key={index} className={`chat-message ${msg.user === player.username ? 'own-message' : ''} ${msg.isNPC ? 'npc-message' : ''}`}>
              <div className="message-header">
                <span className="message-username">{msg.user}</span>
                {msg.level > 0 && <span className="message-level">Nvl {msg.level}</span>}
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
            placeholder="Escribe un mensaje... (Enter para enviar, / para comandos)"
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
              key={otherPlayer.id} 
              className={`lobby-player-item ${otherPlayer.userId === player.userId ? 'current-player' : ''}`}
            >
              <div className="lobby-player-info">
                <div 
                  className="lobby-player-avatar"
                  style={{ backgroundColor: otherPlayer.color }}
                >
                  <div className="player-avatar-direction" style={{
                    transform: `rotate(${getRotation(otherPlayer.direction)}deg)`
                  }}></div>
                </div>
                <div className="lobby-player-details">
                  <span className="lobby-player-name">
                    {otherPlayer.username}
                    {otherPlayer.userId === player.userId && <span className="lobby-you-badge">(Tú)</span>}
                    {otherPlayer.isTemporary && <span className="temporary-badge">Temporal</span>}
                  </span>
                  <span className="lobby-player-position">
                    Nvl {otherPlayer.level} | {otherPlayer.position}
                  </span>
                </div>
              </div>
              <div className="lobby-player-status">
                <div className={`status-indicator ${otherPlayer.isMoving ? 'moving' : 'idle'}`}></div>
                <span className="player-zone">{otherPlayer.currentZone}</span>
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
            : '🕹️ WASD o Flechas para moverte | 💬 Escribe para chatear | 🏋️ Click en Entrenar'
          }
        </p>
        <p>Comandos de chat: /stats, /emote, /help, /players</p>
      </div>
    </div>
  );
};

export default MultiplayerLobbyView;