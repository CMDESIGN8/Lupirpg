// src/components/Views/MultiplayerLobbyView.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import LoadingScreen from '../UI/LoadingScreen';
import '../styles/MultiplayerLobby.css';

const MultiplayerLobbyView = ({ currentUser, setView, supabaseClient, playerData, showMessage }) => {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState({});
  const [equippedAvatar, setEquippedAvatar] = useState(null);
  const [showMobileControls, setShowMobileControls] = useState(false);
  
  // Referencias
  const playerPositionRef = useRef({ x: 0, y: 0 });
  const channelRef = useRef(null);
  const cleanupIntervalRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const moveTimeoutRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });

  // Determinar usuario actual
  const userToUse = currentUser || playerData;

  // Detectar si es móvil
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Depuración
  useEffect(() => {
    console.log('MultiplayerLobbyView - User:', userToUse, 'Mobile:', isMobile);
  }, [userToUse, isMobile]);

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

  // Función para mover al jugador
  const movePlayer = useCallback(async (dx, dy) => {
    if (!userToUse?.id) return;

    const currentPos = playerPositionRef.current;
    let newX = Math.max(0, Math.min(14, currentPos.x + dx));
    let newY = Math.max(0, Math.min(14, currentPos.y + dy));

    // Si no hay cambio, no hacer nada
    if (newX === currentPos.x && newY === currentPos.y) return;

    playerPositionRef.current = { x: newX, y: newY };

    try {
      // 1. Actualizar en la base de datos
      const { error } = await supabaseClient
        .from('room_players')
        .update({ 
          x: newX, 
          y: newY,
          last_activity: new Date().toISOString()
        })
        .eq('user_id', userToUse.id);

      if (error) {
        console.error('Move error:', error);
        return;
      }

      console.log('Moved to:', newX, newY);

      // 2. Actualizar el estado local INMEDIATAMENTE para que se renderice
      setPlayers(prev => {
        const currentPlayer = prev[userToUse.id]?.[0];
        if (!currentPlayer) return prev;

        return {
          ...prev,
          [userToUse.id]: [{
            ...currentPlayer,
            x: newX,
            y: newY,
            last_activity: new Date().toISOString()
          }]
        };
      });

    } catch (error) {
      console.error('Move error:', error);
    }
  }, [supabaseClient, userToUse]);

  // Movimiento con teclado
  const handleKeyDown = useCallback((e) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) return;
    e.preventDefault();

    // Limitar la frecuencia de movimiento
    if (moveTimeoutRef.current) return;

    let dx = 0, dy = 0;

    switch (e.key.toLowerCase()) {
      case 'arrowup':
      case 'w':
        dy = -1;
        break;
      case 'arrowdown':
      case 's':
        dy = 1;
        break;
      case 'arrowleft':
      case 'a':
        dx = -1;
        break;
      case 'arrowright':
      case 'd':
        dx = 1;
        break;
    }

    movePlayer(dx, dy);

    // Timeout para evitar movimiento demasiado rápido
    moveTimeoutRef.current = setTimeout(() => {
      moveTimeoutRef.current = null;
    }, 150);
  }, [movePlayer]);

  // Controles táctiles para móvil
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const minSwipeDistance = 30;

    // Determinar dirección del swipe
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Movimiento horizontal
      if (Math.abs(deltaX) > minSwipeDistance) {
        movePlayer(deltaX > 0 ? 1 : -1, 0);
      }
    } else {
      // Movimiento vertical
      if (Math.abs(deltaY) > minSwipeDistance) {
        movePlayer(0, deltaY > 0 ? 1 : -1);
      }
    }

    touchStartRef.current = null;
  }, [movePlayer]);

  // Joystick virtual para móvil
  const renderMobileControls = () => {
    if (!isMobile || !showMobileControls) return null;

    return (
      <div className="mobile-controls-overlay">
        <div className="joystick-container">
          {/* Joystick de movimiento */}
          <div className="joystick-area">
            <div className="joystick-background">
              <button 
                className="joystick-btn up"
                onTouchStart={() => movePlayer(0, -1)}
                aria-label="Mover arriba"
              >
                ↑
              </button>
              <div className="joystick-middle-row">
                <button 
                  className="joystick-btn left"
                  onTouchStart={() => movePlayer(-1, 0)}
                  aria-label="Mover izquierda"
                >
                  ←
                </button>
                <div className="joystick-center"></div>
                <button 
                  className="joystick-btn right"
                  onTouchStart={() => movePlayer(1, 0)}
                  aria-label="Mover derecha"
                >
                  →
                </button>
              </div>
              <button 
                className="joystick-btn down"
                onTouchStart={() => movePlayer(0, 1)}
                aria-label="Mover abajo"
              >
                ↓
              </button>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="action-buttons-game">
            <button 
              className="action-btn-game menu-btn"
              onClick={() => setShowMobileControls(false)}
              aria-label="Ocultar controles"
            >
              🎮
            </button>
            <button 
              className="action-btn-game exit-btn"
              onClick={() => setView('dashboard')}
              aria-label="Salir"
            >
              🏠
            </button>
          </div>
        </div>
      </div>
    );
  };

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

      // Obtener TODOS los jugadores activos
      const activeCutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: currentPlayers, error: fetchError } = await supabaseClient
        .from('room_players')
        .select('*')
        .gte('last_activity', activeCutoff);

      if (!fetchError && currentPlayers) {
        const playersObj = {};
        currentPlayers.forEach(player => {
          playersObj[player.user_id] = [player];
        });
        setPlayers(playersObj);
        console.log('Loaded players:', currentPlayers.length);
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
      // Limpiar intervalos y timeouts
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
        moveTimeoutRef.current = null;
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
        console.log('Heartbeat sent');
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    }, 25000);
  }, [supabaseClient, userToUse]);

  // Limpiar jugadores desconectados
  const startCleanup = useCallback(() => {
    if (cleanupIntervalRef.current) return;

    cleanupIntervalRef.current = setInterval(async () => {
      try {
        const cutoffTime = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        const { error } = await supabaseClient
          .from('room_players')
          .delete()
          .lt('last_activity', cutoffTime)
          .neq('user_id', userToUse?.id || '');

        if (!error) {
          console.log('Cleanup completed');
        }
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }, 60000);
  }, [supabaseClient, userToUse]);

  // Configurar suscripción en tiempo real - CORREGIDA
  const setupRealtime = useCallback(() => {
    if (channelRef.current) {
      console.log('Channel already exists, removing...');
      supabaseClient.removeChannel(channelRef.current);
    }

    console.log('Setting up realtime channel...');
    
    const channel = supabaseClient.channel('room_players_updates', {
      config: {
        broadcast: { self: true }, // Recibir nuestros propios eventos también
        presence: { key: userToUse?.id }
      }
    });

    // Escuchar TODOS los cambios en room_players
    channel
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'room_players',
        },
        (payload) => {
          console.log('🔴 REALTIME EVENT:', payload.eventType, payload.new || payload.old);
          
          if (payload.eventType === 'INSERT') {
            console.log('🟢 New player joined:', payload.new.username);
            setPlayers(prev => ({
              ...prev,
              [payload.new.user_id]: [payload.new]
            }));
          }
          else if (payload.eventType === 'UPDATE') {
            console.log('🟡 Player updated:', payload.new.username, 'at', payload.new.x, payload.new.y);
            setPlayers(prev => ({
              ...prev,
              [payload.new.user_id]: [payload.new]
            }));
          }
          else if (payload.eventType === 'DELETE') {
            console.log('🔴 Player left:', payload.old.username);
            setPlayers(prev => {
              const newPlayers = { ...prev };
              delete newPlayers[payload.old.user_id];
              return newPlayers;
            });
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        console.log('🟣 Presence sync:', channel.presenceState());
      })
      .subscribe(async (status) => {
        console.log('📡 Channel subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to realtime updates');
          setLoading(false);
          startHeartbeat();
          startCleanup();
          
          // Track presence
          await channel.track({
            user_id: userToUse.id,
            username: userToUse.username,
            online_at: new Date().toISOString()
          });
        }
        
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error');
          showMessage('Error de conexión en tiempo real');
          setLoading(false);
        }
        
        if (status === 'TIMED_OUT') {
          console.error('⏰ Channel timeout');
          showMessage('Timeout de conexión');
          setLoading(false);
        }
      });

    channelRef.current = channel;
    return channel;
  }, [supabaseClient, userToUse, showMessage, startHeartbeat, startCleanup]);

  // Efecto principal - CORREGIDO
  useEffect(() => {
    if (!userToUse?.id) {
      showMessage('Error: Usuario no disponible');
      setTimeout(() => setView('dashboard'), 2000);
      return;
    }

    let mounted = true;
    let channel;

    const initializeRoom = async () => {
      setLoading(true);
      console.log('🚀 Initializing room...');
      
      // 1. Limpiar jugadores desconectados
      try {
        const cutoffTime = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        await supabaseClient
          .from('room_players')
          .delete()
          .lt('last_activity', cutoffTime);
      } catch (error) {
        console.error('Cleanup error on init:', error);
      }

      // 2. Unirse a la sala
      const joined = await joinRoom();
      if (!joined || !mounted) {
        console.log('❌ Failed to join room or unmounted');
        return;
      }

      // 3. Configurar suscripción en tiempo real
      channel = setupRealtime();
    };

    initializeRoom();

    // Limpieza al desmontar
    return () => {
      console.log('🧹 Cleaning up room...');
      mounted = false;
      leaveRoom();
    };
  }, [userToUse, joinRoom, setupRealtime, leaveRoom, setView, showMessage, supabaseClient]);

  // Event listeners para teclado y touch
  useEffect(() => {
    // Teclado
    window.addEventListener('keydown', handleKeyDown);
    
    // Touch (solo si es móvil)
    if (isMobile) {
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
      window.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (isMobile) {
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [handleKeyDown, handleTouchStart, handleTouchEnd, isMobile]);

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
    
    console.log('👥 Players classification - Active:', activePlayers.length, 'Inactive:', inactivePlayers.length);
    
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
                title={`${player.username} (${player.x}, ${player.y})`}
                style={{
                  transition: 'all 0.3s ease'
                }}
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
        console.warn('⏰ Loading timeout - returning to dashboard');
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
          
          {/* Botón para controles móviles */}
          {isMobile && (
            <button 
              onClick={() => setShowMobileControls(!showMobileControls)}
              className="lobby-mobile-controls-btn"
            >
              {showMobileControls ? '❌ Ocultar Controles' : '🎮 Mostrar Controles'}
            </button>
          )}
          
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

      {/* Controles móviles */}
      {renderMobileControls()}

      <div className="lobby-players-panel">
        <h3>👥 Jugadores en la Sala ({activePlayers.length + inactivePlayers.length})</h3>
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
        <p>
          {isMobile ? (
            <>
              🕹️ Controles: Desliza para moverte | Toca 🎮 para controles virtuales
            </>
          ) : (
            <>
              🕹️ Controles: Flechas o WASD para moverte
            </>
          )}
        </p>
        <p>💡 Los jugadores se marcan como inactivos después de 1 minuto sin movimiento</p>
        <p className="debug-info">🔴 Debug: {Object.keys(players).length} jugadores en estado</p>
      </div>
    </div>
  );
};

export default MultiplayerLobbyView;