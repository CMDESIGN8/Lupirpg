// components/game/RewardChest.jsx
import { X, Gift, Award, Zap, Coins, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import '../styles/cofre.css';

const RewardChest = ({ items, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showItems, setShowItems] = useState(false);

  useEffect(() => {
    // Animación de apertura del cofre
    const openTimer = setTimeout(() => {
      setIsOpen(true);
    }, 500);

    // Mostrar items después de que el cofre se abra
    const itemsTimer = setTimeout(() => {
      setShowItems(true);
    }, 1500);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(itemsTimer);
    };
  }, []);

  const getItemIcon = (itemType) => {
    switch (itemType?.toLowerCase()) {
      case 'weapon': return <Zap size={24} />;
      case 'armor': return <Shield size={24} />;
      case 'currency': return <Coins size={24} />;
      case 'special': return <Star size={24} />;
      default: return <Gift size={24} />;
    }
  };

  return (
    <div className="reward-chest-container">
      <div className={`chest ${isOpen ? 'open' : ''}`}>
        <div className="chest-lid"></div>
        <div className="chest-body"></div>
        
        {isOpen && (
          <div className="chest-glow">
            <div className="glow-1"></div>
            <div className="glow-2"></div>
            <div className="glow-3"></div>
          </div>
        )}
      </div>

      <div className={`reward-content ${showItems ? 'visible' : ''}`}>
        <h2>¡Felicidades!</h2>
        <p>Has obtenido {items.length} objetos{items.length > 1 ? 's' : ''}:</p>
        
        <div className="reward-items-grid">
          {items.map((item, index) => (
            <div 
              key={index} 
              className="reward-item"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="item-icon">
                {getItemIcon(item.type)}
              </div>
              <div className="item-details">
                <div className="item-name">{item.name}</div>
                <div className="item-type">{item.type}</div>
                {item.bonus_value && (
                  <div className="item-bonus">+{item.bonus_value}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <button className="reward-collect-btn" onClick={onClose}>
          <Award size={18} />
          Recoger recompensa
        </button>
      </div>

      <button className="reward-close-btn" onClick={onClose}>
        <X size={20} />
      </button>
    </div>
  );
};

export default RewardChest;