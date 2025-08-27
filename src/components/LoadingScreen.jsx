const LoadingScreen = ({ text = 'Cargando...' }) => (
  <div className="container" style={{ display:'grid', placeItems:'center', minHeight:'60vh' }}>
    <div className="card" style={{ textAlign:'center' }}>
      <div className="badge" style={{ marginBottom: 8 }}>LUPI</div>
      <div style={{ fontWeight:800, fontSize:24 }}>{text}</div>
    </div>
  </div>
)
export default LoadingScreen
