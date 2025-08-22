import React from 'react';
import ThemedButton from '../components/ThemedButton';

export default function MarketView({
  marketItems,
  handleBuyItem,
  playerData,
  loading,
  setView,
  message
}) {
  return (
    <div className="app-container">
      <h2>Mercado</h2>
      {message && <div className="message-box">{message}</div>}
      {loading ? <p>Cargando mercado...</p> : (
        marketItems.length > 0 ? (
          marketItems.map(listing => (
            <div key={listing.id}>
              <h3>{listing.player_items.items.name}</h3>
              <p>Bonificación: {listing.player_items.items.skill_bonus} +{listing.player_items.items.bonus_value}</p>
              <p>Vendedor: {listing.players.username}</p>
              <span>{listing.price} Lupi Coins</span>
              <ThemedButton
                onClick={() => handleBuyItem(listing)}
                disabled={loading || playerData.id === listing.seller_id}
              >
                Comprar
              </ThemedButton>
            </div>
          ))
        ) : <p>No hay objetos en el mercado.</p>
      )}
      <button onClick={() => setView('dashboard')}>Volver</button>
    </div>
  );
}
