import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updatePlayer } from "../services/players";
import { useAuth } from "../hooks/useAuth";

const CreateCharacterView = () => {
  const { player } = useAuth();
  const navigate = useNavigate();
  const [sport, setSport] = useState("Fútbol");
  const [position, setPosition] = useState("Delantero");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updatePlayer(player.id, { sport, position });
    navigate("/dashboard");
  };

  return (
    <div className="p-4">
      <h1>Crear tu personaje</h1>
      <form onSubmit={handleSubmit}>
        <label>Deporte</label>
        <select value={sport} onChange={(e) => setSport(e.target.value)}>
          <option>Fútbol</option>
          <option>Voley</option>
          <option>Basket</option>
        </select>

        <label>Posición</label>
        <select value={position} onChange={(e) => setPosition(e.target.value)}>
          <option>Delantero</option>
          <option>Mediocampista</option>
          <option>Arquero</option>
          <option>Neutro</option>
        </select>

        <button type="submit">Confirmar personaje</button>
      </form>
    </div>
  );
};

export default CreateCharacterView;
