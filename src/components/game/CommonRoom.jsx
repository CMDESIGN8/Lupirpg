import React, { useState, useEffect, useRef } from 'react';
import '../styles/CommonRoom.css';

const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef(null);

  // Colores para los avatares
  const avatarColors = [
    '#FF6464', '#64FF64', '#6464FF', '#FFFF64', '#FF64FF', '#64FFFF'
  ];

  // Cargar usuarios y mensajes al iniciar
  useEffect(() => {
    // Verificar que currentUser existe antes de proceder
    if (!currentUser || !currentUser.id) {
      console.error('Current user is not available');
      setIsLoading(false);
      return;
    }

    const initializeRoom = async () => {
      setIsLoading(true);
      try {
        await loadUsers();
        await loadMessages();
        
        // Suscribirse a cambios en tiempo real
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

        // Unirse a la sala automáticamente
        await joinRoom();

        // Guardar las suscripciones para limpiar después
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
      // Limpiar suscripciones cuando el componente se desmonta
      cleanupPromise.then(cleanup => {
        if (cleanup) cleanup();
      }).catch(console.error);
    };
  }, [currentUser]); // Añadir currentUser como dependencia

  // Dibujar la sala
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    drawRoom(ctx);
  }, [users]);

  // Función para enviar mensajes (CON VALIDACIÓN)
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

  // Función para manejar cambios en usuarios
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

  // Función para manejar nuevos mensajes
  const handleNewMessage = (payload) => {
    setMessages(prev => [...prev, payload.new]);
  };

  // Función para dibujar la sala
  const drawRoom = (ctx) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);
    
    // Dibujar fondo
    ctx.fillStyle = '#E6F0FF';
    ctx.fillRect(0, 0, width, height);
    
    // Dibujar área de la sala
    ctx.fillStyle = '#C8D8EB';
    ctx.beginPath();
    ctx.roundRect(50, 100, width - 100, height - 200, 15);
    ctx.fill();
    ctx.strokeStyle = '#B4C8E0';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Dibujar usuarios
    users.forEach(user => {
      drawAvatar(ctx, user);
    });
  };

  // Función para dibujar avatar
  const drawAvatar = (ctx, user) => {
    const { x, y, color, name } = user;
    
    // Cuerpo del avatar
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Ojos
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x - 8, y - 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 8, y - 5, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Sonrisa
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x, y + 5, 10, 0.2, Math.PI - 0.2, false);
    ctx.stroke();
    
    // Nombre
    ctx.fillStyle = '#323C78';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(name, x, y + 45);
  };

  // Cargar usuarios desde Supabase
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

  // Cargar mensajes desde Supabase
  const loadMessages = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('room_messages')
        .select('*, users:user_id(name)')
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

  // Unirse a la sala (CON VALIDACIÓN)
  const joinRoom = async () => {
    if (!currentUser?.id) {
      console.error('Cannot join room: currentUser.id is undefined');
      return;
    }

    try {
      const color = avatarColors[Math.floor(Math.random() * avatarColors.length)];
      
      // Usar números enteros (redondeados)
      const x = Math.round(Math.random() * 600 + 100);
      const y = Math.round(Math.random() * 300 + 150);

      // Usar upsert que maneja mejor los conflictos
      const { error } = await supabaseClient
        .from('room_users')
        .upsert({
          user_id: currentUser.id,
          name: currentUser.username || 'Usuario',
          color: color,
          x: x,
          y: y,
          joined_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error joining room:', error);
        return;
      }

    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  // Salir de la sala (CON VALIDACIÓN)
  const leaveRoom = async () => {
    if (!currentUser?.id) {
      console.error('Cannot leave room: currentUser.id is undefined');
      return;
    }

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

  // Mover avatar (CON VALIDACIÓN)
  const moveAvatar = async (x, y) => {
    if (!currentUser?.id) {
      console.error('Cannot move avatar: currentUser.id is undefined');
      return;
    }

    try {
      // Redondear a números enteros
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

  // Mostrar loading si currentUser no está disponible
  if (isLoading || !currentUser) {
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
                  <span className="user-name">{msg.users?.name || 'Usuario'}:</span>
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