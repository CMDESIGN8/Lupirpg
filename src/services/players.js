import { supabase } from "../lib/supabase";

export const createPlayer = async (userId, username) => {
  const { data, error } = await supabase.from("players").insert([
    {
      id: userId, // mismo ID que auth.users
      username,
      level: 1,
      experience: 0,
      lupi_coins: 100,
      skill_points: 5
    }
  ]);
  return { data, error };
};
