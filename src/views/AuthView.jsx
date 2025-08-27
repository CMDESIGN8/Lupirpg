import { useState } from 'react'
import ThemedButton from '../components/ThemedButton'
import MessageDisplay from '../components/MessageDisplay'
import { LogIn, UserPlus } from 'lucide-react'

const AuthView = ({ onLogin, onSignup, loading, message }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="container" style={{ display:'grid', placeItems:'center', minHeight:'70vh' }}>
      <div className="card" style={{ width: 420 }}>
        <h2 style={{ margin: 0, marginBottom: 8 }}>LUPI APP</h2>
        <p style={{ marginTop:0, opacity:.7 }}>Ingresá o creá tu cuenta</p>
        <MessageDisplay message={message} />
        <div className="grid" style={{ gap: 12 }}>
          <input className="input" type="email" placeholder="Correo" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="input" type="password" placeholder="Contraseña" value={password} onChange={(e)=>setPassword(e.target.value)} />
          <ThemedButton onClick={()=>onLogin(email,password)} disabled={loading} icon={<LogIn size={18} />}>Iniciar sesión</ThemedButton>
          <button className="btn btn-ghost" onClick={()=>onSignup(email,password)} disabled={loading}><UserPlus size={18}/> Crear cuenta</button>
        </div>
      </div>
    </div>
  )
}

export default AuthView
