import { DollarSign, ChevronDown } from 'lucide-react'; // Correcto
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';

const SellItemView = ({ inventory, marketItems, handleSellItem, itemToSell, setItemToSell, sellPrice, setSellPrice, loading, message, setView }) => {
  const availableForSale = inventory.filter(item => !marketItems.some(listing => listing.player_item_id === item.id));
  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 font-sans">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-xl border border-gray-300">
        <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Vender Objeto</h2>
        <MessageDisplay message={message} />
        <form onSubmit={handleSellItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Selecciona un Objeto</label>
            <select onChange={(e) => { const selectedItem = availableForSale.find(item => String(item.id) === e.target.value); setItemToSell(selectedItem); }} value={itemToSell ? itemToSell.id : ''} className="mt-1 w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" required>
              <option value="" disabled>-- Elige un objeto --</option>
              {availableForSale.map(item => (
                <option key={item.id} value={item.id}>{item.items.name} (+{item.items.bonus_value} {item.items.skill_bonus})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio de Venta (LupiCoins)</label>
            <input type="number" placeholder="100" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} className="mt-1 w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" required />
          </div>
          <ThemedButton type="submit" disabled={loading} icon={<DollarSign size={20} />} className="w-full bg-amber-500 hover:bg-amber-400">
            {loading ? 'Listando...' : 'Poner en venta'}
          </ThemedButton>
        </form>
        <div className="flex justify-center mt-6">
          <ThemedButton onClick={() => setView('market')} icon={<ChevronDown size={20} />}>Volver al Mercado</ThemedButton>
        </div>
        </div>
    </div>
  );
};

export default SellItemView;