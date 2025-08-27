import { useState } from 'react'

const SellItemView = ({ onSell }) => {
  const [name, setName] = useState('')
  const [price, setPrice] = useState(1)
  return (
    <div className="container">
      <div className="card">
        <h3>Publicar en Marketplace</h3>
        <div className="grid" style={{ gap: 10 }}>
          <input className="input" placeholder="Nombre del item" value={name} onChange={e=>setName(e.target.value)} />
          <input className="input" type="number" min={1} value={price} onChange={e=>setPrice(parseInt(e.target.value||1))} />
          <button className="btn btn-primary" onClick={()=>onSell({ name, price })}>Publicar</button>
        </div>
      </div>
    </div>
  )
}
export default SellItemView
