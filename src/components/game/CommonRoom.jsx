import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/CommonRoom.css';

const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userNames, setUserNames] = useState({});
  const [selectedMap, setSelectedMap] = useState('ciudad');
  const [isMoving, setIsMoving] = useState(false);
  const [movementCooldown, setMovementCooldown] = useState(false);
  const movementKeys = useRef(new Set());
  const animationFrame = useRef(null);
  const lastPosition = useRef({ x: 0, y: 0 });
  
  // Mapas disponibles (similar a las ciudades de Argentum)
  const maps = [
    { id: 'ciudad', name: '🏙️ Ciudad', color: '#4A90E2', width: 1000, height: 600 },
    { id: 'bosque', name: '🌲 Bosque', color: '#228B22', width: 1200, height: 800 },
    { id: 'castillo', name: '🏰 Castillo', width: 800, height: 800, color: '#8B4513' },
    { id: 'mercado', name: '🛒 Mercado', width: 900, height: 500, color: '#FFD700' },
    { id: 'taberna', name: '🍻 Taberna', width: 700, height: 500, color: '#8B0000' }
  ];

  // Elementos interactivos del mapa
  const [mapElements, setMapElements] = useState([]);
  
  // Dibujar el mapa y los elementos
  const drawMap = useCallback((ctx, mapId) => {
    const map = maps.find(m => m.id === mapId) || maps[0];
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Fondo del mapa
    ctx.fillStyle = map.color + '40'; // Transparencia
    ctx.fillRect(0, 0, width, height);
    
    // Dibujar elementos del mapa
    mapElements.forEach(element => {
      if (element.map === mapId) {
        drawMapElement(ctx, element);
      }
    });
    
    // Dibujar usuarios
    users.forEach(user => {
      drawAvatar(ctx, user);
    });
  }, [users, mapElements, maps]);

  // Dibujar elementos del mapa
  const drawMapElement = (ctx, element) => {
    const { x, y, type, width, height } = element;
    
    ctx.fillStyle = element.color || '#FFFFFF';
    
    switch(type) {
      case 'building':
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // Ventanas
        ctx.fillStyle = '#ADD8E6';
        for (let i = 0; i < Math.floor(width / 30); i++) {
          for (let j = 0; j < Math.floor(height / 40); j++) {
            ctx.fillRect(x + 10 + i * 30, y + 10 + j * 40, 15, 20);
          }
        }
        break;
        
      case 'tree':
        ctx.beginPath();
        ctx.arc(x + 15, y, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 10, y + 20, 10, 30);
        break;
        
      case 'npc':
        ctx.fillStyle = '#FF6347';
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.font = '10px Arial';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText(element.name || 'NPC', x, y + 25);
        break;
        
      default:
        ctx.fillRect(x, y, width, height);
    }
  };

  // Dibujar avatar del usuario
  const drawAvatar = (ctx, user) => {
    const { x, y, color, direction = 'down' } = user;
    
    // Cuerpo
    ctx.fillStyle = color || '#3498db';
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Contorno
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Dirección (indicada por un punto)
    ctx.fillStyle = '#000000';
    switch(direction) {
      case 'up':
        ctx.beginPath();
        ctx.arc(x, y - 8, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'down':
        ctx.beginPath();
        ctx.arc(x, y + 8, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'left':
        ctx.beginPath();
        ctx.arc(x - 8, y, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'right':
        ctx.beginPath();
        ctx.arc(x + 8, y, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
    
    // Nombre
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText(user.name || 'Aventurero', x, y + 20);
    ctx.fillText(user.name || 'Aventurero', x, y + 20);
  };

  // Efecto principal
  useEffect(() => {
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    const initializeRoom = async () => {
      setIsLoading(true);
      try {
        await loadMapElements();
        await loadUsers();
        await loadMessages();
        await joinRoom();

        // Suscripción a cambios de usuarios
        const userSubscription = supabaseClient
          .channel('room_users_changes')
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'room_users' 
            }, 
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setUsers(prev => [...prev, payload.new]);
              } else if (payload.eventType === 'DELETE') {
                setUsers(prev => prev.filter(user => user.user_id !== payload.old.user_id));
              } else if (payload.eventType === 'UPDATE') {
                setUsers(prev => prev.map(user => 
                  user.user_id === payload.new.user_id ? payload.new : user
                ));
              }
            }
          )
          .subscribe();

        // Suscripción a mensajes
        const messageSubscription = supabaseClient
          .channel('room_messages_changes')
          .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'room_messages' 
            }, 
            (payload) => {
              setMessages(prev => [...prev, payload.new]);
            }
          )
          .subscribe();

        // Control de movimiento con teclado
        const handleKeyDown = (e) => {
          if (movementCooldown) return;
          
          const key = e.key.toLowerCase();
          if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
            movementKeys.current.add(key);
            if (!isMoving) {
              setIsMoving(true);
              startMovement();
            }
          }
        };

        const handleKeyUp = (e) => {
          const key = e.key.toLowerCase();
          movementKeys.current.delete(key);
          if (movementKeys.current.size === 0) {
            setIsMoving(false);
          }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Limpiar usuarios inactivos
        const cleanupInterval = setInterval(cleanupInactiveUsers, 30000);

        return () => {
          userSubscription.unsubscribe();
          messageSubscription.unsubscribe();
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
          clearInterval(cleanupInterval);
          leaveRoom();
          if (animationFrame.current) {
            cancelAnimationFrame(animationFrame.current);
          }
        };
      } catch (error) {
        console.error('Error initializing room:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeRoom();
  }, [currentUser, supabaseClient, movementCooldown, isMoving]);

  // Iniciar el bucle de movimiento
  const startMovement = () => {
    const move = () => {
      if (movementKeys.current.size > 0 && isMoving) {
        handleMovement();
        animationFrame.current = requestAnimationFrame(move);
      }
    };
    animationFrame.current = requestAnimationFrame(move);
  };

  // Manejar movimiento
  const handleMovement = async () => {
    if (movementCooldown || !currentUser?.id) return;
    
    const currentUserData = users.find(u => u.user_id === currentUser.id);
    if (!currentUserData) return;
    
    let { x, y, direction } = currentUserData;
    const speed = 5;
    let newDirection = direction;
    
    // Calcular nueva posición basada en teclas presionadas
    movementKeys.current.forEach(key => {
      switch(key) {
        case 'w':
        case 'arrowup':
          y -= speed;
          newDirection = 'up';
          break;
        case 's':
        case 'arrowdown':
          y += speed;
          newDirection = 'down';
          break;
        case 'a':
        case 'arrowleft':
          x -= speed;
          newDirection = 'left';
          break;
        case 'd':
        case 'arrowright':
          x += speed;
          newDirection = 'right';
          break;
      }
    });
    
    // Limitar al área del mapa
    const currentMap = maps.find(m => m.id === selectedMap) || maps[0];
    x = Math.max(20, Math.min(currentMap.width - 20, x));
    y = Math.max(20, Math.min(currentMap.height - 20, y));
    
    // Actualizar solo si la posición cambió
    if (x !== currentUserData.x || y !== currentUserData.y || direction !== newDirection) {
      // Comprobar colisiones con elementos del mapa
      const collision = checkCollision(x, y, mapElements);
      if (collision) return; // No mover si hay colisión
      
      lastPosition.current = { x, y };
      
      try {
        setMovementCooldown(true);
        
        const { error } = await supabaseClient
          .from('room_users')
          .update({ 
            x: Math.round(x), 
            y: Math.round(y),
            direction: newDirection,
            last_activity: new Date().toISOString()
          })
          .eq('user_id', currentUser.id);

        if (error) {
          console.error('Error moving avatar:', error);
        }
        
        // Pequeño cooldown para evitar spam a la base de datos
        setTimeout(() => setMovementCooldown(false), 100);
      } catch (error) {
        console.error('Error moving avatar:', error);
        setMovementCooldown(false);
      }
    }
  };

  // Comprobar colisiones con elementos del mapa
  const checkCollision = (x, y, elements) => {
    for (const element of elements) {
      if (element.map !== selectedMap) continue;
      
      // Colisión simple con rectángulos
      if (x + 15 > element.x && x - 15 < element.x + element.width &&
          y + 15 > element.y && y - 15 < element.y + element.height) {
        return true;
      }
    }
    return false;
  };

  // Cargar elementos del mapa
  const loadMapElements = async () => {
    try {
      // En una implementación real, estos vendrían de la base de datos
      const elements = [
        { id: 1, map: 'ciudad', type: 'building', x: 100, y: 100, width: 200, height: 150, color: '#95a5a6', name: 'Posada' },
        { id: 2, map: 'ciudad', type: 'building', x: 400, y: 150, width: 180, height: 120, color: '#e74c3c', name: 'Tienda' },
        { id: 3, map: 'ciudad', type: 'npc', x: 250, y: 300, width: 30, height: 30, color: '#f39c12', name: 'Mercader' },
        { id: 4, map: 'bosque', type: 'tree', x: 200, y: 200, width: 30, height: 50, color: '#27ae60', name: 'Árbol' },
        { id: 5, map: 'bosque', type: 'tree', x: 300, y: 350, width: 30, height: 50, color: '#27ae60', name: 'Árbol' },
        { id: 6, map: 'castillo', type: 'building', x: 300, y: 100, width: 300, height: 200, color: '#7f8c8d', name: 'Torreón' },
      ];
      
      setMapElements(elements);
    } catch (error) {
      console.error('Error loading map elements:', error);
    }
  };

  // (El resto de funciones como loadUsers, loadMessages, joinRoom, etc. se mantienen similares)
  // ... [las funciones existentes se mantienen con pequeñas adaptaciones]

  // Dibujar en el canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const currentMap = maps.find(m => m.id === selectedMap) || maps[0];
    
    // Ajustar tamaño del canvas al mapa seleccionado
    canvas.width = currentMap.width;
    canvas.height = currentMap.height;
    
    drawMap(ctx, selectedMap);
  }, [users, selectedMap, mapElements, drawMap]);

  // Interactuar con NPCs o objetos
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Comprobar si se hizo clic en un NPC
    const clickedNpc = mapElements.find(element => 
      element.type === 'npc' && 
      Math.sqrt(Math.pow(x - element.x, 2) + Math.pow(y - element.y, 2)) < 20
    );
    
    if (clickedNpc) {
      // Mostrar diálogo del NPC
      setNewMessage(`/hablar ${clickedNpc.name}`);
    } else {
      // Mover al punto clicado (pathfinding simple)
      const currentUserData = users.find(u => u.user_id === currentUser.id);
      if (currentUserData) {
        moveTo(x, y);
      }
    }
  };

  // Movimiento hacia un punto específico (clic)
  const moveTo = async (targetX, targetY) => {
    if (!currentUser?.id) return;
    
    // Aquí implementarías un algoritmo de pathfinding simple
    // Por ahora, movimiento directo
    try {
      const { error } = await supabaseClient
        .from('room_users')
        .update({ 
          x: Math.round(targetX), 
          y: Math.round(targetY),
          last_activity: new Date().toISOString()
        })
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error moving avatar:', error);
      }
    } catch (error) {
      console.error('Error moving avatar:', error);
    }
  };

  // Enviar mensaje con soporte para comandos
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser?.id) return;

    // Comandos especiales (como en Argentum)
    if (newMessage.startsWith('/')) {
      const parts = newMessage.split(' ');
      const command = parts[0].substring(1).toLowerCase();
      
      switch(command) {
        case 'dado':
          // Tirar dado
          const roll = Math.floor(Math.random() * 100) + 1;
          setNewMessage(`🎲 ${currentUser.username} tira un dado: ${roll}`);
          break;
        case 'hablar':
          // Hablar con NPC
          const npcName = parts[1];
          setNewMessage(`🗣️ ${currentUser.username} habla con ${npcName || 'el NPC'}`);
          break;
        case 'emote':
          // Emote
          const emote = parts[1] || 'saluda';
          setNewMessage(`/me ${emote}`);
          break;
        default:
          // Comando no reconocido
          setNewMessage(`❌ Comando no reconocido: ${command}`);
          break;
      }
    }

    try {
      const { error } = await supabaseClient
        .from('room_messages')
        .insert({
          user_id: currentUser.id,
          content: newMessage.trim(),
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage('');
      updateUserActivity();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="world-modal">
        <div className="world-content">
          <div className="world-header">
            <h2>🌍 Mundo de LupiApp</h2>
            <button className="close-btn" onClick={onClose}>⨉</button>
          </div>
          <div className="loading-container">
            <p>Entrando al mundo...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="world-modal">
      <div className="world-content">
        <div className="world-header">
          <h2>🌍 Mundo de LupiApp</h2>
          <button className="close-btn" onClick={onClose}>⨉</button>
          <div className="player-count">
            👥 {users.filter(user => user.user_id).length} jugadores conectados
          </div>
        </div>
        
        <div className="map-selector">
          <h3>Selecciona un mapa:</h3>
          <div className="map-buttons">
            {maps.map(map => (
              <button
                key={map.id}
                onClick={() => setSelectedMap(map.id)}
                className={selectedMap === map.id ? 'active' : ''}
                style={{borderColor: map.color}}
              >
                {map.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="world-container">
          <div className="game-container">
            <canvas 
              ref={canvasRef} 
              onClick={handleCanvasClick}
              className="game-world"
            />
            <div className="controls-help">
              <p>Controles: WASD o Flechas para moverte | Clic para interactuar</p>
            </div>
          </div>
          
          <div className="game-chat">
            <div className="chat-title">💬 Chat</div>
            <div className="messages">
              {messages.map(msg => (
                <div key={msg.id} className="message">
                  <span className="player-name">
                    {getUserDisplayName(msg.user_id)}:
                  </span>
                  <span className="message-content">{msg.content}</span>
                </div>
              ))}
            </div>
            
            <form onSubmit={sendMessage} className="message-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje o /comando"
                disabled={!currentUser}
              />
              <button type="submit" disabled={!currentUser || !newMessage.trim()}>
                ➤ Enviar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonRoom;