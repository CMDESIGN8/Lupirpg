// components/Club/ClubChat.jsx
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const ClubChat = ({ playerData, supabaseClient, session }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');

  // Cargar mensajes y suscribirse a nuevos
  useEffect(() => {
    if (!playerData?.clubs?.id) return;
    
    loadMessages();
    updateOnlineMembers();
    
    const subscription = supabaseClient
      .channel('club_chat')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'club_messages' },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    // Suscribirse a cambios de estado en línea
    const onlineSubscription = supabaseClient
      .channel('online_members')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'players' },
        (payload) => {
          if (payload.new.club_id === playerData.clubs.id || 
              payload.old?.club_id === playerData.clubs.id) {
            updateOnlineMembers();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      onlineSubscription.unsubscribe();
    };
  }, [playerData?.clubs?.id]);

  const loadMessages = async () => {
    if (!playerData?.clubs?.id) return;
    
    const { data, error } = await supabaseClient
      .from('club_messages')
      .select('*, players(username)')
      .eq('club_id', playerData.clubs.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (!error) setMessages(data || []);
  };

  const updateOnlineMembers = async () => {
    if (!playerData?.clubs?.id) return;
    
    const { data, error } = await supabaseClient
      .from('players')
      .select('username, online_status')
      .eq('club_id', playerData.clubs.id)
      .eq('online_status', true);

    if (!error) setOnlineMembers(data.map(m => m.username));
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !playerData?.clubs?.id) return;

    const { error } = await supabaseClient
      .from('club_messages')
      .insert({
        club_id: playerData.clubs.id,
        player_id: session.user.id,
        message: newMessage.trim(),
        created_at: new Date().toISOString()
      });

    if (!error) setNewMessage('');
  };

  // Actualizar estado en línea del usuario
  useEffect(() => {
    if (!session?.user?.id || !playerData?.clubs?.id) return;

    const updateOnlineStatus = async () => {
      await supabaseClient
        .from('players')
        .update({ 
          online_status: true, 
          last_online: new Date().toISOString() 
        })
        .eq('id', session.user.id);
    };

    updateOnlineStatus();

    // Actualizar estado como offline al salir
    const handleBeforeUnload = () => {
      supabaseClient
        .from('players')
        .update({ 
          online_status: false, 
          last_online: new Date().toISOString() 
        })
        .eq('id', session.user.id);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [session?.user?.id, playerData?.clubs?.id]);

  if (!playerData?.clubs) {
    return (
      <div className="player-card">
        <p>No perteneces a ningún club. Únete a uno para acceder al chat.</p>
      </div>
    );
  }

  return (
    <div className="player-card">
      <div className="club-header">
        <div className="club-logo">
          {playerData.clubs.name ? playerData.clubs.name.substring(0, 2).toUpperCase() : 'LF'}
        </div>
        <div>
          <h3 className="club-name-main">{playerData.clubs.name}</h3>
          <p className="club-level-text">
            Nivel de Club: <span className="club-level-value">
              {playerData.club_stats?.average_level || 1}
            </span>
          </p>
        </div>
      </div>
      
      <div className="chat-tabs">
        <button 
          className={activeTab === 'chat' ? 'tab-active' : ''}
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </button>
        <button 
          className={activeTab === 'members' ? 'tab-active' : ''}
          onClick={() => setActiveTab('members')}
        >
          Miembros
        </button>
      </div>
      
      {activeTab === 'chat' ? (
        <div className="chat-container">
          <div className="messages-container">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.player_id === session.user.id ? 'own-message' : ''}`}>
                <div className="message-header">
                  <span className="message-sender">{msg.players?.username || 'Usuario'}</span>
                  <span className="message-time">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-content">{msg.message}</div>
              </div>
            ))}
          </div>
          
          <form onSubmit={sendMessage} className="message-form">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="message-input"
            />
            <button type="submit" className="send-button">Enviar</button>
          </form>
        </div>
      ) : (
        <div className="members-section">
          <h4 className="members-title">
            Miembros: <span className="members-count">
              {playerData.club_stats?.member_count || 0}
            </span>
            {playerData.club_stats?.online_count > 0 && (
              <span style={{ color: '#00ff88', marginLeft: '10px', fontSize: '0.9rem' }}>
                ({playerData.club_stats.online_count} en línea)
              </span>
            )}
          </h4>
          
          <ul className="members-list">
            {playerData.club_members?.slice(0, 10).map(member => (
              <li key={member.username}>
                <span className={`member-status ${member.online_status ? 'status-online' : 'status-offline'}`}>
                  ●
                </span> 
                {member.username} {member.username === playerData.username ? '(Tú)' : ''}
                <span style={{ marginLeft: 'auto', color: '#00ffcc', fontSize: '0.9rem' }}>
                  Nvl {member.level}
                </span>
              </li>
            ))}
            {playerData.club_stats?.member_count > 10 && (
              <li style={{ color: '#88ddff', fontStyle: 'italic' }}>
                +{playerData.club_stats.member_count - 10} miembros más...
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ClubChat;