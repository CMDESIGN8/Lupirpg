import { useEffect, useState } from 'react'
import NavBar from './components/NavBar'
import LoadingScreen from './components/LoadingScreen'
import AuthView from './views/AuthView'
import CreateCharacterView from './views/CreateCharacterView'
import DashboardView from './views/DashboardView'
import MissionsView from './views/MissionsView'
import InventoryView from './views/InventoryView'
import MarketView from './views/MarketView'
import SellItemView from './views/SellItemView'
import TransferView from './views/TransferView'
import LeaderboardView from './views/LeaderboardView'
import ChatView from './views/ChatView'
import ClubsView from './views/ClubsView'
import CreateClubView from './views/CreateClubView'
import ClubDetailsView from './views/ClubDetailsView'
import { useSupabaseAuth, supabase } from './hooks/useSupabase'

function App(){
  const { login, signup, logout } = useSupabaseAuth()
  const [view, setView] = useState('auth')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Datos básicos en memoria (mock). Conectá a tu backend cuando quieras.
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [inventory, setInventory] = useState([])
  const [products, setProducts] = useState([
    { id:1, name:'Remera de entrenamiento', desc:'Indumentaria oficial', price: 25 },
    { id:2, name:'Botella Lupi', desc:'Hidratación pro', price: 10 },
  ])
  const [clubs, setClubs] = useState([
    { id:1, name:'Flores Club Futsal', city:'CABA', sport:'Fútbol', members: 42 },
  ])
  const [openedClub, setOpenedClub] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { setSession(data.session); setView('dashboard') }
    })
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
      setView(sess ? 'dashboard' : 'auth')
    })
    return () => authListener?.subscription.unsubscribe()
  }, [])

  async function handleLogin(email, password){
    setLoading(true); setMessage('')
    const { error } = await login(email, password)
    if (error) setMessage(error.message)
    setLoading(false)
  }
  async function handleSignup(email, password){
    setLoading(true); setMessage('')
    const { error } = await signup(email, password)
    if (error) setMessage(error.message)
    else setMessage('Revisá tu correo para confirmar la cuenta.')
    setLoading(false)
  }
  async function handleLogout(){ await logout(); setProfile(null) }

  function handleCreateCharacter({ username, position, sport, skills }){
    const wallet = { balance: 10, alias: `${username}.lupi` }
    setProfile({ username, position, sport, skills, wallet, level:1, xp:0, missionsDone:0 })
    setView('dashboard')
  }

  function completeMission(m){
    if(!profile) return
    const xp = (profile.xp||0) + 10
    const missionsDone = (profile.missionsDone||0) + 1
    const wallet = { ...profile.wallet, balance: (profile.wallet?.balance||0) + m.reward }
    setProfile({ ...profile, xp, missionsDone, wallet })
  }

  function buy(p){
    if(!profile) return
    if((profile.wallet?.balance||0) < p.price){ setMessage('Saldo insuficiente'); return }
    const wallet = { ...profile.wallet, balance: profile.wallet.balance - p.price }
    setProfile({ ...profile, wallet })
    setInventory([...inventory, { id:Date.now(), name:p.name, rarity:'Común' }])
  }

  function sell({ name, price }){
    setProducts([...products, { id:Date.now(), name, desc:'Publicado por vos', price }])
    setView('market')
  }

  function transfer({ to, amount }){
    if(!profile) return
    if(profile.wallet.balance < amount){ setMessage('Saldo insuficiente'); return }
    setProfile({ ...profile, wallet:{ ...profile.wallet, balance: profile.wallet.balance - amount } })
    setMessage(`Transferencia enviada a ${to} por ${amount} LC`)
  }

  function joinClub(c){ setMessage(`Te uniste a ${c.name}`) }

  function render(){
    if(loading) return <LoadingScreen />
    if(!session && view==='auth') return (
      <AuthView onLogin={handleLogin} onSignup={handleSignup} loading={loading} message={message} />
    )

    return (
      <>
        <NavBar view={view} setView={setView} extra={[{ key:'logout', label:'Salir', onClick:handleLogout }]} />
        {(!profile && view!=='auth' && view!=='create_character') && (
          <div className="container"><div className="card">Creá tu personaje para comenzar.</div></div>
        )}
        {view==='create_character' && <CreateCharacterView onCreate={handleCreateCharacter} />}
        {view==='dashboard' && <DashboardView profile={profile} />}
        {view==='missions' && <MissionsView onCompleteMission={completeMission} />}
        {view==='inventory' && <InventoryView items={inventory} />}
        {view==='market' && <MarketView products={products} onBuy={buy} />}
        {view==='sell' && <SellItemView onSell={sell} />}
        {view==='transfer' && <TransferView onTransfer={transfer} />}
        {view==='leaderboard' && <LeaderboardView entries={[{ id:1, username:'Lupi', level:9 }, { id:2, username: profile?.username||'Vos', level: profile?.level||1 }]} />}
        {view==='chat' && <ChatView onSend={(m)=>console.log('mensaje', m)} />}
        {view==='clubs' && (
          openedClub
            ? <ClubDetailsView club={openedClub} onJoin={joinClub} onBack={()=>setOpenedClub(null)} />
            : <ClubsView clubs={clubs} onOpen={setOpenedClub} onCreate={()=>setView('create_club')} />
        )}
        {view==='create_club' && <CreateClubView onCreate={(c)=>{ setClubs([...clubs, { id:Date.now(), members:1, ...c }]); setView('clubs') }} />}
      </>
    )
  }

  return render()
}

export default App
