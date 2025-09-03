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
    width: 800,
    height: 600,
    plaza: { x: 300, y: 200, width: 200, height: 200 },
    buildings: [
      { x: 50, y: 50, width: 120, height: 100, color: '#95a5a6', name: 'Posada' },
      { x: 200, y: 50, width: 100, height: 80, color: '#e74c3c', name: 'Tienda' },
      { x: 500, y: 50, width: 150, height: 120, color: '#8B4513', name: 'Ayuntamiento' },
      { x: 50, y: 400, width: 110, height: 90, color: '#2c3e50', name: 'Casa' },
      { x: 550, y: 400, width: 140, height: 110, color: '#7f8c8d', name: 'Mercado' }
    ],
    trees: [
      { x: 150, y: 300 }, { x: 180, y: 330 }, { x: 120, y: 280 },
      { x: 500, y: 280 }, { x: 530, y: 310 }, { x: 560, y: 250 }
    ]
  };

  // Dibujar el mapa de ciudad
  const drawCityMap = useCallback((ctx) => {
    const { width, height, plaza, buildings, trees } = mapConfig;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);
    
    // Fondo del mapa (césped)
    ctx.fillStyle = '#2E8B57';
    ctx.fillRect(0, 0, width, height);
    
    // Dibujar caminos
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, plaza.y + plaza.height/2 - 20, width, 40);
    ctx.fillRect(plaza.x + plaza.width/2 - 20, 0, 40, height);
    
    // Dibujar plaza central
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(plaza.x, plaza.y, plaza.width, plaza.height);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.strokeRect(plaza.x, plaza.y, plaza.width, plaza.height);
    
    // Fuente en la plaza
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.arc(plaza.x + plaza.width/2, plaza.y + plaza.height/2, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Dibujar edificios
    buildings.forEach(building => {
      ctx.fillStyle = building.color;
      ctx.fillRect(building.x, building.y, building.width, building.height);
      
      // Puerta
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(building.x + building.width/2 - 12, building.y + building.height - 30, 24, 30);
      
      // Ventanas
      ctx.fillStyle = '#ADD8E6';
      ctx.fillRect(building.x + 15, building.y + 15, 20, 20);
      ctx.fillRect(building.x + building.width - 35, building.y + 15, 20, 20);
    });
    
    // Dibujar árboles
    trees.forEach(tree => {
      ctx.fillStyle = '#228B22';
      ctx.beginPath();
      ctx.arc(tree.x, tree.y, 20, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(tree.x - 4, tree.y + 12, 8, 20);
    });
    
    // Dibujar usuarios
    users.forEach(user => {
      drawAvatar(ctx, user);
    });
  }, [users]);

  // Dibujar avatar del usuario
  const drawAvatar = (ctx, user) => {
    const { x, y, color = '#3498db', direction = 'down' } = user;
    
    // Cuerpo
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Contorno
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Cabeza (dirección)
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    
    switch(direction) {
      case 'up':
        ctx.arc(x, y - 6, 6, 0, Math.PI * 2);
        break;
      case 'down':
        ctx.arc(x, y + 6, 6, 0, Math.PI * 2);
        break;
      case 'left':
        ctx.arc(x - 6, y, 6, 0, Math.PI * 2);
        break;
      case 'right':
        ctx.arc(x + 6, y, 6, 0, Math.PI * 2);
        break;
    }
    ctx.fill();
    ctx.stroke();
    
    // Nombre
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeText(user.name || 'Ciudadano', x, y + 20);
    ctx.fillText(user.name || 'Ciudadano', x, y + 20);
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
        setUsers(data);
        
        const namesMap = {};
        data.forEach(user => {
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

  // Unirse a la sala (VERSIÓN SIMPLIFICADA - sin direction)
  const joinRoom = async () => {
    if (!currentUser?.id) return;

    try {
      const x = mapConfig.plaza.x + mapConfig.plaza.width/2;
      const y = mapConfig.plaza.y + mapConfig.plaza.height/2;

      const userData = {
        user_id: currentUser.id,
        name: currentUser.username || 'Ciudadano',
        x: x,
        y: y,
        joined_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      };

      // Usar update en lugar de upsert para evitar problemas con columnas faltantes
      const { error } = await supabaseClient
        .from('room_users')
        .update(userData)
        .eq('user_id', currentUser.id);

      if (error) {
        // Si el usuario no existe, hacer insert
        const { error: insertError } = await supabaseClient
          .from('room_users')
          .insert(userData);

        if (insertError) {
          console.error('Error joining room:', insertError);
        }
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  // Movimiento local temporal (sin guardar en BD por ahora)
  const handleMovement = async () => {
    if (movementCooldown || !currentUser?.id) return;
    
    const currentUserData = users.find(u => u.user_id === currentUser.id);
    if (!currentUserData) return;
    
    let { x, y } = currentUserData;
    const speed = 4;
    
    movementKeys.current.forEach(key => {
      switch(key) {
        case 'w':
        case 'arrowup':
          y -= speed;
          break;
        case 's':
        case 'arrowdown':
          y += speed;
          break;
        case 'a':
        case 'arrowleft':
          x -= speed;
          break;
        case 'd':
        case 'arrowright':
          x += speed;
          break;
      }
    });
    
    // Limitar al área del mapa
    x = Math.max(15, Math.min(mapConfig.width - 15, x));
    y = Math.max(15, Math.min(mapConfig.height - 15, y));
    
    // Comprobar colisiones
    const collision = checkCollision(x, y);
    if (collision) return;
    
    // Actualizar estado local
    setUsers(prev => prev.map(user => 
      user.user_id === currentUser.id 
        ? { ...user, x, y }
        : user
    ));
    
    setMovementCooldown(true);
    setTimeout(() => setMovementCooldown(false), 50);
  };

  // Comprobar colisiones
  const checkCollision = (x, y) => {
    for (const building of mapConfig.buildings) {
      if (x + 12 > building.x && x - 12 < building.x + building.width &&
          y + 12 > building.y && y - 12 < building.y + building.height) {
        return true;
      }
    }
    
    for (const tree of mapConfig.trees) {
      const distance = Math.sqrt(Math.pow(x - tree.x, 2) + Math.pow(y - tree.y, 2));
      if (distance < 32) {
        return true;
      }
    }
    
    return false;
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

        return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
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
  }, [currentUser, supabaseClient]);

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
          <p>Usa WASD o Flechas para moverte</p>
        </div>
        
        <div className="city-container">
          <div className="game-container">
            <canvas 
              ref={canvasRef} 
              className="city-map"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonRoom;