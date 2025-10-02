import React, { useState, useEffect, useRef } from 'react';
import { supabaseClient } from '../../services/supabase';
import '../styles/CommonRoom.css';

const CommonRoom = () => {
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const movementRef = useRef({ x: 0, y: 0 });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    initializeGame();
    return () => cleanupGame();
  }, []);

  const initializeGame = async () => {
    try {
      // 1. Crear o obtener jugador actual
      await setupCurrentPlayer();
      
      // 2. Cargar jugadores existentes
      await loadExistingPlayers();
      
      // 3. Suscribirse a cambios en tiempo real
      setupRealtimeSubscription();
      
      // 4. Cargar y suscribirse al chat
      await loadChatMessages();
      setupChatSubscription();
      
      // 5. Iniciar loop del juego
      initGameLoop();
    } catch (error) {
      console.error('Error initializing game:', error);
    }
  };

  const setupCurrentPlayer = async () => {
    try {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        createGuestPlayer();
        return;
      }
      
      if (!user) {
        createGuestPlayer();
        return;
      }

      // Buscar jugador existente en room_users
      const { data: existingPlayer, error: fetchError } = await supabaseClient
        .from('room_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching player:', fetchError);
        createGuestPlayer();
        return;
      }

      if (existingPlayer) {
        // Actualizar como online
        const { error: updateError } = await supabaseClient
          .from('room_users')
          .update({ 
            is_online: true,
            x: 200,
            y: 150,
            last_activity: new Date().toISOString(),
            last_heartbeat: new Date().toISOString()
          })
          .eq('id', existingPlayer.id);
        
        if (updateError) {
          console.error('Error updating player:', updateError);
          createGuestPlayer();
          return;
        }
        
        setCurrentPlayer({ ...existingPlayer, is_online: true });
      } else {
        // Crear nuevo jugador en room_users
        const { data: playerProfile } = await supabaseClient
          .from('players')
          .select('username, sport, position')
          .eq('id', user.id)
          .single();

        const newPlayer = {
          user_id: user.id,
          name: playerProfile?.username || user.email?.split('@')[0] || `Jugador${Math.floor(Math.random() * 1000)}`,
          sport: playerProfile?.sport || 'fútbol',
          x: 200,
          y: 150,
          color: getRandomColor(),
          is_online: true,
          last_activity: new Date().toISOString(),
          last_heartbeat: new Date().toISOString()
        };

        const { data: createdPlayer, error: insertError } = await supabaseClient
          .from('room_users')
          .insert([newPlayer])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating player:', insertError);
          createGuestPlayer();
          return;
        }

        setCurrentPlayer(createdPlayer);
      }
    } catch (error) {
      console.error('Error setting up player:', error);
      createGuestPlayer();
    }
  };

  const getRandomColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98FB98', '#FFD700'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const createGuestPlayer = () => {
    const guestId = 'guest_' + Date.now();
    const playerData = {
      id: guestId,
      user_id: guestId,
      name: `Invitado${Math.floor(Math.random() * 1000)}`,
      x: 200,
      y: 150,
      color: getRandomColor(),
      sport: 'fútbol',
      is_online: true,
      last_activity: new Date().toISOString()
    };
    
    setCurrentPlayer(playerData);
  };

  const loadExistingPlayers = async () => {
    try {
      const { data: onlinePlayers, error } = await supabaseClient
        .from('room_users')
        .select('*')
        .eq('is_online', true);

      if (error) {
        console.error('Error loading players:', error);
        return;
      }

      if (onlinePlayers) {
        setPlayers(onlinePlayers);
      }
    } catch (error) {
      console.error('Error in loadExistingPlayers:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    try {
      const subscription = supabaseClient
        .channel('room-users-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'room_users'
          },
          (payload) => {
            handlePlayerUpdate(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Connected to room_users realtime');
          }
        });

      return subscription;
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }
  };

  const handlePlayerUpdate = (payload) => {
    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new.is_online) {
          setPlayers(prev => [...prev.filter(p => p.id !== payload.new.id), payload.new]);
        }
        break;
      
      case 'UPDATE':
        if (payload.new.is_online) {
          setPlayers(prev => 
            prev.map(player => 
              player.id === payload.new.id ? { ...player, ...payload.new } : player
            )
          );
        } else {
          setPlayers(prev => 
            prev.filter(player => player.id !== payload.new.id)
          );
        }
        break;
      
      case 'DELETE':
        setPlayers(prev => 
          prev.filter(player => player.id !== payload.old.id)
        );
        break;
      
      default:
        break;
    }
  };

  const initGameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const gameLoop = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawMap(ctx);
      
      // Dibujar todos los jugadores
      players.forEach(player => {
        drawPlayer(ctx, player);
      });
      
      // Dibujar jugador actual
      if (currentPlayer) {
        drawPlayer(ctx, currentPlayer);
      }
      
      animationRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoop();
  };

  const updatePlayerPosition = async (newX, newY) => {
    if (!currentPlayer) return;

    // Limitar movimiento
    const clampedX = Math.max(20, Math.min(780, newX));
    const clampedY = Math.max(20, Math.min(580, newY));

    const updatedPlayer = {
      ...currentPlayer,
      x: clampedX,
      y: clampedY,
      last_activity: new Date().toISOString(),
      last_heartbeat: new Date().toISOString()
    };

    setCurrentPlayer(updatedPlayer);

    // Actualizar en Supabase solo si no es guest
    if (currentPlayer.id && !currentPlayer.id.startsWith('guest_')) {
      try {
        const { error } = await supabaseClient
          .from('room_users')
          .update({
            x: clampedX,
            y: clampedY,
            last_activity: new Date().toISOString(),
            last_heartbeat: new Date().toISOString()
          })
          .eq('id', currentPlayer.id);

        if (error) {
          console.error('Error updating position:', error);
        }
      } catch (error) {
        console.error('Error in updatePlayerPosition:', error);
      }
    }
  };

  const movePlayer = (dx, dy) => {
    if (!currentPlayer) return;
    
    const newX = currentPlayer.x + dx;
    const newY = currentPlayer.y + dy;
    updatePlayerPosition(newX, newY);
  };

  // Sistema de movimiento continuo con el joystick
  const startContinuousMovement = (dx, dy) => {
    movementRef.current = { x: dx, y: dy };
  };

  const stopContinuousMovement = () => {
    movementRef.current = { x: 0, y: 0 };
  };

  useEffect(() => {
    const movementInterval = setInterval(() => {
      if (movementRef.current.x !== 0 || movementRef.current.y !== 0) {
        movePlayer(movementRef.current.x, movementRef.current.y);
      }
    }, 50);

    return () => clearInterval(movementInterval);
  }, [currentPlayer]);

  const cleanupGame = async () => {
    // Marcar jugador como offline al salir
    if (currentPlayer && currentPlayer.id && !currentPlayer.id.startsWith('guest_')) {
      try {
        await supabaseClient
          .from('room_users')
          .update({ 
            is_online: false,
            last_activity: new Date().toISOString()
          })
          .eq('id', currentPlayer.id);
      } catch (error) {
        console.error('Error cleaning up player:', error);
      }
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Sistema de Chat usando room_messages
  const loadChatMessages = async () => {
    try {
      const { data: chatMessages, error } = await supabaseClient
        .from('room_messages')
        .select(`
          *,
          user:user_id (
            id,
            email
          )
        `)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error loading chat messages:', error);
        return;
      }

      if (chatMessages) {
        // Formatear mensajes para mostrar
        const formattedMessages = chatMessages.map(msg => ({
          id: msg.id,
          username: msg.user?.email?.split('@')[0] || 'Usuario',
          message: msg.content,
          created_at: msg.created_at
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error in loadChatMessages:', error);
    }
  };

  const setupChatSubscription = () => {
    try {
      supabaseClient
        .channel('room-messages-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'room_messages'
          },
          async (payload) => {
            // Obtener información del usuario para el nuevo mensaje
            const { data: userData } = await supabaseClient
              .from('auth.users')
              .select('email')
              .eq('id', payload.new.user_id)
              .single();

            const newMessage = {
              id: payload.new.id,
              username: userData?.email?.split('@')[0] || 'Usuario',
              message: payload.new.content,
              created_at: payload.new.created_at
            };

            setMessages(prev => [...prev, newMessage]);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Connected to room_messages realtime');
          }
        });
    } catch (error) {
      console.error('Error setting up chat subscription:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentPlayer) return;

    try {
      const { error } = await supabaseClient
        .from('room_messages')
        .insert([{
          user_id: currentPlayer.user_id.startsWith('guest_') ? null : currentPlayer.user_id,
          content: newMessage
        }]);

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error in sendMessage:', error);
    }
  };

  // Renderizado del chat
  const renderChat = () => (
    <div className="menu-content">
      <h3>Chat Global</h3>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={msg.id || index} className="message">
            <strong>{msg.username}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input 
          type="text" 
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Enviar</button>
      </div>
    </div>
  );

  // Funciones de dibujo
  const drawMap = (ctx) => {
    // Fondo del mapa
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, 800, 600);
    
    // Suelo
    ctx.fillStyle = '#7CFC00';
    ctx.fillRect(0, 400, 800, 200);
    
    // Caminos
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(200, 0, 100, 600);
    ctx.fillRect(0, 250, 800, 100);
    
    // Edificios o áreas especiales
    ctx.fillStyle = '#A52A2A';
    ctx.fillRect(50, 50, 100, 80); // Casa izquierda
    ctx.fillRect(650, 50, 100, 80); // Casa derecha
    ctx.fillRect(350, 500, 100, 80); // Edificio central
  };

  const drawPlayer = (ctx, player) => {
    // Cuerpo del jugador
    ctx.fillStyle = player.color || '#FF6B6B';
    ctx.fillRect(player.x - 10, player.y - 20, 20, 40);
    
    // Cabeza
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(player.x - 8, player.y - 25, 16, 16);
    
    // Nombre del jugador
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.name, player.x, player.y - 35);
    
    // Indicador deporte
    const sportEmoji = getSportEmoji(player.sport);
    ctx.font = '16px Arial';
    ctx.fillText(sportEmoji, player.x, player.y + 30);
  };

  const getSportEmoji = (sport) => {
    const emojis = {
      'fútbol': '⚽',
      'baloncesto': '🏀',
      'tenis': '🎾',
      'natación': '🏊',
      'atletismo': '🏃'
    };
    return emojis[sport] || '🎯';
  };

  const getPlayerColor = (playerId) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98FB98'];
    const index = String(playerId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // Renderizar otras pestañas del menú
  const renderOnlineUsers = () => (
    <div className="menu-content">
      <h3>Usuarios Online: {players.length}</h3>
      <div className="users-list">
        {players.map(player => (
          <div key={player.id} className="user-item">
            <span 
              className="user-dot" 
              style={{backgroundColor: player.color || getPlayerColor(player.id)}}
            ></span>
            <div className="user-info">
              <div className="user-name">{player.name}</div>
              <div className="user-sport">{getSportEmoji(player.sport)} {player.sport}</div>
            </div>
            {player.id === currentPlayer?.id && <span className="you-badge">(Tú)</span>}
          </div>
        ))}
      </div>
    </div>
  );

  const renderClubMissions = () => (
    <div className="menu-content">
      <h3>Misiones del Club</h3>
      <div className="missions-list">
        <div className="mission active">
          <span className="mission-icon">🎯</span>
          <div className="mission-info">
            <div className="mission-name">Reunir 10 miembros</div>
            <div className="mission-progress">Progreso: 5/10</div>
          </div>
        </div>
        <div className="mission">
          <span className="mission-icon">⚔️</span>
          <div className="mission-info">
            <div className="mission-name">Derrotar al jefe del área</div>
            <div className="mission-progress">Progreso: 0/1</div>
          </div>
        </div>
        <div className="mission">
          <span className="mission-icon">📚</span>
          <div className="mission-info">
            <div className="mission-name">Completar tutorial</div>
            <div className="mission-progress">Progreso: 3/5</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderClubFeed = () => (
    <div className="menu-content">
      <h3>Feed del Club</h3>
      <div className="feed-items">
        <div className="feed-item">
          <span className="feed-icon">🎉</span>
          <div className="feed-content">Nuevo evento comenzado!</div>
        </div>
        <div className="feed-item">
          <span className="feed-icon">🏆</span>
          <div className="feed-content">Juan completó una misión difícil</div>
        </div>
        <div className="feed-item">
          <span className="feed-icon">🆕</span>
          <div className="feed-content">María se unió al club</div>
        </div>
      </div>
    </div>
  );

  const renderActiveEvents = () => (
    <div className="menu-content">
      <h3>Eventos Activos</h3>
      <div className="events-list">
        <div className="event active">
          <span className="event-icon">🏅</span>
          <div className="event-info">
            <div className="event-name">Torneo Semanal</div>
            <div className="event-time">3 días restantes</div>
          </div>
        </div>
        <div className="event">
          <span className="event-icon">🎁</span>
          <div className="event-info">
            <div className="event-name">Evento de Bienvenida</div>
            <div className="event-time">Nuevos jugadores</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="common-room">
      <div className="game-area">
        <canvas 
          ref={canvasRef}
          width={800}
          height={600}
          className="game-canvas"
        />
        
        {/* Joystick mejorado con movimiento continuo */}
        <div className="joystick-container">
          <div className="joystick">
            <button 
              className="joy-btn up" 
              onMouseDown={() => startContinuousMovement(0, -5)}
              onMouseUp={stopContinuousMovement}
              onTouchStart={() => startContinuousMovement(0, -5)}
              onTouchEnd={stopContinuousMovement}
            >↑</button>
            
            <button 
              className="joy-btn down"
              onMouseDown={() => startContinuousMovement(0, 5)}
              onMouseUp={stopContinuousMovement}
              onTouchStart={() => startContinuousMovement(0, 5)}
              onTouchEnd={stopContinuousMovement}
            >↓</button>
            
            <button 
              className="joy-btn left"
              onMouseDown={() => startContinuousMovement(-5, 0)}
              onMouseUp={stopContinuousMovement}
              onTouchStart={() => startContinuousMovement(-5, 0)}
              onTouchEnd={stopContinuousMovement}
            >←</button>
            
            <button 
              className="joy-btn right"
              onMouseDown={() => startContinuousMovement(5, 0)}
              onMouseUp={stopContinuousMovement}
              onTouchStart={() => startContinuousMovement(5, 0)}
              onTouchEnd={stopContinuousMovement}
            >→</button>
            
            <div className="joy-center"></div>
          </div>
        </div>

        <button 
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? '▶' : '◀'}
        </button>
      </div>

      {/* Menú lateral */}
      <div className={`game-menu ${menuOpen ? 'open' : ''}`}>
        <div className="menu-tabs">
          <button onClick={() => setActiveTab('chat')} className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}>
            💬 Chat
          </button>
          <button onClick={() => setActiveTab('users')} className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}>
            👥 Online ({players.length})
          </button>
          <button onClick={() => setActiveTab('missions')} className={`tab-btn ${activeTab === 'missions' ? 'active' : ''}`}>
            🎯 Misiones
          </button>
          <button onClick={() => setActiveTab('feed')} className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}>
            📰 Feed
          </button>
          <button onClick={() => setActiveTab('events')} className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}>
            🎪 Eventos
          </button>
        </div>

        <div className="menu-panel">
          {activeTab === 'chat' && renderChat()}
          {activeTab === 'users' && renderOnlineUsers()}
          {activeTab === 'missions' && renderClubMissions()}
          {activeTab === 'feed' && renderClubFeed()}
          {activeTab === 'events' && renderActiveEvents()}
        </div>
      </div>
    </div>
  );
};

export default CommonRoom;