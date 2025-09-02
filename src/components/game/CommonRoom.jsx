import React, { useState, useEffect, useRef } from 'react';
import '../styles/CommonRoom.css';

const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userNames, setUserNames] = useState({});
  const [cheerSound, setCheerSound] = useState(null);
  const canvasRef = useRef(null);

  // Colores para equipos de fútbol
  const teamColors = [
    '#FF0000', // Rojo (Manchester United)
    '#0000FF', // Azul (Chelsea)
    '#00FF00', // Verde (Celtic)
    '#FFFF00', // Amarillo (Borussia Dortmund)
    '#FFFFFF', // Blanco (Real Madrid)
    '#000000'  // Negro (Juventus)
  ];

  // Efectos de sonido
  useEffect(() => {
    // Cargar sonido de ambiente de estadio (opcional)
    const cheer = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-crowd-cheer-477.mp3');
    setCheerSound(cheer);
    
    return () => {
      if (cheerSound) {
        cheerSound.pause();
      }
    };
  }, []);

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

  // Dibujar el estadio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    drawStadium(ctx);
  }, [users]);

  const drawStadium = (ctx) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);
    
    // Césped del campo
    ctx.fillStyle = '#2E8B57'; // Verde césped
    ctx.fillRect(0, 0, width, height);
    
    // Líneas del campo
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    
    // Círculo central
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 50, 0, Math.PI * 2);
    ctx.stroke();
    
    // Línea central
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    
    // Área grande izquierda
    ctx.strokeRect(0, height / 4, 100, height / 2);
    
    // Área grande derecha
    ctx.strokeRect(width - 100, height / 4, 100, height / 2);
    
    // Área pequeña izquierda
    ctx.strokeRect(0, height / 3, 40, height / 3);
    
    // Área pequeña derecha
    ctx.strokeRect(width - 40, height / 3, 40, height / 3);
    
    // Punto de penalty izquierdo
    ctx.beginPath();
    ctx.arc(75, height / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    
    // Punto de penalty derecho
    ctx.beginPath();
    ctx.arc(width - 75, height / 2, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Dibujar gradas
    ctx.fillStyle = '#8B4513'; // Color madera de gradas
    ctx.fillRect(0, 0, width, 30); // Gradas superior
    ctx.fillRect(0, height - 30, width, 30); // Gradas inferior
    
    // Dibujar jugadores (avatares) como futbolistas
    users.forEach(user => {
      drawFootballPlayer(ctx, user);
    });
  };

  const drawFootballPlayer = (ctx, user) => {
    const { x, y, color, name } = user;
    
    // Cuerpo del jugador (camiseta)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Shorts
    ctx.fillStyle = '#000080'; // Azul marino
    ctx.fillRect(x - 15, y + 10, 30, 15);
    
    // Piernas
    ctx.fillStyle = '#FFD700'; // Dorado (espinilleras)
    ctx.fillRect(x - 5, y + 25, 10, 20);
    
    // Número en la camiseta
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('10', x, y + 5);
    
    // Nombre del jugador
    ctx.fillStyle = '#323C78';
    ctx.font = '12px Arial';
    ctx.fillText(name, x, y + 55);
  };

  // Función para enviar mensaje con temática futbolística
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

      // Reproducir sonido de animación al enviar mensaje
      if (cheerSound) {
        cheerSound.currentTime = 0;
        cheerSound.play().catch(e => console.log('Audio play failed:', e));
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Resto de funciones se mantienen similares pero con temática futbolística
  const joinRoom = async () => {
    if (!currentUser?.id) return;

    try {
      const color = teamColors[Math.floor(Math.random() * teamColors.length)];
      const x = Math.round(Math.random() * 600 + 100);
      const y = Math.round(Math.random() * 300 + 150);

      const { error: insertError } = await supabaseClient
        .from('room_users')
        .insert({
          user_id: currentUser.id,
          name: currentUser.username || 'Jugador',
          color: color,
          x: x,
          y: y,
          joined_at: new Date().toISOString()
        });

      if (insertError) {
        if (insertError.code === '23505') {
          const { error: updateError } = await supabaseClient
            .from('room_users')
            .update({
              name: currentUser.username || 'Jugador',
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

  // ... (resto de funciones loadMessages, loadUsers, etc. se mantienen igual)

  return (
    <div className="stadium-modal">
      <div className="stadium-content">
        <div className="stadium-header">
          <h2>🏟️ Estadio Lupi FC</h2>
          <button className="close-btn" onClick={onClose}>⨉</button>
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
                placeholder="¡Grita tu estrategia!"
                disabled={!currentUser}
              />
              <button type="submit" disabled={!currentUser}>
                ⚽ Enviar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonRoom;