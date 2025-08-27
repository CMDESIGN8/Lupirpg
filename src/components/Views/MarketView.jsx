import { ShoppingCart, DollarSign, ChevronDown, Wallet } from 'lucide-react'; // Correcto
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';

const MarketView = ({ marketItems, handleBuyItem, playerData, loading, message, setView }) => (
  <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 font-sans">
    <div className="w-full max-w-5xl p-8 bg-white rounded-lg shadow-xl border border-gray-300">
      <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Mercado</h2>
      <MessageDisplay message={message} />
      <div className="flex justify-end mb-4">
        <ThemedButton onClick={() => setView('sell_item')} icon={<DollarSign size={16} />} className="bg-amber-500 hover:bg-amber-400">Vender Objeto</ThemedButton>
      </div>
      {loading ? <p className="text-center text-gray-500">Cargando mercado...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketItems.length > 0 ? marketItems.map(listing => (
            <div key={listing.id} className="bg-gray-100 p-4 rounded-lg shadow-inner border border-gray-300">
              <h3 className="text-lg font-semibold text-blue-600">{listing.player_items.items.name}</h3>
              <p className="text-sm text-gray-500">Bonificación: {listing.player_items.items.skill_bonus} <span className="text-green-600">+{listing.player_items.items.bonus_value}</span></p>
              <p className="text-sm text-gray-500">Vendedor: <span className="text-blue-800">{listing.players.username}</span></p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold text-amber-500 flex items-center gap-1"><Wallet size={16} />{listing.price} Lupi Coins</span>
                <ThemedButton onClick={() => handleBuyItem(listing)} disabled={loading || playerData.id === listing.seller_id} icon={<ShoppingCart size={16} />} className="bg-green-600 hover:bg-green-500">Comprar</ThemedButton>
              </div>
            </div>
          )) : <div className="col-span-full text-center py-8"><p className="text-gray-500">No hay objetos en el mercado.</p></div>}
        </div>
      )}
      <div className="flex justify-center mt-6">
        <ThemedButton onClick={() => setView('dashboard')} icon={<ChevronDown size={20} />}>Volver</ThemedButton>
      </div>
    </div>
  </div>
);

export default MarketView;