import { useState, useEffect } from 'react';
import { X, Check, ShoppingCart, Star } from 'lucide-react';
import { avatarService } from '../../services/avatarService';
import './AvatarSelector.css';

const AvatarSelector = ({ playerId, currentAvatar, onClose, onAvatarChange }) => {
  const [avatars, setAvatars] = useState([]);
  const [playerAvatars, setPlayerAvatars] = useState([]);
  const [loading, setLoading] = useState(false);

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
      setPlayerAvatars(ownedAvatars);
    } catch (error) {
      console.error('Error loading avatars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEquipAvatar = async (avatarId) => {
    try {
      await avatarService.equipAvatar(playerId, avatarId);
      onAvatarChange();
      onClose();
    } catch (error) {
      console.error('Error equipping avatar:', error);
    }
  };

  const handlePurchaseAvatar = async (avatar) => {
    try {
      await avatarService.purchaseAvatar(playerId, avatar.id);
      await loadAvatars(); // Recargar la lista
    } catch (error) {
      console.error('Error purchasing avatar:', error);
    }
  };

  const isOwned = (avatarId) => {
    return playerAvatars.some(pa => pa.avatar_id === avatarId);
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

  return (
    <div className="avatar-selector-overlay">
      <div className="avatar-selector">
        <div className="selector-header">
          <h2>SELECTOR DE AVATAR</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="avatars-grid">
          {avatars.map(avatar => {
            const owned = isOwned(avatar.id);
            const equipped = currentAvatar?.avatar_id === avatar.id;
            
            return (
              <div key={avatar.id} className="avatar-item">
                <div 
                  className="avatar-image-container"
                  style={{ borderColor: getRarityColor(avatar.rarity) }}
                >
                  <img src={avatar.image_url} alt={avatar.name} />
                  
                  {equipped && (
                    <div className="equipped-badge">
                      <Check size={16} />
                    </div>
                  )}
                  
                  {!owned && (
                    <div className="price-tag">
                      <ShoppingCart size={14} />
                      {avatar.price} LupiCoins
                    </div>
                  )}
                </div>

                <div className="avatar-info">
                  <h4>{avatar.name}</h4>
                  <p className="avatar-rarity" style={{ color: getRarityColor(avatar.rarity) }}>
                    {avatar.rarity.toUpperCase()}
                  </p>
                  <p className="avatar-description">{avatar.description}</p>
                </div>

                <div className="avatar-actions">
                  {owned ? (
                    <button
                      onClick={() => handleEquipAvatar(avatar.id)}
                      disabled={equipped}
                      className={equipped ? 'equipped-btn' : 'equip-btn'}
                    >
                      {equipped ? 'Equipado' : 'Equipar'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchaseAvatar(avatar)}
                      className="purchase-btn"
                    >
                      Comprar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;