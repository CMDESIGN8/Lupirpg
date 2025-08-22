import React from 'react';

export default function DashboardView({ setView }) {
  return (
    <div className="app-container">
      <h2>Dashboard</h2>
      <button onClick={() => setView('inventory')}>Ir al Inventario</button>
      <button onClick={() => setView('missions')}>Misiones</button>
      <button onClick={() => setView('market')}>Mercado</button>
      <button onClick={() => setView('transfer')}>Transferir Lupi Coins</button>
      <button onClick={() => setView('chat')}>Chat Global</button>
    </div>
  );
}
