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
  const lastUpdateRef = useRef(0);
  const keysPressed = useRef({});
  const animationData = useRef({}); // Para almacenar datos de animación sin usar estado

  const spriteWidth = 32;
  const spriteHeight = 48;
  const framesPerDirection = 3;
  const animationSpeed = 120; // ms entre cambios de frame (reducido para mayor fluidez)

  // Mapeo de direcciones a filas en el spritesheet
  const directionMap = {
    down: 0,
    left: 1,
    right: 2,
    up: 3
  };

  // ========================
  // 🔥 Supabase Presence
  // ========================
  useEffect(() => {
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
              moving: false
            };
          }
        });
        
        setUsers(allUsers);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const x = Math.round(Math.random() * 700 + 50);
          const y = Math.round(Math.random() * 400 + 50);

          // Inicializar datos de animación para el usuario actual
          animationData.current[currentUser.id] = {
            frameIndex: 0,
            lastUpdate: Date.now(),
            moving: false
          };

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
  }, [supabaseClient, currentUser]);

  // ========================
  // 🎮 Render Canvas
  // ========================
  const spriteImage = useRef(new Image());
  const mapImage = useRef(new Image());

  useEffect(() => {
    spriteImage.current.src = playerSprite;
    mapImage.current.src = mapBackground;
  }, []);

  const drawAvatar = (ctx, user) => {
    const { x, y, name, direction = "down", id } = user;
    
    // Obtener datos de animación desde la referencia
    const animData = animationData.current[id] || { frameIndex: 0 };
    const frameIndex = animData.frameIndex || 0;
    
    // Calcular la posición en el spritesheet
    const spriteX = frameIndex * spriteWidth;
    const spriteY = directionMap[direction] * spriteHeight;

    // Dibujar el frame correcto del spritesheet
    ctx.drawImage(
      spriteImage.current,
      spriteX,
      spriteY,
      spriteWidth,
      spriteHeight,
       x - 32,             // Posición X (centrado en 64px)
  y - 32,             // Posición Y (centrado en 64px)
  64,                 // Nuevo ancho de visualización
  64                  // Nuevo alto de visualización
);
    // Dibujar nombre de usuario
    ctx.fillStyle = "#fff";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(name, x, y - spriteHeight/2 - 10);
  };

  const drawRoom = (ctx) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Fondo con mapa
    if (mapImage.current.complete) {
      ctx.drawImage(mapImage.current, 0, 0, width, height);
    } else {
      ctx.fillStyle = "#222";
      ctx.fillRect(0, 0, width, height);
    }

    // Dibujar usuarios
    users.forEach((user) => drawAvatar(ctx, user));
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    const now = Date.now();
    
    // Actualizar animaciones para todos los usuarios
    users.forEach(user => {
      const animData = animationData.current[user.id];
      if (animData && animData.moving && now - animData.lastUpdate > animationSpeed) {
        animData.frameIndex = (animData.frameIndex + 1) % framesPerDirection;
        animData.lastUpdate = now;
        
        // Solo actualizar estado para el usuario actual (para enviar a Supabase)
        if (user.id === currentUser.id) {
          setUsers(prevUsers => 
            prevUsers.map(u => 
              u.id === currentUser.id ? { ...u, frameIndex: animData.frameIndex } : u
            )
          );
        }
      }
    });
    
    drawRoom(ctx);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [users]);

  // ========================
  // 🕹️ Movimiento
  // ========================
  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault(); // Prevenir scroll de la página
        keysPressed.current[e.key] = true;
        
        const user = users.find((u) => u.id === currentUser.id);
        if (!user) return;

        let { x, y } = user;
        let direction = user.direction;

        switch (e.key) {
          case "ArrowUp":
            y -= 4;
            direction = "up";
            break;
          case "ArrowDown":
            y += 4;
            direction = "down";
            break;
          case "ArrowLeft":
            x -= 4;
            direction = "left";
            break;
          case "ArrowRight":
            x += 4;
            direction = "right";
            break;
          default:
            return;
        }

        // Limitar movimiento dentro del canvas
        x = Math.max(spriteWidth/2, Math.min(x, 800 - spriteWidth/2));
        y = Math.max(spriteHeight/2, Math.min(y, 500 - spriteHeight/2));

        // Actualizar datos de animación
        if (animationData.current[currentUser.id]) {
          animationData.current[currentUser.id].moving = true;
          animationData.current[currentUser.id].direction = direction;
        }

        // Actualizar usuario
        const updatedUser = {
          ...user,
          x,
          y,
          direction,
          lastFrameUpdate: Date.now()
        };

        // Estado local
        setUsers((prev) =>
          prev.map((u) => (u.id === currentUser.id ? updatedUser : u))
        );

        // Estado remoto
        if (channelRef.current) {
          await channelRef.current.track(updatedUser);
        }
      }
    };

    const handleKeyUp = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        keysPressed.current[e.key] = false;
        
        // Verificar si todas las teclas de dirección están liberadas
        const noKeysPressed = !Object.values(keysPressed.current).some(val => val);
        
        if (noKeysPressed && animationData.current[currentUser.id]) {
          // Cuando se sueltan todas las teclas, resetear a frame 0
          animationData.current[currentUser.id].moving = false;
          animationData.current[currentUser.id].frameIndex = 0;
          
          // Actualizar estado para forzar re-render
          setUsers(prevUsers => 
            prevUsers.map(user => 
              user.id === currentUser.id ? { ...user, frameIndex: 0 } : user
            )
          );
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [users, currentUser]);

  // ========================
  // 💬 Chat
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
    <div className="common-room-modal">
      <div className="common-room-content">
        <div className="common-room-header">
          <h2>Arena Deportiva Lupi</h2>
          <button className="close-btn" onClick={onClose}>
            X
          </button>
        </div>

        <div className="room-container">
          <div className="canvas-container">
            <canvas 
              ref={canvasRef} 
              width={1200} 
              height={800}
              style={{ width: '100%', height: '100%' }}
            />
            <div className="sport-elements">
              <div className="sport-icon">⚽</div>
              <div className="sport-icon">🏀</div>
              <div className="sport-icon">🏈</div>
            </div>
            <div className="rpg-stats">
              <div>Nivel: <span className="stat-value">15</span></div>
              <div>EXP: <span className="stat-value">1200/2000</span></div>
              <div>Oro: <span className="stat-value">5,430</span></div>
            </div>
          </div>

          <div className="chat-container">
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
                placeholder="Escribe un mensaje..."
              />
              <button type="submit">Enviar</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonRoom;