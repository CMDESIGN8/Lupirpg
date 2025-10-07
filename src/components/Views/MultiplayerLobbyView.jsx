// src/components/Views/MultiplayerLobbyView.jsx

import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import LoadingScreen from "../UI/LoadingScreen";
import "../styles/MultiplayerLobby.css";

const socket = io("http://localhost:5000"); 
// ⚠️ cuando lo subas a Render cambia por tu URL ej: "https://tu-backend.onrender.com"

const MultiplayerLobbyView = ({ currentUser, setView }) => {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState({});
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");

  const canvasRef = useRef(null);
  const playerRef = useRef({ x: 100, y: 100 }); // posición inicial

  // 🔹 Cuando entra un nuevo usuario
  useEffect(() => {
    if (!currentUser) return;

    // Emitimos evento al servidor
    socket.emit("newPlayer", {
      userId: currentUser.id,
      x: playerRef.current.x,
      y: playerRef.current.y,
    });

    // Recibir jugadores conectados
    socket.on("updatePlayers", (data) => {
      setPlayers(data);
    });

    // Recibir chat
    socket.on("chatMessage", (msg) => {
      setChat((prev) => [...prev, msg]);
    });

    setLoading(false);

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  // 🔹 Movimiento con flechas
  useEffect(() => {
    const handleKeyDown = (e) => {
      let { x, y } = playerRef.current;
      if (e.key === "ArrowUp") y -= 10;
      if (e.key === "ArrowDown") y += 10;
      if (e.key === "ArrowLeft") x -= 10;
      if (e.key === "ArrowRight") x += 10;

      playerRef.current = { x, y };
      socket.emit("move", { x, y });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 🔹 Enviar mensaje de chat
  const sendMessage = () => {
    if (message.trim() !== "") {
      socket.emit("chatMessage", message);
      setMessage("");
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="lobby-container">
      <h2>🌍 Sala Común MMORPG</h2>

      {/* CANVAS DEL MAPA */}
      <div className="game-area" ref={canvasRef}>
        {Object.values(players).map((p) => (
          <div
            key={p.id}
            className="player"
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
            }}
          >
            <span className="player-name">{p.name}</span>
          </div>
        ))}
      </div>

      {/* CHAT */}
      <div className="chat-container">
        <div className="chat-messages">
          {chat.map((c, i) => (
            <p key={i}>
              <strong>{c.user}: </strong> {c.message}
            </p>
          ))}
        </div>
        <div className="chat-input">
          <input
            type="text"
            placeholder="Escribe un mensaje..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>Enviar</button>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerLobbyView;
