import React, { useRef, useEffect } from 'react';
import ThemedButton from '../components/ThemedButton';

export default function ChatView({
  messages,
  newMessage,
  setNewMessage,
  handleSendMessage,
  loading,
  setView,
  message
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="app-container">
      <h2>Chat Global</h2>
      {message && <div className="message-box">{message}</div>}
      <div className="chat-messages-container">
        {loading && <p>Cargando mensajes...</p>}
        {messages.map(msg => (
          <div key={msg.id}>
            <strong>{msg.players?.username || 'Usuario Desconocido'}:</strong> {msg.content}
            <small>{new Date(msg.created_at).toLocaleTimeString()}</small>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          required
        />
        <ThemedButton type="submit" disabled={loading}>Enviar</ThemedButton>
      </form>
      <button onClick={() => setView('dashboard')}>Volver</button>
    </div>
  );
}
