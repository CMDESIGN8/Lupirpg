import React from 'react';

export default function AuthView({ email, setEmail, password, setPassword, handleLogin, handleSignup, loading, message }) {
  return (
    <div className="app-container">
      <h2>Autenticación</h2>
      {message && <div className="message-box">{message}</div>}
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? 'Cargando...' : 'Iniciar Sesión'}</button>
      </form>
      <button onClick={handleSignup} disabled={loading}>{loading ? 'Cargando...' : 'Registrarse'}</button>
    </div>
  );
}
