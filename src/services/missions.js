import { supabase } from "../lib/supabase";

export const getMissions = async () => {
  return await supabase.from("missions").select("*");
};

export const completeMission = async (playerId, missionId) => {
  return await supabase.from("player_missions").insert({
    player_id: playerId,
    mission_id: missionId,
    is_completed: true
  });
};
