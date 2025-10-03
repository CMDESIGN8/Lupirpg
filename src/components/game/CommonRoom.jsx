// src/components/game/CommonRoom.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseClient } from '../../services/supabase'; // Asegúrate que la ruta a tu cliente supabase sea correcta
import LoadingScreen from '../UI/LoadingScreen';
import '../styles/CommonRoom.css';

const CommonRoom = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [players, setPlayers] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Usamos useRef para la posición y el canal para evitar re-creaciones innecesarias
  const playerPositionRef = useRef({ x: 0, y: 0, direction: 'down' });
  const channelRef = useRef(null);

  // Efecto para inicializar y limpiar la sala
  useEffect(() => {
    const initialize = async () => {
      // 1. Obtener datos del usuario logueado
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        navigate('/login'); // Si no hay sesión, redirigir al login
        return;
      }

      const { data: playerData, error: playerError } = await supabaseClient
        .from('players')
        .select('*, player_avatars(avatars(image_url))')
        .eq('id', session.user.id)
        .eq('player_avatars.is_equipped', true)
        .single();
        
      if (playerError || !playerData) {
        console.error("Error fetching player:", playerError);
        navigate('/dashboard'); // Si hay un error, volver al dash
        return;
      }
      
      const userProfile = {
          id: playerData.id,
          username: playerData.username,
          avatar_url: playerData.player_avatars[0]?.avatars?.image_url || '/default-avatar.png'
      };
      
      setCurrentUser(userProfile);
      setLoading(false);

      // --- CONFIGURACIÓN DE SUPABASE REALTIME ---
      // BUG FIX: Usamos un nombre de canal constante para todos
      const roomChannel = supabaseClient.channel('sala-comun-principal');
      channelRef.current = roomChannel;

      roomChannel
        .on('presence', { event: 'sync' }, () => {
          const presenceState = roomChannel.presenceState();
          const formattedPlayers = {};
          for (const id in presenceState) {
            formattedPlayers[id] = presenceState[id][0];
          }
          setPlayers(formattedPlayers);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          setPlayers(prev => ({ ...prev, [key]: newPresences[0] }));
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          setPlayers(prev => {
            const newPlayers = { ...prev };
            delete newPlayers[key];
            return newPlayers;
          });
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'room_users' }, (payload) => {
            setPlayers(prev => {
                if(prev[payload.new.user_id]) {
                    return {
                        ...prev,
                        [payload.new.user_id]: {
                            ...prev[payload.new.user_id],
                            x: payload.new.x,
                            y: payload.new.y,
                            direction: payload.new.direction,
                        }
                    };
                }
                return prev;
            });
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            const initialPos = { 
                x: Math.floor(Math.random() * 20), 
                y: Math.floor(Math.random() * 15),
                direction: 'down'
            };
            playerPositionRef.current = initialPos;
            
            const presenceTrackStatus = {
              ...userProfile,
              ...initialPos,
            };

            await roomChannel.track(presenceTrackStatus);
            await supabaseClient.from('room_users').upsert({ user_id: userProfile.id, ...presenceTrackStatus }, { onConflict: 'user_id' });
          }
        });
    };

    initialize();

    // Función de limpieza al salir de la página
    return () => {
      const channel = channelRef.current;
      if (channel) {
        supabaseClient.removeChannel(channel);
        if (currentUser) {
            supabaseClient.from('room_users').delete().eq('user_id', currentUser.id).then();
        }
      }
    };
  }, []); // El array vacío asegura que esto solo se ejecute una vez

  // Efecto para el movimiento del jugador
  useEffect(() => {
    if (!currentUser) return;

    const handleKeyDown = (e) => {
      let { x, y, direction } = playerPositionRef.current;

      switch (e.key) {
        case 'ArrowUp':    y = Math.max(0, y - 1); direction = 'up'; break;
        case 'ArrowDown':  y = Math.min(17, y + 1); direction = 'down'; break;
        case 'ArrowLeft':  x = Math.max(0, x - 1); direction = 'left'; break;
        case 'ArrowRight': x = Math.min(24, x + 1); direction = 'right'; break;
        default: return;
      }

      playerPositionRef.current = { x, y, direction };

      // Actualización a Supabase (sin await para no bloquear la UI)
      supabaseClient.from('room_users')
        .update({ x, y, direction })
        .eq('user_id', currentUser.id)
        .then();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser]); // Se activa una vez que tenemos los datos del usuario

  if (loading) return <LoadingScreen message="Entrando a la Sala Común..." />;

  return (
    <div className="common-room-page">
      <div className="map-container">
        {Object.values(players).map((player) => (
          <div
            key={player.id}
            className="player"
            style={{
              left: `${player.x * 32}px`,
              top: `${player.y * 32}px`,
            }}
          >
            <img src={player.avatar_url} alt={player.username} className={`player-sprite direction-${player.direction}`} />
            <span className="player-name">{player.username}</span>
          </div>
        ))}
      </div>
      <button className="back-button" onClick={() => navigate('/dashboard')}>
        Volver al Dashboard
      </button>
    </div>
  );
};

export default CommonRoom;