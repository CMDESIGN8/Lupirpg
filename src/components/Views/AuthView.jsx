import { LogIn, UserPlus } from 'lucide-react'; // Correcto
import ThemedButton from '../UI/ThemedButton.jsx';
import MessageDisplay from '../UI/MessageDisplay.jsx';

const AuthView = ({ handleLogin, handleSignup, setEmail, setPassword, email, password, loading, message }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 font-sans">
    <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-xl border border-gray-300">
      <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">LUPI APP</h2>
      <MessageDisplay message={message} />
      <form onSubmit={handleLogin} className="space-y-4">
        <input type="email" placeholder="Correo Electrónico" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" />
        <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" />
        <ThemedButton type="submit" disabled={loading} icon={<LogIn size={20} />} className="w-full">
          {loading ? 'Cargando...' : 'Iniciar Sesión'}
        </ThemedButton>
      </form>
      <button onClick={handleSignup} disabled={loading} className="w-full mt-4 flex items-center justify-center gap-2 p-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition disabled:bg-gray-300">
        <UserPlus size={20} />
        {loading ? 'Cargando...' : 'Registrarse'}
      </button>
    </div>
  </div>
);

export default AuthView;