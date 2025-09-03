import React, { useState, useEffect, useRef } from "react";
import "../styles/CommonRoom.css";

// Spritesheet: 32x48 px, 4 direcciones (abajo, izquierda, derecha, arriba), 3 frames cada una
import playerSprite from "../assets/player.png";
import mapBackground from "../assets/map.png"; // 👈 tu mapa

const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const channelRef = useRef(null);

  const spriteWidth = 32;
  const spriteHeight = 48;
  const framesPerDirection = 3;

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
        setUsers(allUsers);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const x = Math.round(Math.random() * 700 + 50);
          const y = Math.round(Math.random() * 400 + 50);

          await channel.track({
            id: currentUser.id,
            name: currentUser.username || "Usuario",
            x,
            y,
            direction: "down",
            frameIndex: 0,
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
  const spriteImage = new Image();
  spriteImage.src = playerSprite;

  const mapImage = new Image();
  mapImage.src = mapBackground;

  const drawAvatar = (ctx, user) => {
  const { x, y, name } = user;

  ctx.drawImage(
    spriteImage,
    0,
    0,
    spriteImage.width,
    spriteImage.height,
    x - 32,
    y - 32,
    64,
    64
  );

  ctx.fillStyle = "#fff";
  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.fillText(name, x, y - 40);
};


  const drawRoom = (ctx) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Fondo con mapa
    if (mapImage.complete) {
      ctx.drawImage(mapImage, 0, 0, width, height);
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
    drawRoom(ctx);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [users]);

   // ========================
  // 🕹️ Movimiento fluido
  // ========================
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed[e.key] = true;
    };

    const handleKeyUp = (e) => {
      keysPressed[e.key] = false;
    };

    const interval = setInterval(async () => {
      const user = users.find((u) => u.id === currentUser.id);
      if (!user) return;

      let { x, y, direction } = user;
      let moved = false;

      if (keysPressed["ArrowUp"]) {
        y -= 4;
        direction = "up";
        moved = true;
      }
      if (keysPressed["ArrowDown"]) {
        y += 4;
        direction = "down";
        moved = true;
      }
      if (keysPressed["ArrowLeft"]) {
        x -= 4;
        direction = "left";
        moved = true;
      }
      if (keysPressed["ArrowRight"]) {
        x += 4;
        direction = "right";
        moved = true;
      }

      if (moved) {
        const updatedUser = {
          ...user,
          x,
          y,
          direction,
          frameIndex: (user.frameIndex + 1) % framesPerDirection,
        };

        setUsers((prev) =>
          prev.map((u) => (u.id === currentUser.id ? updatedUser : u))
        );

        if (channelRef.current) {
          await channelRef.current.track(updatedUser);
        }
      }
    }, 120);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      clearInterval(interval);
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
          <h2>Sala Común de Lupi</h2>
          <button className="close-btn" onClick={onClose}>
            X
          </button>
        </div>

        <div className="room-container">
          {/* 🎮 Sala visual */}
          <div className="canvas-container">
            <canvas ref={canvasRef} width={800} height={500} />
          </div>

          {/* 💬 Chat */}
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
