import React, { useState, useEffect, useRef } from "react";
import "../styles/CommonRoom.css";
import playerSprite from "../assets/player.png";
import mapBackground from "../assets/map.png";

const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const canvasRef = useRef(null);
  const requestRef = useRef();
  const channelRef = useRef(null);
  const keysRef = useRef({}); // ⬅️ Para movimiento suave

  const spriteWidth = 32;
  const spriteHeight = 48;
  const framesPerDirection = 3;
  const speed = 2; // píxeles por frame

  const directions = { down: 0, left: 1, right: 2, up: 3 };

  const spriteImage = new Image();
  spriteImage.src = playerSprite;

  const mapImage = new Image();
  mapImage.src = mapBackground;

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
  // 🕹️ Teclas presionadas
  // ========================
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.key] = true;
    };
    const handleKeyUp = (e) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // ========================
  // 🎮 Dibujar
  // ========================
  const drawAvatar = (ctx, user) => {
    const { x, y, direction, frameIndex, name } = user;
    const dirIndex = directions[direction];

    ctx.drawImage(
      spriteImage,
      frameIndex * spriteWidth,
      dirIndex * spriteHeight,
      spriteWidth,
      spriteHeight,
      x - spriteWidth / 2,
      y - spriteHeight / 2,
      spriteWidth * 2,
      spriteHeight * 2
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

    if (mapImage.complete) {
      ctx.drawImage(mapImage, 0, 0, width, height);
    } else {
      ctx.fillStyle = "#222";
      ctx.fillRect(0, 0, width, height);
    }

    users.forEach((user) => drawAvatar(ctx, user));
  };

  // ========================
  // 🎮 Animación y movimiento
  // ========================
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== currentUser.id) return user;

        let { x, y, direction, frameIndex } = user;
        let moving = false;

        if (keysRef.current["ArrowUp"]) {
          y -= speed;
          direction = "up";
          moving = true;
        }
        if (keysRef.current["ArrowDown"]) {
          y += speed;
          direction = "down";
          moving = true;
        }
        if (keysRef.current["ArrowLeft"]) {
          x -= speed;
          direction = "left";
          moving = true;
        }
        if (keysRef.current["ArrowRight"]) {
          x += speed;
          direction = "right";
          moving = true;
        }

        if (moving) {
          frameIndex = (frameIndex + 1) % framesPerDirection;
        } else {
          frameIndex = 0; // idle
        }

        if (channelRef.current)
          channelRef.current.track({ ...user, x, y, direction, frameIndex });

        return { ...user, x, y, direction, frameIndex };
      })
    );

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
          <div className="canvas-container">
            <canvas ref={canvasRef} width={800} height={500} />
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
