import { supabase } from "../lib/supabase";

// Obtener misiones
export const getMissions = async () => {
  const { data, error } = await supabase.from("missions").select("*");
  return { data, error };
};

// Completar misión
export const completeMission = async (playerId, missionId) => {
  const { data, error } = await supabase
    .from("player_missions")
    .insert({ player_id: playerId, mission_id: missionId, is_completed: true });
  return { data, error };
};
