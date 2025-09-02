import React, { useState, useEffect, useRef } from 'react';
import '../styles/CommonRoom.css';

const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const canvasRef = useRef(null);

  // Colores para los avatares
  const avatarColors = [
    '#FF6464', '#64FF64', '#6464FF', '#FFFF64', '#FF64FF', '#64FFFF'
  ];

  // Cargar usuarios y mensajes al iniciar
  useEffect(() => {
    loadUsers();
    loadMessages();
    
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
    joinRoom();

    return () => {
      userSubscription.unsubscribe();
      messageSubscription.unsubscribe();
      leaveRoom();
    };
  }, []);

  // Dibujar la sala
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    drawRoom(ctx);
  }, [users]);

  // AÑADIR: Función sendMessage que faltaba
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

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

      setNewMessage(''); // Limpiar el input después de enviar
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // AÑADIR: Función para manejar cambios en usuarios
  const handleUserChange = (payload) => {
    if (payload.eventType === 'INSERT') {
      setUsers(prev => [...prev, {
        ...payload.new,
        x: payload.new.x || Math.random() * 600 + 100,
        y: payload.new.y || Math.random() * 300 + 150
      }]);
    } else if (payload.eventType === 'DELETE') {
      setUsers(prev => prev.filter(user => user.id !== payload.old.id));
    } else if (payload.eventType === 'UPDATE') {
      setUsers(prev => prev.map(user => 
        user.id === payload.new.id ? {...user, ...payload.new} : user
      ));
    }
  };

  // AÑADIR: Función para manejar nuevos mensajes
  const handleNewMessage = (payload) => {
    setMessages(prev => [...prev, payload.new]);
  };

  // AÑADIR: Función para dibujar la sala
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

  // AÑADIR: Función para dibujar avatar
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

  // CORREGIDO: Cargar usuarios desde Supabase
  const loadUsers = async () => {
    const { data, error } = await supabaseClient
      .from('room_users')
      .select('*');
    
    if (error) {
      console.error('Error loading users:', error);
      return;
    }
    
    if (data) {
      setUsers(data.map(user => ({
        ...user,
        x: user.x || Math.random() * 600 + 100,
        y: user.y || Math.random() * 300 + 150
      })));
    }
  };

  // CORREGIDO: Cargar mensajes desde Supabase
  const loadMessages = async () => {
    const { data, error } = await supabaseClient
      .from('room_messages')
      .select('*, user:user_id(name)')
      .order('created_at', { ascending: true })
      .limit(50);
    
    if (error) {
      console.error('Error loading messages:', error);
      return;
    }
    
    if (data) {
      setMessages(data);
    }
  };

  // CORREGIDO: Unirse a la sala
  const joinRoom = async () => {
    try {
      const color = avatarColors[Math.floor(Math.random() * avatarColors.length)];
      
      // Primero verifica si el usuario ya existe
      const { data: existingUser } = await supabaseClient
        .from('room_users')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (existingUser) {
        // Si ya existe, actualiza
        const { error } = await supabaseClient
          .from('room_users')
          .update({
            name: currentUser.username || 'Usuario',
            color: color,
            x: Math.random() * 600 + 100,
            y: Math.random() * 300 + 150
          })
          .eq('user_id', currentUser.id);

        if (error) throw error;
      } else {
        // Si no existe, inserta
        const { error } = await supabaseClient
          .from('room_users')
          .insert({
            user_id: currentUser.id,
            name: currentUser.username || 'Usuario',
            color: color,
            x: Math.random() * 600 + 100,
            y: Math.random() * 300 + 150
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error joining room:', error);
      console.error('Error details:', error.message);
    }
  };

  // CORREGIDO: Salir de la sala
  const leaveRoom = async () => {
    try {
      const { error } = await supabaseClient
        .from('room_users')
        .delete()
        .eq('user_id', currentUser.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  // CORREGIDO: Mover avatar
  const moveAvatar = async (x, y) => {
    try {
      const { error } = await supabaseClient
        .from('room_users')
        .update({ x, y })
        .eq('user_id', currentUser.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error moving avatar:', error);
    }
  };

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
                  <span className="user-name">{msg.user?.name}:</span>
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
              />
              <button type="submit">Enviar</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonRoom;