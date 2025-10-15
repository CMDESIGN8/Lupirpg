import { LogIn, UserPlus } from 'lucide-react';
import MessageDisplay from '../UI/MessageDisplay.jsx';
import '../styles/login.css'   // 👈 acá importás tu CSS

const AuthView = ({ handleLogin, handleSignup, setEmail, setPassword, email, password, loading, message }) => (
  <div className="auth-container">
    <div className="auth-box">
      <div className="auth-title">
        <h2 className="pulse-effect">LUPI SPORTS RPG</h2>
        <p>Inicia tu aventura en el mundo del deporte</p>
      </div>
      
      <MessageDisplay message={message} />
      
      <form onSubmit={handleLogin} className="auth-form">
        <input 
          type="email" 
          placeholder="Correo Electrónico" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          className="auth-input input-glow"
          required 
        />
        
        <input 
          type="password" 
          placeholder="Contraseña" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className="auth-input input-glow"
          required 
        />
        
        <button type="submit" disabled={loading} className="auth-btn">
          <LogIn size={20} />
          {loading ? 'Cargando...' : 'Iniciar Sesión'}
        </button>
      </form>
      
      <button onClick={handleSignup} disabled={loading} className="auth-alt">
        <UserPlus size={20} />
        {loading ? 'Cargando...' : 'Registrarse'}
      </button>
    </div>
  </div>
);

export default AuthView;