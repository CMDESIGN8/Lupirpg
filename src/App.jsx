import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import './styles/App.css'


import { supabase } from './lib/supabaseClient'
import ThemedButton from './components/ThemedButton'
import AuthView from './views/AuthView'


export default function App() {
const [loading, setLoading] = useState(true)
const [message, setMessage] = useState('')
const [session, setSession] = useState(null)


const [email, setEmail] = useState('')
const [password, setPassword] = useState('')


const showMessage = (text) => {
setMessage(text)
setTimeout(() => setMessage(''), 3000)
}


useEffect(() => {
let mounted = true
;(async () => {
const { data: { session } } = await supabase.auth.getSession()
if (!mounted) return
setSession(session)
setLoading(false)
})()


const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
setSession(session)
})


return () => subscription.unsubscribe()
}, [])


const handleLogin = async (e) => {
e.preventDefault()
setLoading(true)
const { error } = await supabase.auth.signInWithPassword({ email, password })
if (error) showMessage(error.message)
else showMessage('Inicio de sesión exitoso')
setLoading(false)
}


const handleSignup = async () => {
setLoading(true)
const { error } = await supabase.auth.signUp({ email, password })
if (error) showMessage(error.message)
else showMessage('Registro exitoso. Revisa tu correo para confirmar.')
setLoading(false)
}


if (loading) {
return (
<div className="main-background">
<div className="app-container"><p className="loading-text">Cargando...</p></div>
</div>
)
}


if (!session) {
  return (
    <div className="app-container">
      <p>Cargando sesión...</p>
    </div>
  );
}
