import React, { useState, useEffect, useRef } from 'react';
import '../styles/CommonRoom.css';

const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  // ... (estados anteriores se mantienen igual)
  
  // NUEVO: useEffect para redibujar cuando cambian los usuarios o el deporte
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const redrawCanvas = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Limpiar el canvas completamente
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Dibujar el campo deportivo
      drawSportField(ctx, selectedSport);
    };
    
    redrawCanvas();
    
    // Redibujar cuando cambian los usuarios o el deporte seleccionado
  }, [users, selectedSport]); // ← Añadidas dependencias

  // FUNCIÓN MEJORADA: Dibujar campo según deporte
  const drawSportField = (ctx, sport) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Fondo negro de respaldo
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    
    switch(sport) {
      case 'fútbol':
        // Campo de fútbol
        ctx.fillStyle = '#2E8B57';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        
        // Línea central
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        
        // Círculo central
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 50, 0, Math.PI * 2);
        ctx.stroke();
        
        // Áreas
        ctx.strokeRect(0, height / 4, 100, height / 2);
        ctx.strokeRect(width - 100, height / 4, 100, height / 2);
        break;
        
      case 'baloncesto':
        // Cancha de baloncesto
        ctx.fillStyle = '#FF6B35';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 50, width - 100, height - 100);
        
        // Círculo central
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 60, 0, Math.PI * 2);
        ctx.stroke();
        break;
        
      case 'tenis':
        // Cancha de tenis
        ctx.fillStyle = '#00A8E8';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 50, width - 100, height - 100);
        
        // Línea central
        ctx.beginPath();
        ctx.moveTo(width / 2, 50);
        ctx.lineTo(width / 2, height - 50);
        ctx.stroke();
        break;
        
      default:
        // Campo genérico
        ctx.fillStyle = '#4ECDC4';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 50, width - 100, height - 100);
    }
    
    // Dibujar deportistas
    users.forEach(user => {
      drawAthlete(ctx, user);
    });
  };

  // FUNCIÓN MEJORADA: Dibujar deportista
  const drawAthlete = (ctx, user) => {
    const { x, y, color, name, sport } = user;
    
    // Asegurar coordenadas válidas
    const posX = x || Math.random() * 600 + 100;
    const posY = y || Math.random() * 300 + 150;
    
    // Cuerpo del deportista
    ctx.fillStyle = color || '#2E8B57';
    ctx.beginPath();
    ctx.arc(posX, posY, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Borde blanco
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Icono del deporte
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const userSport = sport || 'fútbol';
    switch(userSport) {
      case 'fútbol': ctx.fillText('⚽', posX, posY); break;
      case 'baloncesto': ctx.fillText('🏀', posX, posY); break;
      case 'tenis': ctx.fillText('🎾', posX, posY); break;
      case 'voleibol': ctx.fillText('🏐', posX, posY); break;
      case 'rugby': ctx.fillText('🏉', posX, posY); break;
      case 'béisbol': ctx.fillText('⚾', posX, posY); break;
      case 'hockey': ctx.fillText('🏒', posX, posY); break;
      case 'atletismo': ctx.fillText('🏃', posX, posY); break;
      default: ctx.fillText('👤', posX, posY);
    }
    
    // Nombre del deportista
    ctx.fillStyle = '#323C78';
    ctx.font = '12px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(name || 'Deportista', posX, posY + 40);
  };

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

  const handleNewMessage = (payload) => {
    setMessages(prev => [...prev, payload.new]);
  };

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
                
                // Redibujar inmediatamente después de mover
                const canvas = canvasRef.current;
                if (canvas) {
                  const ctx = canvas.getContext('2d');
                  drawSportField(ctx, selectedSport);
                }
              }}
              className="sport-field"
              style={{ 
                background: '#2E8B57', // Fondo verde por defecto
                borderRadius: '12px' 
              }}
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