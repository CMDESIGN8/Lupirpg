import { supabase } from "../lib/supabase";

// Enviar mensaje
export const sendMessage = async (senderId, content) => {
  const { data, error } = await supabase
    .from("messages")
    .insert({ sender_id: senderId, content });
  return { data, error };
};

// Obtener últimos mensajes
export const getMessages = async () => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  return { data, error };
};
