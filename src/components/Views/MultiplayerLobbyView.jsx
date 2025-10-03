// src/components/Views/MultiplayerLobbyView.jsx

import React, { useState, useEffect, useCallback } from 'react';
import LoadingScreen from '../UI/LoadingScreen';
import '../styles/MultiplayerLobby.css';

const MultiplayerLobbyView = ({ setView, supabaseClient, playerData, showMessage }) => {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState([]);
  const [equippedAvatar, setEquippedAvatar] = useState(null);

  // Obtener el avatar equipado del jugador
  useEffect(() => {
    const fetchEquippedAvatar = async () => {
      const { data, error } = await supabaseClient
        .from('player_avatars')
        .select(`
          avatar_id,
          avatars (
            image_url,
            name
          )
        `)
        .eq('player_id', playerData.id)
        .eq('is_equipped', true)
        .single();

      if (!error && data) {
        setEquippedAvatar(data.avatars);
      }
    };

    fetchEquippedAvatar();
  }, [supabaseClient, playerData.id]);

  // Función para manejar el movimiento del jugador
  const handleMove = useCallback(async (dx, dy) => {
    const me = players.find(p => p.user_id === playerData.id);
    if (!me) return;

    const newX = Math.max(0, Math.min(14, me.x + dx));
    const newY = Math.max(0, Math.min(14, me.y + dy));

    // Determinar dirección para animaciones futuras
    let direction = 'down';
    if (dx > 0) direction = 'right';
    if (dx < 0) direction = 'left';
    if (dy > 0) direction = 'down';
    if (dy < 0) direction = 'up';

    // Actualizar posición en la base de datos
    const { error } = await supabaseClient
      .from('room_players')
      .update({ 
        x: newX, 
        y: newY,
        last_activity: new Date().toISOString()
      })
      .eq('user_id', playerData.id);

    if (error) {
      console.error('Error al moverse:', error);
    }
  }, [players, playerData.id, supabaseClient]);

  // Efecto para manejar el teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevenir scroll con flechas
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      
      switch (e.key) {
        case 'ArrowUp': handleMove(0, -1); break;
        case 'ArrowDown': handleMove(0, 1); break;
        case 'ArrowLeft': handleMove(-1, 0); break;
        case 'ArrowRight': handleMove(1, 0); break;
        case 'Escape': setView('dashboard'); break;
        default: break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, setView]);

  // Efecto principal para unirse al lobby y escuchar cambios
  useEffect(() => {
    const joinLobby = async () => {
      setLoading(true);
      
      try {
        // Obtener avatar equipado para incluirlo en room_players
        const { data: avatarData } = await supabaseClient
          .from('player_avatars')
          .select(`
            avatar_id,
            avatars (image_url)
          `)
          .eq('player_id', playerData.id)
          .eq('is_equipped', true)
          .single();

        // Unirse a la sala
        const { error: upsertError } = await supabaseClient
          .from('room_players')
          .upsert({
            user_id: playerData.id,
            username: playerData.username,
            avatar_url: avatarData?.avatars?.image_url || '/default-avatar.png',
            x: Math.floor(Math.random() * 15),
            y: Math.floor(Math.random() * 15),
            last_activity: new Date().toISOString()
          }, { 
            onConflict: 'user_id'
          });

        if (upsertError) throw upsertError;
        
        // Obtener todos los jugadores en la sala
        const { data: initialPlayers, error: fetchError } = await supabaseClient
          .from('room_players')
          .select('*')
          .order('joined_at', { ascending: true });

        if (fetchError) throw fetchError;
        
        setPlayers(initialPlayers || []);
        
      } catch (error) {
        console.error('Error al unirse al lobby:', error);
        showMessage('Error al unirse al lobby: ' + error.message);
        setView('dashboard');
        return;
      }
      
      setLoading(false);
    };

    joinLobby();

    // Suscribirse a cambios en tiempo real
    const channel = supabaseClient
      .channel('multiplayer-lobby')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_players' 
      }, (payload) => {
        console.log('Cambio en room_players:', payload);
        
        if (payload.eventType === 'INSERT') {
          setPlayers(current => [...current, payload.new]);
        }
        else if (payload.eventType === 'UPDATE') {
          setPlayers(current => current.map(p => 
            p.user_id === payload.new.user_id ? { ...p, ...payload.new } : p
          ));
        }
        else if (payload.eventType === 'DELETE') {
          setPlayers(current => current.filter(p => p.user_id !== payload.old.user_id));
        }
      })
      .subscribe();

    // Limpieza al salir del componente
    return () => {
      const leaveLobby = async () => {
        try {
          await supabaseClient.from('room_players').delete().eq('user_id', playerData.id);
        } catch (error) {
          console.error('Error al salir del lobby:', error);
        }
        supabaseClient.removeChannel(channel);
      };
      leaveLobby();
    };
  }, [supabaseClient, playerData.id, playerData.username, setView, showMessage]);

  // Renderizar celda del mapa
  const renderMapCell = (x, y) => {
    const playersInCell = players.filter(player => player.x === x && player.y === y);
    
    return (
      <div 
        key={`${x}-${y}`} 
        className={`map-cell ${playersInCell.length > 0 ? 'occupied' : ''}`}
      >
        {playersInCell.length > 0 && (
          <div className="players-in-cell">
            {playersInCell.map(player => (
              <div 
                key={player.user_id}
                className={`player-marker ${player.user_id === playerData.id ? 'my-player' : 'other-player'}`}
                title={player.username}
              >
                {player.avatar_url ? (
                  <img 
                    src={player.avatar_url} 
                    alt={player.username}
                    className="player-avatar"
                    onError={(e) => {
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                ) : (
                  <div className="player-initial">
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <LoadingScreen message="Entrando al Mundo Lupi..." />;

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>🏟️ Mundo Lupi</h1>
        <p>¡Muévete con las flechas del teclado y encuentra a otros jugadores!</p>
        <div className="lobby-info">
          <span>Jugadores en línea: {players.length}</span>
          <button onClick={() => setView('dashboard')} className="lobby-back-btn">
            🏠 Volver al Dashboard
          </button>
        </div>
      </div>

      <div className="game-map-container">
        <div className="game-map">
          {/* Renderizar grid del mapa 15x15 */}
          {Array.from({ length: 15 }, (_, y) => (
            <div key={y} className="map-row">
              {Array.from({ length: 15 }, (_, x) => renderMapCell(x, y))}
            </div>
          ))}
        </div>
      </div>

      <div className="players-panel">
        <h3>👥 Jugadores Conectados ({players.length})</h3>
        <div className="players-list">
          {players.map(player => (
            <div 
              key={player.user_id} 
              className={`player-item ${player.user_id === playerData.id ? 'current-player' : ''}`}
            >
              <div className="player-info">
                {player.avatar_url && (
                  <img 
                    src={player.avatar_url} 
                    alt="Avatar"
                    className="player-avatar-small"
                  />
                )}
                <span className="player-name">{player.username}</span>
                {player.user_id === playerData.id && <span className="you-badge">(Tú)</span>}
              </div>
              <div className="player-position">
                Posición: ({player.x}, {player.y})
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="controls-help">
        <p>🕹️ Controles: Flechas para moverte | ESC para salir</p>
      </div>
    </div>
  );
};

export default MultiplayerLobbyView;