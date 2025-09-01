// components/game/RewardChest.jsx
import React from 'react';
import { X, Gift, Award, Zap, Coins, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import '../styles/cofre.css';

const RewardChest = ({ items, onClose }) => {
  // Función de seguridad
  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    } else {
      console.error('onClose is not a function');
    }
  };

  return (
    <div className="reward-chest">
      <div className="particles">
  {[...Array(15)].map((_, i) => (
    <div
      key={i}
      className="particle"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 3}s`
      }}
    />
  ))}
</div>
      <button className="reward-close-btn" onClick={handleClose}>
        <X size={20} />
      </button>
      
      <div className="chest-animation">
        <div className="chest-icon">🎁</div>
        <div className="chest-glows">
          <div className="glow-1"></div>
          <div className="glow-2"></div>
          <div className="glow-3"></div>
        </div>
      </div>
      
      <h2>¡Felicidades!</h2>
      <p>Has encontrado {items.length} objeto(s):</p>
      
      <div className="reward-items-grid">
        {items.map((item, index) => (
          <div key={index} className="reward-item">
            <div className="item-icon">
              <Gift size={24} />
            </div>
            <div className="item-details">
              <div className="item-name">{item.name || `Item ${index + 1}`}</div>
              <div className="item-type">{item.type || 'Recompensa'}</div>
              {item.bonus_value && (
                <div className="item-bonus">+{item.bonus_value}</div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <button className="reward-collect-btn" onClick={handleClose}>
        <Award size={18} />
        Recoger recompensa
      </button>
    </div>
  );
};

export default RewardChest;