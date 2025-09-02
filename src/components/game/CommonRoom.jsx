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

  // ... (resto de funciones de dibujo iguales)

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