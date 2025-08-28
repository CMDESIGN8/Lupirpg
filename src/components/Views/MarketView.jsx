import { ShoppingCart, DollarSign, ChevronDown, Wallet } from 'lucide-react'; // Correcto
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';
import { avatarService } from '../../services/avatarService';
import '../styles/MarketView.css';
import React, { useState, useEffect } from 'react';
import { Package } from "lucide-react";
import { User } from "lucide-react";


const MarketView = ({ marketItems, handleBuyItem, playerData, loading, message, setView }) => {
  const [activeTab, setActiveTab] = useState('items');
  const [avatars, setAvatars] = useState([]);
  const [avatarsLoading, setAvatarsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'avatars') {
      loadAvatars();
    }
  }, [activeTab]);

  const loadAvatars = async () => {
    try {
      setAvatarsLoading(true);
      const avatarsData = await avatarService.getAllAvatars();
      setAvatars(avatarsData);
    } catch (error) {
      console.error('Error loading avatars:', error);
    } finally {
      setAvatarsLoading(false);
    }
  };

  const handleBuyAvatar = async (avatar) => {
  try {
    const purchased = await avatarService.purchaseAvatar(playerData.id, avatar.id);
    
    // Actualiza las LupiCoins en tiempo real
    setPlayerData(prev => ({
      ...prev,
      lupi_coins: prev.lupi_coins - avatar.price
    }));

    // Recargar los avatares después de la compra
    loadAvatars();

    // Mostrar mensaje de éxito
    alert(`¡Has comprado el avatar ${avatar.name} por ${avatar.price} LupiCoins!`);
  } catch (error) {
    console.error('Error buying avatar:', error);
    alert(error.message);
  }
};


  const canBuyItem = (item) => {
    return playerData.id !== item.seller_id && playerData.lupi_coins >= item.price;
  };

  const canBuyAvatar = (avatar) => {
    return playerData.lupi_coins >= avatar.price && playerData.level >= avatar.required_level;
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

  return (
    <div className="market-container">
      <div className="market-box">
        <div className="market-header">
          <h2 className="market-title">MERCADO LUPI</h2>
          <div className="market-balance">
            <Wallet size={20} />
            <span className="balance-amount">{playerData?.lupi_coins || 0}</span>
            <span className="balance-text">LupiCoins</span>
          </div>
        </div>

        <MessageDisplay message={message} />

        <div className="market-tabs">
          <button 
            className={`tab-button ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            <Package size={18} />
            Objetos
          </button>
          <button 
            className={`tab-button ${activeTab === 'avatars' ? 'active' : ''}`}
            onClick={() => setActiveTab('avatars')}
          >
            <User size={18} />
            Avatares
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'items' && (
            <>
              <div className="market-actions">
                <button 
                  onClick={() => setView('sell_item')} 
                  className="sell-button"
                >
                  <DollarSign size={16} />
                  Vender Objeto
                </button>
              </div>

              {loading ? (
                <div className="loading-state">
                  <p>Cargando objetos del mercado...</p>
                </div>
              ) : (
                <div className="items-grid">
                  {marketItems.length > 0 ? (
                    marketItems.map(listing => (
                      <div key={listing.id} className="market-item">
                        <div className="item-header">
                          <h3 className="item-name">{listing.player_items.items.name}</h3>
                          <p className="item-bonus">
                            {listing.player_items.items.skill_bonus} 
                            <span className="bonus-value">+{listing.player_items.items.bonus_value}</span>
                          </p>
                        </div>

                        <div className="item-seller">
                          <span className="seller-label">Vendedor:</span>
                          <span className="seller-name">{listing.players.username}</span>
                        </div>

                        <div className="item-price">
                          <Wallet size={16} />
                          <span className="price-amount">{listing.price}</span>
                          <span className="price-currency">LupiCoins</span>
                        </div>

                        <button 
                          onClick={() => handleBuyItem(listing)} 
                          disabled={loading || !canBuyItem(listing)}
                          className="buy-button"
                        >
                          <ShoppingCart size={16} />
                          {canBuyItem(listing) ? 'Comprar' : 'No disponible'}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <Package size={48} />
                      <p>No hay objetos en el mercado</p>
                      <small>¡Sé el primero en vender algo!</small>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'avatars' && (
            <>
              {avatarsLoading ? (
                <div className="loading-state">
                  <p>Cargando avatares...</p>
                </div>
              ) : (
                <div className="avatars-grid">
                  {avatars.map(avatar => (
                    <div 
                      key={avatar.id} 
                      className="avatar-item"
                      style={{ borderColor: getRarityColor(avatar.rarity) }}
                    >
                      <div className="avatar-image">
                        <img src={avatar.image_url} alt={avatar.name} />
                        <div 
                          className="rarity-badge"
                          style={{ backgroundColor: getRarityColor(avatar.rarity) }}
                        >
                          {getRarityName(avatar.rarity)}
                        </div>
                      </div>

                      <div className="avatar-info">
                        <h3 className="avatar-name">{avatar.name}</h3>
                        <p className="avatar-description">{avatar.description}</p>
                        <div className="avatar-requirements">
                          <span className="level-requirement">Nvl. {avatar.required_level}+</span>
                        </div>
                      </div>

                      <div className="avatar-price">
                        <Wallet size={16} />
                        <span className="price-amount">{avatar.price}</span>
                        <span className="price-currency">LupiCoins</span>
                      </div>

                      <button 
                        onClick={() => handleBuyAvatar(avatar)}
                        disabled={!canBuyAvatar(avatar)}
                        className="buy-avatar-button"
                      >
                        <ShoppingCart size={16} />
                        {canBuyAvatar(avatar) ? 'Comprar' : 'No disponible'}
                      </button>

                      {!canBuyAvatar(avatar) && (
                        <div className="unavailable-reason">
                          {playerData.lupi_coins < avatar.price ? 'Fondos insuficientes' : 'Nivel insuficiente'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="market-footer">
          <button 
            onClick={() => setView('dashboard')} 
            className="back-button"
          >
            <ChevronDown size={20} />
            Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketView;