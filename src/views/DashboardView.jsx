import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { getMissions } from "../services/missions";

const DashboardView = () => {
  const { player, signOut } = useAuth();
  const [missions, setMissions] = useState([]);

  useEffect(() => {
    const loadMissions = async () => {
      const { data } = await getMissions();
      setMissions(data || []);
    };
    loadMissions();
  }, []);

  if (!player) return <p>No hay jugador cargado</p>;

  return (
    <div className="p-4">
      <h1>Bienvenido {player.username}</h1>
      <p>Nivel: {player.level} | Coins: {player.lupi_coins}</p>
      <button onClick={signOut}>Salir</button>

      <h2>Misiones disponibles</h2>
      <ul>
        {missions.map((m) => (
          <li key={m.id}>{m.name} - {m.description} (+{m.xp_reward} XP)</li>
        ))}
      </ul>
    </div>
  );
};

export default DashboardView;
