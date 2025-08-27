import { supabase } from "../lib/supabase.js";

export const createPlayer = async (userId, username) => {
  return await supabase.from("players").insert([
    {
      id: userId,
      username,
      level: 1,
      experience: 0,
      lupi_coins: 100,
      skill_points: 5,
      position: "Neutro",
      sport: "Fútbol",
    },
  ]);
};

export const getPlayer = async (userId) => {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", userId)
    .single();
  return { data, error };
};
