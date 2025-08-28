import React, { useState, useEffect } from 'react';
import { X, Check, ShoppingCart, Star, Zap } from 'lucide-react';
import { avatarService } from '../../services/avatarService';
import '../styles/AvatarSelector.css';

const AvatarSelector = ({ playerId, currentAvatar, onClose, onAvatarChange }) => {
  const [avatars, setAvatars] = useState([]);
  const [playerAvatars, setPlayerAvatars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAvatars();
  }, []);

  const loadAvatars = async () => {
    try {
      setLoading(true);
      const [allAvatars, ownedAvatars] = await Promise.all([
        avatarService.getAllAvatars(),
        avatarService.getPlayerAvatars(playerId)
      ]);
      
      setAvatars(allAvatars);
      setPlayerAvatars(ownedAvatars || []);
    } catch (error) {
      console.error('Error loading avatars:', error);
      setMessage('Error al cargar los avatares');
    } finally {
      setLoading(false);
    }
  };

  const handleEquipAvatar = async (avatarId) => {
    try {
      setLoading(true);
      await avatarService.equipAvatar(playerId, avatarId);
      setMessage('¡Avatar equipado con éxito!');
      setTimeout(() => {
        onAvatarChange();
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error equipping avatar:', error);
      setMessage(error.message || 'Error al equipar el avatar');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseAvatar = async (avatar) => {
    try {
      setLoading(true);
      await avatarService.purchaseAvatar(playerId, avatar.id);
      setMessage(`¡Has comprado ${avatar.name} por ${avatar.price} LupiCoins!`);
      // Recargar la lista de avatares
      await loadAvatars();
    } catch (error) {
      console.error('Error purchasing avatar:', error);
      setMessage(error.message || 'Error al comprar el avatar');
    } finally {
      setLoading(false);
    }
  };

  const isOwned = (avatarId) => {
    return playerAvatars.some(pa => pa.avatar_id === avatarId);
  };

  const isEquipped = (avatarId) => {
    return currentAvatar?.avatar_id === avatarId;
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#ffffff',
      rare: '#0070dd',
      epic: '#a335ee',
      legendary: '#ff8000'
    };
    return colors[rarity] || '#ffffff';
  };

  const getRarityName = (rarity) => {
    const names = {
      common: 'Común',
      rare: 'Raro',
      epic: 'Épico',
      legendary: 'Legendario'
    };
    return names[rarity] || 'Común';
  };

  const getRarityIcon = (rarity) => {
    const icons = {
      common: '⭐',
      rare: '🌟🌟',
      epic: '🌟🌟🌟',
      legendary: '🌟🌟🌟🌟'
    };
    return icons[rarity] || '⭐';
  };

  return (
    <div className="avatar-selector-overlay">
      <div className="avatar-selector">
        <div className="selector-header">
          <h2>SELECTOR DE AVATAR</h2>
          <button className="close-btn" onClick={onClose} disabled={loading}>
            <X size={24} />
          </button>
        </div>

        {message && (
          <div className="selector-message">
            {message}
          </div>
        )}

        <div className="selector-tabs">
          <div className="tab active">
            <Zap size={18} />
            Mis Avatares
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando avatares...</p>
          </div>
        ) : (
          <div className="avatars-grid">
            {avatars.map(avatar => {
              const owned = isOwned(avatar.id);
              const equipped = isEquipped(avatar.id);
              const canBuy = !owned;
              
              return (
                <div 
                  key={avatar.id} 
                  className={`avatar-item ${equipped ? 'equipped' : ''} ${!owned ? 'not-owned' : ''}`}
                  style={{ borderColor: getRarityColor(avatar.rarity) }}
                >
                  <div className="avatar-image-container">
                    <img 
                      src={avatar.image_url} 
                      alt={avatar.name}
                      className="avatar-image"
                    />
                    
                    <div 
                      className="rarity-badge"
                      style={{ backgroundColor: getRarityColor(avatar.rarity) }}
                    >
                      {getRarityIcon(avatar.rarity)}
                    </div>

                    {equipped && (
                      <div className="equipped-badge">
                        <Check size={16} />
                        <span>Equipado</span>
                      </div>
                    )}

                    {!owned && (
                      <div className="price-overlay">
                        <div className="price-tag">
                          <ShoppingCart size={14} />
                          {avatar.price} LupiCoins
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="avatar-info">
                    <h3 className="avatar-name">{avatar.name}</h3>
                    <p className="avatar-rarity" style={{ color: getRarityColor(avatar.rarity) }}>
                      {getRarityName(avatar.rarity)}
                    </p>
                    <p className="avatar-description">{avatar.description}</p>
                    
                    {avatar.required_level > 1 && (
                      <div className="level-requirement">
                        Nivel {avatar.required_level}+ requerido
                      </div>
                    )}
                  </div>

                  <div className="avatar-actions">
                    {owned ? (
                      <button
                        onClick={() => handleEquipAvatar(avatar.id)}
                        disabled={loading || equipped}
                        className={equipped ? 'equipped-btn' : 'equip-btn'}
                      >
                        {equipped ? 'Equipado' : 'Equipar'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePurchaseAvatar(avatar)}
                        disabled={loading}
                        className="purchase-btn"
                      >
                        <ShoppingCart size={16} />
                        Comprar
                      </button>
                    )}
                  </div>

                  {!owned && (
                    <div className="avatar-stats">
                      <div className="stat">
                        <Star size={14} />
                        <span>Rareza: {getRarityName(avatar.rarity)}</span>
                      </div>
                      <div className="stat">
                        <span>Nivel req.: {avatar.required_level}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="selector-footer">
          <button 
            onClick={onClose}
            className="close-selector-btn"
            disabled={loading}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;