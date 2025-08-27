import { useState } from 'react'

const ChatView = ({ onSend }) => {
  const [text, setText] = useState('')
  const [msgs, setMsgs] = useState([])

  function send(){
    if(!text.trim()) return
    const m = { id: Date.now(), text }
    setMsgs(x=>[...x,m])
    onSend?.(m)
    setText('')
  }

  return (
    <div className="container grid" style={{ gap: 10 }}>
      <div className="card" style={{ minHeight: 280 }}>
        {msgs.length===0? 'Sin mensajes todavía.' : msgs.map(m=> (
          <div key={m.id} style={{ padding:'6px 0', borderBottom:'1px solid #f1f5f9' }}>{m.text}</div>
        ))}
      </div>
      <div className="grid grid-2">
        <input className="input" placeholder="Escribí un mensaje" value={text} onChange={e=>setText(e.target.value)} />
        <button className="btn btn-primary" onClick={send}>Enviar</button>
      </div>
    </div>
  )
}
export default ChatView
