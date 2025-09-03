import React, { useState, useEffect, useRef } from "react";
import "../styles/CommonRoom.css";

// Spritesheet: 32x48 px, 4 direcciones (abajo, izquierda, derecha, arriba), 3 frames cada una
import playerSprite from "../assets/player.png"; 

const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const canvasRef = useRef(null);
  const requestRef = useRef();

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

    // 👥 Presencia en tiempo real
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

    // 📩 Mensajes en tiempo real
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
  // 🎮 Animación de sala
  // ========================
  const spriteImage = new Image();
  spriteImage.src = playerSprite;

  const drawAvatar = (ctx, user) => {
    const { x, y, direction = "down", frameIndex = 0, name, color } = user;
    const dirMap = { down: 0, left: 1, right: 2, up: 3 };
    const row = dirMap[direction] || 0;

    ctx.drawImage(
      spriteImage,
      frameIndex * spriteWidth,
      row * spriteHeight,
      spriteWidth,
      spriteHeight,
      x - spriteWidth / 2,
      y - spriteHeight / 2,
      spriteWidth,
      spriteHeight
    );

    // Nombre
    ctx.fillStyle = "#323C78";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(name, x, y - spriteHeight / 2 - 5);
  };

  const drawRoom = (ctx) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Fondo
    ctx.fillStyle = "#E6F0FF";
    ctx.fillRect(0, 0, width, height);

    // Área de la sala
    ctx.fillStyle = "#C8D8EB";
    ctx.beginPath();
    ctx.roundRect(50, 100, width - 100, height - 200, 15);
    ctx.fill();
    ctx.strokeStyle = "#B4C8E0";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Dibujar usuarios
    users.forEach((user) => drawAvatar(ctx, user));
  };

  // Animación continua
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
  // 🕹️ Mover avatar con teclado
  // ========================
  useEffect(() => {
    const handleKey = async (e) => {
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

      // Actualizar local
      user.x = x;
      user.y = y;
      user.direction = direction;
      user.frameIndex = (user.frameIndex + 1) % framesPerDirection;
      setUsers([...users]);

      // Actualizar Supabase
      const channel = supabaseClient.channel("lupi_common_room");
      await channel.track(user);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [users, currentUser, supabaseClient]);

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
