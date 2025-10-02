import React, { useState, useEffect, useRef } from "react";
import "../styles/CommonRoom.css";

// Spritesheet: 32x48 px, 4 direcciones (abajo, izquierda, derecha, arriba), 3 frames cada una
import playerSprite from "../assets/player.png";
import mapBackground from "../assets/map.png";

const CommonRoom = () => {
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState({}); // Usamos un objeto para fácil acceso por ID
  const playerRef = useRef(null); // Referencia al jugador actual para movimiento

  // Efecto para unirse y salir de la sala
  useEffect(() => {
    let channel;

    const setupRoom = async () => {
      // 1. Obtener datos del usuario actual
      const { data: { user: currentUser } } = await supabaseClient.auth.getUser();
      if (!currentUser) return;

      // Hacemos un join para obtener datos de la tabla 'players'
      const { data: playerData, error: playerError } = await supabaseClient
        .from('players')
        .select(`
          username,
          player_avatars(
            avatars(image_url)
          )
        `)
        .eq('id', currentUser.id)
        .eq('player_avatars.is_equipped', true) // Solo el avatar equipado
        .single();
      
      if (playerError) {
          console.error("Error fetching player data:", playerError);
          return;
      }
      
      const avatarUrl = playerData.player_avatars[0]?.avatars?.image_url || 'default_avatar.png';
      setUser({ ...currentUser, username: playerData.username, avatar_url: avatarUrl });

      // 2. Crear un canal de Supabase Realtime con Presence
      channel = supabaseClient.channel('sala-comun', {
        config: {
          presence: {
            key: currentUser.id, // Identificador único del usuario
          },
        },
      });

      // 3. Escuchar cambios de presencia (join, leave)
      channel.on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        setPlayers(newState);
      });

      // 4. Escuchar cambios en la base de datos (movimiento)
      channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'room_users' },
        (payload) => {
          setPlayers((prevPlayers) => ({
            ...prevPlayers,
            [payload.new.user_id]: [{
              ...prevPlayers[payload.new.user_id][0], // Mantener datos de presence
              x: payload.new.x,
              y: payload.new.y,
              direction: payload.new.direction,
            }]
          }));
        }
      );
      
      // 5. Unirse al canal y notificar presencia
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const initialX = Math.floor(Math.random() * 10); // Posición inicial aleatoria
          const initialY = Math.floor(Math.random() * 10);

          // Insertar o actualizar al usuario en room_users
          await supabaseClient.from('room_users').upsert({
            user_id: currentUser.id,
            name: playerData.username,
            avatar_url: avatarUrl,
            x: initialX,
            y: initialY,
            direction: 'down',
          }, { onConflict: 'user_id' });
          
          await channel.track({
            user_id: currentUser.id,
            username: playerData.username,
            avatar_url: avatarUrl,
            x: initialX,
            y: initialY,
          });
        }
      });
    };

    setupRoom();

    // 6. Limpieza al desmontar el componente (salir de la sala)
    return () => {
      if (channel) {
        supabaseClient.from('room_users').delete().eq('user_id', user?.id);
        supabaseClient.removeChannel(channel);
      }
    };
  }, []);

  // Efecto para manejar el movimiento del jugador
  useEffect(() => {
    if (!user) return; // Solo si el usuario está cargado

    const handleKeyDown = (e) => {
      if (!playerRef.current) return;
      
      let { x, y } = playerRef.current;
      let direction = 'down';

      switch (e.key) {
        case 'ArrowUp': y -= 1; direction = 'up'; break;
        case 'ArrowDown': y += 1; direction = 'down'; break;
        case 'ArrowLeft': x -= 1; direction = 'left'; break;
        case 'ArrowRight': x += 1; direction = 'right'; break;
        default: return;
      }
      
      // Actualizar la posición en la base de datos
      const updatePosition = async () => {
         await supabaseClient
          .from('room_users')
          .update({ x, y, direction })
          .eq('user_id', user.id);
      };
      
      // Actualizamos el estado local inmediatamente para una respuesta fluida
      playerRef.current = { x, y };
      setPlayers(prev => ({
        ...prev,
        [user.id]: [{ ...prev[user.id][0], x, y, direction }]
      }));

      updatePosition(); // Y luego notificamos a Supabase
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user]);
  
  // Asignar la posición inicial a la referencia del jugador
  useEffect(() => {
    if (user && players[user.id]) {
      playerRef.current = { x: players[user.id][0].x, y: players[user.id][0].y };
    }
  }, [user, players]);

  return (
    <div className="map-container">
      {Object.entries(players).map(([userId, presenceInfos]) => {
        const player = presenceInfos[0]; // Presence puede tener múltiples infos, tomamos la primera
        if (!player) return null;

        return (
          <div
            key={userId}
            className="player"
            style={{
              left: `${player.x * 32}px`, // Asumiendo un grid de 32x32px
              top: `${player.y * 32}px`,
            }}
          >
            <img src={player.avatar_url} alt={player.username} />
            <span className="player-name">{player.username}</span>
          </div>
        );
      })}
    </div>
  );
};

export default CommonRoom;