import { createPlayer } from "../services/players";

const signUp = async (email, password, username) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } }
  });

  if (data.user) {
    // Crear jugador en tabla players
    await createPlayer(data.user.id, username);
  }

  return { data, error };
};
