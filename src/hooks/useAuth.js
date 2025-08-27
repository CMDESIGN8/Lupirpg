import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { createPlayer, getPlayer } from "../services/players";

export const useAuth = () => {
  const [session, setSession] = useState(null);
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user) {
        const { data: p } = await getPlayer(data.session.user.id);
        setPlayer(p);
      }
    };
    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          const { data: p } = await getPlayer(session.user.id);
          setPlayer(p);
        } else {
          setPlayer(null);
        }
      }
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });
    if (data.user) {
      await createPlayer(data.user.id, username);
      const { data: p } = await getPlayer(data.user.id);
      setPlayer(p);
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
