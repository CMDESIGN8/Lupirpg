// src/components/game/LupiMiniGame.jsx
import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

const LupiMiniGame = ({ requiredCoins = 5, onFinish, onCancel }) => {
  const gameRef = useRef(null);

  useEffect(() => {
    if (gameRef.current) return;

    class MiniScene extends Phaser.Scene {
      constructor() { super("MiniScene"); }

      preload() {
        this.load.image("sky", "https://labs.phaser.io/assets/skies/sky4.png");
        this.load.image("player", "https://labs.phaser.io/assets/sprites/phaser-dude.png");
        this.load.image("coin", "https://labs.phaser.io/assets/sprites/gold_1.png");
      }

      create() {
        this.add.image(400, 300, "sky");
        this.player = this.physics.add.sprite(400, 300, "player").setScale(1);
        this.player.setCollideWorldBounds(true);

        this.coins = this.physics.add.group({
          key: "coin",
          repeat: requiredCoins - 1,
          setXY: { x: 80, y: 100, stepX: 140 }
        });

        this.score = 0;
        this.scoreText = this.add.text(16, 16, `Monedas: ${this.score}/${requiredCoins}`, { fontSize: "20px", fill: "#000" });

        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

        this.cursors = this.input.keyboard.createCursorKeys();
        // expose onFinish for scene
        this.reactOnFinish = () => {
          if (typeof onFinish === "function") onFinish();
        };
      }

      update() {
        this.player.setVelocity(0);
        if (this.cursors.left.isDown) this.player.setVelocityX(-250);
        if (this.cursors.right.isDown) this.player.setVelocityX(250);
        if (this.cursors.up.isDown) this.player.setVelocityY(-250);
        if (this.cursors.down.isDown) this.player.setVelocityY(250);
      }

      collectCoin(player, coin) {
        coin.disableBody(true, true);
        this.score++;
        this.scoreText.setText(`Monedas: ${this.score}/${requiredCoins}`);
        if (this.score >= requiredCoins) {
          // fin de minijuego
          this.reactOnFinish();
        }
      }
    }

    // create game
    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      width: 800,
      height: 520,
      parent: "lupi-game-container",
      physics: { default: "arcade", arcade: { gravity: { y: 0 } } },
      scene: MiniScene,
    });

    return () => {
      if (gameRef.current) {
        try { gameRef.current.destroy(true); } catch (e) { /* ignore */ }
        gameRef.current = null;
      }
    };
  }, [onFinish, requiredCoins]);

  return (
    <div className="w-[800px] h-[520px] bg-transparent relative">
      <div id="lupi-game-container" className="w-full h-full" />
      <button
        onClick={onCancel}
        className="absolute top-2 right-2 bg-black/60 text-white px-3 py-1 rounded"
      >
        Salir
      </button>
    </div>
  );
};

export default LupiMiniGame;
