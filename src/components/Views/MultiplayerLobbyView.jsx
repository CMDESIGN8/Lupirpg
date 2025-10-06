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
  
  // Referencias
  const playerPositionRef = useRef({ x: 0, y: 0 });
  const channelRef = useRef(null);
  const cleanupIntervalRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const moveTimeoutRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const chatInputRef = useRef(null);
  const initializationRef = useRef(false);

  // --- NUEVAS REFERENCIAS / ESTADOS para el motor gráfico ---
const canvasRef = useRef(null);
const [worldSize] = useState({ width: 1200, height: 1200 }); // píxeles, mundo expandido
const [tileCount] = useState({ x: 60, y: 60 }); // 60x60 tiles -> mundo abierto
const [entities, setEntities] = useState({}); // { ball: {x,y,vx,vy,...}, ... }
const entitiesRef = useRef({});
const lastServerUpdateRef = useRef(Date.now());
const outgoingThrottleRef = useRef(null);

// util para set + ref sincronizados
const setEntitiesWithRef = (updater) => {
  setEntities(prev => {
    const next = typeof updater === 'function' ? updater(prev) : updater;
    entitiesRef.current = next;
    return next;
  });
};

// ---------- RENDER LOOP + INTERPOLACIÓN ----------
useEffect(() => {
  let rafId;
  let lastTime = performance.now();

  const draw = (now) => {
    const dt = Math.min(50, now - lastTime) / 1000; // cap delta
    lastTime = now;

    const canvas = canvasRef.current;
    if (!canvas) {
      rafId = requestAnimationFrame(draw);
      return;
    }
    const ctx = canvas.getContext('2d');
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background grid (opcional)
    // draw tiles visible around player
    const camera = getCameraForPlayer(); // función abajo
    drawWorldGrid(ctx, camera, tileCount, worldSize);

    // update local entity physics (client-side prediction for local entities)
    // actualizar pelota
    const ents = { ...entitiesRef.current };
    if (ents.ball) {
      // integrador simple de física
      ents.ball.x += ents.ball.vx * dt;
      ents.ball.y += ents.ball.vy * dt;
      // fricción
      ents.ball.vx *= Math.pow(0.9, dt * 10);
      ents.ball.vy *= Math.pow(0.9, dt * 10);

      // keep inside world bounds
      ents.ball.x = Math.max(0, Math.min(tileCount.x - 0.01, ents.ball.x));
      ents.ball.y = Math.max(0, Math.min(tileCount.y - 0.01, ents.ball.y));
    }

    // Dibujar entidades interpoladas (players + ball)
    // players - usar interpolación entre last known pos y server timestamp (simple)
    Object.values(players).flat().forEach(p => {
      const screenPos = worldToScreen({ x: p.x, y: p.y }, camera, tileCount, worldSize);
      drawPlayerSprite(ctx, p, screenPos, p.user_id === userToUse.id);
    });

    // ball
    if (ents.ball) {
      const ballScreen = worldToScreen({ x: ents.ball.x, y: ents.ball.y }, camera, tileCount, worldSize);
      drawBall(ctx, ents.ball, ballScreen);
    }

    // HUD, minimap, stamina, etc
    drawHUD(ctx, camera);

    rafId = requestAnimationFrame(draw);
  };

  rafId = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(rafId);
}, [players, tileCount, worldSize]);

// --- Helper: Camera centrada en player ---
const getCameraForPlayer = () => {
  const playerPos = playerPositionRef.current || { x: 0, y: 0 };
  const viewport = { w: 800, h: 600 }; // adapt to container size
  const px = (playerPos.x / (tileCount.x)) * worldSize.width;
  const py = (playerPos.y / (tileCount.y)) * worldSize.height;
  return {
    x: px - viewport.w / 2,
    y: py - viewport.h / 2,
    w: viewport.w,
    h: viewport.h
  };
};

// --- Conversiones simple mundo -> screen ---
const worldToScreen = (pos, camera, tileCount, worldSize) => {
  const sx = (pos.x / tileCount.x) * worldSize.width - camera.x;
  const sy = (pos.y / tileCount.y) * worldSize.height - camera.y;
  return { x: sx, y: sy };
};

// --- DIBUJOS simples ---
const drawWorldGrid = (ctx, camera, tileCount, worldSize) => {
  // opcional: un tiled background o imagen
  ctx.save();
  // fondo
  ctx.fillStyle = '#081229';
  ctx.fillRect(0, 0, camera.w, camera.h);
  ctx.restore();
};

const drawPlayerSprite = (ctx, player, screenPos, isSelf) => {
  ctx.save();
  const size = 32;
  // shadow
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = isSelf ? '#4fe' : '#fff';
  ctx.beginPath();
  ctx.arc(screenPos.x + size/2, screenPos.y + size*0.9, 12, 0, Math.PI*2);
  ctx.fill();

  // avatar image if exists (synchronous simple method)
  if (player.avatar_url) {
    const img = new Image();
    img.src = player.avatar_url;
    img.onload = () => {
      ctx.drawImage(img, screenPos.x, screenPos.y, size, size);
    };
    img.onerror = () => {
      // fallback: circle
      ctx.fillStyle = isSelf ? '#0ff' : '#ccc';
      ctx.beginPath();
      ctx.arc(screenPos.x + size/2, screenPos.y + size/2, size/2, 0, Math.PI*2);
      ctx.fill();
    };
  } else {
    ctx.fillStyle = isSelf ? '#0ff' : '#ccc';
    ctx.beginPath();
    ctx.arc(screenPos.x + size/2, screenPos.y + size/2, size/2, 0, Math.PI*2);
    ctx.fill();
  }
  // name
  ctx.fillStyle = '#fff';
  ctx.font = '12px sans-serif';
  ctx.fillText(player.username || 'Player', screenPos.x, screenPos.y - 6);
  ctx.restore();
};

const drawBall = (ctx, ball, screenPos) => {
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = '#fff';
  ctx.arc(screenPos.x + 8, screenPos.y + 8, 8, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
};

const drawHUD = (ctx, camera) => {
  // ejemplo: contador de jugadores
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(10, 10, 160, 40);
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.fillText(`Jugadores: ${Object.values(players).flat().length}`, 20, 34);
  ctx.restore();
};

// --- Movimiento: prediction + enviar menos frecuentemente ---
const localMovePlayer = (dx, dy) => {
  // aplicar movimiento local inmediato (predicción)
  const cur = playerPositionRef.current || { x: 0, y: 0 };
  const nx = Math.max(0, Math.min(tileCount.x - 1, cur.x + dx));
  const ny = Math.max(0, Math.min(tileCount.y - 1, cur.y + dy));
  playerPositionRef.current = { x: nx, y: ny };

  // actualizar UI local (players state)
  setPlayers(prev => {
    const p = prev[userToUse.id]?.[0] || {};
    return {
      ...prev,
      [userToUse.id]: [{
        ...p,
        x: nx,
        y: ny,
        last_activity: new Date().toISOString()
      }]
    };
  });

  // enviar update al servidor cada 100ms (throttle)
  if (outgoingThrottleRef.current) return;
  outgoingThrottleRef.current = setTimeout(async () => {
    outgoingThrottleRef.current = null;
    try {
      await supabaseClient
        .from('room_players')
        .update({ x: nx, y: ny, last_activity: new Date().toISOString() })
        .eq('user_id', userToUse.id);
    } catch (err) {
      console.error('Error sending move:', err);
    }
  }, 100);
};

// función para buscar la entidad ball y patearla si estás cerca
const kickBall = (playerId, angleRad, force = 5) => {
  const ents = { ...entitiesRef.current };
  if (!ents.ball) return;
  const p = players[playerId]?.[0];
  if (!p) return;
  const dx = ents.ball.x - p.x;
  const dy = ents.ball.y - p.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (dist > 1.5) return; // no está lo suficientemente cerca

  // aplicar impulso
  ents.ball.vx += Math.cos(angleRad) * force;
  ents.ball.vy += Math.sin(angleRad) * force;

  setEntitiesWithRef(ents);

  // enviar acción al servidor (log y validación de servidor)
  supabaseClient.from('room_actions').insert({
    user_id: playerId,
    action_type: 'kick',
    payload: { ball_id: ents.ball.id, vx: ents.ball.vx, vy: ents.ball.vy }
  });
};



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

  // Función para mostrar burbuja de chat
  const showChatBubble = useCallback((userId, message, username) => {
    const bubbleId = `${userId}-${Date.now()}`;
    
    setActiveChatBubbles(prev => ({
      ...prev,
      [bubbleId]: {
        userId,
        message,
        username,
        timestamp: Date.now(),
        position: players[userId]?.[0] || { x: 0, y: 0 }
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

  // Movimiento con teclado
  const handleKeyDown = useCallback((e) => {
    // Si está escribiendo en el chat, no mover al jugador
    if (document.activeElement === chatInputRef.current) {
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
  }, [movePlayer]);

  // Enviar mensaje de chat
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
      
      // Enfocar el input de nuevo para seguir escribiendo
      if (chatInputRef.current) {
        chatInputRef.current.focus();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      showMessage('Error al enviar el mensaje');
    }
  }, [newMessage, userToUse, supabaseClient, showMessage, showChatBubble]);

  // Manejar envío con Enter
  const handleKeyDownChat = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('Enter pressed, sending message...');
      sendMessage();
    }
  }, [sendMessage]);

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

  // Renderizar burbujas de chat
  const renderChatBubbles = () => {
    return Object.entries(activeChatBubbles).map(([bubbleId, bubble]) => {
      const player = players[bubble.userId]?.[0];
      if (!player) return null;

      return (
        <div
          key={bubbleId}
          className={`chat-bubble ${bubble.userId === userToUse?.id ? 'own-chat-bubble' : 'other-chat-bubble'}`}
          style={{
            left: `${player.x * 6.66}%`,
            top: `${player.y * 6.66 - 15}%`,
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

  // Función para unirse a la sala
  const joinRoom = useCallback(async () => {
    if (!userToUse?.id) return false;

    try {
      const avatarUrl = equippedAvatar?.image_url || '/default-avatar.png';
      const initialX = Math.floor(Math.random() * 15);
      const initialY = Math.floor(Math.random() * 15);
      
      playerPositionRef.current = { x: initialX, y: initialY };

      const { error: upsertError } = await supabaseClient
        .from('room_players')
        .upsert({
          user_id: userToUse.id,
          username: userToUse.username || 'Jugador',
          avatar_url: avatarUrl,
          x: initialX,
          y: initialY,
          last_activity: new Date().toISOString()
        }, { 
          onConflict: 'user_id'
        });

      if (upsertError) {
        throw new Error(`Join error: ${upsertError.message}`);
      }

      console.log('User joined room successfully');

      // Obtener jugadores activos
      const activeCutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: currentPlayers, error: fetchError } = await supabaseClient
        .from('room_players')
        .select('*')
        .gte('last_activity', activeCutoff);

      if (!fetchError && currentPlayers) {
        const playersObj = {};
        currentPlayers.forEach(player => {
          playersObj[player.user_id] = [player];
        });
        setPlayers(playersObj);
        console.log('Loaded players:', currentPlayers.length);
      }

      return true;
    } catch (error) {
      console.error('Error joining room:', error);
      showMessage('Error al unirse a la sala: ' + error.message);
      return false;
    }
  }, [supabaseClient, userToUse, equippedAvatar, showMessage]);

  // Función para salir de la sala
  const leaveRoom = useCallback(async () => {
    if (!userToUse?.id) return;

    try {
      console.log('Starting cleanup...');

      // Limpiar intervalos
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
        moveTimeoutRef.current = null;
      }

      // Remover canales
      if (channelRef.current?.messagesChannel) {
        supabaseClient.removeChannel(channelRef.current.messagesChannel);
        console.log('Removed messages channel');
      }

      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
        console.log('Removed main channel');
      }

      // Eliminar de la base de datos
      await supabaseClient
        .from('room_players')
        .delete()
        .eq('user_id', userToUse.id);

      console.log('User left room successfully');
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }, [supabaseClient, userToUse]);

  // Heartbeat para mantener activo
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) return;

    heartbeatIntervalRef.current = setInterval(async () => {
      if (!userToUse?.id) return;

      try {
        await supabaseClient
          .from('room_players')
          .update({ 
            last_activity: new Date().toISOString() 
          })
          .eq('user_id', userToUse.id);
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    }, 25000);
  }, [supabaseClient, userToUse]);

  // Limpiar jugadores desconectados
  const startCleanup = useCallback(() => {
    if (cleanupIntervalRef.current) return;

    cleanupIntervalRef.current = setInterval(async () => {
      try {
        const cutoffTime = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        await supabaseClient
          .from('room_players')
          .delete()
          .lt('last_activity', cutoffTime)
          .neq('user_id', userToUse?.id || '');
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }, 60000);
  }, [supabaseClient, userToUse]);

  // Configurar suscripción en tiempo real
  const setupRealtime = useCallback(() => {
    if (channelRef.current) {
      console.log('Removing existing channel...');
      supabaseClient.removeChannel(channelRef.current);
    }

    console.log('Setting up realtime channel...');
    
    const channel = supabaseClient.channel('room_players_updates');

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_players',
        },
        (payload) => {
          console.log('Room event:', payload.eventType, payload.new?.username);
          
          if (payload.eventType === 'INSERT') {
            setPlayers(prev => ({
              ...prev,
              [payload.new.user_id]: [payload.new]
            }));
          }
          else if (payload.eventType === 'UPDATE') {
            setPlayers(prev => ({
              ...prev,
              [payload.new.user_id]: [payload.new]
            }));
          }
          else if (payload.eventType === 'DELETE') {
            setPlayers(prev => {
              const newPlayers = { ...prev };
              delete newPlayers[payload.old.user_id];
              return newPlayers;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Channel status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to realtime updates');
          startHeartbeat();
          startCleanup();
        }
        
        if (status === 'CHANNEL_ERROR') {
          console.error('Channel error');
          showMessage('Error de conexión en tiempo real');
        }
      });

    channelRef.current = channel;
    return channel;
  }, [supabaseClient, showMessage, startHeartbeat, startCleanup]);

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

  // Event listeners para teclado y touch
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    if (isMobile) {
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
      window.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
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

      {/* Input de chat fijo */}
      <div className="lobby-chat-input-container">
        <input
          ref={chatInputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDownChat}
          placeholder="Escribe un mensaje y presiona Enter..."
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
          {isMobile ? '🕹️ Desliza para moverte | 💬 Escribe abajo para chatear' : '🕹️ Flechas o WASD para moverte | 💬 Escribe abajo para chatear'}
        </p>
      </div>
    </div>
  );
};

export default MultiplayerLobbyView;