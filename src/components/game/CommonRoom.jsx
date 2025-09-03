import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/CommonRoom.css';

const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [movementCooldown, setMovementCooldown] = useState(false);
  
  const movementKeys = useRef(new Set());
  const animationFrame = useRef(null);
  const canvasRef = useRef(null);

  // Configuración del mapa
  const mapConfig = {
    width: 800,
    height: 600,
    plaza: { x: 300, y: 200, width: 200, height: 200 }
  };

  // Dibujar el mapa
  const drawMap = useCallback((ctx) => {
    console.log('Dibujando mapa...');
    const { width, height, plaza } = mapConfig;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);
    
    // Fondo verde
    ctx.fillStyle = '#2E8B57';
    ctx.fillRect(0, 0, width, height);
    
    // Plaza central (color arena)
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(plaza.x, plaza.y, plaza.width, plaza.height);
    
    // Borde plaza
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.strokeRect(plaza.x, plaza.y, plaza.width, plaza.height);
    
    // Dibujar usuarios
    users.forEach(user => {
      drawAvatar(ctx, user);
    });
    
    console.log('Mapa dibujado con', users.length, 'usuarios');
  }, [users]);

  // Dibujar avatar
  const drawAvatar = (ctx, user) => {
    const { x, y } = user;
    
    // Cuerpo (círculo azul)
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Contorno negro
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Nombre
    ctx.font = '12px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(user.name || 'Jugador', x, y + 20);
  };

  // Efecto principal
  useEffect(() => {
    console.log('Inicializando sala...');
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    const initializeRoom = async () => {
      setIsLoading(true);
      try {
        // Crear usuario local
        const initialUser = {
          user_id: currentUser.id,
          name: currentUser.username || 'Jugador',
          x: mapConfig.plaza.x + mapConfig.plaza.width/2,
          y: mapConfig.plaza.y + mapConfig.plaza.height/2
        };
        
        setUsers([initialUser]);
        console.log('Usuario creado:', initialUser);

        // Control de teclado
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
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeRoom();
  }, [currentUser]);

  // Movimiento
  const handleMovement = () => {
    if (movementCooldown || !currentUser?.id) return;
    
    setUsers(prev => prev.map(user => {
      if (user.user_id !== currentUser.id) return user;
      
      let { x, y } = user;
      const speed = 5;
      
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
      
      // Limitar al mapa
      x = Math.max(20, Math.min(mapConfig.width - 20, x));
      y = Math.max(20, Math.min(mapConfig.height - 20, y));
      
      return { ...user, x, y };
    }));
    
    setMovementCooldown(true);
    setTimeout(() => setMovementCooldown(false), 50);
  };

  // Iniciar bucle de movimiento
  const startMovement = () => {
    const move = () => {
      if (movementKeys.current.size > 0 && isMoving) {
        handleMovement();
        animationFrame.current = requestAnimationFrame(move);
      }
    };
    animationFrame.current = requestAnimationFrame(move);
  };

  // Dibujar en canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('Canvas no encontrado');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Contexto 2D no disponible');
      return;
    }
    
    console.log('Configurando canvas:', mapConfig.width, mapConfig.height);
    canvas.width = mapConfig.width;
    canvas.height = mapConfig.height;
    
    drawMap(ctx);
  }, [users, drawMap]);

  if (isLoading) {
    return (
      <div className="city-modal">
        <div className="city-content">
          <div className="loading-container">
            <p>Cargando ciudad...</p>
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
            👥 {users.length} ciudadanos
          </div>
        </div>
        
        <div className="controls-info">
          <p>Usa WASD o Flechas para moverte</p>
        </div>
        
        <div className="game-container">
          <canvas 
            ref={canvasRef}
            className="city-map"
            style={{ 
              border: '2px solid blue',
              background: '#2E8B57' 
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CommonRoom;