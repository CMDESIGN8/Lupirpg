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
        // Crear texturas programáticamente
        this.createSkyTexture();
        this.createPlayerTexture();
        this.createCoinTexture();
      }

      createSkyTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        // Fondo degradado azul cielo
        const colorTop = 0x87CEFA; // azul claro
        const colorBottom = 0x4682B4; // azul más oscuro
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
        // Cuerpo principal
        g.fillStyle(0xFF6F61, 1); // color coral
        g.fillRoundedRect(0, 0, 32, 48, 8);
        // Ojos
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
        // Moneda dorada con brillo
        g.fillStyle(0xFFD700, 1);
        g.fillCircle(16, 16, 16);
        // Brillo
        g.fillStyle(0xFFFFE0, 0.6);
        g.fillCircle(12, 12, 8);
        g.generateTexture("coin", 32, 32);
        g.destroy();
      }

      create() {
        // Fondo
        this.add.image(400, 300, "sky");

        // Jugador
        this.player = this.physics.add.sprite(400, 300, "player").setScale(1.2);
        this.player.setCollideWorldBounds(true);

        // Grupo de monedas
        this.coins = this.physics.add.group();
        for (let i = 0; i < requiredCoins; i++) {
          const x = Phaser.Math.Between(50, 750);
          const y = Phaser.Math.Between(50, 550);
          this.coins.create(x, y, "coin");
        }

        // Texto de puntuación
        this.score = 0;
        this.scoreText = this.add.text(16, 16, `Monedas: ${this.score}/${requiredCoins}`, {
          fontSize: "22px",
          fill: "#ffffff",
          stroke: "#000000",
          strokeThickness: 5
        });

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

        // Flechas
        if (this.cursors.left.isDown) this.player.setVelocityX(-300);
        if (this.cursors.right.isDown) this.player.setVelocityX(300);
        if (this.cursors.up.isDown) this.player.setVelocityY(-300);
        if (this.cursors.down.isDown) this.player.setVelocityY(300);

        // WASD
        if (this.wasd.left.isDown) this.player.setVelocityX(-300);
        if (this.wasd.right.isDown) this.player.setVelocityX(300);
        if (this.wasd.up.isDown) this.player.setVelocityY(-300);
        if (this.wasd.down.isDown) this.player.setVelocityY(300);
      }

      collectCoin(player, coin) {
        coin.disableBody(true, true);
        this.score++;
        this.scoreText.setText(`Monedas: ${this.score}/${requiredCoins}`);

        if (this.score >= requiredCoins) {
          this.cameras.main.flash(500, 255, 215, 0); // flash dorado
          this.time.delayedCall(800, () => {
            if (typeof onFinish === "function") onFinish();
          });
        }
      }
    }

    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: "lupi-game-container",
      physics: { default: "arcade", arcade: { gravity: { y: 0 }, debug: false } },
      scene: MiniScene
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
      <div id="lupi-game-container" className="game-canvas" />
      <div className="game-controls">
        <button onClick={onCancel} className="cancel-button">Salir del juego</button>
      </div>
    </div>
  );
};

export default LupiMiniGame;
