// src/components/game/LupiMiniGame.jsx
import React, { useEffect, useRef } from "react";
import Phaser from "phaser";
import '../styles/lupigame.css';

const LupiMiniGame = ({ requiredCoins = 5, onFinish, onCancel }) => {
  const gameRef = useRef(null);

  useEffect(() => {
    if (gameRef.current) return;

    class MiniScene extends Phaser.Scene {
      constructor() { 
        super({ key: "MiniScene" }); 
      }

      preload() {
        // Usar recursos locales o de un CDN confiable
        this.load.image("sky", "https://assets.phaser.io/skies/sky4.png");
        
        // Imágenes alternativas que sabemos que funcionan
        this.load.image("player", "https://assets.phaser.io/sprites/phaser-dude.png");
        
        // Crear monedas programáticamente en lugar de cargar imágenes
        // que pueden no estar disponibles
        this.createCoinTexture();
      }

      createCoinTexture() {
        // Crear textura para monedas programáticamente
        const coinGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        coinGraphics.fillStyle(0xFFD700, 1.0); // Dorado
        coinGraphics.fillCircle(16, 16, 16); // Círculo de 32x32
        coinGraphics.generateTexture("coin", 32, 32);
        coinGraphics.destroy();
      }

      create() {
        // Fondo
        this.add.image(400, 300, "sky");
        
        // Jugador
        this.player = this.physics.add.sprite(400, 300, "player").setScale(0.5);
        this.player.setCollideWorldBounds(true);

        // Grupo de monedas
        this.coins = this.physics.add.group();
        
        // Crear monedas en posiciones aleatorias
        for (let i = 0; i < requiredCoins; i++) {
          const x = Phaser.Math.Between(50, 750);
          const y = Phaser.Math.Between(50, 550);
          this.coins.create(x, y, "coin");
        }

        // Texto de puntuación
        this.score = 0;
        this.scoreText = this.add.text(16, 16, `Monedas: ${this.score}/${requiredCoins}`, { 
          fontSize: "20px", 
          fill: "#fff",
          stroke: "#000",
          strokeThickness: 4
        });

        // Colisiones
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

        // Controles
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // También agregar controles WASD
        this.wasd = {
          up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
          down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
          left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
          right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
      }

      update() {
        // Reiniciar velocidad
        this.player.setVelocity(0);
        
        // Controles flechas
        if (this.cursors.left.isDown) this.player.setVelocityX(-300);
        if (this.cursors.right.isDown) this.player.setVelocityX(300);
        if (this.cursors.up.isDown) this.player.setVelocityY(-300);
        if (this.cursors.down.isDown) this.player.setVelocityY(300);
        
        // Controles WASD
        if (this.wasd.left.isDown) this.player.setVelocityX(-300);
        if (this.wasd.right.isDown) this.player.setVelocityX(300);
        if (this.wasd.up.isDown) this.player.setVelocityY(-300);
        if (this.wasd.down.isDown) this.player.setVelocityY(300);
      }

      collectCoin(player, coin) {
        coin.disableBody(true, true);
        this.score++;
        
        // Efecto de sonido (podrías agregar uno)
        // this.sound.play('collect-sound');
        
        this.scoreText.setText(`Monedas: ${this.score}/${requiredCoins}`);
        
        if (this.score >= requiredCoins) {
          // Pequeña animación de finalización
          this.cameras.main.flash(500, 0, 255, 0);
          
          // Esperar un momento antes de finalizar
          this.time.delayedCall(800, () => {
            if (typeof onFinish === "function") {
              onFinish();
            }
          });
        }
      }
    }

    // Configuración del juego
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: "lupi-game-container",
      physics: { 
        default: "arcade", 
        arcade: { 
          gravity: { y: 0 },
          debug: false // Cambiar a true para ver hitboxes durante desarrollo
        } 
      },
      scene: MiniScene,
      // Configuración para evitar problemas de CORS
      loader: {
        crossOrigin: "anonymous"
      }
    };

    // Crear juego
    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        try { 
          gameRef.current.destroy(true); 
        } catch (e) { 
          console.warn("Error al destruir juego Phaser:", e);
        }
        gameRef.current = null;
      }
    };
  }, [onFinish, requiredCoins]);

  return (
    <div className="mini-game-container">
      <div className="game-instructions">
        <h3>¡Recolecta todas las monedas!</h3>
        <p>Usa las flechas o WASD para moverte</p>
      </div>
      
      <div id="lupi-game-container" className="game-canvas" />
      
      <div className="game-controls">
        <button onClick={onCancel} className="cancel-button">
          Salir del juego
        </button>
      </div>
    </div>
  );
};

export default LupiMiniGame;