import { CornerUpRight, ChevronDown } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';

const ChatView = ({ messages, handleSendMessage, newMessage, setNewMessage, messagesEndRef, loading, message, setView }) => (
  <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 font-sans">
    <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-xl border border-gray-300 h-[80vh] flex flex-col">
      <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Chat Global</h2>
      <MessageDisplay message={message} />
      <div className="flex-1 overflow-y-auto space-y-4 p-4 border border-gray-300 rounded-md bg-gray-100">
        {loading && <p className="text-center text-gray-500">Cargando mensajes...</p>}
        {messages.map((msg) => (
          <div key={msg.id} className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
            <span className="font-semibold text-blue-600">{msg.players?.username || 'Usuario Desconocido'}:</span>
            <span className="text-gray-800 ml-2">{msg.content}</span>
            <div className="text-right text-xs text-gray-500 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
        <input type="text" placeholder="Escribe un mensaje..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1 p-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" required />
        <ThemedButton type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500" icon={<CornerUpRight size={20} />}>Enviar</ThemedButton>
      </form>
      <div className="flex justify-center mt-6">
        <ThemedButton onClick={() => setView('dashboard')} icon={<ChevronDown size={20} />}>Volver</ThemedButton>
      </div>
    </div>
  </div>
);

export default ChatView;