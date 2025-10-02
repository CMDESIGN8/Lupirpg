import React, { useState, useEffect, useRef } from "react";
import "../styles/CommonRoom.css";

// Spritesheet: 32x48 px, 4 direcciones (abajo, izquierda, derecha, arriba), 3 frames cada una
import playerSprite from "../assets/player.png";
import mapBackground from "../assets/map.png";

const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const channelRef = useRef(null);
  const keysPressed = useRef({});
  const animationData = useRef({});
  const lastPositionRef = useRef({ x: 0, y: 0 });

  const spriteWidth = 32;
  const spriteHeight = 48;
  const framesPerDirection = 3;
  const animationSpeed = 120;
  const movementSpeed = 3; // Reducido para mejor control

  // Mapeo de direcciones a filas en el spritesheet
  const directionMap = {
    down: 0,
    left: 1,
    right: 2,
    up: 3
  };

  // ========================
  // 🔥 Supabase Presence - CORREGIDO
  // ========================
  useEffect(() => {
    const initializeRoom = async () => {
      const channel = supabaseClient.channel("lupi_common_room", {
        config: { presence: { key: currentUser.id } },
      });
      channelRef.current = channel;

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const allUsers = Object.values(state).map((u) => u[0]);
          
          // Inicializar datos de animación para cada usuario
          allUsers.forEach(user => {
            if (!animationData.current[user.id]) {
              animationData.current[user.id] = {
                frameIndex: 0,
                lastUpdate: Date.now(),
                moving: false,
                direction: user.direction || "down"
              };
            }
          });
          
          setUsers(allUsers);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const x = Math.round(Math.random() * (canvas.width - 100) + 50);
            const y = Math.round(Math.random() * (canvas.height - 100) + 50);

            // Inicializar datos de animación para el usuario actual
            animationData.current[currentUser.id] = {
              frameIndex: 0,
              lastUpdate: Date.now(),
              moving: false,
              direction: "down"
            };

            lastPositionRef.current = { x, y };

            await channel.track({
              id: currentUser.id,
              name: currentUser.username || "Usuario",
              x,
              y,
              direction: "down",
              frameIndex: 0,
              lastFrameUpdate: Date.now()
            });
          }
        });

      // 📩 Mensajes
      const messageChannel = supabaseClient
        .channel("room_messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "room_messages" },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
        messageChannel.unsubscribe();
        cancelAnimationFrame(requestRef.current);
      };
    };

    initializeRoom();
  }, [supabaseClient, currentUser]);

  // ========================
  // 🎮 Render Canvas - MEJORADO
  // ========================
  const spriteImage = useRef(new Image());
  const mapImage = useRef(new Image());

  useEffect(() => {
    spriteImage.current.src = playerSprite;
    mapImage.current.src = mapBackground;

    // Preload images
    spriteImage.current.onload = () => console.log("Player sprite loaded");
    mapImage.current.onload = () => console.log("Map background loaded");
  }, []);

  const drawAvatar = (ctx, user) => {
    const { x, y, name, id } = user;
    
    // Obtener datos de animación desde la referencia
    const animData = animationData.current[id];
    if (!animData) return;

    const frameIndex = animData.frameIndex || 0;
    const direction = animData.direction || "down";
    
    // Calcular la posición en el spritesheet
    const spriteX = frameIndex * spriteWidth;
    const spriteY = directionMap[direction] * spriteHeight;

    // Solo dibujar si la imagen está cargada
    if (spriteImage.current.complete) {
      ctx.drawImage(
        spriteImage.current,
        spriteX,
        spriteY,
        spriteWidth,
        spriteHeight,
        x - 32,
        y - 32,
        64,
        64
      );
    } else {
      // Fallback: dibujar círculo temporal
      ctx.fillStyle = animData.color || "#ff6b6b";
      ctx.fillRect(x - 16, y - 16, 32, 32);
    }

    // Dibujar nombre de usuario
    ctx.fillStyle = "#fff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, x, y - 40);
  };

  const drawRoom = (ctx) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Fondo con mapa o fallback
    if (mapImage.current.complete) {
      ctx.drawImage(mapImage.current, 0, 0, width, height);
    } else {
      // Fallback: fondo gradiente
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#2a9d8f");
      gradient.addColorStop(1, "#264653");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // Dibujar usuarios
    users.forEach((user) => drawAvatar(ctx, user));
  };

  // ========================
  // 🕹️ Sistema de Movimiento - COMPLETAMENTE REHECHO
  // ========================
  const updateMovement = async () => {
    const user = users.find((u) => u.id === currentUser.id);
    if (!user || !channelRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentKeys = keysPressed.current;
    let moved = false;
    let newX = user.x;
    let newY = user.y;
    let newDirection = user.direction;

    // Calcular movimiento basado en teclas presionadas
    if (currentKeys.ArrowUp) {
      newY -= movementSpeed;
      newDirection = "up";
      moved = true;
    }
    if (currentKeys.ArrowDown) {
      newY += movementSpeed;
      newDirection = "down";
      moved = true;
    }
    if (currentKeys.ArrowLeft) {
      newX -= movementSpeed;
      newDirection = "left";
      moved = true;
    }
    if (currentKeys.ArrowRight) {
      newX += movementSpeed;
      newDirection = "right";
      moved = true;
    }

    // Limitar movimiento dentro del canvas con márgenes seguros
    const margin = 32;
    newX = Math.max(margin, Math.min(newX, canvas.width - margin));
    newY = Math.max(margin, Math.min(newY, canvas.height - margin));

    // Actualizar animación solo si hubo movimiento
    const animData = animationData.current[currentUser.id];
    if (animData) {
      animData.moving = moved;
      animData.direction = newDirection;

      if (moved) {
        const now = Date.now();
        if (now - animData.lastUpdate > animationSpeed) {
          animData.frameIndex = (animData.frameIndex + 1) % framesPerDirection;
          animData.lastUpdate = now;
        }
      } else {
        animData.frameIndex = 0; // Reset to standing frame when not moving
      }
    }

    // Solo actualizar si la posición cambió significativamente
    const positionChanged = Math.abs(newX - lastPositionRef.current.x) > 0.1 || 
                           Math.abs(newY - lastPositionRef.current.y) > 0.1;

    if (positionChanged) {
      lastPositionRef.current = { x: newX, y: newY };

      const updatedUser = {
        ...user,
        x: newX,
        y: newY,
        direction: newDirection,
        frameIndex: animData?.frameIndex || 0,
        lastFrameUpdate: Date.now()
      };

      // Actualizar estado local
      setUsers((prev) =>
        prev.map((u) => (u.id === currentUser.id ? updatedUser : u))
      );

      // Estado remoto (no floodear con updates)
      await channelRef.current.track(updatedUser);
    }
  };

  const gameLoop = () => {
    updateMovement();
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawRoom(ctx);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [users]);

  // ========================
  // ⌨️ Manejo de Teclado - CORREGIDO
  // ========================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault(); // Prevenir scroll
        keysPressed.current[e.key] = true;
      }
    };

    const handleKeyUp = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        keysPressed.current[e.key] = false;
        
        // Reset animation when no keys are pressed
        const anyKeyPressed = Object.values(keysPressed.current).some(val => val);
        const animData = animationData.current[currentUser.id];
        
        if (animData && !anyKeyPressed) {
          animData.moving = false;
          animData.frameIndex = 0;
        }
      }
    };

    // Agregar event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      // Reset keys cuando el componente se desmonta
      keysPressed.current = {};
    };
  }, [currentUser.id]);

  // ========================
  // 📐 Ajuste de Canvas - MEJORADO
  // ========================
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const container = canvas.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      canvas.width = containerRect.width;
      canvas.height = containerRect.height;

      // Redibujar inmediatamente después del resize
      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawRoom(ctx);
      }
    };

    // Configurar ResizeObserver para mejor performance
    const resizeObserver = new ResizeObserver(handleResize);
    const canvasContainer = canvasRef.current?.parentElement;
    if (canvasContainer) {
      resizeObserver.observe(canvasContainer);
    }

    // También escuchar resize de ventana por si acaso
    window.addEventListener('resize', handleResize);
    
    // Ejecutar una vez al montar
    setTimeout(handleResize, 100);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // ========================
  // 💬 Chat (sin cambios)
  // ========================
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabaseClient.from("room_messages").insert({
        user_id: currentUser.id,
        content: newMessage.trim(),
      });

      if (error) console.error("Error sending message:", error);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="common-room-fullscreen">
      <div className="common-room-header">
        <h2>🏟️ Arena Deportiva Lupi - Sala Común</h2>
        <button className="close-btn" onClick={onClose}>
          ✕ Salir
        </button>
      </div>

      <div className="room-container">
        <div className="canvas-container">
          <canvas 
            ref={canvasRef}
            style={{ 
              display: 'block',
              background: 'linear-gradient(to bottom, #2a9d8f, #264653)'
            }}
          />
          <div className="sport-elements">
            <div className="sport-icon">⚽</div>
            <div className="sport-icon">🏀</div>
            <div className="sport-icon">🏈</div>
          </div>
          <div className="rpg-stats">
            <div>Jugador: <span className="stat-value">{currentUser.username}</span></div>
            <div>Online: <span className="stat-value">{users.length}</span></div>
            <div>Controles: <span className="stat-value">Flechas</span></div>
          </div>
          <div className="controls-info">
            <p>🕹️ Usa las flechas para moverte suavemente</p>
          </div>
        </div>

        <div className="chat-container">
          <div className="chat-header">
            <h3>💬 Chat Global</h3>
            <span className="online-count">{users.length} jugadores online</span>
          </div>
          <div className="messages">
            {messages.map((msg) => (
              <div key={msg.id} className="message">
                <span className="user-name">{msg.user_id}:</span>
                <span className="message-content">{msg.content}</span>
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} className="message-form">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje a la comunidad..."
            />
            <button type="submit">Enviar</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommonRoom;