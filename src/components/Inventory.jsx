import React, { useState } from 'react';

const Inventory = ({ items, onUseItem, onEquipItem, onDropItem }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  const handleUseItem = () => {
    if (selectedItem) {
      onUseItem(selectedItem);
      setSelectedItem(null);
    }
  };

  const handleEquipItem = () => {
    if (selectedItem) {
      onEquipItem(selectedItem);
      setSelectedItem(null);
    }
  };

  const handleDropItem = () => {
    if (selectedItem) {
      onDropItem(selectedItem);
      setSelectedItem(null);
    }
  };

  return (
    <div className="inventory-panel">
      <h2>Inventario</h2>
      <div className="inventory-grid">
        {items.map((item, index) => (
          <div 
            key={index} 
            className={`inventory-slot ${selectedItem === item ? 'selected' : ''}`}
            onClick={() => handleItemClick(item)}
          >
            {item.icon && <img src={item.icon} alt={item.name} />}
            <span className="item-count">{item.count > 1 ? item.count : ''}</span>
          </div>
        ))}
      </div>
      
      {selectedItem && (
        <div className="item-actions">
          <h3>{selectedItem.name}</h3>
          <p>{selectedItem.description}</p>
          <button onClick={handleUseItem}>Usar</button>
          <button onClick={handleEquipItem}>Equipar</button>
          <button onClick={handleDropItem}>Tirar</button>
        </div>
      )}
    </div>
  );
};

export default Inventory;