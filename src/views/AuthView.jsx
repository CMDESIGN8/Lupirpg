import { LogIn, UserPlus } from 'lucide-react'
import ThemedButton from '../components/ThemedButton'


export default function AuthView({
message,
loading,
email,
setEmail,
password,
setPassword,
handleLogin,
handleSignup,
}) {
return (
<div className="app-container">
<div className="card auth-card">
<h2 className="card-title">LUPI APP</h2>
{message && <div className="message-box">{message}</div>}
<form onSubmit={handleLogin} className="form-container">
<input
type="email"
placeholder="Correo Electrónico"
value={email}
onChange={(e) => setEmail(e.target.value)}
className="form-input"
/>
<input
type="password"
placeholder="Contraseña"
value={password}
onChange={(e) => setPassword(e.target.value)}
className="form-input"
/>
<ThemedButton
type="submit"
disabled={loading}
icon={<LogIn size={20} />}
className="button-full-width"
>
{loading ? 'Cargando...' : 'Iniciar Sesión'}
</ThemedButton>
</form>
<button
onClick={handleSignup}
disabled={loading}
className="secondary-button button-full-width"
>
<UserPlus size={20} />
{loading ? 'Cargando...' : 'Registrarse'}
</button>
</div>
</div>
)
}