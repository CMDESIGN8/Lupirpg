// LobbyDashboard.jsx
import React, { useState, useRef, useEffect } from 'react';
import '../styles/LobbyDashboard.css';

export default function LobbyDashboard({
  user,
  clubFeed,
  roomMessages,
  clubStats,
  onSendMessage,
  onCreateFeedPost,
  activePlayers
}) {
  const [activeTab, setActiveTab] = useState('chat');
  const [messageInput, setMessageInput] = useState('');
  const [postContent, setPostContent] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [roomMessages]);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput);
      setMessageInput('');
    }
  };

  const handleCreatePost = () => {
    if (postContent.trim()) {
      onCreateFeedPost(postContent);
      setPostContent('');
    }
  };

  const handleKeyPress = (e, type) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (type === 'message') handleSendMessage();
      if (type === 'post') handleCreatePost();
    }
  };

  return (
    <div className="lobby-dashboard">
      {/* Tabs del dashboard */}
      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'chat' ? 'active' : ''}
          onClick={() => setActiveTab('chat')}
        >
          💬 Chat
        </button>
        <button 
          className={activeTab === 'feed' ? 'active' : ''}
          onClick={() => setActiveTab('feed')}
        >
          📢 Feed
        </button>
        <button 
          className={activeTab === 'events' ? 'active' : ''}
          onClick={() => setActiveTab('events')}
        >
          🎯 Eventos
        </button>
        <button 
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          📊 Stats
        </button>
      </div>

      <div className="dashboard-content">
        {/* CHAT */}
        {activeTab === 'chat' && (
          <div className="chat-section">
            <div className="messages-container">
              {roomMessages.map((message) => (
                <div key={message.id} className="message">
                  <span className="user-name">{message.user?.username}:</span>
                  <span className="message-content">{message.content}</span>
                  <span className="message-time">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="message-input">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'message')}
                placeholder="Escribe un mensaje..."
              />
              <button onClick={handleSendMessage}>Enviar</button>
            </div>
          </div>
        )}

        {/* FEED DEL CLUB */}
        {activeTab === 'feed' && (
          <div className="feed-section">
            <div className="create-post">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'post')}
                placeholder="¿Qué está pasando en el club?"
                rows="3"
              />
              <button onClick={handleCreatePost}>Publicar</button>
            </div>
            <div className="feed-posts">
              {clubFeed.map((post) => (
                <div key={post.id} className="feed-post">
                  <div className="post-header">
                    <span className="post-author">{post.user?.username}</span>
                    <span className="post-time">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="post-content">{post.content}</div>
                  {post.image_url && (
                    <img src={post.image_url} alt="Post" className="post-image" />
                  )}
                  <div className="post-actions">
                    <button>❤️ {post.likes_count}</button>
                    <button>💬 {post.comments_count}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EVENTOS Y RIFAS */}
        {activeTab === 'events' && (
          <div className="events-section">
            <div className="event-card">
              <h3>🏆 Próximo Partido</h3>
              <p>Lupi FC vs Rival United</p>
              <span className="event-time">Hoy 20:00</span>
            </div>
            
            <div className="event-card">
              <h3>🎯 Rifa Semanal</h3>
              <p>Kit de entrenamiento premium</p>
              <span className="event-time">Termina en 2 días</span>
            </div>

            <div className="event-card">
              <h3>📅 Eventos del Club</h3>
              <ul className="events-list">
                <li>Entrenamiento grupal - Mañana 18:00</li>
                <li>Torneo interno - Sábado 10:00</li>
                <li>Sesión de estrategia - Domingo 16:00</li>
              </ul>
            </div>
          </div>
        )}

        {/* ESTADÍSTICAS */}
        {activeTab === 'stats' && (
          <div className="stats-section">
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Miembros Online</h4>
                <div className="stat-value">{clubStats.onlineMembers}</div>
              </div>
              <div className="stat-card">
                <h4>Total Miembros</h4>
                <div className="stat-value">{clubStats.totalMembers}</div>
              </div>
              <div className="stat-card">
                <h4>Partidos Hoy</h4>
                <div className="stat-value">3</div>
              </div>
              <div className="stat-card">
                <h4>Nivel Promedio</h4>
                <div className="stat-value">15</div>
              </div>
            </div>

            <div className="online-players">
              <h4>Jugadores en Lobby</h4>
              <div className="players-list">
                {activePlayers.map(player => (
                  <div key={player.id} className="online-player">
                    <span 
                      className="player-color" 
                      style={{ backgroundColor: player.color }}
                    ></span>
                    <span className="player-name">{player.name}</span>
                    <span className="player-sport">{getSportEmoji(player.sport)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getSportEmoji(sport) {
  const emojis = {
    'fútbol': '⚽',
    'baloncesto': '🏀', 
    'tenis': '🎾',
    'natación': '🏊',
    'atletismo': '🏃'
  };
  return emojis[sport] || '🏆';
}