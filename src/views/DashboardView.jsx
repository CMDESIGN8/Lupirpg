import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const DashboardView = () => {
  const { player, signOut } = useAuth();

  if (!player) return <p>Cargando...</p>;

  return (
    <div className="p-4">
      <h1>Bienvenido {player.username}</h1>
      <p>Nivel {player.level} | XP: {player.experience} | Coins: {player.lupi_coins}</p>
      <button onClick={signOut}>Salir</button>

      <nav className="mt-4">
        <ul className="space-y-2">
          <li><Link to="/clubs">🏟️ Ver clubes</Link></li>
          <li><Link to="/missions">🎯 Misiones</Link></li>
          <li><Link to="/inventory">🎒 Inventario</Link></li>
          <li><Link to="/chat">💬 Chat</Link></li>
          <li><Link to="/market">🛒 Marketplace</Link></li>
        </ul>
      </nav>

      <div className="mt-6">
        <Link to="/train">
          <button>🏋️ Entrenar (subir de nivel)</button>
        </Link>
      </div>
    </div>
  );
};

export default DashboardView;
