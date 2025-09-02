// src/components/game/CommonRoom.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { avatarService } from '../../services/avatarService'; // Asegúrate de que la ruta sea correcta
import '../styles/CommonRoom.css';

const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userNames, setUserNames] = useState({});
  const [selectedSport, setSelectedSport] = useState('fútbol');
  const [avatarImages, setAvatarImages] = useState({}); // <-- NUEVO: Almacena las imágenes cargadas
  const canvasRef = useRef(null);

  const sports = [
    { id: 'fútbol', name: '⚽ Fútbol', color: '#2E8B57' },
    { id: 'baloncesto', name: '🏀 Baloncesto', color: '#FF6B35' },
    { id: 'tenis', name: '🎾 Tenis', color: '#00A8E8' },
    { id: 'voleibol', name: '🏐 Voleibol', color: '#F9A826' },
  ];

  // Hook principal para inicializar y suscribirse a los cambios en tiempo real
  useEffect(() => {
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    const initializeRoom = async () => {
      setIsLoading(true);
      try {
        await joinRoom(); // Primero nos unimos o actualizamos datos
        await loadInitialData(); // Cargamos usuarios y mensajes
        
        const userSub = supabaseClient
          .channel('room_users_changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'room_users' }, handleUserChange)
          .subscribe();

        const messageSub = supabaseClient
          .channel('room_messages_changes')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_messages' }, handleNewMessage)
          .subscribe();

        // Función de limpieza al desmontar el componente
        return () => {
          supabaseClient.removeChannel(userSub);
          supabaseClient.removeChannel(messageSub);
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

  // Hook para cargar las imágenes de los avatares de forma asíncrona
  useEffect(() => {
    users.forEach(user => {
      if (user.avatar_url && !avatarImages[user.avatar_url]) {
        const img = new Image();
        img.src = user.avatar_url;
        img.onload = () => {
          setAvatarImages(prev => ({ ...prev, [user.avatar_url]: img }));
        };
      }
    });
  }, [users, avatarImages]);

  // Hook para dibujar en el canvas cada vez que cambian los usuarios o el deporte
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    drawSportField(ctx, selectedSport);
    users.forEach(user => drawAthlete(ctx, user));

  }, [users, selectedSport, avatarImages]); // avatarImages es dependencia para redibujar cuando cargan

  // Carga inicial de datos
  const loadInitialData = async () => {
    const usersPromise = supabaseClient.from('room_users').select('*');
    const messagesPromise = supabaseClient.from('room_messages').select('*').order('created_at').limit(50);
    const [usersRes, messagesRes] = await Promise.all([usersPromise, messagesPromise]);

    if (usersRes.data) setUsers(usersRes.data);
    if (usersRes.error) console.error("Error loading users:", usersRes.error);
    if (messagesRes.data) setMessages(messagesRes.data);
    if (messagesRes.error) console.error("Error loading messages:", messagesRes.error);
  };

  // MODIFICADO: Unirse (o actualizar datos) al lobby
  const joinRoom = async () => {
    if (!currentUser?.id) return;
    try {
      const equippedAvatar = await avatarService.getEquippedAvatar(currentUser.id);
      const avatarUrl = equippedAvatar?.avatars?.image_url || '/default-avatar.png';

      const userRoomData = {
        user_id: currentUser.id,
        name: currentUser.username || 'Deportista',
        sport: currentUser.sport || 'fútbol',
        x: Math.round(Math.random() * 750 + 25),
        y: Math.round(Math.random() * 450 + 25),
        joined_at: new Date().toISOString(),
        avatar_url: avatarUrl // Guardamos la URL del avatar
      };

      const { error } = await supabaseClient.from('room_users').upsert(userRoomData);
      if (error) console.error('Error joining room:', error);
    } catch (error) {
  console.error('Error joining room:', error); // Esto imprime el objeto
  // Añade esta línea para ver el mensaje específico:
  if (error) console.error('Supabase error message:', error.message); 
    }
  };

  const leaveRoom = async () => {
    if (!currentUser?.id) return;
    await supabaseClient.from('room_users').delete().eq('user_id', currentUser.id);
  };
  
  // MODIFICADO: Lógica para dibujar el avatar
  const drawAthlete = (ctx, user) => {
    const { x, y, name, avatar_url } = user;
    const avatarSize = 50;
    const image = avatarImages[avatar_url];

    if (image) { // Si la imagen ya cargó
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, avatarSize / 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.clip(); // Recorta el área para que la imagen sea circular
      ctx.drawImage(image, x - avatarSize / 2, y - avatarSize / 2, avatarSize, avatarSize);
      ctx.restore();
    } else { // Placeholder mientras carga
      ctx.beginPath();
      ctx.arc(x, y, avatarSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
    }
    
    // Dibuja el nombre debajo del avatar
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(name, x, y + 40);
    ctx.shadowBlur = 0;
  };

  // Dibuja el fondo del campo deportivo
  const drawSportField = (ctx, sport) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    ctx.clearRect(0, 0, width, height);
    // Tu lógica para dibujar canchas (fútbol, basket, etc.) va aquí
    ctx.fillStyle = sports.find(s => s.id === sport)?.color || '#4ECDC4';
    ctx.fillRect(0, 0, width, height);
  };

  // Mover el avatar del usuario actual
  const moveAvatar = async (e) => {
    if (!currentUser?.id) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Actualiza la posición localmente para una respuesta instantánea
    setUsers(prevUsers => prevUsers.map(u => 
        u.user_id === currentUser.id ? { ...u, x, y } : u
    ));

    // Envía la actualización a Supabase
    await supabaseClient
        .from('room_users')
        .update({ x, y })
        .eq('user_id', currentUser.id);
  };

  // Manejadores de eventos de Supabase en tiempo real
  const handleUserChange = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    if (eventType === 'INSERT') {
      setUsers(prev => [...prev, newRecord]);
    }
    if (eventType === 'UPDATE') {
      setUsers(prev => prev.map(user => (user.id === newRecord.id ? newRecord : user)));
    }
    if (eventType === 'DELETE') {
      setUsers(prev => prev.filter(user => user.id !== oldRecord.id));
    }
  };

  const handleNewMessage = (payload) => {
    setMessages(prev => [...prev, payload.new]);
  };
  
  // Enviar un mensaje de chat
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser?.id) return;
    await supabaseClient.from('room_messages').insert({ user_id: currentUser.id, content: newMessage.trim() });
    setNewMessage('');
  };

  const getUserDisplayName = (userId) => {
    const user = users.find(u => u.user_id === userId);
    return user?.name || 'Usuario';
  };

  if (isLoading) {
    return (
      <div className="sports-lobby-modal">
        <div className="sports-lobby-content">
            <h2>🏟️ Cargando Lobby...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="sports-lobby-modal">
      <div className="sports-lobby-content">
        <div className="sports-lobby-header">
          <h2>🏟️ Lobby Multideporte</h2>
          <button className="close-btn" onClick={onClose}>⨉</button>
        </div>
        
        <div className="sports-selector">
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
            <canvas ref={canvasRef} width={800} height={500} onClick={moveAvatar} className="sport-field" />
          </div>
          
          <div className="locker-room-chat">
            <div className="chat-title">🗣️ Vestuarios</div>
            <div className="messages">
              {messages.map(msg => (
                <div key={msg.id} className="message">
                  <span className="player-name">{getUserDisplayName(msg.user_id)}:</span>
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