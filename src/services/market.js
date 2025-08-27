import { supabase } from "../lib/supabase";

// Publicar item en el mercado
export const listMarketItem = async (playerItemId, sellerId, price) => {
  const { data, error } = await supabase.from("market_listings").insert([
    { player_item_id: playerItemId, seller_id: sellerId, price }
  ]);
  return { data, error };
};

// Obtener mercado
export const getMarket = async () => {
  const { data, error } = await supabase.from("market_listings").select(`
    id,
    price,
    created_at,
    player_items ( id, item_id, items ( name, skill_bonus, bonus_value ) )
  `);
  return { data, error };
};
