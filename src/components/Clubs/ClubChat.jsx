// components/Club/ClubChat.jsx
import { useState, useEffect } from 'react';
import '../styles/ClubChat.css'   // 👈 acá importás tu CSS

const ClubChat = ({ playerData, supabaseClient, session }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [clubMembers, setClubMembers] = useState([]);

  // Cargar mensajes, miembros y suscribirse a cambios
  useEffect(() => {
    if (!playerData?.clubs?.id) return;
    
    loadMessages();
    loadClubMembers();
    
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

    // Suscribirse a cambios de estado en línea
    const onlineSubscription = supabaseClient
      .channel('online_members')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'players' },
        (payload) => {
          if (payload.new?.club_id === playerData.clubs.id) {
            loadClubMembers(); // Recargar miembros cuando cambie el estado
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      onlineSubscription.unsubscribe();
    };
  }, [playerData?.clubs?.id]);

  // Cargar miembros del club con su estado en línea
  const loadClubMembers = async () => {
    if (!playerData?.clubs?.id) return;
    
    const { data, error } = await supabaseClient
      .from('players')
      .select('username, level, online_status')
      .eq('club_id', playerData.clubs.id)
      .order('online_status', { ascending: false }) // Primero los en línea
      .order('level', { ascending: false });

    if (!error) {
      setClubMembers(data || []);
      
      // Actualizar también onlineMembers para el contador
      const online = data.filter(member => member.online_status);
      setOnlineMembers(online.map(m => m.username));
    }
  };

  // Ordenar miembros: primero los en línea
  const sortedMembers = clubMembers.length > 0 
    ? [...clubMembers].sort((a, b) => {
        if (a.online_status && !b.online_status) return -1;
        if (!a.online_status && b.online_status) return 1;
        return b.level - a.level; // Luego por nivel descendente
      })
    : playerData.club_members || [];

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

  // Actualizar estado en línea del usuario actual
  useEffect(() => {
    if (!session?.user?.id) return;

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
  }, [session?.user?.id]);

  if (!playerData?.clubs) {
    return (
      <div className="player-card">
        <p>No perteneces a ningún club. Únete a uno para acceder al chat.</p>
      </div>
    );
  }

  // Calcular estadísticas actualizadas
  const onlineCount = clubMembers.filter(member => member.online_status).length;
  const memberCount = clubMembers.length || playerData.club_stats?.member_count || 0;
  const averageLevel = clubMembers.length > 0 
    ? Math.round(clubMembers.reduce((sum, m) => sum + m.level, 0) / clubMembers.length)
    : playerData.club_stats?.average_level || 1;

  return (
    <div className="player-card">
      <div className="chat-header">
        <h3>Chat del Club</h3>
        <div className="chat-tabs">
          <button 
            className={activeTab === 'info' ? 'tab-active' : ''}
            onClick={() => setActiveTab('info')}
          >
            Información
          </button>
          <button 
            className={activeTab === 'chat' ? 'tab-active' : ''}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
        </div>
      </div>
      
      {activeTab === 'info' ? (
        <div className="club-info">
          <div className="club-header">
            <div className="club-logo">
              {playerData.clubs.name ? playerData.clubs.name.substring(0, 2).toUpperCase() : 'LF'}
            </div>
            <div>
              <h3 className="club-name-main">{playerData.clubs.name}</h3>
              <p className="club-level-text">
                Nivel de Club: <span className="club-level-value">
                  {averageLevel}
                </span>
              </p>
            </div>
          </div>
          
          <div className="members-section">
            <h4 className="members-title">
              Miembros: <span className="members-count">
                {memberCount}
              </span>
              {onlineCount > 0 && (
                <span className="online-count">
                  ({onlineCount} en línea)
                </span>
              )}
            </h4>
            
            <ul className="members-list">
              {sortedMembers.slice(0, 8).map(member => (
                <li key={member.username} className={member.online_status ? 'member-online' : ''}>
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
              {memberCount > 8 && (
                <li className="more-members">
                  +{memberCount - 8} miembros más...
                </li>
              )}
            </ul>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default ClubChat;