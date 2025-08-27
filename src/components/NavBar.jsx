import { Home, UserPlus, Trophy, ShoppingCart, Sword, Users, MessageSquare, Boxes, Wallet } from 'lucide-react'

const items = [
  { key:'dashboard', label:'Inicio', icon:<Home size={18} /> },
  { key:'missions', label:'Misiones', icon:<Sword size={18} /> },
  { key:'inventory', label:'Inventario', icon:<Boxes size={18} /> },
  { key:'market', label:'Marketplace', icon:<ShoppingCart size={18} /> },
  { key:'transfer', label:'Transferir', icon:<Wallet size={18} /> },
  { key:'leaderboard', label:'Ranking', icon:<Trophy size={18} /> },
  { key:'clubs', label:'Clubes', icon:<Users size={18} /> },
  { key:'chat', label:'Chat', icon:<MessageSquare size={18} /> },
]

const NavBar = ({ view, setView, extra=[] }) => {
  return (
    <nav className="nav">
      {items.map(it => (
        <button key={it.key} onClick={() => setView(it.key)} className={view===it.key?'active':''}>
          {it.icon} {it.label}
        </button>
      ))}
      {extra.map(it => (
        <button key={it.key} onClick={it.onClick} className={it.active?'active':''}>
          {it.icon} {it.label}
        </button>
      ))}
    </nav>
  )
}

export default NavBar
