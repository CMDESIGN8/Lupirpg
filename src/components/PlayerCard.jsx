const Stat = ({ name, value }) => (
  <div style={{ display:'flex', justifyContent:'space-between' }}>
    <span>{name}</span>
    <strong>{value}</strong>
  </div>
)

const PlayerCard = ({ username='Jugador', level=1, position='Neutro', sport='Fútbol', skills={} }) => {
  return (
    <div className="card" style={{ width: 320, borderRadius: 16, background: 'linear-gradient(135deg,#f0f9ff,#e0e7ff)' }}>
      <div className="badge" style={{ marginBottom: 8 }}>{sport}</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{username} • Lv {level}</div>
      <div style={{ opacity:.7, marginBottom:12 }}>{position}</div>
      <div className="grid" style={{ gap: 8 }}>
        {Object.entries(skills).map(([k,v]) => <Stat key={k} name={k} value={v} />)}
      </div>
    </div>
  )
}

export default PlayerCard
