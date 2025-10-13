import { Sword, Backpack, DollarSign, ChevronDown } from 'lucide-react';
import MessageDisplay from '../UI/MessageDisplay';
import '../styles/InventoryView.css';
import itemAssets from '../../utils/itemAssets';

const InventoryView = ({ 
  inventory, 
  setInventory, 
  showMessage, 
  loadInventory, 
  setView, 
  loading, 
  handleDropItem 
}) => {
  const toggleEquip = async (item) => {
    try {
      const res = await fetch(
        "https://lupirpgbackend.onrender.com/api/inventory/equip",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ player_item_id: item.id, equip: !item.is_equipped }),
        }
      );
      const result = await res.json();
      if (result.success) {
        showMessage(item.is_equipped ? "Ítem desequipado" : "Ítem equipado");
        loadInventory(); // recarga inventario actualizado
      } else {
        showMessage("Error al equipar/desequipar el ítem");
      }
    } catch (err) {
      console.error("Error equipando ítem:", err);
      showMessage("Error al comunicarse con el servidor");
    }
  };

  return (
    <div className="inventory-container">
      <div className="inventory-box">
        <div className="inventory-header">
          <h2 className="inventory-title">INVENTARIO</h2>
        </div>

        <MessageDisplay message={loading ? "Cargando inventario..." : ""} />

        <div className="inventory-grid">
          {inventory.length === 0 ? (
            <div className="inventory-empty">
              <p>Tu inventario está vacío.</p>
            </div>
          ) : (
            inventory.map((item) => (
              <div key={item.id} className={`inventory-item ${item.is_equipped ? 'item-equipped' : ''}`}>
                <div className="item-image-wrapper">
                  <img
                    src={item.items.image_url || "/assets/items/default.png"}
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
                  <button 
                    onClick={() => toggleEquip(item)} 
                    disabled={loading} 
                    className={item.is_equipped ? "unequip-btn" : "equip-btn"}
                  >
                    {item.is_equipped ? <Backpack size={16} /> : <Sword size={16} />}
                    {item.is_equipped ? "Desequipar" : "Equipar"}
                  </button>

                  <button 
                    onClick={() => handleDropItem(item.id)} 
                    disabled={loading} 
                    className="drop-btn"
                  >
                    Tirar item
                  </button>

                  {/* Opcional: vender item */}
                  {/* <button 
                    onClick={() => {/* tu lógica de venta */}} 
                    disabled={item.is_equipped || loading} 
                    className="sell-btn"
                  >
                    <DollarSign size={16} />
                    Vender
                  </button> */}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-center mt-6">
          <button onClick={() => setView('dashboard')} className="back-btn">
            <ChevronDown size={20} />
            Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryView;
