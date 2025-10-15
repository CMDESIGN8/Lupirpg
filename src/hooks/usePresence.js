import { useEffect, useState, useRef } from "react";

export function usePresence(supabase, currentUser) {
  const [users, setUsers] = useState([]);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel("room")
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const userList = Object.values(state)
          .flat()
          .map(u => u.user);
        setUsers(userList);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        setUsers(prev => [...prev, ...newPresences.map(p => p.user)]);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        setUsers(prev => prev.filter(u => !leftPresences.some(p => p.user.id === u.id)));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user: currentUser });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, currentUser]);

  return { users, channelRef };
}
