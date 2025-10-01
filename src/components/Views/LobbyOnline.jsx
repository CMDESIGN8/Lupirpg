// LobbyOnline.jsx
import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../../services/supabase'; 
import Lobby3D from './Lobby3D';
import LobbyDashboard from './LobbyDashboard';
import './LobbyOnline.css';

export default function LobbyOnline({ isOpen, onClose, user }) {
  const [activePlayers, setActivePlayers] = useState([]);
  const [clubFeed, setClubFeed] = useState([]);
  const [onlineMembers, setOnlineMembers] = useState(0);
  const [clubStats, setClubStats] = useState({});
  const [roomMessages, setRoomMessages] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadLobbyData();
      setupRealtimeSubscriptions();
    }
  }, [isOpen]);

  const loadLobbyData = async () => {
    await Promise.all([
      loadActivePlayers(),
      loadClubFeed(),
      loadClubStats(),
      loadRoomMessages()
    ]);
  };

  const loadActivePlayers = async () => {
    const { data, error } = await supabase
      .from('room_users')
      .select('*')
      .eq('is_online', true)
      .order('joined_at', { ascending: true });
    
    if (data) setActivePlayers(data);
  };

  const loadClubFeed = async () => {
    const { data, error } = await supabase
      .from('club_feed')
      .select(`
        *,
        user:user_id (
          username
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) setClubFeed(data);
  };

  const loadClubStats = async () => {
    // Estadísticas del club
    const { count: onlineCount } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('online_status', true);

    const { data: nextMatches } = await supabase
      .from('club_missions')
      .select('*')
      .eq('is_active', true)
      .gt('end_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(3);

    setOnlineMembers(onlineCount || 0);
    setClubStats({
      onlineMembers: onlineCount || 0,
      nextMatches: nextMatches || [],
      totalMembers: 50 // Esto debería venir de una query real
    });
  };

  const loadRoomMessages = async () => {
    const { data, error } = await supabase
      .from('room_messages')
      .select(`
        *,
        user:user_id (
          username
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (data) setRoomMessages(data.reverse());
  };

  const setupRealtimeSubscriptions = () => {
    // Suscripción a jugadores en sala
    const roomPlayersSubscription = supabase
      .channel('room_players')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'room_users' },
        (payload) => {
          loadActivePlayers();
        }
      )
      .subscribe();

    // Suscripción a mensajes de sala
    const messagesSubscription = supabase
      .channel('room_messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_messages' },
        (payload) => {
          setRoomMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      roomPlayersSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
    };
  };

  const sendMessage = async (content) => {
    if (!user || !content.trim()) return;

    const { error } = await supabase
      .from('room_messages')
      .insert({
        user_id: user.id,
        content: content.trim()
      });

    if (error) console.error('Error sending message:', error);
  };

  const createFeedPost = async (content, imageUrl = null) => {
    if (!user || !content.trim()) return;

    const { error } = await supabase
      .from('club_feed')
      .insert({
        user_id: user.id,
        content: content.trim(),
        image_url: imageUrl
      });

    if (error) console.error('Error creating feed post:', error);
  };

  if (!isOpen) return null;

  return (
    <div className="lobby-online">
      <div className="lobby-container">
        {/* Header */}
        <div className="lobby-header">
          <div className="lobby-title">
            <h1>🏟️ LOBBY CLUB LUPI</h1>
            <div className="online-indicator">
              <span className="dot"></span>
              {onlineMembers} miembros online
            </div>
          </div>
          <button className="close-lobby-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Contenido principal dividido en 2 */}
        <div className="lobby-content">
          {/* Sección 3D - Sala de espera interactiva */}
          <div className="lobby-3d-section">
            <Lobby3D 
              players={activePlayers}
              currentUser={user}
              onPlayerInteract={(playerId) => {
                console.log('Interact with player:', playerId);
              }}
            />
          </div>

          {/* Dashboard lateral */}
          <div className="lobby-dashboard-section">
            <LobbyDashboard
              user={user}
              clubFeed={clubFeed}
              roomMessages={roomMessages}
              clubStats={clubStats}
              onSendMessage={sendMessage}
              onCreateFeedPost={createFeedPost}
              activePlayers={activePlayers}
            />
          </div>
        </div>
      </div>
    </div>
  );
}