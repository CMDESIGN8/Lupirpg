import { supabase } from "../lib/supabase";

// Listar items
export const getItems = async () => {
  const { data, error } = await supabase.from("items").select("*");
  return { data, error };
};

// Dar item a jugador
export const giveItemToPlayer = async (playerId, itemId) => {
  const { data, error } = await supabase
    .from("player_items")
    .insert({ player_id: playerId, item_id: itemId });
  return { data, error };
};
