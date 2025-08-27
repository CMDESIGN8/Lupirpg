import { useState } from 'react'

const TransferView = ({ onTransfer }) => {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState(1)
  return (
    <div className="container">
      <div className="card">
        <h3>Transferir Lupicoins</h3>
        <div className="grid" style={{ gap: 10 }}>
          <input className="input" placeholder="alias destino (usuario.lupi)" value={to} onChange={e=>setTo(e.target.value)} />
          <input className="input" type="number" min={1} value={amount} onChange={e=>setAmount(parseInt(e.target.value||1))} />
          <button className="btn btn-primary" onClick={()=>onTransfer({ to, amount })}>Transferir</button>
        </div>
      </div>
    </div>
  )
}
export default TransferView
