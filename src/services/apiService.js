// src/services/apiService.js
const API_BASE = "http://localhost:5000"; // Cambiar cuando lo deployes

export const apiService = {
  // === PLAYER ===
  getPlayer: async (userId) => {
    const res = await fetch(`${API_BASE}/api/player/${userId}`);
    return res.json();
  },

  getAvatars: async (userId) => {
    const res = await fetch(`${API_BASE}/api/player/${userId}/avatars`);
    return res.json();
  },

  getClub: async (userId) => {
    const res = await fetch(`${API_BASE}/api/player/${userId}/club`);
    return res.json();
  },

  // === INVENTORY ===
  getInventory: async (userId) => {
    const res = await fetch(`${API_BASE}/api/inventory/${userId}`);
    return res.json();
  },

  addItem: async (player_id, item_id) => {
    const res = await fetch(`${API_BASE}/api/inventory/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_id, item_id }),
    });
    return res.json();
  },

  equipItem: async (player_item_id, equip) => {
    const res = await fetch(`${API_BASE}/api/inventory/equip`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_item_id, equip }),
    });
    return res.json();
  },

  // === MISSIONS ===
  getPlayerMissions: async (userId) => {
    const res = await fetch(`${API_BASE}/api/player/${userId}/missions`);
    return res.json();
  },

  getAllMissions: async () => {
    const res = await fetch(`${API_BASE}/api/missions`);
    return res.json();
  },

  // === ITEMS ===
  getAllItems: async () => {
    const res = await fetch(`${API_BASE}/api/items`);
    return res.json();
  },
};
