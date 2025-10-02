import React, { useState, useEffect, useRef } from "react";
// ❗️ Cambia la ruta a tu nuevo archivo CSS
import "../styles/CommonRoom3DS.css"; 

// Spritesheet y mapa (sin cambios)
import playerSprite from "../assets/player.png";
import mapBackground from "../assets/map.png";

// Iconos para las pestañas del menú (opcional, pero mejora la UI)
import { FaComment, FaUsers, FaStream, FaTasks } from 'react-icons/fa';

const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  // 🔥 NUEVO: Estado para controlar la pestaña activa en la pantalla inferior
  const [activeTab, setActiveTab] = useState("chat"); 
  
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const channelRef = useRef(null);
  const keysPressed = useRef({});
  const animationData = useRef({});

  // ... (TODA la lógica de sprites, Supabase, Canvas, movimiento y chat permanece EXACTAMENTE IGUAL)
  // No es necesario cambiar nada en los useEffect de Supabase, renderizado del canvas o movimiento.
  // La lógica de `sendMessage` también se mantiene.
  // Por brevedad, se omite aquí, pero debes mantener todo ese código sin cambios.

  // ========================================
  // LÓGICA DE SPRITES, CONSTANTES, ETC. (SIN CAMBIOS)
  // ========================================
    const spriteWidth = 32;
    const spriteHeight = 48;
    const framesPerDirection = 3;
    const animationSpeed = 120;
    const directionMap = { down: 0, left: 1, right: 2, up: 3 };

  // ========================
  // 🔥 Supabase Presence (SIN CAMBIOS)
  // ========================
  useEffect(() => {
    // ... (Tu código de Supabase aquí)
  }, [supabaseClient, currentUser]);

  // ========================
  // 🎮 Render Canvas (SIN CAMBIOS)
  // ========================
  // ... (Tu código para `drawAvatar`, `drawRoom`, `animate` aquí)
  
  // ========================
  // 🕹️ Movimiento (SIN CAMBIOS)
  // ========================
  useEffect(() => {
    // ... (Tu código de `handleKeyDown` y `handleKeyUp` aquí)
  }, [users, currentUser]);

  // ========================
  // 💬 Chat (Lógica sin cambios)
  // ========================
   const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabaseClient.from("room_messages").insert({
        user_id: currentUser.id, // Asegúrate que tu tabla espera user_id
        // Para mostrar el nombre, necesitarías hacer un JOIN o guardarlo directamente
        user_name: currentUser.username || "Usuario", 
        content: newMessage.trim(),
      });

      if (error) console.error("Error sending message:", error);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
   };
  
  // ========================
  // 🎨 Componente para renderizar la pantalla inferior
  // ========================
  const renderBottomScreen = () => {
    switch (activeTab) {
      case "chat":
        return (
          <div className="chat-container">
            <div className="messages">
              {messages.map((msg) => (
                <div key={msg.id} className="message">
                  <span className="user-name">{msg.user_name || 'Usuario'}:</span>
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
        );
      case "users":
        return (
          <div className="user-list-container">
            <h3>Usuarios Online ({users.length})</h3>
            <ul className="user-list">
              {users.map((user) => (
                <li key={user.id} className="user-list-item">
                  <span className="user-status-dot"></span>
                  {user.name}
                </li>
              ))}
            </ul>
          </div>
        );
      case "feed":
        return (
          <div className="placeholder-tab">
            <h3>Feed del Club</h3>
            <p>Aquí se mostrarán las últimas noticias y actualizaciones del club.</p>
          </div>
        );
      case "missions":
        return (
          <div className="placeholder-tab">
            <h3>Misiones Online</h3>
            <p>Próximamente: ¡Completa misiones con otros jugadores para ganar recompensas!</p>
          </div>
        );
      default:
        return null;
    }
  };


  // ========================
  // 🔥 RENDERIZADO PRINCIPAL CON NUEVO LAYOUT
  // ========================
  return (
    <div className="common-room-modal">
      <div className="ds-container">
        {/* ======================= PANTALLA SUPERIOR (JUEGO) ======================= */}
        <div className="top-screen">
          <canvas
            ref={canvasRef}
            width={1000} // Ajusta si es necesario
            height={600}  // Ajusta si es necesario
          />
           <div className="top-screen-header">
             <h2>Sala Común</h2>
             <button className="close-btn" onClick={onClose}>X</button>
           </div>
        </div>

        {/* ======================= "BISAGRA" DE LA CONSOLA ======================= */}
        <div className="hinge"></div>

        {/* ======================= PANTALLA INFERIOR (MENÚS) ======================= */}
        <div className="bottom-screen">
          <nav className="bottom-nav">
            <button onClick={() => setActiveTab("chat")} className={activeTab === 'chat' ? 'active' : ''}>
              <FaComment /> Chat
            </button>
            <button onClick={() => setActiveTab("users")} className={activeTab === 'users' ? 'active' : ''}>
              <FaUsers /> Usuarios
            </button>
            <button onClick={() => setActiveTab("feed")} className={activeTab === 'feed' ? 'active' : ''}>
              <FaStream /> Feed
            </button>
            <button onClick={() => setActiveTab("missions")} className={activeTab === 'missions' ? 'active' : ''}>
              <FaTasks /> Misiones
            </button>
          </nav>
          
          <div className="bottom-content">
            {renderBottomScreen()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonRoom;