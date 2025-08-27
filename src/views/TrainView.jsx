import { useAuth } from "../hooks/useAuth";
import { updatePlayer } from "../services/players";

const TrainView = () => {
  const { player } = useAuth();

  const handleTrain = async () => {
    await updatePlayer(player.id, { 
      level: player.level + 1, 
      experience: player.experience + 50,
      skill_points: player.skill_points + 2
    });
    alert("¡Has entrenado y subido de nivel!");
    window.location.reload();
  };

  return (
    <div className="p-4">
      <h2>Entrenamiento</h2>
      <p>Sube de nivel a tu jugador entrenando duro 💪</p>
      <button onClick={handleTrain}>Entrenar</button>
    </div>
  );
};

export default TrainView;
