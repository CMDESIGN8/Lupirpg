import React from 'react';
import ThemedButton from '../components/ThemedButton';

export default function TransferView({
  lupiCoins,
  recipientAddress,
  setRecipientAddress,
  transferAmount,
  setTransferAmount,
  handleTransferCoins,
  loading,
  setView,
  message
}) {
  return (
    <div className="app-container">
      <h2>Transferir Lupi Coins</h2>
      {message && <div className="message-box">{message}</div>}
      <p>Tu saldo: {lupiCoins} Lupi Coins</p>
      <form onSubmit={handleTransferCoins}>
        <input
          type="text"
          placeholder="Nombre de usuario"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Cantidad"
          value={transferAmount}
          onChange={(e) => setTransferAmount(e.target.value)}
          required
        />
        <ThemedButton type="submit" disabled={loading}>
          {loading ? 'Transfiriendo...' : 'Confirmar Transferencia'}
        </ThemedButton>
      </form>
      <button onClick={() => setView('dashboard')}>Volver</button>
    </div>
  );
}
