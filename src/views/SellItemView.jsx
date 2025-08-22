import React from 'react';
import ThemedButton from '../components/ThemedButton';

export default function SellItemView({
  inventory,
  marketItems,
  itemToSell,
  setItemToSell,
  sellPrice,
  setSellPrice,
  handleSellItem,
  loading,
  setView,
  message
}) {
  const availableForSale = inventory.filter(item => !marketItems.some(listing => listing.player_item_id === item.id));

  return (
    <div className="app-container">
      <h2>Vender Objeto</h2>
      {message && <div className="message-box">{message}</div>}
      <form onSubmit={handleSellItem}>
        <select
          value={itemToSell ? itemToSell.id : ''}
          onChange={(e) => setItemToSell(availableForSale.find(item => String(item.id) === e.target.value))}
          required
        >
          <option value="" disabled>-- Elige un objeto --</option>
          {availableForSale.map(item => (
            <option key={item.id} value={item.id}>
              {item.items.name} (+{item.items.bonus_value} {item.items.skill_bonus})
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Precio"
          value={sellPrice}
          onChange={(e) => setSellPrice(e.target.value)}
          required
        />
        <ThemedButton type="submit" disabled={loading}>
          {loading ? 'Listando...' : 'Poner en venta'}
        </ThemedButton>
      </form>
      <button onClick={() => setView('market')}>Volver al Mercado</button>
    </div>
  );
}
