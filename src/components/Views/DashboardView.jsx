import React, { useState, useEffect, useRef } from "react";
import "../styles/CommonRoom.css";

const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const canvasRef = useRef(null);

  // 🎨 Colores para los avatares
  const avatarColors = [
    "#FF6464",
    "#64FF64",
    "#6464FF",
    "#FFFF64",
    "#FF64FF",
    "#64FFFF",
  ];

  // ========================
  // 🔥 Manejo de Supabase
  // ========================
  useEffect(() => {
    const channel = supabaseClient.channel("lupi_common_room", {
      config: { presence: { key: currentUser.id } },
    });

    // 👥 Presencia en tiempo real
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const allUsers = Object.values(state).map((u) => u[0]); // flatten
        setUsers(allUsers);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const color =
            avatarColors[Math.floor(Math.random() * avatarColors.length)];
          const x = Math.round(Math.random() * 600 + 100);
          const y = Math.round(Math.random() * 300 + 150);

          await channel.track({
            id: currentUser.id,
            name: currentUser.username || "Usuario",
            color,
            x,
            y,
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
    };
  }, [supabaseClient, currentUser]);

  // ========================
  // 🎮 Dibujar sala y avatares
  // ========================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    drawRoom(ctx);
  }, [users]);

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

    // Avatares
    users.forEach((user) => {
      drawAvatar(ctx, user);
    });
  };

  const drawAvatar = (ctx, user) => {
    const { x, y, color, name } = user;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ojos
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(x - 8, y - 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 8, y - 5, 5, 0, Math.PI * 2);
    ctx.fill();

    // Sonrisa
    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.arc(x, y + 5, 10, 0.2, Math.PI - 0.2, false);
    ctx.stroke();

    // Nombre
    ctx.fillStyle = "#323C78";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(name, x, y + 45);
  };

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
