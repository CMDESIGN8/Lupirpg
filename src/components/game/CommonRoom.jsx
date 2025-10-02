// src/components/game/CommonRoom.jsx
import React, { useState, useEffect, useRef } from 'react';
import '../styles/CommonRoom.css'; // Crearemos este archivo de estilos a continuación

const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  // Estado para manejar la lista de jugadores en la sala
  const [players, setPlayers] = useState({});
  // Ref para la posición del jugador actual, para evitar re-renders en cada movimiento
  const playerPositionRef = useRef({ x: 0, y: 0 });

  // ✨ Efecto principal para unirse, escuchar cambios y salir de la sala
  useEffect(() => {
    // Si no hay usuario, no hacemos nada.
    if (!currentUser) return;

    let channel;

    const setupRoom = async () => {
      // 1. Obtener el avatar equipado del usuario actual
      const { data: avatarData, error } = await supabaseClient
        .from('player_avatars')
        .select('avatars(image_url)')
        .eq('player_id', currentUser.id)
        .eq('is_equipped', true)
        .single();
      
      if (error) console.error("Error fetching equipped avatar:", error);
      const avatarUrl = avatarData?.avatars?.image_url || '/default-avatar.png';

      // 2. Crear un canal de Supabase Realtime con Presence
      channel = supabaseClient.channel(`sala-comun:${currentUser.id}`, {
        config: {
          presence: { key: currentUser.id },
        },
      });

      // 3. Escuchar cambios de presencia (quién entra y sale)
      channel.on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        setPlayers(presenceState);
      });
      
      // 4. Escuchar cambios en la base de datos (actualizaciones de posición)
      channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'room_users' },
        (payload) => {
          setPlayers((prev) => ({
            ...prev,
            [payload.new.user_id]: [{
              ...prev[payload.new.user_id]?.[0], // Mantiene datos de presence
              x: payload.new.x,
              y: payload.new.y,
              direction: payload.new.direction,
            }],
          }));
        }
      );

      // 5. Suscribirse al canal
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Posición inicial aleatoria
          const initialX = Math.floor(Math.random() * 20);
          const initialY = Math.floor(Math.random() * 15);
          playerPositionRef.current = { x: initialX, y: initialY };

          // Datos a compartir con los demás
          const presenceTrackStatus = {
            user_id: currentUser.id,
            username: currentUser.username,
            avatar_url: avatarUrl,
            x: initialX,
            y: initialY,
            direction: 'down',
          };

          // Actualizar la tabla y rastrear la presencia
          await supabaseClient.from('room_users').upsert({ user_id: currentUser.id, ...presenceTrackStatus }, { onConflict: 'user_id' });
          await channel.track(presenceTrackStatus);
        }
      });
    };

    setupRoom();

    // 6. Función de limpieza al desmontar (cuando el usuario cierra el modal)
    return () => {
      if (channel) {
        // Eliminar al usuario de la tabla y desuscribirse
        supabaseClient.from('room_users').delete().eq('user_id', currentUser.id).then();
        supabaseClient.removeChannel(channel);
      }
    };
  }, [currentUser, supabaseClient]); // Dependencias del efecto

  // ✨ Efecto para manejar el movimiento del jugador con el teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();

      let { x, y } = playerPositionRef.current;
      let direction = 'down';

      switch (e.key) {
        case 'ArrowUp':    y = Math.max(0, y - 1); direction = 'up'; break;
        case 'ArrowDown':  y = Math.min(17, y + 1); direction = 'down'; break; // Limites del mapa
        case 'ArrowLeft':  x = Math.max(0, x - 1); direction = 'left'; break;
        case 'ArrowRight': x = Math.min(24, x + 1); direction = 'right'; break;
      }
      
      // Actualiza la referencia local inmediatamente para fluidez
      playerPositionRef.current = { x, y };

      // Actualiza el estado global para que React renderice el cambio
      setPlayers(prev => ({
        ...prev,
        [currentUser.id]: [{ ...prev[currentUser.id]?.[0], x, y, direction }]
      }));
      
      // Envía la actualización a Supabase (sin 'await' para no bloquear)
      supabaseClient
        .from('room_users')
        .update({ x, y, direction })
        .eq('user_id', currentUser.id)
        .then();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser.id, supabaseClient]);

  return (
    <div className="common-room-overlay">
      <div className="map-container">
        <button className="close-button" onClick={onClose}>×</button>
        {Object.entries(players).map(([key, presenceInfos]) => {
          const player = presenceInfos[0];
          if (!player) return null;

          return (
            <div
              key={key}
              className="player"
              style={{
                left: `${player.x * 32}px`, // Grid de 32x32px
                top: `${player.y * 32}px`,
              }}
            >
              <img src={player.avatar_url} alt={player.username} />
              <span className="player-name">{player.username}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommonRoom;