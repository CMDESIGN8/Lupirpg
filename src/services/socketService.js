import { io } from "socket.io-client";

const socket = io("https://lupirpgbackend.onrender.com", { transports: ["websocket"] });

export const connectPlayer = (user) => {
  socket.emit("newPlayer", {
    userId: user.id,
    username: user.username,
    avatar_url: user.avatar_url || "default_avatar.png",
    x: 100,
    y: 100,
  });
};

export const sendMove = (x, y) => {
  socket.emit("move", { x, y });
};

export const sendMessage = (msg) => {
  socket.emit("chatMessage", msg);
};

export const onChatMessage = (callback) => {
  socket.on("chatMessage", callback);
};

export const onPlayersUpdate = (callback) => {
  socket.on("updatePlayers", callback);
};

export const onDisconnect = (callback) => {
  socket.on("playerLeft", callback);
};

export default socket;
