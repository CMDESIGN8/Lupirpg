import React, { useState, useEffect, useRef } from 'react';
import '../styles/CommonRoom.css';

const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userNames, setUserNames] = useState({});
  const [selectedSport, setSelectedSport] = useState('fútbol');
  const canvasRef = useRef(null);

  const sports = [
    { id: 'fútbol', name: '⚽ Fútbol', color: '#2E8B57' },
    { id: 'baloncesto', name: '🏀 Baloncesto', color: '#FF6B35' },
    { id: 'tenis', name: '🎾 Tenis', color: '#00A8E8' },
    { id: 'voleibol', name: '🏐 Voleibol', color: '#F9A826' },
    { id: 'rugby', name: '🏉 Rugby', color: '#6A0572' },
    { id: 'béisbol', name: '⚾ Béisbol', color: '#8B4513' },
    { id: 'hockey', name: '🏒 Hockey', color: '#FF0000' },
    { id: 'atletismo', name: '🏃 Atletismo', color: '#4ECDC4' }
  ];

  // Dibujar el campo deportivo
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    drawSportField(ctx, selectedSport);
  }, [users, selectedSport]);

  // Efecto principal
  useEffect(() => {
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    const initializeRoom = async () => {
      setIsLoading(true);
      try {
        await loadUsers();
        await loadMessages();
        await joinRoom();

        const userSubscription = supabaseClient
          .channel('room_users_changes')
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'room_users' 
            }, 
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setUsers(prev => [...prev, payload.new]);
              } else if (payload.eventType === 'DELETE') {
                setUsers(prev => prev.filter(user => user.user_id !== payload.old.user_id));
              } else if (payload.eventType === 'UPDATE') {
                setUsers(prev => prev.map(user => 
                  user.user_id === payload.new.user_id ? payload.new : user
                ));
              }
            }
          )
          .subscribe();

        const messageSubscription = supabaseClient
          .channel('room_messages_changes')
          .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'room_messages' 
            }, 
            (payload) => {
              setMessages(prev => [...prev, payload.new]);
            }
          )
          .subscribe();

        // Limpiar usuarios inactivos cada 30 segundos
        const cleanupInterval = setInterval(cleanupInactiveUsers, 30000);

        return () => {
          userSubscription.unsubscribe();
          messageSubscription.unsubscribe();
          clearInterval(cleanupInterval);
          leaveRoom();
        };
      } catch (error) {
        console.error('Error initializing room:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeRoom();
  }, [currentUser, supabaseClient]);

  const cleanupInactiveUsers = async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { error } = await supabaseClient
        .from('room_users')
        .delete()
        .lt('last_activity', fiveMinutesAgo);

      if (error) {
        console.error('Error cleaning up users:', error);
      }
    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('room_users')
        .select('*')
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error loading users:', error);
        return;
      }
      
      if (data) {
        // Filtrar usuarios duplicados por user_id
        const uniqueUsers = data.reduce((acc, user) => {
          if (!acc.find(u => u.user_id === user.user_id)) {
            acc.push(user);
          }
          return acc;
        }, []);
        
        setUsers(uniqueUsers);
        
        const namesMap = {};
        uniqueUsers.forEach(user => {
          namesMap[user.user_id] = user.name;
        });
        setUserNames(namesMap);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('room_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }
      
      if (data) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const joinRoom = async () => {
    if (!currentUser?.id) return;

    try {
      const sport = sports[Math.floor(Math.random() * sports.length)];
      const x = Math.round(Math.random() * 600 + 100);
      const y = Math.round(Math.random() * 300 + 150);

      const userData = {
        user_id: currentUser.id,
        name: currentUser.username || 'Deportista',
        x: x,
        y: y,
        sport: sport.id,
        color: sport.color, // Añadir color explícitamente
        joined_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      };

      // Usar upsert para evitar conflictos
      const { error } = await supabaseClient
        .from('room_users')
        .upsert(userData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error joining room:', error);
        
        // Si falla, intentar con update primero
        await handleJoinFallback(userData);
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const handleJoinFallback = async (userData) => {
    try {
      // Primero intentar actualizar
      const { error: updateError } = await supabaseClient
        .from('room_users')
        .update(userData)
        .eq('user_id', currentUser.id);

      if (updateError) {
        // Si falla el update, intentar insert ignorando el conflicto
        const { error: insertError } = await supabaseClient
          .from('room_users')
          .insert(userData)
          .select()
          .maybeSingle();

        if (insertError && insertError.code !== '23505') { // Ignorar error de duplicado
          console.error('Fallback insert error:', insertError);
        }
      }
    } catch (error) {
      console.error('Error in fallback join:', error);
    }
  };

  const leaveRoom = async () => {
    if (!currentUser?.id) return;

    try {
      const { error } = await supabaseClient
        .from('room_users')
        .delete()
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error leaving room:', error);
      }
    } catch (error) {
      console.error('Error in leaveRoom:', error);
    }
  };

  const updateUserActivity = async () => {
    if (!currentUser?.id) return;

    try {
      const { error } = await supabaseClient
        .from('room_users')
        .update({ 
          last_activity: new Date().toISOString() 
        })
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error updating activity:', error);
      }
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  const drawSportField = (ctx, sport) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Fondo del campo
    const sportConfig = sports.find(s => s.id === sport) || sports[0];
    ctx.fillStyle = sportConfig.color;
    ctx.fillRect(0, 0, width, height);
    
    // Líneas del campo
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    
    if (sport === 'fútbol') {
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 50, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();
    }
    
    // Dibujar usuarios
    users.forEach(user => {
      drawAthlete(ctx, user);
    });
  };

  const drawAthlete = (ctx, user) => {
    const { x, y, sport, color } = user;
    const userSport = sports.find(s => s.id === (sport || 'fútbol')) || sports[0];
    const userColor = color || userSport.color;
    
    // Círculo del avatar
    ctx.fillStyle = userColor;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Icono del deporte
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    
    switch(sport || 'fútbol') {
      case 'fútbol': ctx.fillText('⚽', x, y); break;
      case 'baloncesto': ctx.fillText('🏀', x, y); break;
      case 'tenis': ctx.fillText('🎾', x, y); break;
      case 'voleibol': ctx.fillText('🏐', x, y); break;
      case 'rugby': ctx.fillText('🏉', x, y); break;
      case 'béisbol': ctx.fillText('⚾', x, y); break;
      case 'hockey': ctx.fillText('🏒', x, y); break;
      case 'atletismo': ctx.fillText('🏃', x, y); break;
      default: ctx.fillText('👤', x, y);
    }
    
    // Nombre
    ctx.font = '12px Arial';
    ctx.textBaseline = 'top';
    ctx.fillText(user.name || 'Deportista', x - 30, y + 25);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser?.id) return;

    try {
      const { error } = await supabaseClient
        .from('room_messages')
        .insert({
          user_id: currentUser.id,
          content: newMessage.trim(),
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage('');
      updateUserActivity();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const moveAvatar = async (x, y) => {
    if (!currentUser?.id) return;

    try {
      const { error } = await supabaseClient
        .from('room_users')
        .update({ 
          x: Math.round(x), 
          y: Math.round(y),
          last_activity: new Date().toISOString()
        })
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error moving avatar:', error);
      }
    } catch (error) {
      console.error('Error moving avatar:', error);
    }
  };

  const getUserDisplayName = (userId) => {
    return userNames[userId] || `Deportista${userId ? userId.slice(-4) : ''}`;
  };

  if (isLoading) {
    return (
      <div className="stadium-modal">
        <div className="stadium-content">
          <div className="stadium-header">
            <h2>🏟️ Lobby Multideporte Lupi</h2>
            <button className="close-btn" onClick={onClose}>⨉</button>
          </div>
          <div className="loading-container">
            <p>Entrando al lobby deportivo...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stadium-modal">
      <div className="stadium-content">
        <div className="stadium-header">
          <h2>🏟️ Lobby Multideporte Lupi</h2>
          <button className="close-btn" onClick={onClose}>⨉</button>
          <div style={{color: '#ffd700', marginLeft: '20px'}}>
            👥 {users.filter(user => user.user_id).length} conectados
          </div>
        </div>
        
        <div style={{marginBottom: '15px', color: '#ffd700'}}>
          <h3>Selecciona un deporte:</h3>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
            {sports.map(sport => (
              <button
                key={sport.id}
                onClick={() => setSelectedSport(sport.id)}
                style={{
                  background: selectedSport === sport.id ? sport.color : 'transparent',
                  color: selectedSport === sport.id ? 'white' : sport.color,
                  border: `2px solid ${sport.color}`,
                  padding: '8px 12px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                {sport.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="stadium-container">
          <div className="field-container">
            <canvas 
              ref={canvasRef} 
              width={800} 
              height={500}
              onClick={(e) => {
                const rect = e.target.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                moveAvatar(x, y);
              }}
              className="soccer-field"
            />
          </div>
          
          <div className="locker-room-chat">
            <div className="chat-title">🗣️ Vestuarios</div>
            <div className="messages">
              {messages.map(msg => (
                <div key={msg.id} className="message">
                  <span className="player-name">
                    {getUserDisplayName(msg.user_id)}:
                  </span>
                  <span className="message-content">{msg.content}</span>
                </div>
              ))}
            </div>
            
            <form onSubmit={sendMessage} className="message-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="¡Comparte tu estrategia!"
                disabled={!currentUser}
              />
              <button type="submit" disabled={!currentUser || !newMessage.trim()}>
                🎯 Enviar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonRoom;