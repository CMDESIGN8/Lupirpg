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
  const animationData = useRef({});
  const movementInterval = useRef(null);

  const spriteWidth = 32;
  const spriteHeight = 48;
  const displaySize = 64;
  const framesPerDirection = 3;
  const animationSpeed = 120;
  const movementSpeed = 4;

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
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      messageChannel.unsubscribe();
      cancelAnimationFrame(requestRef.current);
      if (movementInterval.current) {
        clearInterval(movementInterval.current);
      }
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
    
    const animData = animationData.current[id] || { frameIndex: 0 };
    const frameIndex = animData.frameIndex || 0;
    
    const spriteX = frameIndex * spriteWidth;
    const spriteY = directionMap[direction] * spriteHeight;

    // Dibujar el frame escalado a 64x64 píxeles
    ctx.drawImage(
      spriteImage.current,
      spriteX,
      spriteY,
      spriteWidth,
      spriteHeight,
      x - displaySize/2,
      y - displaySize/2,
      displaySize,
      displaySize
    );

    // Dibujar nombre de usuario
    ctx.fillStyle = "#fff";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(name, x, y - displaySize/2 - 10);
  };

  const drawRoom = (ctx) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (mapImage.current.complete) {
      ctx.drawImage(mapImage.current, 0, 0, width, height);
    } else {
      ctx.fillStyle = "#222";
      ctx.fillRect(0, 0, width, height);
    }

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
    const movePlayer = async () => {
      const user = users.find((u) => u.id === currentUser.id);
      if (!user) return;

      let { x, y } = user;
      let direction = user.direction;
      let moved = false;

      if (keysPressed.current.ArrowUp) {
        y -= movementSpeed;
        direction = "up";
        moved = true;
      }
      if (keysPressed.current.ArrowDown) {
        y += movementSpeed;
        direction = "down";
        moved = true;
      }
      if (keysPressed.current.ArrowLeft) {
        x -= movementSpeed;
        direction = "left";
        moved = true;
      }
      if (keysPressed.current.ArrowRight) {
        x += movementSpeed;
        direction = "right";
        moved = true;
      }

      if (!moved) return;

      // Limitar movimiento dentro del canvas
      x = Math.max(displaySize/2, Math.min(x, 1200 - displaySize/2));
      y = Math.max(displaySize/2, Math.min(y, 800 - displaySize/2));

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

      setUsers((prev) =>
        prev.map((u) => (u.id === currentUser.id ? updatedUser : u))
      );

      if (channelRef.current) {
        await channelRef.current.track(updatedUser);
      }
    };

    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        
        if (!keysPressed.current[e.key]) {
          keysPressed.current[e.key] = true;
          
          if (!movementInterval.current) {
            movementInterval.current = setInterval(movePlayer, 16);
          }

          if (animationData.current[currentUser.id]) {
            animationData.current[currentUser.id].moving = true;
          }
        }
      }
    };

    const handleKeyUp = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        keysPressed.current[e.key] = false;
        
        const noKeysPressed = !keysPressed.current.ArrowUp && 
                             !keysPressed.current.ArrowDown && 
                             !keysPressed.current.ArrowLeft && 
                             !keysPressed.current.ArrowRight;
        
        if (noKeysPressed) {
          if (movementInterval.current) {
            clearInterval(movementInterval.current);
            movementInterval.current = null;
          }
          
          if (animationData.current[currentUser.id]) {
            animationData.current[currentUser.id].moving = false;
            animationData.current[currentUser.id].frameIndex = 0;
            
            setUsers(prevUsers => 
              prevUsers.map(user => 
                user.id === currentUser.id ? { ...user, frameIndex: 0 } : user
              )
            );
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (movementInterval.current) {
        clearInterval(movementInterval.current);
      }
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