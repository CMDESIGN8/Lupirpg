const MarketView = ({ products=[], onBuy }) => (
  <div className="container grid grid-3">
    {products.length===0 && <div className="card">No hay productos aún.</div>}
    {products.map(p=> (
      <div key={p.id} className="card">
        <div style={{ fontWeight:700 }}>{p.name}</div>
        <div style={{ opacity:.7 }}>{p.desc}</div>
        <div className="badge">{p.price} LC</div>
        <div style={{ marginTop:8 }}>
          <button className="btn btn-primary" onClick={()=>onBuy(p)}>Comprar</button>
        </div>
      </div>
    ))}
  </div>
)
export default MarketView
