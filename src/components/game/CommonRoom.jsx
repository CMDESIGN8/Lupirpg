import React, { useState, useEffect, useRef } from "react";
import "../styles/CommonRoom.css";

// Spritesheet: 32x48 px, 4 direcciones (abajo, izquierda, derecha, arriba), 3 frames cada una
import playerSprite from "../assets/player.png";
import mapBackground from "../assets/map.png";

const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeMenu, setActiveMenu] = useState("chat"); // chat, users, feed, missions, etc.
  const [onlineCount, setOnlineCount] = useState(0);
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const channelRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const keysPressed = useRef({});
  const animationData = useRef({});

  const spriteWidth = 32;
  const spriteHeight = 48;
  const framesPerDirection = 3;
  const animationSpeed = 120;

  // Mapeo de direcciones a filas en el spritesheet
  const directionMap = {
    down: 0,
    left: 1,
    right: 2,
    up: 3
  };

  // Menú options estilo Pokémon
  const menuOptions = [
    { id: "chat", label: "Chat", icon: "💬" },
    { id: "users", label: "Usuarios", icon: "👥" },
    { id: "feed", label: "Feed Club", icon: "📰" },
    { id: "missions", label: "Misiones", icon: "🎯" },
    { id: "inventory", label: "Inventario", icon: "🎒" },
    { id: "settings", label: "Opciones", icon: "⚙️" }
  ];

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
        setOnlineCount(allUsers.length);
        
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
          setMessages((prev) => [...prev.slice(-49), payload.new]); // Mantener últimos 50 mensajes
        }
      )
      .subscribe();

    // Cargar mensajes existentes
    const loadMessages = async () => {
      const { data } = await supabaseClient
        .from("room_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(50);
      if (data) setMessages(data);
    };
    loadMessages();

    return () => {
      channel.unsubscribe();
      messageChannel.unsubscribe();
      cancelAnimationFrame(requestRef.current);
    };
  }, [supabaseClient, currentUser]);

  // ========================
  // 🎮 Render Canvas - Estilo Pokémon 3DS
  // ========================
  const spriteImage = useRef(new Image());
  const mapImage = useRef(new Image());

  useEffect(() => {
    spriteImage.current.src = playerSprite;
    mapImage.current.src = mapBackground;
  }, []);

  const drawAvatar = (ctx, user) => {
    const { x, y, name, direction = "down", id } = user;
    
    const animData = animationData.current[id] || { frameIndex: 0 };
    const frameIndex = animData.frameIndex || 0;
    
    const spriteX = frameIndex * spriteWidth;
    const spriteY = directionMap[direction] * spriteHeight;

    // Dibujar sombra del avatar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + 40, 20, 8, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Dibujar el avatar
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

    // Dibujar nombre de usuario con estilo Pokémon
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px 'Press Start 2P', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.strokeText(name, x, y - spriteHeight/2 - 5);
    ctx.fillText(name, x, y - spriteHeight/2 - 5);
  };

  const drawRoom = (ctx) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Fondo con mapa estilo Pokémon
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
    
    users.forEach(user => {
      const animData = animationData.current[user.id];
      if (animData && animData.moving && now - animData.lastUpdate > animationSpeed) {
        animData.frameIndex = (animData.frameIndex + 1) % framesPerDirection;
        animData.lastUpdate = now;
        
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
        e.preventDefault();
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

        x = Math.max(spriteWidth/2, Math.min(x, 800 - spriteWidth/2));
        y = Math.max(spriteHeight/2, Math.min(y, 500 - spriteHeight/2));

        if (animationData.current[currentUser.id]) {
          animationData.current[currentUser.id].moving = true;
          animationData.current[currentUser.id].direction = direction;
        }

        const updatedUser = {
          ...user,
          x,
          y,
          direction,
          lastFrameUpdate: Date.now()
        };

        setUsers((prev) =>
          prev.map((u) => (u.id === currentUser.id ? updatedUser : u))
        );

        if (channelRef.current) {
          await channelRef.current.track(updatedUser);
        }
      }
    };

    const handleKeyUp = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        keysPressed.current[e.key] = false;
        
        const noKeysPressed = !Object.values(keysPressed.current).some(val => val);
        
        if (noKeysPressed && animationData.current[currentUser.id]) {
          animationData.current[currentUser.id].moving = false;
          animationData.current[currentUser.id].frameIndex = 0;
          
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
  // 💬 Chat y Funciones
  // ========================
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabaseClient.from("room_messages").insert({
        user_id: currentUser.id,
        username: currentUser.username || "Usuario",
        content: newMessage.trim(),
      });

      if (error) console.error("Error sending message:", error);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Renderizar contenido según el menú activo
  const renderMenuContent = () => {
    switch (activeMenu) {
      case "chat":
        return (
          <div className="menu-content">
            <div className="messages">
              {messages.map((msg) => (
                <div key={msg.id} className="message">
                  <span className="user-name">{msg.username || msg.user_id}:</span>
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
                maxLength={200}
              />
              <button type="submit">Enviar</button>
            </form>
          </div>
        );
      
      case "users":
        return (
          <div className="menu-content">
            <h3>Usuarios Conectados ({onlineCount})</h3>
            <div className="users-list">
              {users.map(user => (
                <div key={user.id} className="user-item">
                  <span className="user-avatar">🎮</span>
                  <span className="user-name">{user.name}</span>
                  <span className="user-status online">●</span>
                </div>
              ))}
            </div>
          </div>
        );
      
      case "feed":
        return (
          <div className="menu-content">
            <h3>Feed del Club</h3>
            <div className="feed-item">
              <div className="feed-header">
                <span className="feed-author">Lupi Club</span>
                <span className="feed-time">Hace 2h</span>
              </div>
              <div className="feed-content">
                ¡Bienvenidos a la nueva arena deportiva! Completad misiones para ganar recompensas.
              </div>
            </div>
          </div>
        );
      
      case "missions":
        return (
          <div className="menu-content">
            <h3>Misiones Activas</h3>
            <div className="mission-item">
              <span className="mission-icon">⚽</span>
              <div className="mission-info">
                <div className="mission-title">Primeros Pasos</div>
                <div className="mission-progress">0/3 mensajes enviados</div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="menu-content">
            <h3>{menuOptions.find(opt => opt.id === activeMenu)?.label}</h3>
            <p>Contenido en desarrollo...</p>
          </div>
        );
    }
  };

  return (
    <div className="common-room-modal pokemon-style">
      <div className="common-room-content">
        <div className="common-room-header">
          <div className="header-info">
            <h2>Arena Deportiva Lupi</h2>
            <div className="online-counter">
              <span className="online-dot">●</span>
              {onlineCount} en línea
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            X
          </button>
        </div>

        {/* Pantalla principal estilo Pokémon 3DS */}
        <div className="pokemon-screen">
          <div className="game-screen">
            <canvas 
              ref={canvasRef} 
              width={1200} 
              height={800}
              className="pokemon-canvas"
            />
            
            {/* Stats RPG en esquina */}
            <div className="rpg-stats pokemon-stats">
              <div className="stat-item">
                <span className="stat-label">Nivel:</span>
                <span className="stat-value">15</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">EXP:</span>
                <span className="stat-value">1200/2000</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Oro:</span>
                <span className="stat-value">5,430</span>
              </div>
            </div>
          </div>

          {/* Panel inferior estilo Pokémon */}
          <div className="pokemon-panel">
            {/* Menú de navegación */}
            <div className="pokemon-menu">
              {menuOptions.map((option) => (
                <button
                  key={option.id}
                  className={`menu-option ${activeMenu === option.id ? 'active' : ''}`}
                  onClick={() => setActiveMenu(option.id)}
                >
                  <span className="menu-icon">{option.icon}</span>
                  <span className="menu-label">{option.label}</span>
                </button>
              ))}
            </div>

            {/* Contenido del menú */}
            <div className="pokemon-content">
              {renderMenuContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonRoom;