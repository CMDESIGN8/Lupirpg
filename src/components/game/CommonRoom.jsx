import React, { useState, useEffect, useRef } from 'react';
import '../styles/CommonRoom.css';

const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef(null);

  const avatarColors = [
    '#FF6464', '#64FF64', '#6464FF', '#FFFF64', '#FF64FF', '#64FFFF'
  ];

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

        await joinRoom();

        return () => {
          userSubscription.unsubscribe();
          messageSubscription.unsubscribe();
          leaveRoom();
        };
      } catch (error) {
        console.error('Error initializing room:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const cleanupPromise = initializeRoom();
    
    return () => {
      cleanupPromise.then(cleanup => {
        if (cleanup) cleanup();
      }).catch(console.error);
    };
  }, [currentUser]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    drawRoom(ctx);
  }, [users]);

  // FUNCIÓN CORREGIDA: Cargar mensajes
  const loadMessages = async () => {
    try {
      // Consulta corregida - seleccionar directamente sin join complicado
      const { data, error } = await supabaseClient
        .from('room_messages')
        .select(`
          id,
          user_id,
          content,
          created_at,
          user:user_id(username)
        `)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error loading messages:', error);
        // Fallback: cargar solo los datos básicos
        const { data: simpleData, error: simpleError } = await supabaseClient
          .from('room_messages')
          .select('id, user_id, content, created_at')
          .order('created_at', { ascending: true })
          .limit(50);
        
        if (simpleError) {
          console.error('Error loading simple messages:', simpleError);
          return;
        }
        
        if (simpleData) {
          setMessages(simpleData);
        }
        return;
      }
      
      if (data) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // FUNCIÓN CORREGIDA: Unirse a la sala
  const joinRoom = async () => {
    if (!currentUser?.id) return;

    try {
      const color = avatarColors[Math.floor(Math.random() * avatarColors.length)];
      const x = Math.round(Math.random() * 600 + 100);
      const y = Math.round(Math.random() * 300 + 150);

      // ENFOQUE CORREGIDO: Primero intentar insertar, si falla por duplicado, actualizar
      const { error: insertError } = await supabaseClient
        .from('room_users')
        .insert({
          user_id: currentUser.id,
          name: currentUser.username || 'Usuario',
          color: color,
          x: x,
          y: y,
          joined_at: new Date().toISOString()
        });

      if (insertError) {
        // Si es error de duplicado, actualizar en lugar de insertar
        if (insertError.code === '23505') {
          const { error: updateError } = await supabaseClient
            .from('room_users')
            .update({
              name: currentUser.username || 'Usuario',
              color: color,
              x: x,
              y: y,
              joined_at: new Date().toISOString()
            })
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

  // Función para enviar mensajes (ACTUALIZADA)
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

  // Resto de funciones se mantienen igual...
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

  const handleNewMessage = (payload) => {
    setMessages(prev => [...prev, payload.new]);
  };

  const drawRoom = (ctx) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#E6F0FF';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#C8D8EB';
    ctx.beginPath();
    ctx.roundRect(50, 100, width - 100, height - 200, 15);
    ctx.fill();
    ctx.strokeStyle = '#B4C8E0';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    users.forEach(user => {
      drawAvatar(ctx, user);
    });
  };

  const drawAvatar = (ctx, user) => {
    const { x, y, color, name } = user;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x - 8, y - 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 8, y - 5, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x, y + 5, 10, 0.2, Math.PI - 0.2, false);
    ctx.stroke();
    
    ctx.fillStyle = '#323C78';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(name, x, y + 45);
  };

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
      }
    } catch (error) {
      console.error('Error loading users:', error);
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
      console.error('Error leaving room:', error);
    }
  };

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

  if (isLoading) {
    return (
      <div className="common-room-modal">
        <div className="common-room-content">
          <div className="common-room-header">
            <h2>Sala Común de Lupi</h2>
            <button className="close-btn" onClick={onClose}>X</button>
          </div>
          <div className="loading-container">
            <p>Cargando sala...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="common-room-modal">
      <div className="common-room-content">
        <div className="common-room-header">
          <h2>Sala Común de Lupi</h2>
          <button className="close-btn" onClick={onClose}>X</button>
        </div>
        
        <div className="room-container">
          <div className="canvas-container">
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
            />
          </div>
          
          <div className="chat-container">
            <div className="messages">
              {messages.map(msg => (
                <div key={msg.id} className="message">
                  <span className="user-name">
                    {msg.user?.username || `Usuario${msg.user_id?.slice(-4)}` || 'Usuario'}:
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
                placeholder="Escribe un mensaje..."
                disabled={!currentUser}
              />
              <button type="submit" disabled={!currentUser}>
                Enviar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonRoom;