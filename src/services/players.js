import { supabase } from "../lib/supabase";

// Crear jugador después del signup
export const createPlayer = async (userId, username, position = "Neutro", sport = "Fútbol") => {
  const { data, error } = await supabase.from("players").insert([
    {
      id: userId,
      username,
      position,
      sport,
      level: 1,
      experience: 0,
      skill_points: 5,
      lupi_coins: 100
    }
  ]);
  return { data, error };
};

// Obtener jugador por id
export const getPlayer = async (userId) => {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", userId)
    .single();
  return { data, error };
};

// Actualizar stats del jugador
export const updatePlayer = async (userId, fields) => {
  const { data, error } = await supabase
    .from("players")
    .update(fields)
    .eq("id", userId);
  return { data, error };
};
