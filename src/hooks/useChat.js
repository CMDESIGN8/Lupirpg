import { useEffect, useState } from "react";

export function useChat(supabase, channelRef, currentUser) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!channelRef.current) return;

    const channel = channelRef.current;

    channel.on("broadcast", { event: "chat" }, (payload) => {
      setMessages(prev => [...prev, payload.payload]);
    });

    return () => {
      channel.off("broadcast", { event: "chat" });
    };
  }, [channelRef]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    await channelRef.current.send({
      type: "broadcast",
      event: "chat",
      payload: { user: currentUser, message: text, timestamp: new Date().toISOString() },
    });
  };

  return { messages, sendMessage };
}
