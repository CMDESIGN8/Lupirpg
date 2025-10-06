import React, { useState, useEffect, useRef } from 'react';
import '../styles/MultiplayerLobby.css';
import { supabaseClient } from '../../services/supabase';

const TILE_SIZE = 45;
const MAP_ROWS = 12;
const MAP_COLS = 16;

const MultiplayerWorld = ({ currentUser }) => {
  const [players, setPlayers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const mapRef = useRef();

  const [myPosition, setMyPosition] = useState({ row: 5, col: 5 });

  // 🟢 Validación segura: si no hay usuario, mostramos cargando
  if (!currentUser) return <div className="lobby-container">Cargando mundo Lupi...</div>;

  // Movimiento simple con teclado
  const handleKeyDown = (e) => {
    setMyPosition((pos) => {
      let { row, col } = pos;
      if (e.key === 'ArrowUp' && row > 0) row--;
      if (e.key === 'ArrowDown' && row < MAP_ROWS - 1) row++;
      if (e.key === 'ArrowLeft' && col > 0) col--;
      if (e.key === 'ArrowRight' && col < MAP_COLS - 1) col++;
      return { row, col };
    });
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Simular jugadores online (reemplazar con Supabase)
  useEffect(() => {
    const interval = setInterval(() => {
      setPlayers((prev) => {
        const others = prev.filter(p => p.id !== currentUser.id);
        return [
          ...others,
          { id: currentUser.id, name: currentUser.username, position: myPosition }
        ];
      });
    }, 200);
    return () => clearInterval(interval);
  }, [myPosition, currentUser]);

  // Enviar mensaje
  const sendMessage = () => {
    if (!inputMessage) return;
    const newMsg = { id: Date.now(), username: currentUser.username, message: inputMessage, playerId: currentUser.id };
    setChatMessages((msgs) => [...msgs, newMsg]);
    setInputMessage('');
    // Desaparece después de 2 segundos
    setTimeout(() => {
      setChatMessages((msgs) => msgs.filter(m => m.id !== newMsg.id));
    }, 2000);
  };

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>Mundo Lupi</h1>
      </div>

      <div className="lobby-map-container">
        <div
          className="lobby-game-map"
          ref={mapRef}
          style={{ width: MAP_COLS * TILE_SIZE, height: MAP_ROWS * TILE_SIZE }}
        >
          {/* Mapa tiles */}
          {Array.from({ length: MAP_ROWS }).map((_, row) => (
            <div key={row} className="lobby-map-row">
              {Array.from({ length: MAP_COLS }).map((_, col) => (
                <div key={col} className="lobby-map-cell" />
              ))}
            </div>
          ))}

          {/* Jugadores */}
          {players.map((p) => (
            <div
              key={p.id || Math.random()}
              className={`lobby-player-marker ${p.id === currentUser.id ? 'my-player' : 'other-player'}`}
              style={{
                top: p.position?.row * TILE_SIZE + 'px',
                left: p.position?.col * TILE_SIZE + 'px'
              }}
            >
              <div className="lobby-player-avatar"></div>
              <div className="lobby-player-name-tag">{p.name || 'Jugador'}</div>

              {/* Burbujas de chat */}
              {chatMessages
                .filter(m => m && m.playerId === p.id)
                .map((m) => (
                  <div
                    className={`chat-bubble ${m.username === currentUser.username ? 'own-chat-bubble' : ''}`}
                    key={m.id}
                  >
                    <div className="chat-bubble-content">{m.message}</div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* Chat input */}
      <div className="lobby-chat-input-container">
        <input
          type="text"
          className="lobby-chat-input"
          placeholder="Escribe algo..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button className="lobby-chat-send-btn" onClick={sendMessage}>➡</button>
      </div>
    </div>
  );
};

export default MultiplayerWorld;