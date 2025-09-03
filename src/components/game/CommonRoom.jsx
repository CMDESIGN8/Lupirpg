import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/CommonRoom.css';

const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userNames, setUserNames] = useState({});
  const [isMoving, setIsMoving] = useState(false);
  const [movementCooldown, setMovementCooldown] = useState(false);
  
  const movementKeys = useRef(new Set());
  const animationFrame = useRef(null);
  const canvasRef = useRef(null);

  // Configuración del mapa de ciudad
  const mapConfig = {
    width: 1000,
    height: 800,
    backgroundColor: '#4A90E2',
    plaza: { x: 400, y: 300, width: 200, height: 200 },
    buildings: [
      { x: 100, y: 100, width: 150, height: 120, color: '#95a5a6', name: 'Posada' },
      { x: 300, y: 100, width: 120, height: 100, color: '#e74c3c', name: 'Tienda' },
      { x: 600, y: 100, width: 180, height: 140, color: '#8B4513', name: 'Ayuntamiento' },
      { x: 100, y: 500, width: 130, height: 110, color: '#2c3e50', name: 'Casa' },
      { x: 700, y: 500, width: 160, height: 130, color: '#7f8c8d', name: 'Mercado' }
    ],
    trees: [
      { x: 250, y: 400 }, { x: 300, y: 450 }, { x: 200, y: 350 },
      { x: 650, y: 350 }, { x: 700, y: 400 }, { x: 750, y: 300 }
    ]
  };

  // Dibujar el mapa de ciudad
  const drawCityMap = useCallback((ctx) => {
    const { width, height, backgroundColor, plaza, buildings, trees } = mapConfig;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);
    
    // Fondo del mapa (césped)
    ctx.fillStyle = '#2E8B57';
    ctx.fillRect(0, 0, width, height);
    
    // Dibujar caminos
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, plaza.y + plaza.height/2 - 25, width, 50); // Camino horizontal
    ctx.fillRect(plaza.x + plaza.width/2 - 25, 0, 50, height); // Camino vertical
    
    // Dibujar plaza central
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(plaza.x, plaza.y, plaza.width, plaza.height);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.strokeRect(plaza.x, plaza.y, plaza.width, plaza.height);
    
    // Fuente en la plaza
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.arc(plaza.x + plaza.width/2, plaza.y + plaza.height/2, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Dibujar edificios
    buildings.forEach(building => {
      ctx.fillStyle = building.color;
      ctx.fillRect(building.x, building.y, building.width, building.height);
      
      // Techo
      ctx.fillStyle = '#8B0000';
      ctx.beginPath();
      ctx.moveTo(building.x - 10, building.y);
      ctx.lineTo(building.x + building.width + 10, building.y);
      ctx.lineTo(building.x + building.width/2, building.y - 20);
      ctx.closePath();
      ctx.fill();
      
      // Puerta
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(building.x + building.width/2 - 15, building.y + building.height - 40, 30, 40);
      
      // Ventanas
      ctx.fillStyle = '#ADD8E6';
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          ctx.fillRect(
            building.x + 20 + i * (building.width - 50), 
            building.y + 20 + j * (building.height - 60), 
            20, 
            20
          );
        }
      }
    });
    
    // Dibujar árboles
    trees.forEach(tree => {
      // Copa del árbol
      ctx.fillStyle = '#228B22';
      ctx.beginPath();
      ctx.arc(tree.x, tree.y, 25, 0, Math.PI * 2);
      ctx.fill();
      
      // Tronco
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(tree.x - 5, tree.y + 15, 10, 25);
    });
    
    // Dibujar usuarios
    users.forEach(user => {
      drawAvatar(ctx, user);
    });
  }, [users]);

  // Dibujar avatar del usuario
  const drawAvatar = (ctx, user) => {
    const { x, y, color, direction = 'down' } = user;
    
    // Cuerpo (círculo)
    ctx.fillStyle = color || '#3498db';
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Contorno
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Dirección (cabeza)
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    
    switch(direction) {
      case 'up':
        ctx.arc(x, y - 8, 8, 0, Math.PI * 2);
        break;
      case 'down':
        ctx.arc(x, y + 8, 8, 0, Math.PI * 2);
        break;
      case 'left':
        ctx.arc(x - 8, y, 8, 0, Math.PI * 2);
        break;
      case 'right':
        ctx.arc(x + 8, y, 8, 0, Math.PI * 2);
        break;
    }
    ctx.fill();
    ctx.stroke();
    
    // Nombre
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeText(user.name || 'Ciudadano', x, y + 25);
    ctx.fillText(user.name || 'Ciudadano', x, y + 25);
  };

  // Cargar usuarios
  const loadUsers = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('room_users')
        .select('*')
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error loading users:', error);
        return;
      }
      
      if (data) {
        const uniqueUsers = data.reduce((acc, user) => {
          if (!acc.find(u => u.user_id === user.user_id)) {
            acc.push(user);
          }
          return acc;
        }, []);
        
        setUsers(uniqueUsers);
        
        const namesMap = {};
        uniqueUsers.forEach(user => {
          namesMap[user.user_id] = user.name;
        });
        setUserNames(namesMap);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // Cargar mensajes
  const loadMessages = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('room_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }
      
      if (data) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Unirse a la sala
  const joinRoom = async () => {
    if (!currentUser?.id) return;

    try {
      // Posición inicial en la plaza central
      const x = mapConfig.plaza.x + mapConfig.plaza.width/2;
      const y = mapConfig.plaza.y + mapConfig.plaza.height/2;

      const userData = {
        user_id: currentUser.id,
        name: currentUser.username || 'Ciudadano',
        x: x,
        y: y,
        direction: 'down',
        color: getRandomColor(),
        joined_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      };

      const { error } = await supabaseClient
        .from('room_users')
        .upsert(userData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error joining room:', error);
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  // Generar color aleatorio
  const getRandomColor = () => {
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Limpiar usuarios inactivos
  const cleanupInactiveUsers = async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { error } = await supabaseClient
        .from('room_users')
        .delete()
        .lt('last_activity', fiveMinutesAgo);

      if (error) {
        console.error('Error cleaning up users:', error);
      }
    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  };

  // Salir de la sala
  const leaveRoom = async () => {
    if (!currentUser?.id) return;

    try {
      const { error } = await supabaseClient
        .from('room_users')
        .delete()
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error leaving room:', error);
      }
    } catch (error) {
      console.error('Error in leaveRoom:', error);
    }
  };

  // Actualizar actividad del usuario
  const updateUserActivity = async () => {
    if (!currentUser?.id) return;

    try {
      const { error } = await supabaseClient
        .from('room_users')
        .update({ 
          last_activity: new Date().toISOString() 
        })
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error updating activity:', error);
      }
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

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
    const speed = 4;
    let newDirection = direction;
    
    // Procesar teclas presionadas
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
    x = Math.max(20, Math.min(mapConfig.width - 20, x));
    y = Math.max(20, Math.min(mapConfig.height - 20, y));
    
    // Comprobar colisiones con edificios
    const collision = checkCollision(x, y);
    if (collision) return;
    
    // Actualizar solo si la posición cambió
    if (x !== currentUserData.x || y !== currentUserData.y || direction !== newDirection) {
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
        
        setTimeout(() => setMovementCooldown(false), 50);
      } catch (error) {
        console.error('Error moving avatar:', error);
        setMovementCooldown(false);
      }
    }
  };

  // Comprobar colisiones con edificios
  const checkCollision = (x, y) => {
    // Colisión con edificios
    for (const building of mapConfig.buildings) {
      if (x + 15 > building.x && x - 15 < building.x + building.width &&
          y + 15 > building.y && y - 15 < building.y + building.height) {
        return true;
      }
    }
    
    // Colisión con árboles
    for (const tree of mapConfig.trees) {
      const distance = Math.sqrt(Math.pow(x - tree.x, 2) + Math.pow(y - tree.y, 2));
      if (distance < 40) { // Radio del árbol + radio del avatar
        return true;
      }
    }
    
    return false;
  };

  // Obtener nombre para mostrar
  const getUserDisplayName = (userId) => {
    return userNames[userId] || `Ciudadano${userId ? userId.slice(-4) : ''}`;
  };

  // Enviar mensaje
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser?.id) return;

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

  // Efecto principal
  useEffect(() => {
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    const initializeRoom = async () => {
      setIsLoading(true);
      try {
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

  // Dibujar en el canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = mapConfig.width;
    canvas.height = mapConfig.height;
    
    drawCityMap(ctx);
  }, [users, drawCityMap]);

  if (isLoading) {
    return (
      <div className="city-modal">
        <div className="city-content">
          <div className="city-header">
            <h2>🏙️ Ciudad Lupi</h2>
            <button className="close-btn" onClick={onClose}>⨉</button>
          </div>
          <div className="loading-container">
            <p>Entrando a la ciudad...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="city-modal">
      <div className="city-content">
        <div className="city-header">
          <h2>🏙️ Ciudad Lupi</h2>
          <button className="close-btn" onClick={onClose}>⨉</button>
          <div className="player-count">
            👥 {users.filter(user => user.user_id).length} ciudadanos
          </div>
        </div>
        
        <div className="controls-info">
          <p>Usa WASD o Flechas para moverte por la ciudad</p>
        </div>
        
        <div className="city-container">
          <div className="game-container">
            <canvas 
              ref={canvasRef} 
              className="city-map"
            />
          </div>
          
          <div className="city-chat">
            <div className="chat-title">💬 Plaza Central</div>
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
                placeholder="Escribe un mensaje..."
                disabled={!currentUser}
              />
              <button type="submit" disabled={!currentUser || !newMessage.trim()}>
                ➤
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonRoom;