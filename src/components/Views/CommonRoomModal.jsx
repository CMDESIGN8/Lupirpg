// CommonRoomModal.jsx
import React, { useState } from "react";
import CommonRoom3D from "../game/CommonRoom.jsx"; // Tu componente 3D
import "../styles/CommonRoom.css"; // Tus estilos del dashboard

export default function CommonRoomModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("chat");

  if (!isOpen) return null;

  return (
    <div className="common-room-modal">
      <div className="common-room-content">
        {/* Header */}
        <div className="common-room-header">
          <h2>SALA COMÚN - LUPI RPG</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Layout principal */}
        <div className="room-container">
          {/* Sección 3D */}
          <div className="canvas-container-3d">
            <CommonRoom3D />
          </div>

          {/* Dashboard */}
          <div className="dashboard-container">
            <div className="dashboard-tabs">
              <button 
                className={activeTab === "chat" ? "active" : ""}
                onClick={() => setActiveTab("chat")}
              >
                Chat
              </button>
              <button 
                className={activeTab === "events" ? "active" : ""}
                onClick={() => setActiveTab("events")}
              >
                Eventos
              </button>
              <button 
                className={activeTab === "raffle" ? "active" : ""}
                onClick={() => setActiveTab("raffle")}
              >
                Rifas
              </button>
              <button 
                className={activeTab === "stats" ? "active" : ""}
                onClick={() => setActiveTab("stats")}
              >
                Stats
              </button>
            </div>

            <div className="dashboard-content">
              {activeTab === "chat" && (
                <div className="chat-full">
                  <div className="messages-full">
                    <div className="message">
                      <span className="user-name">Sistema:</span>
                      <span className="message-content">
                        Bienvenido a la sala común de Lupi RPG
                      </span>
                    </div>
                  </div>
                  <div className="message-form">
                    <input type="text" placeholder="Escribe un mensaje..." />
                    <button>Enviar</button>
                  </div>
                </div>
              )}

              {activeTab === "events" && (
                <div>
                  <div className="event-card">
                    <div className="feed-title">Evento del Día</div>
                    <div className="feed-meta">Caza del tesoro - 20:00 hrs</div>
                  </div>
                </div>
              )}

              {activeTab === "raffle" && (
                <div>
                  <div className="raffle-card">
                    <div className="feed-title">Rifa Semanal</div>
                    <div className="feed-meta">Premio: 1000 monedas</div>
                  </div>
                </div>
              )}

              {activeTab === "stats" && (
                <div>
                  <div className="stats-card">
                    <div className="feed-title">Tus Estadísticas</div>
                    <div className="feed-meta">Nivel: 5 | Monedas: 250</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}