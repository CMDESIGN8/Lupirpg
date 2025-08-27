const ClubsView = ({ clubs=[], onOpen, onCreate }) => (
  <div className="container grid" style={{ gap: 12 }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <h3>Clubes</h3>
      <button className="btn btn-primary" onClick={onCreate}>Crear club</button>
    </div>
    <div className="grid grid-3">
      {clubs.length===0 && <div className="card">No hay clubes aún.</div>}
      {clubs.map(c=> (
        <div key={c.id} className="card">
          <div style={{ fontWeight:700 }}>{c.name}</div>
          <div className="badge">Socios: {c.members||0}</div>
          <div style={{ marginTop:8 }}>
            <button className="btn btn-primary" onClick={()=>onOpen(c)}>Ver detalles</button>
          </div>
        </div>
      ))}
    </div>
  </div>
)
export default ClubsView
