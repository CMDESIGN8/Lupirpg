// src/components/Views/MultiplayerLobbyView.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import LoadingScreen from '../UI/LoadingScreen';
import '../styles/MultiplayerLobby.css';

const MultiplayerLobbyView = ({ currentUser, setView, supabaseClient, playerData, showMessage }) => {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState({});
  const [equippedAvatar, setEquippedAvatar] = useState(null);
  
  // Referencia para la posición del jugador actual
  const playerPositionRef = useRef({ x: 0, y: 0 });

  // Obtener avatar equipado
  useEffect(() => {
    const fetchEquippedAvatar = async () => {
      if (!currentUser?.id) return;
      
      try {
        const { data, error } = await supabaseClient
          .from('player_avatars')
          .select(`
            avatar_id,
            avatars (
              image_url,
              name
            )
          `)
          .eq('player_id', currentUser.id)
          .eq('is_equipped', true)
          .single();

        if (!error && data) {
          setEquippedAvatar(data.avatars);
        }
      } catch (error) {
        console.error('Error fetching avatar:', error);
      }
    };

    fetchEquippedAvatar();
  }, [supabaseClient, currentUser]);

  // ✨ Efecto principal para unirse, escuchar cambios y salir de la sala
  useEffect(() => {
    // Si no hay usuario, no hacemos nada
    if (!currentUser?.id) {
      console.error('No current user found');
      setView('dashboard');
      return;
    }

    let channel;
    let isSubscribed = false;

    const setupRoom = async () => {
      try {
        setLoading(true);
        
        // 1. Obtener el avatar equipado del usuario actual
        const avatarUrl = equippedAvatar?.image_url || '/default-avatar.png';

        // 2. Posición inicial aleatoria
        const initialX = Math.floor(Math.random() * 15);
        const initialY = Math.floor(Math.random() * 15);
        playerPositionRef.current = { x: initialX, y: initialY };

        // 3. Unirse a la sala en la base de datos
        const { error: upsertError } = await supabaseClient
          .from('room_players')
          .upsert({
            user_id: currentUser.id,
            username: currentUser.username || playerData?.username || 'Jugador',
            avatar_url: avatarUrl,
            x: initialX,
            y: initialY,
            last_activity: new Date().toISOString()
          }, { 
            onConflict: 'user_id'
          });

        if (upsertError) {
          console.error('Error joining room:', upsertError);
          showMessage('Error al unirse a la sala: ' + upsertError.message);
          return;
        }

        // 4. Obtener jugadores actuales en la sala
        const { data: currentPlayers, error: fetchError } = await supabaseClient
          .from('room_players')
          .select('*');

        if (!fetchError && currentPlayers) {
          // Convertir array a objeto para el estado de presencia
          const playersObj = {};
          currentPlayers.forEach(player => {
            playersObj[player.user_id] = [player];
          });
          setPlayers(playersObj);
        }

        // 5. Crear canal de Supabase Realtime
        channel = supabaseClient.channel('room_players_channel');

        // 6. Escuchar cambios en la tabla room_players
        channel
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'room_players',
            },
            (payload) => {
              console.log('Change received:', payload);
              
              if (payload.eventType === 'INSERT') {
                setPlayers(prev => ({
                  ...prev,
                  [payload.new.user_id]: [payload.new]
                }));
              }
              else if (payload.eventType === 'UPDATE') {
                setPlayers(prev => ({
                  ...prev,
                  [payload.new.user_id]: [payload.new]
                }));
              }
              else if (payload.eventType === 'DELETE') {
                setPlayers(prev => {
                  const newPlayers = { ...prev };
                  delete newPlayers[payload.old.user_id];
                  return newPlayers;
                });
              }
            }
          )
          .subscribe((status) => {
            console.log('Channel status:', status);
            if (status === 'SUBSCRIBED') {
              isSubscribed = true;
              setLoading(false);
            }
          });

      } catch (error) {
        console.error('Error setting up room:', error);
        showMessage('Error al configurar la sala: ' + error.message);
        setLoading(false);
      }
    };

    setupRoom();

    // 7. Función de limpieza al desmontar
    return () => {
      console.log('Cleaning up room...');
      const leaveRoom = async () => {
        try {
          if (currentUser?.id) {
            await supabaseClient
              .from('room_players')
              .delete()
              .eq('user_id', currentUser.id);
          }
        } catch (error) {
          console.error('Error leaving room:', error);
        }
        
        if (channel && isSubscribed) {
          supabaseClient.removeChannel(channel);
        }
      };
      
      leaveRoom();
    };
  }, [currentUser, supabaseClient, equippedAvatar, showMessage, setView, playerData]);

  // ✨ Efecto para manejar el movimiento del jugador con el teclado
  useEffect(() => {
    if (!currentUser?.id) return;

    const handleKeyDown = async (e) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();

      const currentPos = playerPositionRef.current;
      let newX = currentPos.x;
      let newY = currentPos.y;

      switch (e.key) {
        case 'ArrowUp':    
          newY = Math.max(0, newY - 1); 
          break;
        case 'ArrowDown':  
          newY = Math.min(14, newY + 1); 
          break;
        case 'ArrowLeft':  
          newX = Math.max(0, newX - 1); 
          break;
        case 'ArrowRight': 
          newX = Math.min(14, newX + 1); 
          break;
        default: 
          return;
      }

      // Actualizar referencia local
      playerPositionRef.current = { x: newX, y: newY };

      try {
        // Actualizar en la base de datos
        const { error } = await supabaseClient
          .from('room_players')
          .update({ 
            x: newX, 
            y: newY,
            last_activity: new Date().toISOString()
          })
          .eq('user_id', currentUser.id);

        if (error) {
          console.error('Error updating position:', error);
        }
      } catch (error) {
        console.error('Error moving player:', error);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser, supabaseClient]);

  // Renderizar celda del mapa
  const renderMapCell = (x, y) => {
    const playersInCell = Object.values(players).flat().filter(player => 
      player.x === x && player.y === y
    );
    
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
                className={`player-marker ${player.user_id === currentUser?.id ? 'my-player' : 'other-player'}`}
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
                    {player.username?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="player-name-tag">
                  {player.username}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <LoadingScreen message="Entrando al Mundo Lupi..." />;
  }

  if (!currentUser) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>No se pudo cargar la información del usuario.</p>
        <button onClick={() => setView('dashboard')} className="lobby-back-btn">
          Volver al Dashboard
        </button>
      </div>
    );
  }

  const playersArray = Object.values(players).flat();

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>🏟️ Mundo Lupi</h1>
        <p>¡Muévete con las flechas del teclado y encuentra a otros jugadores!</p>
        <div className="lobby-info">
          <span>Jugadores en línea: {playersArray.length}</span>
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
        <h3>👥 Jugadores Conectados ({playersArray.length})</h3>
        <div className="players-list">
          {playersArray.map(player => (
            <div 
              key={player.user_id} 
              className={`player-item ${player.user_id === currentUser.id ? 'current-player' : ''}`}
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
                {player.user_id === currentUser.id && <span className="you-badge">(Tú)</span>}
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