import { useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { usePresence } from "./hooks/usePresence";
import { useChat } from "./hooks/useChat";
import { useGameLoop } from "./hooks/useGameLoop";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY);

export default function CommonRoom({ currentUser }) {
  const canvasRef = useRef(null);
  const [chatInput, setChatInput] = useState("");

  // Hooks
  const { users, channelRef } = usePresence(supabase, currentUser);
  const { messages, sendMessage } = useChat(supabase, channelRef, currentUser);
  useGameLoop(canvasRef, users, currentUser, channelRef);

  return (
    <div className="common-room">
      <canvas ref={canvasRef} width={800} height={600} style={{ border: "2px solid cyan" }} />

      <div className="sidebar">
        <h3>Usuarios Online</h3>
        <ul>
          {users.map(u => <li key={u.id}>{u.username || u.email}</li>)}
        </ul>

        <h3>Chat</h3>
        <div className="chat-box">
          {messages.map((m, i) => (
            <div key={i}><b>{m.user.username || m.user.email}:</b> {m.message}</div>
          ))}
        </div>
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (sendMessage(chatInput), setChatInput(""))}
          placeholder="Escribe un mensaje..."
        />
      </div>
    </div>
  );
}
