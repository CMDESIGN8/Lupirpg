import PlayerCard from '../components/PlayerCard'

const DashboardView = ({ profile }) => {
  if(!profile) return <div className="container"><div className="card">No hay perfil aún. Creá tu personaje.</div></div>
  return (
    <div className="container">
      <div className="grid grid-3">
        <PlayerCard username={profile.username} level={profile.level||1} position={profile.position} sport={profile.sport} skills={profile.skills||{}} />
        <div className="card">
          <h3>Wallet</h3>
          <div>Lupicoins: <strong>{profile.wallet?.balance ?? 0}</strong></div>
          <div>Alias: <span className="badge">{profile.wallet?.alias || `${profile.username}.lupi`}</span></div>
        </div>
        <div className="card">
          <h3>Progreso</h3>
          <div>XP: <strong>{profile.xp ?? 0}</strong></div>
          <div>Misiones completadas: <strong>{profile.missionsDone ?? 0}</strong></div>
        </div>
      </div>
    </div>
  )
}

export default DashboardView
