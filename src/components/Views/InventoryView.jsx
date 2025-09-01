import { Sword, Backpack, DollarSign, ChevronDown } from 'lucide-react';
import MessageDisplay from '../UI/MessageDisplay';
import '../styles/InventoryView.css';
import itemAssets from '../../utils/itemAssets';

const InventoryView = ({ inventory, handleEquipItem, handleUnequipItem, setItemToSell, setSellPrice, setView, loading, message,handleDropItem  }) => (
  <div className="inventory-container">
    <div className="inventory-box">
      <div className="inventory-header">
        <h2 className="inventory-title">INVENTARIO</h2>
      </div>
      
      <MessageDisplay message={message} />
      
      <div className="inventory-grid">
        {inventory.length > 0 ? (
          inventory.map(item => (
            <div key={item.id} className={`inventory-item ${item.is_equipped ? 'item-equipped' : ''}`}>
               {/* Imagen estilo RPG */}
  <div className="item-image-wrapper">
    <img
      src={itemAssets[item.items.name] || "/assets/items/default.png"}
      alt={item.items.name}
      className="item-image"
    />
  </div>
              <div className="item-header">
                <h3 className="item-name">{item.items.name}</h3>
                <p className="item-stats">
                  Bonificación: {item.items.skill_bonus} 
                  <span className="bonus-value"> +{item.items.bonus_value}</span>
                </p>
              </div>
              
              <div className="item-actions">
                {!item.is_equipped ? (
                  <button 
                    onClick={() => handleEquipItem(item.id, item.items.skill_bonus)} 
                    disabled={loading} 
                    className="equip-btn"
                  >
                    <Sword size={16} />
                    Equipar
                  </button>
                ) : (
                  <button 
                    onClick={() => handleUnequipItem(item.id)} 
                    disabled={loading} 
                    className="unequip-btn"
                  >
                    <Backpack size={16} />
                    Desequipar
                  </button>
                )}
                
                <button 
                  onClick={() => { setItemToSell(item); setSellPrice(''); setView('sell_item'); }} 
                  disabled={item.is_equipped || loading} 
                  className="sell-btn"
                >
                  <DollarSign size={16} />
                  Vender
                </button>
                <button 
  onClick={() => handleDropItem(item.id)} 
  disabled={loading} 
  className="drop-btn"
>
  Tirar item
</button>
              </div>
            </div>
          ))
        ) : (
          <div className="inventory-empty">
            <p>Tu inventario está vacío.</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-center mt-6">
        <button 
          onClick={() => setView('dashboard')} 
          className="back-btn"
        >
          <ChevronDown size={20} />
          Volver al Dashboard
        </button>
      </div>
    </div>
  </div>
);

export default InventoryView;