import { useState } from 'react'
import ThemedButton from '../components/ThemedButton'
import { positions, sports, skillNames, initialSkillPoints } from "../constants";

const CreateCharacterView = ({ onCreate }) => {
  const [username, setUsername] = useState('')
  const [position, setPosition] = useState(positions[4])
  const [sport, setSport] = useState(sports[0])
  const [skills, setSkills] = useState(Object.fromEntries(skillNames.map(n=>[n,0])))
  const [remaining, setRemaining] = useState(initialSkillPoints)

  function inc(k){ if(remaining>0){ setSkills(s=>({...s,[k]:s[k]+1})); setRemaining(r=>r-1) } }
  function dec(k){ if(skills[k]>0){ setSkills(s=>({...s,[k]:s[k]-1})); setRemaining(r=>r+1) } }

  function handleCreate(){ onCreate({ username, position, sport, skills }) }

  return (
    <div className="container">
      <div className="grid grid-2">
        <div className="card">
          <h3>Creación de Personaje</h3>
          <div className="grid" style={{ gap: 12 }}>
            <input className="input" placeholder="Nombre de usuario" value={username} onChange={e=>setUsername(e.target.value)} />
            <select className="input" value={position} onChange={e=>setPosition(e.target.value)}>
              {positions.map(p=> <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="input" value={sport} onChange={e=>setSport(e.target.value)}>
              {sports.map(s=> <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="card">
          <h3>Skills • <span className="badge">Disponibles: {remaining}</span></h3>
          <div className="grid" style={{ gap: 8 }}>
            {skillNames.map((k)=> (
              <div key={k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                <span style={{ width: 140 }}>{k}</span>
                <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                  <button className="btn" onClick={()=>dec(k)}>-</button>
                  <strong>{skills[k]}</strong>
                  <button className="btn" onClick={()=>inc(k)}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <ThemedButton onClick={handleCreate} disabled={!username || remaining!==0}>Crear personaje</ThemedButton>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateCharacterView
