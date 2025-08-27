import { Sword, Backpack, DollarSign, ChevronDown } from 'lucide-react'; // Swords -> Sword
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';

const InventoryView = ({ inventory, handleEquipItem, handleUnequipItem, setItemToSell, setSellPrice, setView, loading, message }) => (
  <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 font-sans">
    <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-xl border border-gray-300">
      <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Inventario</h2>
      <MessageDisplay message={message} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventory.length > 0 ? (
          inventory.map(item => (
            <div key={item.id} className="bg-gray-100 p-4 rounded-lg shadow-inner border border-gray-300">
              <h3 className="text-lg font-semibold text-blue-600">{item.items.name}</h3>
              <p className="text-sm text-gray-500">Bonificación: {item.items.skill_bonus} <span className="text-green-600">+{item.items.bonus_value}</span></p>
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                {!item.is_equipped ? (
  <ThemedButton onClick={() => handleEquipItem(item.id, item.items.skill_bonus)} disabled={loading} icon={<Sword size={16} />} className="flex-1 bg-blue-600 hover:bg-blue-500">Equipar</ThemedButton>
) : (
  <ThemedButton onClick={() => handleUnequipItem(item.id)} disabled={loading} icon={<Backpack size={16} />} className="flex-1 bg-red-600 hover:bg-red-500">Desequipar</ThemedButton>
)}
                <ThemedButton onClick={() => { setItemToSell(item); setSellPrice(''); setView('sell_item'); }} disabled={item.is_equipped || loading} icon={<DollarSign size={16} />} className={`flex-1 bg-amber-500 hover:bg-amber-400 ${item.is_equipped ? 'disabled:bg-gray-400 disabled:text-gray-600' : ''}`}>Vender</ThemedButton>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8"><p className="text-gray-500">Tu inventario está vacío.</p></div>
        )}
      </div>
      <div className="flex justify-center mt-6">
        <ThemedButton onClick={() => setView('dashboard')} icon={<ChevronDown size={20} />}>Volver</ThemedButton>
      </div>
    </div>
  </div>
);

export default InventoryView;