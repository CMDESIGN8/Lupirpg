// src/components/game/CommonRoom.jsx

import React, { useState, useEffect, useRef } from 'react';
// NO necesitas useNavigate
// import { useNavigate } from 'react-router-dom';
import { supabaseClient } from '../../services/supabase';
import LoadingScreen from '../UI/LoadingScreen';
import '../styles/CommonRoom.css';

// Recibimos setView como prop
const CommonRoom = ({ setView }) => { 
  const [currentUser, setCurrentUser] = useState(null);
  const [players, setPlayers] = useState({});
  const [loading, setLoading] = useState(true);
  
  const playerPositionRef = useRef({ x: 0, y: 0, direction: 'down' });
  const channelRef = useRef(null);

  useEffect(() => {
    // ... toda la lógica de 'initialize' que te pasé en la respuesta anterior es la misma
    const initialize = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        setView('login'); // O como manejes la sesión expirada
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
        setView('dashboard');
        return;
      }
      
      const userProfile = {
          id: playerData.id,
          username: playerData.username,
          avatar_url: playerData.player_avatars[0]?.avatars?.image_url || '/default-avatar.png'
      };
      
      setCurrentUser(userProfile);
      setLoading(false);

      const roomChannel = supabaseClient.channel('sala-comun-principal');
      channelRef.current = roomChannel;

      // ... toda la lógica de suscripción al canal .on() se mantiene igual
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

    return () => {
      const channel = channelRef.current;
      if (channel) {
        supabaseClient.removeChannel(channel).then(() => {
             if (currentUser) {
                supabaseClient.from('room_users').delete().eq('user_id', currentUser.id).then();
             }
        });
      }
    };
  }, []);

  // El useEffect del movimiento se mantiene exactamente igual...

  if (loading) return <LoadingScreen message="Entrando a la Sala Común..." />;

  return (
    <div className="common-room-page">
      <div className="map-container">
        {Object.values(players).map((player) => (
          <div
            key={player.id}
            className="player"
            style={{ left: `${player.x * 32}px`, top: `${player.y * 32}px` }}
          >
            <img src={player.avatar_url} alt={player.username} className={`player-sprite direction-${player.direction}`} />
            <span className="player-name">{player.username}</span>
          </div>
        ))}
      </div>
      {/* Botón para volver al dashboard usando setView */}
      <button className="back-button" onClick={() => setView('dashboard')}>
        Volver al Dashboard
      </button>
    </div>
  );
};

export default CommonRoom;