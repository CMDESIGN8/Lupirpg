const InventoryView = ({ items=[] }) => (
  <div className="container grid grid-3">
    {items.length===0 && <div className="card">Sin items por ahora.</div>}
    {items.map(it=> (
      <div key={it.id} className="card">
        <div style={{ fontWeight:700 }}>{it.name}</div>
        <div className="badge">Rareza: {it.rarity||'Común'}</div>
      </div>
    ))}
  </div>
)
export default InventoryView
