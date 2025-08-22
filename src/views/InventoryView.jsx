import React from 'react';
import ThemedButton from '../components/ThemedButton';

export default function InventoryView({ inventory, handleEquipItem, handleUnequipItem, loading, setView, message }) {
  return (
    <div className="app-container">
      <h2>Inventario</h2>
      {message && <div className="message-box">{message}</div>}
      {inventory.length > 0 ? (
        inventory.map(item => (
          <div key={item.id}>
            <h3>{item.items.name}</h3>
            <p>Bonificación: {item.items.skill_bonus} +{item.items.bonus_value}</p>
            {!item.is_equipped ? (
              <ThemedButton onClick={() => handleEquipItem(item.id, item.items.skill_bonus)} disabled={loading}>Equipar</ThemedButton>
            ) : (
              <ThemedButton onClick={() => handleUnequipItem(item.id)} disabled={loading}>Desequipar</ThemedButton>
            )}
          </div>
        ))
      ) : (
        <p>Inventario vacío.</p>
      )}
      <button onClick={() => setView('dashboard')}>Volver</button>
    </div>
  );
}
