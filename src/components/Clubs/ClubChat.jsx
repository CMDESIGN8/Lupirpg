// components/Club/ClubChat.jsx
import { useState, useEffect } from 'react';

const ClubChat = ({ playerData, supabaseClient, session }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('chat');

  // Cargar mensajes y suscribirse a nuevos
  useEffect(() => {
    if (!playerData?.clubs?.id) return;
    
    loadMessages();
    
    const subscription = supabaseClient
      .channel('club_chat')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'club_messages',
          filter: `club_id=eq.${playerData.clubs.id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
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

  if (!playerData?.clubs) {
    return (
      <div className="player-card">
        <p>No perteneces a ningún club. Únete a uno para acceder al chat.</p>
      </div>
    );
  }

  return (
    <div className="club-chat-container">
      <div className="chat-header">
        <h3>Chat del Club</h3>
        <div className="chat-tabs">
          <button 
            className={activeTab === 'chat' ? 'tab-active' : ''}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button 
            className={activeTab === 'info' ? 'tab-active' : ''}
            onClick={() => setActiveTab('info')}
          >
            Información
          </button>
        </div>
      </div>
      
      {activeTab === 'chat' ? (
        <div className="chat-content">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="no-messages">
                <p>¡Sé el primero en enviar un mensaje!</p>
                <p>Coordina estrategias con tus compañeros de club.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.player_id === session.user.id ? 'own-message' : ''}`}>
                  <div className="message-header">
                    <span className="message-sender">{msg.players?.username || 'Usuario'}</span>
                    <span className="message-time">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="message-content">{msg.message}</div>
                </div>
              ))
            )}
          </div>
          
          <form onSubmit={sendMessage} className="message-form">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje a tu club..."
              className="message-input"
              maxLength={200}
            />
            <button 
              type="submit" 
              className="send-button"
              disabled={!newMessage.trim()}
            >
              Enviar
            </button>
          </form>
        </div>
      ) : (
        <div className="club-info">
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
          
          <div className="members-section">
            <h4 className="members-title">
              Miembros: <span className="members-count">
                {playerData.club_stats?.member_count || 0}
              </span>
              {playerData.club_stats?.online_count > 0 && (
                <span className="online-count">
                  ({playerData.club_stats.online_count} en línea)
                </span>
              )}
            </h4>
            
            <ul className="members-list">
              {playerData.club_members?.slice(0, 8).map(member => (
                <li key={member.username}>
                  <span className={`member-status ${member.online_status ? 'status-online' : 'status-offline'}`}>
                    ●
                  </span> 
                  <span className="member-name">
                    {member.username} {member.username === playerData.username ? '(Tú)' : ''}
                  </span>
                  <span className="member-level">
                    Nvl {member.level}
                  </span>
                </li>
              ))}
              {playerData.club_stats?.member_count > 8 && (
                <li className="more-members">
                  +{playerData.club_stats.member_count - 8} miembros más...
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubChat;