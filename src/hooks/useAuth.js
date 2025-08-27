import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { createPlayer, getPlayer } from "../services/players";

export const useAuth = () => {
  const [session, setSession] = useState(null);
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user) {
        await ensurePlayer(data.session.user);
      }
    };
    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          await ensurePlayer(session.user);
        } else {
          setPlayer(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // 👇 Esta función se asegura de que siempre exista el player
  const ensurePlayer = async (user) => {
    let { data: p } = await getPlayer(user.id);

    if (!p) {
      console.log("⚠️ No existe player, creando uno nuevo...");
      await createPlayer(
        user.id,
        user.user_metadata?.username || user.email.split("@")[0] // usa username si existe, sino email
      );
      const { data: newP } = await getPlayer(user.id);
      p = newP;
    }

    setPlayer(p);
  };

  const signUp = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (data.user) {
      await ensurePlayer(data.user);
    }

    return { data, error };
  };

  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setPlayer(null);
  };

  return { session, player, signUp, signIn, signOut };
};
