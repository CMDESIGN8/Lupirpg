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

  // Depuración: ver qué props estamos recibiendo
  useEffect(() => {
    console.log('MultiplayerLobbyView - Props recibidas:', {
      currentUser,
      playerData,
      hasSetView: !!setView,
      hasSupabaseClient: !!supabaseClient
    });
  }, [currentUser, playerData, setView, supabaseClient]);

  // Obtener avatar equipado
  useEffect(() => {
    const fetchEquippedAvatar = async () => {
      const userId = currentUser?.id || playerData?.id;
      
      if (!userId) {
        console.log('No user ID found for avatar fetch');
        return;
      }
      
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
          .eq('player_id', userId)
          .eq('is_equipped', true)
          .single();

        if (error) {
          console.log('Error fetching avatar (puede ser normal si no tiene avatar):', error);
          return;
        }

        if (data) {
          setEquippedAvatar(data.avatars);
        }
      } catch (error) {
        console.error('Error fetching avatar:', error);
      }
    };

    fetchEquippedAvatar();
  }, [supabaseClient, currentUser, playerData]);

  // Función para limpiar jugadores DESCONECTADOS (no inactivos)
  const cleanupDisconnectedPlayers = useCallback(async () => {
    try {
      // Solo eliminar jugadores que no han tenido actividad en los últimos 2 MINUTOS
      // Esto da tiempo para reconexiones y distingue entre inactivo y desconectado
      const cutoffTime = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      
      const { error } = await supabaseClient
        .from('room_players')
        .delete()
        .lt('last_activity', cutoffTime);

      if (error) {
        console.error('Error cleaning disconnected players:', error);
      } else {
        console.log('Cleaned up disconnected players');
      }
    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  }, [supabaseClient]);

  // ✨ Efecto principal para unirse, escuchar cambios y salir de la sala
  useEffect(() => {
    // Determinar qué datos de usuario usar
    const userToUse = currentUser || playerData;
    
    if (!userToUse?.id) {
      console.error('No user data available:', { currentUser, playerData });
      showMessage('Error: No se pudo cargar la información del usuario');
      setTimeout(() => setView('dashboard'), 2000);
      return;
    }

    console.log('Setting up room for user:', userToUse.id, userToUse.username);

    let channel;
    let isSubscribed = false;
    let heartbeatInterval;
    let cleanupInterval;

    const setupRoom = async () => {
      try {
        setLoading(true);
        
        // 1. Limpiar jugadores DESCONECTADOS (2 minutos) al entrar
        await cleanupDisconnectedPlayers();
        
        // 2. Obtener el avatar equipado del usuario actual
        const avatarUrl = equippedAvatar?.image_url || '/default-avatar.png';

        // 3. Posición inicial aleatoria
        const initialX = Math.floor(Math.random() * 15);
        const initialY = Math.floor(Math.random() * 15);
        playerPositionRef.current = { x: initialX, y: initialY };

        // 4. Unirse a la sala en la base de datos con timestamp actual
        const { error: upsertError } = await supabaseClient
          .from('room_players')
          .upsert({
            user_id: userToUse.id,
            username: userToUse.username || 'Jugador',
            avatar_url: avatarUrl,
            x: initialX,
            y: initialY,
            last_activity: new Date().toISOString(),
            is_online: true // Nuevo campo para estado de conexión
          }, { 
            onConflict: 'user_id'
          });

        if (upsertError) {
          console.error('Error joining room:', upsertError);
          showMessage('Error al unirse a la sala: ' + upsertError.message);
          return;
        }

        // 5. Obtener TODOS los jugadores de la sala (sin filtrar por tiempo)
        // Pero marcarlos como activos/inactivos en el frontend
        const { data: currentPlayers, error: fetchError } = await supabaseClient
          .from('room_players')
          .select('*');

        if (fetchError) {
          console.error('Error fetching players:', fetchError);
        } else {
          // Convertir array a objeto para el estado
          const playersObj = {};
          currentPlayers?.forEach(player => {
            playersObj[player.user_id] = [player];
          });
          setPlayers(playersObj);
          console.log('All room players loaded:', currentPlayers?.length || 0);
        }

        // 6. Crear canal de Supabase Realtime
        channel = supabaseClient.channel('room_players_channel');

        // 7. Escuchar cambios en la tabla room_players
        channel
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'room_players',
            },
            (payload) => {
              console.log('Room change:', payload.eventType, payload.new?.username);
              
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
            console.log('Channel subscription status:', status);
            if (status === 'SUBSCRIBED') {
              isSubscribed = true;
              setLoading(false);
              console.log('Successfully joined the room!');
              
              // Heartbeat más espaciado - solo para mantener conexión
              heartbeatInterval = setInterval(async () => {
                try {
                  await supabaseClient
                    .from('room_players')
                    .update({ 
                      last_activity: new Date().toISOString() 
                    })
                    .eq('user_id', userToUse.id);
                  console.log('Heartbeat sent');
                } catch (error) {
                  console.error('Heartbeat error:', error);
                }
              }, 30000); // Cada 30 segundos (en lugar de 15)
              
              // Limpiar DESCONECTADOS (no inactivos) cada 2 minutos
              cleanupInterval = setInterval(cleanupDisconnectedPlayers, 120000);
            }
          });

      } catch (error) {
        console.error('Error setting up room:', error);
        showMessage('Error al configurar la sala: ' + error.message);
        setLoading(false);
      }
    };

    setupRoom();

    // 8. Función de limpieza al desmontar
    return () => {
      console.log('Cleaning up room for user:', userToUse.id);
      
      // Limpiar intervalos
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (cleanupInterval) clearInterval(cleanupInterval);
      
      const leaveRoom = async () => {
        try {
          await supabaseClient
            .from('room_players')
            .delete()
            .eq('user_id', userToUse.id);
          console.log('User removed from room');
        } catch (error) {
          console.error('Error leaving room:', error);
        }
        
        if (channel && isSubscribed) {
          supabaseClient.removeChannel(channel);
          console.log('Channel removed');
        }
      };
      
      leaveRoom();
    };
  }, [currentUser, playerData, supabaseClient, equippedAvatar, showMessage, setView, cleanupDisconnectedPlayers]);

  // ✨ Efecto para manejar el movimiento del jugador con el teclado
  useEffect(() => {
    const userToUse = currentUser || playerData;
    if (!userToUse?.id) return;

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
        // Actualizar en la base de datos con timestamp actual
        const { error } = await supabaseClient
          .from('room_players')
          .update({ 
            x: newX, 
            y: newY,
            last_activity: new Date().toISOString()
          })
          .eq('user_id', userToUse.id);

        if (error) {
          console.error('Error updating position:', error);
        } else {
          console.log('Position updated:', newX, newY);
        }
      } catch (error) {
        console.error('Error moving player:', error);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser, playerData, supabaseClient]);

  // Clasificar jugadores por estado
  const classifyPlayers = useCallback(() => {
    const now = new Date();
    const allPlayers = Object.values(players).flat();
    
    const activePlayers = allPlayers.filter(player => {
      if (!player.last_activity) return false;
      const lastActivity = new Date(player.last_activity);
      return (now - lastActivity) < 60 * 1000; // Activos en último minuto
    });
    
    const inactivePlayers = allPlayers.filter(player => {
      if (!player.last_activity) return false;
      const lastActivity = new Date(player.last_activity);
      return (now - lastActivity) >= 60 * 1000 && (now - lastActivity) < 2 * 60 * 1000; // 1-2 minutos
    });
    
    // Los que llevan más de 2 minutos serán eliminados por el cleanup

    return { activePlayers, inactivePlayers };
  }, [players]);

  // Renderizar celda del mapa (solo jugadores activos)
  const renderMapCell = (x, y) => {
    const userToUse = currentUser || playerData;
    const { activePlayers } = classifyPlayers();
    const playersInCell = activePlayers.filter(player => 
      player.x === x && player.y === y
    );
    
    return (
      <div 
        key={`${x}-${y}`} 
        className={`lobby-map-cell ${playersInCell.length > 0 ? 'occupied' : ''}`}
      >
        {playersInCell.length > 0 && (
          <div className="lobby-players-in-cell">
            {playersInCell.map(player => (
              <div 
                key={player.user_id}
                className={`lobby-player-marker ${player.user_id === userToUse?.id ? 'my-player' : 'other-player'}`}
                title={player.username}
              >
                {player.avatar_url ? (
                  <img 
                    src={player.avatar_url} 
                    alt={player.username}
                    className="lobby-player-avatar"
                    onError={(e) => {
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                ) : (
                  <div className="lobby-player-initial">
                    {player.username?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="lobby-player-name-tag">
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

  const userToUse = currentUser || playerData;
  const { activePlayers, inactivePlayers } = classifyPlayers();
  const allPlayersArray = Object.values(players).flat();

  if (!userToUse) {
    return (
      <div className="lobby-error-container">
        <h2>Error</h2>
        <p>No se pudo cargar la información del usuario.</p>
        <button onClick={() => setView('dashboard')} className="lobby-back-btn">
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>🏟️ Mundo Lupi</h1>
        <p>¡Muévete con las flechas del teclado y encuentra a otros jugadores!</p>
        <div className="lobby-info">
          <span>Jugadores activos: {activePlayers.length}</span>
          <span>Inactivos: {inactivePlayers.length}</span>
          <span>Tu posición: ({playerPositionRef.current.x}, {playerPositionRef.current.y})</span>
          <button onClick={() => setView('dashboard')} className="lobby-back-btn">
            🏠 Volver al Dashboard
          </button>
        </div>
      </div>

      <div className="lobby-map-container">
        <div className="lobby-game-map">
          {Array.from({ length: 15 }, (_, y) => (
            <div key={y} className="lobby-map-row">
              {Array.from({ length: 15 }, (_, x) => renderMapCell(x, y))}
            </div>
          ))}
        </div>
      </div>

      <div className="lobby-players-panel">
        <h3>👥 Jugadores en la Sala</h3>
        <div className="lobby-players-status">
          <div className="lobby-status-active">
            <h4>🟢 Activos ({activePlayers.length})</h4>
            <div className="lobby-players-list">
              {activePlayers.map(player => (
                <div 
                  key={player.user_id} 
                  className={`lobby-player-item ${player.user_id === userToUse.id ? 'current-player' : ''}`}
                >
                  <div className="lobby-player-info">
                    {player.avatar_url && (
                      <img 
                        src={player.avatar_url} 
                        alt="Avatar"
                        className="lobby-player-avatar-small"
                      />
                    )}
                    <span className="lobby-player-name">{player.username}</span>
                    {player.user_id === userToUse.id && <span className="lobby-you-badge">(Tú)</span>}
                  </div>
                  <div className="lobby-player-position">
                    ({player.x}, {player.y})
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {inactivePlayers.length > 0 && (
            <div className="lobby-status-inactive">
              <h4>🟡 Inactivos ({inactivePlayers.length})</h4>
              <div className="lobby-players-list inactive">
                {inactivePlayers.map(player => (
                  <div 
                    key={player.user_id} 
                    className="lobby-player-item inactive"
                  >
                    <div className="lobby-player-info">
                      {player.avatar_url && (
                        <img 
                          src={player.avatar_url} 
                          alt="Avatar"
                          className="lobby-player-avatar-small"
                        />
                      )}
                      <span className="lobby-player-name">{player.username}</span>
                    </div>
                    <div className="lobby-player-position">
                      (Inactivo)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="lobby-controls-help">
        <p>🕹️ Controles: Flechas para moverte | ESC para salir</p>
        <p>💡 Los jugadores se marcan como inactivos después de 1 minuto sin movimiento</p>
      </div>
    </div>
  );
};

export default MultiplayerLobbyView;