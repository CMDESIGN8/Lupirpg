import { useRef, useState } from "react";
import { supabaseClient } from "../../services/supabase";
import { usePresence } from "../../hooks/usePresence";
import { useChat } from "../../hooks/useChat";
import { useGameLoop } from "../../hooks/useGameLoop";
import "../styles/CommonRoom.css";

export default function CommonRoom({ currentUser }) {
  const canvasRef = useRef(null);
  const [chatInput, setChatInput] = useState("");

  // Hooks conectados a supabaseClient
  const { users, channelRef } = usePresence(supabaseClient, currentUser);
  const { messages, sendMessage } = useChat(supabaseClient, channelRef, currentUser);
  useGameLoop(canvasRef, users, currentUser, channelRef);

  return (
    <div className="common-room">
      {/* Mapa tipo canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="common-canvas"
      />

      {/* Sidebar con usuarios y chat */}
      <div className="sidebar">
        <h3>Usuarios Online</h3>
        <ul className="online-list">
          {users.map((u) => (
            <li key={u.id}>{u.username || u.email}</li>
          ))}
        </ul>

        <h3>Chat</h3>
        <div className="chat-box">
          {messages.map((m, i) => (
            <div key={i}>
              <b>{m.user.username || m.user.email}:</b> {m.message}
            </div>
          ))}
        </div>
        <input
          className="chat-input"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && (sendMessage(chatInput), setChatInput(""))
          }
          placeholder="Escribe un mensaje..."
        />
      </div>
    </div>
  );
}
