// src/components/Views/MultiplayerLobbyView.jsx

import React, { useState, useEffect, useCallback } from 'react';
import LoadingScreen from '../UI/LoadingScreen';
import '../styles/MultiplayerLobby.css'; // Crearemos este archivo CSS a continuación

const MultiplayerLobbyView = ({ setView, supabaseClient, playerData, showMessage }) => {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState([]);

  // Función para manejar el movimiento del jugador
  const handleMove = useCallback(async (dx, dy) => {
    // Encuentra la posición actual del jugador
    const me = players.find(p => p.user_id === playerData.id);
    if (!me) return;

    const newX = me.x + dx;
    const newY = me.y + dy;

    // Lógica simple de colisión con los bordes del mapa (15x15)
    if (newX < 0 || newX > 14 || newY < 0 || newY > 14) {
      return; 
    }

    // Actualiza la posición en la base de datos
    const { error } = await supabaseClient
      .from('room_players')
      .update({ x: newX, y: newY })
      .eq('user_id', playerData.id);

    if (error) {
      showMessage('Error al moverse: ' + error.message);
    }
  }, [players, playerData.id, supabaseClient, showMessage]);

  // Efecto para manejar el teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowUp': handleMove(0, -1); break;
        case 'ArrowDown': handleMove(0, 1); break;
        case 'ArrowLeft': handleMove(-1, 0); break;
        case 'ArrowRight': handleMove(1, 0); break;
        default: break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  // Efecto para unirse, salir y escuchar cambios en el lobby
  useEffect(() => {
    const joinLobby = async () => {
      setLoading(true);
      // 1. Unirse a la sala (o actualizar la posición si ya estaba)
      const { error: upsertError } = await supabaseClient
        .from('room_players')
        .upsert({
          user_id: playerData.id,
          username: playerData.username,
          x: Math.floor(Math.random() * 15), // Posición inicial aleatoria
          y: Math.floor(Math.random() * 15),
        }, { onConflict: 'user_id' });

      if (upsertError) {
        showMessage('Error al unirse al lobby: ' + upsertError.message);
        setView('dashboard');
        return;
      }
      
      // 2. Obtener todos los jugadores actuales en la sala
      const { data: initialPlayers, error: fetchError } = await supabaseClient
        .from('room_players')
        .select('*');

      if (fetchError) {
        showMessage('Error al cargar jugadores: ' + fetchError.message);
      } else {
        setPlayers(initialPlayers || []);
      }
      setLoading(false);
    };

    joinLobby();

    // 3. Suscribirse a cambios en tiempo real
    const channel = supabaseClient
      .channel('multiplayer-lobby')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_players' 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setPlayers(current => [...current, payload.new]);
        }
        if (payload.eventType === 'UPDATE') {
          setPlayers(current => current.map(p => p.user_id === payload.new.user_id ? payload.new : p));
        }
        if (payload.eventType === 'DELETE') {
          setPlayers(current => current.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();

    // 4. Limpieza al salir del componente
    return () => {
      const leaveLobby = async () => {
        await supabaseClient.from('room_players').delete().eq('user_id', playerData.id);
        supabaseClient.removeChannel(channel);
      };
      leaveLobby();
    };
  }, [supabaseClient, playerData.id, playerData.username, setView, showMessage]);

  if (loading) return <LoadingScreen message="Entrando al Mundo Lupi..." />;

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>Mundo Lupi (Lobby)</h1>
        <p>¡Muévete con las flechas y encuéntrate con otros jugadores!</p>
        <button onClick={() => setView('dashboard')} className="lobby-back-btn">
          Volver al Dashboard
        </button>
      </div>
      <div className="lobby-map">
        {players.map(player => (
          <div
            key={player.user_id}
            className="player-avatar-map"
            style={{
              left: `${player.x * 6.66}%`, // 100% / 15 celdas
              top: `${player.y * 6.66}%`,
              transition: 'left 0.2s, top 0.2s'
            }}
            title={player.username}
          >
            {player.username.charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiplayerLobbyView;