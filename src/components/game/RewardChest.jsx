// components/game/RewardChest.jsx
import { X } from 'lucide-react';

const RewardChest = ({ items, onClose }) => {
  return (
    <div className="reward-chest">
      <button className="reward-close-btn" onClick={onClose}>
        <X size={20} />
      </button>
      
      <h2>¡Felicidades!</h2>
      <p>Has encontrado {items.length} objetos:</p>
      
      <div className="reward-items-grid">
        {items.map((item, index) => (
          <div key={index} className="reward-item">
            <div className="item-icon">🎁</div>
            <div className="item-name">{item.name}</div>
            <div className="item-type">{item.type}</div>
            {item.bonus_value && (
              <div className="item-bonus">+{item.bonus_value}</div>
            )}
          </div>
        ))}
      </div>
      
      <button className="reward-collect-btn" onClick={onClose}>
        Recoger y cerrar
      </button>
    </div>
  );
};

export default RewardChest;