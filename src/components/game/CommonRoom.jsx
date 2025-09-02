import React, { useState, useEffect, useRef } from 'react';
import '../styles/CommonRoom.css';

const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userNames, setUserNames] = useState({});
  const [selectedSport, setSelectedSport] = useState('fútbol');
  const [connectionId, setConnectionId] = useState(null);
  const canvasRef = useRef(null);

  // Deportes disponibles
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

  useEffect(() => {
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    const initializeRoom = async () => {
      setIsLoading(true);
      try {
        // Generar ID único para esta conexión
        const connId = Date.now().toString();
        setConnectionId(connId);

        // Limpiar usuarios antiguos primero
        await cleanupOldUsers();
        
        await loadUsers();
        await loadMessages();
        
        const userSubscription = supabaseClient
          .channel('room_users')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'room_users' }, 
            handleUserChange
          )
          .subscribe();

        const messageSubscription = supabaseClient
          .channel('room_messages')
          .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'room_messages' }, 
            handleNewMessage
          )
          .subscribe();

        await joinRoom(connId);

        // Heartbeat para mantener conexión activa
        const heartbeatInterval = setInterval(() => {
          updateUserPresence(connId);
        }, 30000);

        return () => {
          userSubscription.unsubscribe();
          messageSubscription.unsubscribe();
          clearInterval(heartbeatInterval);
          leaveRoom(connId);
        };
      } catch (error) {
        console.error('Error initializing room:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeRoom();
  }, [currentUser]);

  // Limpiar usuarios antiguos
  const cleanupOldUsers = async () => {
    try {
      // Primero intentar con columna last_activity si existe
      const { error } = await supabaseClient
        .from('room_users')
        .update({ is_online: false })
        .lt('joined_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

      if (error) {
        console.log('Cleanup con last_activity falló, intentando método alternativo');
      }
    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  };

  // Actualizar presencia del usuario
  const updateUserPresence = async (connId) => {
    if (!currentUser?.id) return;

    try {
      const { error } = await supabaseClient
        .from('room_users')
        .update({
          last_activity: new Date().toISOString()
        })
        .eq('user_id', currentUser.id);

      if (error) {
        console.warn('Error updating presence:', error);
      }
    } catch (error) {
      console.error('Error in presence update:', error);
    }
  };

  // Cargar usuarios
  const loadUsers = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('room_users')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading users:', error);
        return;
      }
      
      if (data) {
        setUsers(data.map(user => ({
          ...user,
          x: user.x || Math.round(Math.random() * 600 + 100),
          y: user.y || Math.round(Math.random() * 300 + 150)
        })));

        const namesMap = {};
        data.forEach(user => {
          namesMap[user.user_id] = user.name;
        });
        setUserNames(prev => ({ ...prev, ...namesMap }));
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // Cargar mensajes
  const loadMessages = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('room_messages')
        .select('id, user_id, content, created_at')
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

  // Unirse al lobby
  const joinRoom = async (connId) => {
    if (!currentUser?.id) return;

    try {
      const sport = sports[Math.floor(Math.random() * sports.length)];
      const x = Math.round(Math.random() * 600 + 100);
      const y = Math.round(Math.random() * 300 + 150);

      const userData = {
        user_id: currentUser.id,
        name: currentUser.username || 'Deportista',
        color: sport.color,
        x: x,
        y: y,
        joined_at: new Date().toISOString()
      };

      // Intentar agregar sport solo si la columna existe
      try {
        const { error: checkError } = await supabaseClient
          .from('room_users')
          .select('sport')
          .limit(1);

        if (!checkError) {
          userData.sport = sport.id;
        }
      } catch (e) {
        console.log('Columna sport no disponible, continuando sin ella');
      }

      const { error: insertError } = await supabaseClient
        .from('room_users')
        .insert(userData);

      if (insertError) {
        if (insertError.code === '23505') {
          const updateData = {
            name: currentUser.username || 'Deportista',
            color: sport.color,
            x: x,
            y: y,
            joined_at: new Date().toISOString()
          };

          try {
            const { error: checkError } = await supabaseClient
              .from('room_users')
              .select('sport')
              .limit(1);
            
            if (!checkError) {
              updateData.sport = sport.id;
            }
          } catch (e) {
            console.log('Columna sport no disponible para update');
          }

          const { error: updateError } = await supabaseClient
            .from('room_users')
            .update(updateData)
            .eq('user_id', currentUser.id);

          if (updateError) {
            console.error('Error updating user in room:', updateError);
          }
        } else {
          console.error('Error joining room:', insertError);
        }
      }

    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  // Salir del lobby
  const leaveRoom = async (connId) => {
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

  // Dibujar campo según deporte
  const drawSportField = (ctx, sport) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    switch(sport) {
      case 'fútbol':
        ctx.fillStyle = '#2E8B57';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 50, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        ctx.strokeRect(0, height / 4, 100, height / 2);
        ctx.strokeRect(width - 100, height / 4, 100, height / 2);
        break;
        
      case 'baloncesto':
        ctx.fillStyle = '#FF6B35';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 50, width - 100, height - 100);
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 60, 0, Math.PI * 2);
        ctx.stroke();
        break;
        
      case 'tenis':
        ctx.fillStyle = '#00A8E8';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 50, width - 100, height - 100);
        ctx.beginPath();
        ctx.moveTo(width / 2, 50);
        ctx.lineTo(width / 2, height - 50);
        ctx.stroke();
        break;
        
      default:
        ctx.fillStyle = '#4ECDC4';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 50, width - 100, height - 100);
    }
    
    users.forEach(user => {
      drawAthlete(ctx, user);
    });
  };

  // Dibujar deportista
  const drawAthlete = (ctx, user) => {
    const { x, y, color, name, sport } = user;
    
    ctx.fillStyle = color || '#2E8B57';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    
    const userSport = sport || 'fútbol';
    switch(userSport) {
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
    
    ctx.fillStyle = '#323C78';
    ctx.font = '12px Arial';
    ctx.fillText(name || 'Deportista', x, y + 40);
  };

  // Enviar mensaje
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser?.id) return;

    try {
      const { error } = await supabaseClient
        .from('room_messages')
        .insert({
          user_id: currentUser.id,
          content: newMessage.trim()
        });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Mover avatar
  const moveAvatar = async (x, y) => {
    if (!currentUser?.id) return;

    try {
      const roundedX = Math.round(x);
      const roundedY = Math.round(y);
      
      const { error } = await supabaseClient
        .from('room_users')
        .update({ 
          x: roundedX, 
          y: roundedY 
        })
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error moving avatar:', error);
      }
    } catch (error) {
      console.error('Error moving avatar:', error);
    }
  };

  // Manejar cambios en usuarios
  const handleUserChange = (payload) => {
    if (payload.eventType === 'INSERT') {
      setUsers(prev => [...prev, {
        ...payload.new,
        x: payload.new.x || Math.round(Math.random() * 600 + 100),
        y: payload.new.y || Math.round(Math.random() * 300 + 150)
      }]);
    } else if (payload.eventType === 'DELETE') {
      setUsers(prev => prev.filter(user => user.id !== payload.old.id));
    } else if (payload.eventType === 'UPDATE') {
      setUsers(prev => prev.map(user => 
        user.id === payload.new.id ? {...user, ...payload.new} : user
      ));
    }
  };

  // Manejar nuevos mensajes
  const handleNewMessage = (payload) => {
    setMessages(prev => [...prev, payload.new]);
  };

  // Obtener nombre para mostrar
  const getUserDisplayName = (userId) => {
    if (!userId) return 'Deportista';
    return userNames[userId] || `Deportista${userId.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="sports-lobby-modal">
        <div className="sports-lobby-content">
          <div className="sports-lobby-header">
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
    <div className="sports-lobby-modal">
      <div className="sports-lobby-content">
        <div className="sports-lobby-header">
          <h2>🏟️ Lobby Multideporte Lupi</h2>
          <button className="close-btn" onClick={onClose}>⨉</button>
          <div className="online-counter">
            👥 {users.length} conectados
          </div>
        </div>
        
        <div className="sports-selector">
          <h3>Selecciona un deporte:</h3>
          <div className="sports-buttons">
            {sports.map(sport => (
              <button
                key={sport.id}
                className={`sport-btn ${selectedSport === sport.id ? 'active' : ''}`}
                onClick={() => setSelectedSport(sport.id)}
                style={{ borderColor: sport.color }}
              >
                {sport.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="lobby-container">
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
              className="sport-field"
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
              <button type="submit" disabled={!currentUser}>
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