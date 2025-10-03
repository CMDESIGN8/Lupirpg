// src/components/Views/MultiplayerLobbyView.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import LoadingScreen from '../UI/LoadingScreen';
import '../styles/MultiplayerLobby.css';

const MultiplayerLobbyView = ({ currentUser, setView, supabaseClient, playerData, showMessage }) => {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState({});
  const [equippedAvatar, setEquippedAvatar] = useState(null);
  
  // Referencias
  const playerPositionRef = useRef({ x: 0, y: 0 });
  const channelRef = useRef(null);
  const cleanupIntervalRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);

  // Determinar usuario actual
  const userToUse = currentUser || playerData;

  // Depuración
  useEffect(() => {
    console.log('MultiplayerLobbyView - User:', userToUse);
  }, [userToUse]);

  // Obtener avatar equipado
  useEffect(() => {
    const fetchEquippedAvatar = async () => {
      if (!userToUse?.id) return;
      
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
          .eq('player_id', userToUse.id)
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
  }, [supabaseClient, userToUse]);

  // Función para unirse a la sala
  const joinRoom = useCallback(async () => {
    if (!userToUse?.id) return;

    try {
      const avatarUrl = equippedAvatar?.image_url || '/default-avatar.png';
      const initialX = Math.floor(Math.random() * 15);
      const initialY = Math.floor(Math.random() * 15);
      
      playerPositionRef.current = { x: initialX, y: initialY };

      // Unirse a la sala
      const { error: upsertError } = await supabaseClient
        .from('room_players')
        .upsert({
          user_id: userToUse.id,
          username: userToUse.username || 'Jugador',
          avatar_url: avatarUrl,
          x: initialX,
          y: initialY,
          last_activity: new Date().toISOString()
        }, { 
          onConflict: 'user_id'
        });

      if (upsertError) {
        throw new Error(`Join error: ${upsertError.message}`);
      }

      console.log('User joined room successfully');

      // Obtener jugadores actuales
      const { data: currentPlayers, error: fetchError } = await supabaseClient
        .from('room_players')
        .select('*')
        .gte('last_activity', new Date(Date.now() - 2 * 60 * 1000).toISOString());

      if (!fetchError && currentPlayers) {
        const playersObj = {};
        currentPlayers.forEach(player => {
          playersObj[player.user_id] = [player];
        });
        setPlayers(playersObj);
      }

      return true;
    } catch (error) {
      console.error('Error joining room:', error);
      showMessage('Error al unirse a la sala: ' + error.message);
      return false;
    }
  }, [supabaseClient, userToUse, equippedAvatar, showMessage]);

  // Función para salir de la sala
  const leaveRoom = useCallback(async () => {
    if (!userToUse?.id) return;

    try {
      // Limpiar intervalos
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }

      // Remover canal
      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Eliminar de la base de datos
      await supabaseClient
        .from('room_players')
        .delete()
        .eq('user_id', userToUse.id);

      console.log('User left room successfully');
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }, [supabaseClient, userToUse]);

  // Heartbeat para mantener activo
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) return;

    heartbeatIntervalRef.current = setInterval(async () => {
      if (!userToUse?.id) return;

      try {
        await supabaseClient
          .from('room_players')
          .update({ 
            last_activity: new Date().toISOString() 
          })
          .eq('user_id', userToUse.id);
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    }, 25000); // Cada 25 segundos
  }, [supabaseClient, userToUse]);

  // Limpiar jugadores desconectados
  const startCleanup = useCallback(() => {
    if (cleanupIntervalRef.current) return;

    cleanupIntervalRef.current = setInterval(async () => {
      try {
        const cutoffTime = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        await supabaseClient
          .from('room_players')
          .delete()
          .lt('last_activity', cutoffTime)
          .neq('user_id', userToUse?.id || '');
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }, 60000); // Cada 60 segundos
  }, [supabaseClient, userToUse]);

  // Configurar suscripción en tiempo real
  const setupRealtime = useCallback(() => {
    if (channelRef.current) return;

    const channel = supabaseClient.channel('room_players_realtime');
    
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_players',
        },
        (payload) => {
          console.log('Realtime update:', payload.eventType, payload.new?.username);
          
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
        console.log('Realtime subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('Realtime connected successfully');
          setLoading(false);
          startHeartbeat();
          startCleanup();
        }
        
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Realtime connection failed:', status);
          showMessage('Error de conexión en tiempo real');
          setLoading(false);
        }
      });

    channelRef.current = channel;
  }, [supabaseClient, showMessage, startHeartbeat, startCleanup]);

  // Efecto principal
  useEffect(() => {
    if (!userToUse?.id) {
      showMessage('Error: Usuario no disponible');
      setTimeout(() => setView('dashboard'), 2000);
      return;
    }

    let mounted = true;

    const initializeRoom = async () => {
      setLoading(true);
      
      // 1. Unirse a la sala
      const joined = await joinRoom();
      if (!joined || !mounted) return;

      // 2. Configurar suscripción en tiempo real
      setupRealtime();
    };

    initializeRoom();

    // Limpieza al desmontar
    return () => {
      mounted = false;
      leaveRoom();
    };
  }, [userToUse, joinRoom, setupRealtime, leaveRoom, setView, showMessage]);

  // Movimiento del jugador
  useEffect(() => {
    if (!userToUse?.id) return;

    const handleKeyDown = async (e) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();

      const currentPos = playerPositionRef.current;
      let newX = currentPos.x;
      let newY = currentPos.y;

      switch (e.key) {
        case 'ArrowUp': newY = Math.max(0, newY - 1); break;
        case 'ArrowDown': newY = Math.min(14, newY + 1); break;
        case 'ArrowLeft': newX = Math.max(0, newX - 1); break;
        case 'ArrowRight': newX = Math.min(14, newX + 1); break;
        default: return;
      }

      playerPositionRef.current = { x: newX, y: newY };

      try {
        await supabaseClient
          .from('room_players')
          .update({ 
            x: newX, 
            y: newY,
            last_activity: new Date().toISOString()
          })
          .eq('user_id', userToUse.id);
      } catch (error) {
        console.error('Move error:', error);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userToUse, supabaseClient]);

  // Clasificar jugadores
  const classifyPlayers = useCallback(() => {
    const now = new Date();
    const allPlayers = Object.values(players).flat();
    
    const activePlayers = allPlayers.filter(player => {
      if (!player.last_activity) return false;
      return (now - new Date(player.last_activity)) < 60 * 1000;
    });
    
    const inactivePlayers = allPlayers.filter(player => {
      if (!player.last_activity) return false;
      const diff = now - new Date(player.last_activity);
      return diff >= 60 * 1000 && diff < 2 * 60 * 1000;
    });
    
    return { activePlayers, inactivePlayers };
  }, [players]);

  // Renderizar celda del mapa
  const renderMapCell = (x, y) => {
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

  // Timeout de seguridad
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout - returning to dashboard');
        showMessage('Timeout de conexión');
        setView('dashboard');
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [loading, setView, showMessage]);

  if (loading) {
    return <LoadingScreen message="Conectando al Mundo Lupi..." />;
  }

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

  const { activePlayers, inactivePlayers } = classifyPlayers();

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