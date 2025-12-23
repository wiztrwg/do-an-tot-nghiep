import React, { useEffect, useRef, useState } from "react";
import "./TrashCatchGame.css";

function TrashCatchGame() {
  const gameAreaRef = useRef(null);
  const [trashList, setTrashList] = useState([]);
  const [playerPos, setPlayerPos] = useState(50); // % ngang
  const [score, setScore] = useState(0);

  // Rác random
  const trashTypes = ["♻️", "🍂", "☠️", "🗑️"];

  // Tạo rác mới mỗi 1.5s
  useEffect(() => {
    const interval = setInterval(() => {
      const newTrash = {
        id: Date.now(),
        type: trashTypes[Math.floor(Math.random() * trashTypes.length)],
        left: Math.random() * 90, // % vị trí ngang
        top: 0,
      };
      setTrashList((prev) => [...prev, newTrash]);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Di chuyển rác xuống
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setTrashList(
        (prev) =>
          prev
            .map((t) => ({ ...t, top: t.top + 2 })) // rơi 2% mỗi bước
            .filter((t) => t.top < 95) // loại bỏ rác rơi quá thấp
      );
    }, 50);
    return () => clearInterval(moveInterval);
  }, []);

  // Kiểm tra va chạm
  useEffect(() => {
    trashList.forEach((t) => {
      if (t.top >= 90 && Math.abs(t.left - playerPos) < 10) {
        setScore((prev) => prev + 1);
        setTrashList((prev) => prev.filter((tr) => tr.id !== t.id));
      }
    });
  }, [trashList, playerPos]);

  // Di chuyển người chơi bằng chuột
  const handleMouseMove = (e) => {
    const rect = gameAreaRef.current.getBoundingClientRect();
    let newPos = ((e.clientX - rect.left) / rect.width) * 100;
    if (newPos < 0) newPos = 0;
    if (newPos > 90) newPos = 90;
    setPlayerPos(newPos);
  };

  return (
    <div className="game-container">
      <h2>Trò chơi Hứng Rác</h2>
      <p>Điểm: {score}</p>
      <div
        className="game-area"
        ref={gameAreaRef}
        onMouseMove={handleMouseMove}
      >
        {/* Rác */}
        {trashList.map((t) => (
          <div
            key={t.id}
            className="trash"
            style={{ left: `${t.left}%`, top: `${t.top}%` }}
          >
            {t.type}
          </div>
        ))}

        {/* Người chơi */}
        <div className="player" style={{ left: `${playerPos}%` }}>
          🗑️
        </div>
      </div>
    </div>
  );
}

export default TrashCatchGame;
