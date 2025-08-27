const ClubDetailsView = ({ club, onJoin, onBack }) => {
  if(!club) return <div className="container"><div className="card">No hay club seleccionado.</div></div>
  return (
    <div className="container grid" style={{ gap: 12 }}>
      <button className="btn btn-ghost" onClick={onBack}>← Volver</button>
      <div className="card">
        <h3>{club.name}</h3>
        <div>Ciudad: <strong>{club.city}</strong></div>
        <div>Deporte: <span className="badge">{club.sport}</span></div>
        <div style={{ marginTop:8 }}>
          <button className="btn btn-primary" onClick={()=>onJoin(club)}>Unirme</button>
        </div>
      </div>
    </div>
  )
}
export default ClubDetailsView
