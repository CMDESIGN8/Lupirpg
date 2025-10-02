import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './CommonRoom.css';

const CommonRoom = () => {
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const socketRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    // Conectar al servidor Socket.io
    socketRef.current = io('http://localhost:3001');
    
    // Obtener ID del jugador actual (en una app real, esto vendría del auth)
    const playerId = 'player_' + Date.now();
    const playerData = {
      id: playerId,
      name: `Jugador${Math.floor(Math.random() * 1000)}`,
      x: 200,
      y: 150,
      sprite: 'player1', // Para diferentes sprites
      direction: 'down'
    };

    setCurrentPlayer(playerData);

    // Unirse a la sala
    socketRef.current.emit('join-room', playerData);

    // Escuchar actualizaciones de otros jugadores
    socketRef.current.on('players-update', (playersList) => {
      setPlayers(playersList);
    });

    // Inicializar el juego
    initGame();

    return () => {
      socketRef.current.disconnect();
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const initGame = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const gameLoop = () => {
      // Limpiar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Dibujar mapa de fondo (pixel art)
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

  const drawMap = (ctx) => {
    // Fondo simple - en un juego real sería un tilemap
    ctx.fillStyle = '#87CEEB'; // Cielo azul
    ctx.fillRect(0, 0, 800, 600);
    
    ctx.fillStyle = '#7CFC00'; // Pasto verde
    ctx.fillRect(0, 400, 800, 200);
    
    // Dibujar caminos y elementos del mapa
    ctx.fillStyle = '#8B4513'; // Camino marrón
    ctx.fillRect(200, 0, 100, 600);
    ctx.fillRect(0, 250, 800, 100);
  };

  const drawPlayer = (ctx, player) => {
    // Sprite simple - en un juego real cargarías imágenes
    ctx.fillStyle = getPlayerColor(player.id);
    ctx.fillRect(player.x - 10, player.y - 20, 20, 40); // Cuerpo
    
    // Cabeza
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(player.x - 8, player.y - 25, 16, 16);
  };

  const getPlayerColor = (playerId) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const index = playerId.split('_')[1] % colors.length;
    return colors[index];
  };

  const movePlayer = (dx, dy) => {
    if (!currentPlayer) return;

    const newX = currentPlayer.x + dx;
    const newY = currentPlayer.y + dy;

    // Limitar movimiento dentro del mapa
    if (newX >= 20 && newX <= 780 && newY >= 20 && newY <= 580) {
      const updatedPlayer = {
        ...currentPlayer,
        x: newX,
        y: newY
      };
      
      setCurrentPlayer(updatedPlayer);
      socketRef.current.emit('player-move', updatedPlayer);
    }
  };

  // Renderizar componentes del menú
  const renderChat = () => (
    <div className="menu-content">
      <h3>Chat Global</h3>
      <div className="chat-messages">
        <div className="message">Bienvenido a la sala común!</div>
      </div>
      <div className="chat-input">
        <input type="text" placeholder="Escribe un mensaje..." />
        <button>Enviar</button>
      </div>
    </div>
  );

  const renderOnlineUsers = () => (
    <div className="menu-content">
      <h3>Usuarios Online: {players.length}</h3>
      <div className="users-list">
        {players.map(player => (
          <div key={player.id} className="user-item">
            <span className="user-dot" style={{backgroundColor: getPlayerColor(player.id)}}></span>
            {player.name}
          </div>
        ))}
      </div>
    </div>
  );

  const renderClubMissions = () => (
    <div className="menu-content">
      <h3>Misiones del Club</h3>
      <div className="missions-list">
        <div className="mission active">🎯 Reunir 10 miembros</div>
        <div className="mission">⚔️ Derrotar al jefe del área</div>
        <div className="mission">📚 Completar tutorial</div>
      </div>
    </div>
  );

  const renderClubFeed = () => (
    <div className="menu-content">
      <h3>Feed del Club</h3>
      <div className="feed-items">
        <div className="feed-item">🎉 Nuevo evento comenzado!</div>
        <div className="feed-item">🏆 Juan completó una misión</div>
        <div className="feed-item">🆕 María se unió al club</div>
      </div>
    </div>
  );

  const renderActiveEvents = () => (
    <div className="menu-content">
      <h3>Eventos Activos</h3>
      <div className="events-list">
        <div className="event active">🏅 Torneo Semanal (3 días restantes)</div>
        <div className="event">🎁 Evento de Bienvenida</div>
      </div>
    </div>
  );

  return (
    <div className="common-room">
      {/* Área del juego */}
      <div className="game-area">
        <canvas 
          ref={canvasRef}
          width={800}
          height={600}
          className="game-canvas"
        />
        
        {/* Joystick estilo Nintendo 3DS */}
        <div className="joystick-container">
          <div className="joystick">
            <button className="joy-btn up" onClick={() => movePlayer(0, -10)}>↑</button>
            <button className="joy-btn down" onClick={() => movePlayer(0, 10)}>↓</button>
            <button className="joy-btn left" onClick={() => movePlayer(-10, 0)}>←</button>
            <button className="joy-btn right" onClick={() => movePlayer(10, 0)}>→</button>
            <div className="joy-center"></div>
          </div>
        </div>

        {/* Botón del menú */}
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
          <button 
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            💬 Chat
          </button>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Online
          </button>
          <button 
            className={`tab-btn ${activeTab === 'missions' ? 'active' : ''}`}
            onClick={() => setActiveTab('missions')}
          >
            🎯 Misiones
          </button>
          <button 
            className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            📰 Feed
          </button>
          <button 
            className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
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