import { supabase } from "../lib/supabase";

// Crear un club
export const createClub = async (name, description, ownerId) => {
  const { data, error } = await supabase.from("clubs").insert([
    { name, description, owner_id: ownerId }
  ]);
  return { data, error };
};

// Listar todos los clubes
export const getClubs = async () => {
  const { data, error } = await supabase.from("clubs").select("*");
  return { data, error };
};

// Unirse a un club
export const joinClub = async (playerId, clubId) => {
  const { data, error } = await supabase
    .from("players")
    .update({ club_id: clubId })
    .eq("id", playerId);
  return { data, error };
};
