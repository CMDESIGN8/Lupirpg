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
        // Crear todos los recursos programáticamente para evitar problemas de CORS
        this.createSkyTexture();
        this.createPlayerTexture();
        this.createCoinTexture();
      }

      createSkyTexture() {
        // Crear textura para el cielo (fondo azul gradiente)
        const skyGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        
        // Crear gradiente
        const gradient = skyGraphics.createGradient(0, 0, 800, 600, 0x1a365d, 0x2d3748, 0x4a5568);
        skyGraphics.fillGradientStyle(0x1a365d, 0x2d3748, 0x4a5568, 0x718096, 1);
        skyGraphics.fillRect(0, 0, 800, 600);
        
        // Agregar algunas estrellas
        skyGraphics.fillStyle(0xFFFFFF, 1);
        for (let i = 0; i < 100; i++) {
          const x = Phaser.Math.Between(0, 800);
          const y = Phaser.Math.Between(0, 600);
          const size = Phaser.Math.FloatBetween(0.5, 2);
          skyGraphics.fillCircle(x, y, size);
        }
        
        skyGraphics.generateTexture("sky", 800, 600);
        skyGraphics.destroy();
      }

      createPlayerTexture() {
        // Crear textura para el jugador (un círculo con detalles)
        const playerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        
        // Cuerpo principal
        playerGraphics.fillStyle(0x00FF7F, 1.0); // Verde esmeralda
        playerGraphics.fillCircle(20, 20, 20);
        
        // Detalles
        playerGraphics.fillStyle(0xFFFFFF, 1.0);
        playerGraphics.fillCircle(14, 14, 4); // Ojo izquierdo
        playerGraphics.fillCircle(26, 14, 4); // Ojo derecho
        
        playerGraphics.generateTexture("player", 40, 40);
        playerGraphics.destroy();
      }

      createCoinTexture() {
        // Crear textura para monedas
        const coinGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        
        // Círculo dorado
        coinGraphics.fillStyle(0xFFD700, 1.0);
        coinGraphics.fillCircle(16, 16, 16);
        
        // Brillo
        coinGraphics.fillStyle(0xFFFFFF, 0.8);
        coinGraphics.fillCircle(10, 10, 5);
        
        coinGraphics.generateTexture("coin", 32, 32);
        coinGraphics.destroy();
      }

      create() {
        // Fondo
        this.add.image(400, 300, "sky");
        
        // Jugador
        this.player = this.physics.add.sprite(400, 300, "player");
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.2);

        // Grupo de monedas
        this.coins = this.physics.add.group();
        
        // Crear monedas en posiciones aleatorias
        for (let i = 0; i < requiredCoins; i++) {
          const x = Phaser.Math.Between(50, 750);
          const y = Phaser.Math.Between(50, 550);
          const coin = this.coins.create(x, y, "coin");
          coin.setBounce(Phaser.Math.FloatBetween(0.4, 0.8));
        }

        // Texto de puntuación
        this.score = 0;
        this.scoreText = this.add.text(16, 16, `Monedas: ${this.score}/${requiredCoins}`, { 
          fontSize: "24px", 
          fill: "#FFD700",
          fontFamily: "Arial",
          stroke: "#000",
          strokeThickness: 4
        });

        // Colisiones
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

        // Controles
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Controles WASD
        this.wasd = {
          up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
          down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
          left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
          right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };

        // Instrucciones de controles
        this.controlsText = this.add.text(16, 50, "Controles: Flechas o WASD", {
          fontSize: "16px",
          fill: "#FFFFFF",
          fontFamily: "Arial"
        });
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
        
        // Efecto de partículas al recoger moneda
        const particles = this.add.particles(coin.x, coin.y, "coin", {
          speed: { min: -200, max: 200 },
          scale: { start: 0.5, end: 0 },
          blendMode: 'ADD',
          lifespan: 500,
          quantity: 5
        });
        
        this.time.delayedCall(500, () => {
          particles.destroy();
        });
        
        this.scoreText.setText(`Monedas: ${this.score}/${requiredCoins}`);
        
        if (this.score >= requiredCoins) {
          // Animación de finalización
          this.cameras.main.flash(500, 0, 255, 0);
          this.cameras.main.shake(300, 0.01);
          
          // Esperar un momento antes de finalizar
          this.time.delayedCall(1000, () => {
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
          debug: false
        } 
      },
      scene: MiniScene,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
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
    <div className="game-modal-overlay">
      <div className="mini-game-container">
        <div className="game-instructions">
          <h3>¡Recolecta todas las monedas!</h3>
          <p>Usa las flechas o WASD para moverte</p>
        </div>
        
        <div className="game-canvas-container">
          <div id="lupi-game-container" className="game-canvas" />
        </div>
        
        <div className="game-controls">
          <button onClick={onCancel} className="cancel-button">
            Salir del juego
          </button>
        </div>
      </div>
    </div>
  );
};

export default LupiMiniGame;