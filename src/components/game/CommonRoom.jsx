import React, { useState, useEffect, useRef } from "react";
import "../styles/CommonRoom.css";

// Spritesheet: 32x48 px, 4 direcciones (abajo, izquierda, derecha, arriba), 3 frames cada una
import playerSprite from "../assets/player.png";
import mapBackground from "../assets/map.png";

const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("feed"); // "feed", "misiones", "chat", "usuarios"
  const [clubPosts, setClubPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [misiones, setMisiones] = useState([]);
  
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const channelRef = useRef(null);
  const animationData = useRef({});

  const spriteWidth = 32;
  const spriteHeight = 48;
  const framesPerDirection = 3;
  const animationSpeed = 120;

  const directionMap = {
    down: 0,
    left: 1,
    right: 2,
    up: 3
  };

  // ========================
  // 🔥 Supabase Presence (mantener igual)
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
    };
  }, [supabaseClient, currentUser]);

  // ========================
  // 📱 Funciones del Dashboard
  // ========================

  // Cargar publicaciones del club
  useEffect(() => {
    loadClubPosts();
    loadMisiones();
  }, []);

  const loadClubPosts = async () => {
    // Simular carga de publicaciones
    const mockPosts = [
      { id: 1, user: "Juan", content: "¡Gran partido hoy equipo! 💪", timestamp: "Hace 2 horas", likes: 5 },
      { id: 2, user: "Maria", content: "¿Alguien para entrenar mañana?", timestamp: "Hace 4 horas", likes: 3 },
      { id: 3, user: "Club Lupi", content: "Próximo torneo: Sábado 15", timestamp: "Hace 1 día", likes: 8 }
    ];
    setClubPosts(mockPosts);
  };

  const loadMisiones = async () => {
    // Simular misiones activas
    const mockMisiones = [
      { id: 1, title: "Primer Gol", description: "Anota tu primer gol en el club", progress: 100, reward: "100 XP" },
      { id: 2, title: "Socializar", description: "Interactúa con 5 miembros", progress: 60, reward: "50 XP" },
      { id: 3, title: "Asistencia Perfecta", description: "Asiste a 3 entrenamientos", progress: 33, reward: "150 XP" }
    ];
    setMisiones(mockMisiones);
  };

  const createPost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    const newPostObj = {
      id: Date.now(),
      user: currentUser.username,
      content: newPost,
      timestamp: "Ahora mismo",
      likes: 0
    };

    setClubPosts(prev => [newPostObj, ...prev]);
    setNewPost("");
  };

  const likePost = (postId) => {
    setClubPosts(prev => 
      prev.map(post => 
        post.id === postId 
          ? { ...post, likes: post.likes + 1 }
          : post
      )
    );
  };

  // ========================
  // 🎮 Canvas y Animación (mantener igual)
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

    ctx.fillStyle = "#fff";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(name, x, y - spriteHeight/2 - 10);
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
  // 🕹️ Movimiento (mantener igual)
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

  // ========================
  // 🎨 Render del Dashboard
  // ========================
  const renderDashboardContent = () => {
    switch (activeTab) {
      case "feed":
        return (
          <div className="dashboard-feed">
            <div className="post-creator">
              <form onSubmit={createPost}>
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="¿Qué está pasando en el club?"
                  rows="3"
                />
                <button type="submit">Publicar</button>
              </form>
            </div>
            <div className="posts-list">
              {clubPosts.map(post => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <span className="post-author">{post.user}</span>
                    <span className="post-time">{post.timestamp}</span>
                  </div>
                  <p className="post-content">{post.content}</p>
                  <div className="post-actions">
                    <button onClick={() => likePost(post.id)} className="like-btn">
                      👍 {post.likes}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "misiones":
        return (
          <div className="dashboard-misiones">
            <h3>Misiones Activas</h3>
            {misiones.map(mision => (
              <div key={mision.id} className="mision-card">
                <div className="mision-header">
                  <h4>{mision.title}</h4>
                  <span className="mision-reward">{mision.reward}</span>
                </div>
                <p>{mision.description}</p>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${mision.progress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{mision.progress}%</span>
              </div>
            ))}
          </div>
        );

      case "chat":
        return (
          <div className="dashboard-chat">
            <div className="chat-messages">
              {messages.map((msg) => (
                <div key={msg.id} className="chat-message">
                  <span className="chat-user">{msg.user_id}:</span>
                  <span className="chat-content">{msg.content}</span>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="chat-input-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
              />
              <button type="submit">Enviar</button>
            </form>
          </div>
        );

      case "usuarios":
        return (
          <div className="dashboard-users">
            <h3>Usuarios Online ({users.length})</h3>
            <div className="users-list">
              {users.map(user => (
                <div key={user.id} className="user-online">
                  <div className="user-avatar"></div>
                  <span className="user-name">{user.name}</span>
                  <span className="user-status">🟢</span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
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
          {/* Canvas del juego */}
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

          {/* Dashboard Lateral */}
          <div className="dashboard-container">
            <div className="dashboard-tabs">
              <button 
                className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
                onClick={() => setActiveTab('feed')}
              >
                📰 Feed
              </button>
              <button 
                className={`tab-btn ${activeTab === 'misiones' ? 'active' : ''}`}
                onClick={() => setActiveTab('misiones')}
              >
                🎯 Misiones
              </button>
              <button 
                className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                💬 Chat
              </button>
              <button 
                className={`tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`}
                onClick={() => setActiveTab('usuarios')}
              >
                👥 Online
              </button>
            </div>

            <div className="dashboard-content">
              {renderDashboardContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonRoom;