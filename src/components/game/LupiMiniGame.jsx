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
        this.createSkyTexture();
        this.createPlayerTexture();
        this.createCoinTexture();
      }

      createSkyTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const colorTop = 0x87CEFA;
        const colorBottom = 0x4682B4;
        const height = 600;
        for (let i = 0; i < height; i++) {
          const t = i / height;
          const color = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(colorTop),
            Phaser.Display.Color.ValueToColor(colorBottom),
            1,
            t
          );
          g.lineStyle(1, Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
          g.beginPath();
          g.moveTo(0, i);
          g.lineTo(800, i);
          g.strokePath();
        }
        g.generateTexture("sky", 800, 600);
        g.destroy();
      }

      createPlayerTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xFF6F61, 1);
        g.fillRoundedRect(0, 0, 32, 48, 8);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(8, 12, 4);
        g.fillCircle(24, 12, 4);
        g.fillStyle(0x000000, 1);
        g.fillCircle(8, 12, 2);
        g.fillCircle(24, 12, 2);
        g.generateTexture("player", 32, 48);
        g.destroy();
      }

      createCoinTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xFFD700, 1);
        g.fillCircle(16, 16, 16);
        g.fillStyle(0xFFFFE0, 0.6);
        g.fillCircle(12, 12, 8);
        g.generateTexture("coin", 32, 32);
        g.destroy();
      }

      create() {
        // Ajustar escala a pantalla completa y centrado
        this.cameras.main.setBackgroundColor("#87CEFA");
        const { width, height } = this.scale;
        this.add.image(width / 2, height / 2, "sky").setDisplaySize(width, height);

        // Jugador
        this.player = this.physics.add.sprite(width / 2, height / 2, "player").setScale(1.5);
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.3); // rebote suave

        // Grupo de monedas
        this.coins = this.physics.add.group();
        for (let i = 0; i < requiredCoins; i++) {
          const x = Phaser.Math.Between(50, width - 50);
          const y = Phaser.Math.Between(50, height - 50);
          const coin = this.coins.create(x, y, "coin");
          coin.setScale(1.2);
        }

        // Texto de puntuación
        this.score = 0;
        this.scoreText = this.add.text(20, 20, `Monedas: ${this.score}/${requiredCoins}`, {
          fontSize: "28px",
          fill: "#ffffff",
          stroke: "#000000",
          strokeThickness: 6
        }).setScrollFactor(0);

        // Colisiones
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

        // Controles
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
          up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
          down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
          left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
          right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
      }

      update() {
        this.player.setVelocity(0);

        // Movimiento
        let moving = false;
        const speed = 300;
        if (this.cursors.left.isDown || this.wasd.left.isDown) {
          this.player.setVelocityX(-speed);
          moving = true;
        }
        if (this.cursors.right.isDown || this.wasd.right.isDown) {
          this.player.setVelocityX(speed);
          moving = true;
        }
        if (this.cursors.up.isDown || this.wasd.up.isDown) {
          this.player.setVelocityY(-speed);
          moving = true;
        }
        if (this.cursors.down.isDown || this.wasd.down.isDown) {
          this.player.setVelocityY(speed);
          moving = true;
        }

        // Animación ligera de "saltito" cuando se mueve
        if (moving) {
          this.player.y += Math.sin(this.time.now / 100) * 0.5;
        }

        // Animación de monedas girando
        this.coins.getChildren().forEach((coin) => {
          coin.rotation += 0.05;
        });
      }

      collectCoin(player, coin) {
        coin.disableBody(true, true);
        this.score++;
        this.scoreText.setText(`Monedas: ${this.score}/${requiredCoins}`);

        if (this.score >= requiredCoins) {
          this.cameras.main.flash(500, 255, 215, 0); // dorado
          this.time.delayedCall(800, () => {
            if (typeof onFinish === "function") onFinish();
          });
        }
      }
    }

    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: "lupi-game-container",
      physics: { default: "arcade", arcade: { gravity: { y: 0 }, debug: false } },
      scene: MiniScene,
      scale: {
        mode: Phaser.Scale.RESIZE, // escala automáticamente al tamaño de ventana
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        try { gameRef.current.destroy(true); } 
        catch (e) { console.warn("Error al destruir juego Phaser:", e); }
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
      <div id="lupi-game-container" className="game-canvas" style={{ width: '100vw', height: '100vh' }} />
      <div className="game-controls">
        <button onClick={onCancel} className="cancel-button">Salir del juego</button>
      </div>
    </div>
  );
};

export default LupiMiniGame;
