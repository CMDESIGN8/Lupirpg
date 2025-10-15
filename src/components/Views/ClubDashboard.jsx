import React, { useState, useEffect } from "react";
import "../styles/ClubDashboard.css";

const ClubDashboard = ({ currentUser, supabaseClient }) => {
  const [activeTab, setActiveTab] = useState("feed");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [missions, setMissions] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [newPost, setNewPost] = useState("");

  // 🔥 Obtener usuarios online
  useEffect(() => {
    const channel = supabaseClient.channel("lupi_dashboard_presence", {
      config: { presence: { key: currentUser.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const allUsers = Object.values(state).map((u) => u[0]);
        setOnlineUsers(allUsers);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            id: currentUser.id,
            name: currentUser.username || "Usuario",
            online: true
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [supabaseClient, currentUser]);

  // 📝 Cargar misiones activas (usando tu tabla existente)
  useEffect(() => {
    const loadMissions = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('club_missions')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error loading missions:', error);
          // Si hay error, usar datos de ejemplo
          setMissions(getSampleMissions());
        } else {
          setMissions(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
        setMissions(getSampleMissions());
      }
    };
    
    loadMissions();
  }, [supabaseClient]);

  // 📰 Cargar feed del club (usando tabla existente o mensajes como fallback)
  useEffect(() => {
    const loadFeed = async () => {
      try {
        // Intentar cargar de club_feed, si no existe usar room_messages
        const { data, error } = await supabaseClient
          .from('club_feed')
          .select(`
            *,
            user:user_id (username, avatar_url)
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.log('club_feed not found, using room_messages');
          // Fallback a room_messages
          const { data: messagesData } = await supabaseClient
            .from('room_messages')
            .select(`
              *,
              user:user_id (username)
            `)
            .order('created_at', { ascending: false })
            .limit(15);
          
          setFeedPosts(messagesData?.map(msg => ({
            id: msg.id,
            content: msg.content,
            user: { username: msg.user?.username || 'Usuario' },
            created_at: msg.created_at,
            type: 'message'
          })) || []);
        } else {
          setFeedPosts(data || []);
        }
      } catch (error) {
        console.error('Error loading feed:', error);
        setFeedPosts([]);
      }
    };
    
    loadFeed();
  }, [supabaseClient]);

  // Función para crear misiones de ejemplo
  const getSampleMissions = () => [
    {
      id: 1,
      title: "Primer Partido del Mes",
      description: "Completa tu primer partido este mes",
      reward: "100 EXP + 50 Monedas",
      target_progress: 1,
      current_progress: 0,
      active: true
    },
    {
      id: 2,
      title: "Invita 3 Amigos",
      description: "Invita a 3 amigos a unirse al club",
      reward: "300 EXP + 150 Monedas",
      target_progress: 3,
      current_progress: 1,
      active: true
    },
    {
      id: 3,
      title: "Participa en 5 Eventos",
      description: "Únete a 5 eventos del club",
      reward: "500 EXP + 250 Monedas",
      target_progress: 5,
      current_progress: 2,
      active: true
    }
  ];

  // ✨ Crear nueva publicación
  const createNewPost = async () => {
    if (!newPost.trim()) return;

    try {
      // Intentar insertar en club_feed
      const { error } = await supabaseClient
        .from('club_feed')
        .insert({
          user_id: currentUser.id,
          content: newPost.trim()
        });

      if (error) {
        // Si falla, usar room_messages como fallback
        await supabaseClient
          .from('room_messages')
          .insert({
            user_id: currentUser.id,
            content: newPost.trim()
          });
      }

      setNewPost("");
      // Recargar feed
      window.location.reload();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <div className="club-dashboard">
      {/* Header del Dashboard */}
      <div className="dashboard-header">
        <h1>🏆 Club Dashboard - {currentUser.username}</h1>
        <div className="user-stats">
          <span>Nivel: 15</span>
          <span>EXP: 1200/2000</span>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* Sidebar izquierda - Navegación */}
        <div className="sidebar">
          <div className="nav-tabs">
            <button 
              className={`tab ${activeTab === "feed" ? "active" : ""}`}
              onClick={() => setActiveTab("feed")}
            >
              📰 Feed del Club
            </button>
            <button 
              className={`tab ${activeTab === "missions" ? "active" : ""}`}
              onClick={() => setActiveTab("missions")}
            >
              🎯 Misiones Activas
            </button>
            <button 
              className={`tab ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}
            >
              💬 Chat General
            </button>
            <button 
              className={`tab ${activeTab === "members" ? "active" : ""}`}
              onClick={() => setActiveTab("members")}
            >
              👥 Miembros Online
            </button>
          </div>

          {/* Usuarios Online */}
          <div className="online-users-section">
            <h3>👥 Usuarios Online ({onlineUsers.length})</h3>
            <div className="online-users-list">
              {onlineUsers.map(user => (
                <div key={user.id} className="online-user">
                  <div className="user-status"></div>
                  <span>{user.name}</span>
                  {user.id === currentUser.id && <span> (Tú)</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Estadísticas Rápidas */}
          <div className="quick-stats">
            <h3>📊 Estadísticas</h3>
            <div className="stat-item">
              <span>Miembros Online:</span>
              <span>{onlineUsers.length}</span>
            </div>
            <div className="stat-item">
              <span>Misiones Activas:</span>
              <span>{missions.length}</span>
            </div>
            <div className="stat-item">
              <span>Publicaciones Hoy:</span>
              <span>{feedPosts.filter(post => 
                new Date(post.created_at).toDateString() === new Date().toDateString()
              ).length}</span>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="main-content">
          {/* Feed del Club */}
          {activeTab === "feed" && (
            <div className="tab-content">
              <div className="feed-header">
                <h2>📰 Feed del Club</h2>
                <div className="post-creator">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="¿Qué está pasando en el club?"
                    rows="3"
                  />
                  <button 
                    className="btn-primary" 
                    onClick={createNewPost}
                    disabled={!newPost.trim()}
                  >
                    Publicar
                  </button>
                </div>
              </div>
              
              <div className="feed-posts">
                {feedPosts.length > 0 ? (
                  feedPosts.map(post => (
                    <div key={post.id} className="feed-post">
                      <div className="post-header">
                        <span className="post-author">
                          {post.user?.username || 'Usuario'}
                          {post.type === 'message' && ' 💬'}
                        </span>
                        <span className="post-time">
                          {new Date(post.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="post-content">{post.content}</p>
                      {post.image_url && (
                        <img src={post.image_url} alt="Post" className="post-image" />
                      )}
                      <div className="post-actions">
                        <button>👍 Me gusta</button>
                        <button>💬 Comentar</button>
                        <button>🔄 Compartir</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No hay publicaciones aún. ¡Sé el primero en publicar!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Misiones Activas */}
          {activeTab === "missions" && (
            <div className="tab-content">
              <h2>🎯 Misiones Activas</h2>
              <div className="missions-grid">
                {missions.map(mission => (
                  <div key={mission.id} className="mission-card">
                    <h3>{mission.title}</h3>
                    <p>{mission.description}</p>
                    <div className="mission-reward">🏆 Recompensa: {mission.reward}</div>
                    <div className="mission-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{
                            width: `${Math.min(
                              (mission.current_progress / mission.target_progress) * 100, 
                              100
                            )}%`
                          }}
                        ></div>
                      </div>
                      <span>{mission.current_progress}/{mission.target_progress}</span>
                    </div>
                    <button className="btn-primary">Participar</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat General */}
          {activeTab === "chat" && (
            <div className="tab-content">
              <h2>💬 Chat General</h2>
              <div className="simple-chat-container">
                <div className="chat-messages">
                  {feedPosts.filter(post => post.type === 'message').slice(0, 10).map(post => (
                    <div key={post.id} className="chat-message">
                      <strong>{post.user?.username}:</strong> {post.content}
                    </div>
                  ))}
                </div>
                <div className="chat-input">
                  <input 
                    type="text" 
                    placeholder="Escribe un mensaje..." 
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createNewPost()}
                  />
                  <button onClick={createNewPost}>Enviar</button>
                </div>
              </div>
            </div>
          )}

          {/* Miembros Online */}
          {activeTab === "members" && (
            <div className="tab-content">
              <h2>👥 Miembros Online</h2>
              <div className="members-grid">
                {onlineUsers.map(user => (
                  <div key={user.id} className="member-card">
                    <div className="member-avatar">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-info">
                      <h4>{user.name} {user.id === currentUser.id && '(Tú)'}</h4>
                      <p>Nivel 15</p>
                      <p>Última conexión: Ahora</p>
                    </div>
                    <button className="btn-secondary">Enviar Mensaje</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubDashboard;