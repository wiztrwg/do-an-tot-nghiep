// src/components/GameCanvas.js
import React, { useRef, useState, useEffect, useCallback } from "react";
import "./GameCanvas.css"; // Dùng chung CSS cho game

const GameCanvas = ({ canvasRef, onClose }) => {
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOverVisible, setGameOverVisible] = useState(false);
  const finalScoreRef = useRef(0);
  const animationId = useRef(null);

  const startGame = useCallback(() => {
    setScore(0);
    setIsPlaying(true);
    setGameOverVisible(false);
    if (animationId.current) cancelAnimationFrame(animationId.current);
    animate();
  }, []);

  const gameOver = useCallback((finalScore) => {
    setIsPlaying(false);
    cancelAnimationFrame(animationId.current);
    finalScoreRef.current = finalScore;
    setGameOverVisible(true);
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    let currentScore = 0;
    let items = [];
    let frameCount = 0;
    const bin = {
      x: W / 2 - 30,
      y: H - 60,
      width: 60,
      height: 50,
      color: "#22c55e",
      speed: 8,
    };
    let keys = {};
    let touchX = null;

    const handleKeyDown = (e) => (keys[e.key] = true);
    const handleKeyUp = (e) => (keys[e.key] = false);
    const handleTouchMove = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      touchX = e.touches[0].clientX - rect.left;
    };
    const handleTouchEnd = () => (touchX = null);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);

    const cleanup = () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };

    const gameLoop = () => {
      if (!isPlaying) {
        cleanup();
        return;
      }

      ctx.clearRect(0, 0, W, H);

      // Move bin
      if (keys["ArrowLeft"] && bin.x > 0) bin.x -= bin.speed;
      if (keys["ArrowRight"] && bin.x < W - bin.width) bin.x += bin.speed;
      if (touchX !== null) {
        const targetX = touchX - bin.width / 2;
        if (targetX < bin.x) bin.x -= Math.min(bin.speed, bin.x - targetX);
        if (targetX > bin.x) bin.x += Math.min(bin.speed, targetX - bin.x);
        if (bin.x < 0) bin.x = 0;
        if (bin.x > W - bin.width) bin.x = W - bin.width;
      }

      // Draw bin
      ctx.fillStyle = bin.color;
      ctx.fillRect(bin.x, bin.y, bin.width, bin.height);
      ctx.font = "20px Arial";
      ctx.fillText("🗑️", bin.x + 15, bin.y + 32);

      // Spawn items
      if (frameCount % 60 === 0) {
        const type = Math.random() > 0.3 ? "good" : "bad";
        items.push({
          x: Math.random() * (W - 30),
          y: -30,
          size: 30,
          speed: 3 + Math.random() * 2,
          type,
          symbol: type === "good" ? "♻️" : "🍌",
        });
      }
      frameCount++;

      // Update & draw items
      for (let i = 0; i < items.length; i++) {
        let item = items[i];
        item.y += item.speed;

        ctx.font = "24px Arial";
        ctx.fillText(item.symbol, item.x, item.y + item.size / 2);

        // Collision
        if (
          item.x < bin.x + bin.width &&
          item.x + item.size > bin.x &&
          item.y + item.size > bin.y &&
          item.y < bin.y + bin.height
        ) {
          if (item.type === "good") currentScore += 10;
          else currentScore -= 5;
          setScore(currentScore);
          items.splice(i, 1);
          i--;
        } else if (item.y > H) {
          if (item.type === "good") {
            gameOver(currentScore);
            cleanup();
            return;
          }
          items.splice(i, 1);
          i--;
        }
      }

      animationId.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();
  }, [canvasRef, isPlaying, gameOver]);

  return (
    <div className="game-section">
      <div className="game-wrapper">
        <canvas
          ref={canvasRef}
          width="600"
          height="400"
          id="gameCanvas"
        ></canvas>

        {!isPlaying && !gameOverVisible && (
          <div className="game-overlay start-screen">
            <h3 className="overlay-title">Sẵn sàng chưa?</h3>
            <p className="overlay-text">
              Dùng phím mũi tên ← → hoặc chạm màn hình để di chuyển
            </p>
            <button onClick={startGame} className="btn btn-game-start">
              ▶ Bắt Đầu
            </button>
            <button
              onClick={onClose}
              className="btn btn-outline"
              style={{ marginTop: "1rem" }}
            >
              Đóng Game
            </button>
          </div>
        )}

        {gameOverVisible && (
          <div className="game-overlay game-over-screen">
            <h3 className="overlay-title game-over-title">Game Over!</h3>
            <p className="overlay-text">Điểm số: {score}</p>
            <button onClick={startGame} className="btn btn-game-restart">
              Chơi Lại
            </button>
            <button
              onClick={onClose}
              className="btn btn-outline"
              style={{ marginTop: "1rem" }}
            >
              Đóng Game
            </button>
          </div>
        )}

        <div className="score-display">Điểm: {score}</div>
      </div>
    </div>
  );
};

export default GameCanvas;
