const MissionsView = ({ onCompleteMission }) => {
  const missions = [
    { id:1, title:'Correr 2km', reward: 5 },
    { id:2, title:'50 abdominales', reward: 3 },
    { id:3, title:'Asistir al entrenamiento', reward: 8 },
  ]
  return (
    <div className="container grid" style={{ gap: 12 }}>
      {missions.map(m=> (
        <div key={m.id} className="card" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontWeight:700 }}>{m.title}</div>
            <div className="badge">+{m.reward} LC</div>
          </div>
          <button className="btn btn-primary" onClick={()=>onCompleteMission(m)}>Completar</button>
        </div>
      ))}
    </div>
  )
}
export default MissionsView
