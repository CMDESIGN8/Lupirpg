import { useState } from 'react'

const CreateClubView = ({ onCreate }) => {
  const [name, setName] = useState('')
  const [sport, setSport] = useState('Fútbol')
  const [city, setCity] = useState('')
  return (
    <div className="container">
      <div className="card">
        <h3>Crear Club</h3>
        <div className="grid" style={{ gap: 10 }}>
          <input className="input" placeholder="Nombre" value={name} onChange={e=>setName(e.target.value)} />
          <input className="input" placeholder="Ciudad" value={city} onChange={e=>setCity(e.target.value)} />
          <select className="input" value={sport} onChange={e=>setSport(e.target.value)}>
            {['Fútbol','Voley','Handball','Hockey','Rugby','Fitness'].map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-primary" onClick={()=>onCreate({ name, city, sport })}>Crear</button>
        </div>
      </div>
    </div>
  )
}
export default CreateClubView
