import React, { useState, useEffect, useRef } from 'react';
import {   } from '../../services/supabase';
import '../styles/CommonRoom.css';

const CommonRoom = () => {
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [user] = useState(supabase.auth.getUser());
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const movementRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    initializeGame();
    return () => cleanupGame();
  }, []);

  const initializeGame = async () => {
    // 1. Crear o obtener jugador actual
    await setupCurrentPlayer();
    
    // 2. Cargar jugadores existentes
    await loadExistingPlayers();
    
    // 3. Suscribirse a cambios en tiempo real
    setupRealtimeSubscription();
    
    // 4. Iniciar loop del juego
    initGameLoop();
  };

  const setupCurrentPlayer = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Usuario anónimo para demo
        const guestId = 'guest_' + Date.now();
        const playerData = {
          id: guestId,
          username: `Jugador${Math.floor(Math.random() * 1000)}`,
          x: 200,
          y: 150,
          sprite: 'player1',
          direction: 'down',
          user_id: guestId,
          is_online: true
        };
        
        setCurrentPlayer(playerData);
        return;
      }

      // Buscar jugador existente
      const { data: existingPlayer } = await supabaseClient
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingPlayer) {
        // Actualizar como online
        await supabaseClient
          .from('players')
          .update({ 
            is_online: true,
            x: 200,
            y: 150,
            last_updated: new Date()
          })
          .eq('id', existingPlayer.id);
        
        setCurrentPlayer(existingPlayer);
      } else {
        // Crear nuevo jugador
        const newPlayer = {
          user_id: user.id,
          username: user.email?.split('@')[0] || `Jugador${Math.floor(Math.random() * 1000)}`,
          x: 200,
          y: 150,
          sprite: 'player1',
          direction: 'down',
          is_online: true
        };

        const { data: createdPlayer } = await supabaseClient
          .from('players')
          .insert([newPlayer])
          .select()
          .single();

        setCurrentPlayer(createdPlayer);
      }
    } catch (error) {
      console.error('Error setting up player:', error);
    }
  };

  const loadExistingPlayers = async () => {
    const { data: onlinePlayers } = await supabaseClient
      .from('players')
      .select('*')
      .eq('is_online', true)
      .eq('room_id', 'common-room');

    if (onlinePlayers) {
      setPlayers(onlinePlayers);
    }
  };

  const setupRealtimeSubscription = () => {
    // Suscribirse a cambios en la tabla de jugadores
    const subscription = supabaseClient
      .channel('room-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: 'room_id=eq.common-room'
        },
        (payload) => {
          handlePlayerUpdate(payload);
        }
      )
      .subscribe();

    return subscription;
  };

  const handlePlayerUpdate = (payload) => {
    switch (payload.eventType) {
      case 'INSERT':
        setPlayers(prev => [...prev, payload.new]);
        break;
      
      case 'UPDATE':
        setPlayers(prev => 
          prev.map(player => 
            player.id === payload.new.id ? payload.new : player
          )
        );
        break;
      
      case 'DELETE':
        setPlayers(prev => 
          prev.filter(player => player.id !== payload.old.id)
        );
        break;
    }
  };

  const initGameLoop = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const gameLoop = () => {
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
      last_updated: new Date()
    };

    setCurrentPlayer(updatedPlayer);

    // Actualizar en Supabase
    if (currentPlayer.id && !currentPlayer.id.startsWith('guest_')) {
      await supabaseClient
        .from('players')
        .update({
          x: clampedX,
          y: clampedY,
          last_updated: new Date()
        })
        .eq('id', currentPlayer.id);
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
    }, 50); // Actualizar cada 50ms para movimiento suave

    return () => clearInterval(movementInterval);
  }, [currentPlayer]);

  const cleanupGame = async () => {
    // Marcar jugador como offline al salir
    if (currentPlayer && currentPlayer.id && !currentPlayer.id.startsWith('guest_')) {
      await supabaseClient
        .from('players')
        .update({ is_online: false })
        .eq('id', currentPlayer.id);
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Sistema de Chat con Supabase
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadChatMessages();
    setupChatSubscription();
  }, []);

  const loadChatMessages = async () => {
    const { data: chatMessages } = await supabaseClient
      .from('chat_messages')
      .select('*')
      .eq('room_id', 'common-room')
      .order('created_at', { ascending: true })
      .limit(50);

    if (chatMessages) setMessages(chatMessages);
  };

  const setupChatSubscription = () => {
    supabaseClient
      .channel('chat-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: 'room_id=eq.common-room'
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentPlayer) return;

    await supabaseClient
      .from('chat_messages')
      .insert([{
        room_id: 'common-room',
        username: currentPlayer.username,
        message: newMessage,
        user_id: currentPlayer.user_id
      }]);

    setNewMessage('');
  };

  // Renderizado del chat actualizado
  const renderChat = () => (
    <div className="menu-content">
      <h3>Chat Global</h3>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className="message">
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

  // Resto del componente se mantiene igual...
  const drawMap = (ctx) => {
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#7CFC00';
    ctx.fillRect(0, 400, 800, 200);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(200, 0, 100, 600);
    ctx.fillRect(0, 250, 800, 100);
  };

  const drawPlayer = (ctx, player) => {
    ctx.fillStyle = getPlayerColor(player.id);
    ctx.fillRect(player.x - 10, player.y - 20, 20, 40);
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(player.x - 8, player.y - 25, 16, 16);
  };

  const getPlayerColor = (playerId) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const index = playerId.split('_').reduce((acc, val) => acc + val.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

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

      {/* Menú lateral (se mantiene igual) */}
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
          {activeTab === 'users' && (
            <div className="menu-content">
              <h3>Usuarios Online: {players.length}</h3>
              <div className="users-list">
                {players.map(player => (
                  <div key={player.id} className="user-item">
                    <span className="user-dot" style={{backgroundColor: getPlayerColor(player.id)}}></span>
                    {player.username}
                    {player.id === currentPlayer?.id && ' (Tú)'}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Resto de pestañas... */}
        </div>
      </div>
    </div>
  );
};

export default CommonRoom;