// src/components/Blog.js (hoặc Blog.jsx)
import React, { useRef, useState } from "react";
import "./MainContent.css";
// Giả định bạn có một component cho Game Canvas
// import GameCanvas from "../game/GameCanvas";

// Icon placeholder (Sử dụng unicode hoặc component icon thực tế)
const CustomIcon = ({ className, children }) => (
  <span className={`icon ${className}`}>{children}</span>
);

// --- Dữ liệu Mẫu ---
const GUIDE_DATA = [
  {
    id: "organic",
    color: "green",
    icon: "🍎",
    title: "Rác Hữu Cơ",
    desc: "Dễ phân hủy, dùng làm phân bón.",
    items: ["Thức ăn thừa", "Vỏ rau củ quả", "Bã trà, cà phê"],
  },
  {
    id: "recycle",
    color: "blue",
    icon: "♻️",
    title: "Rác Tái Chế",
    desc: "Có thể tái sinh vòng đời mới.",
    items: ["Giấy, sách báo", "Chai nhựa sạch", "Vỏ lon kim loại"],
  },
  {
    id: "inorganic",
    color: "orange",
    icon: "🗑️",
    title: "Rác Vô Cơ / Khác",
    desc: "Không thể tái chế, cần xử lý riêng.",
    items: ["Túi nilon bẩn", "Sành sứ vỡ", "Giấy ăn đã dùng"],
  },
];

const BLOG_DATA = [
  {
    id: 1,
    img: "https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=500&q=80",
    tag: "Tin tức",
    tagColor: "green",
    title: "Chiến dịch làm sạch bờ biển 2025",
    excerpt: "Hơn 5000 tình nguyện viên đã tham gia dọn dẹp rác thải nhựa...",
  },
  {
    id: 2,
    img: "https://images.unsplash.com/photo-1591191853822-112e304748a2?auto=format&fit=crop&w=500&q=80",
    tag: "Mẹo vặt",
    tagColor: "blue",
    title: "5 cách tái chế chai nhựa cũ",
    excerpt: "Biến chai nhựa thành chậu cây hoặc hộp đựng bút cực xinh...",
  },
  {
    id: 3,
    img: "https://images.unsplash.com/photo-1542601906990-b4d3fb7d5b43?auto=format&fit=crop&w=500&q=80",
    tag: "Góc nhìn",
    tagColor: "orange",
    title: "Sống tối giản để bảo vệ trái đất",
    excerpt:
      "Lối sống tối giản giúp giảm thiểu rác thải sinh hoạt như thế nào?",
  },
];
// --- Hướng Dẫn Section ---
const GuideSection = () => (
  <section id="guide" className="guide-section blog-content-section">
    <div className="blog-container">
      <h2 className="guide-title section-heading">Hướng Dẫn Phân Loại</h2>
      <div className="guide-grid">
        {GUIDE_DATA.map((g, idx) => (
          <div key={idx} className={`guide-card guide-card-${g.color}`}>
            <div className={`guide-icon-wrapper guide-icon-${g.color}`}>
              <CustomIcon>{g.icon}</CustomIcon>
            </div>
            <h3 className="guide-card-title">{g.title}</h3>
            <p className="guide-card-description">{g.desc}</p>
            <ul className="guide-card-list">
              {g.items.map((item, i) => (
                <li key={i} className="guide-list-item">
                  <CustomIcon className={`guide-check-${g.color}`}>
                    ✓
                  </CustomIcon>{" "}
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// --- Blog Listing Section ---
const BlogListingSection = () => (
  <section
    id="blog-posts"
    className="blog-listing-section blog-content-section"
  >
    <div className="blog-container">
      <div className="blog-header">
        <div>
          <h2 className="blog-list-title section-heading-left">
            Blog Môi Trường
          </h2>
          <p className="blog-subtitle">
            Cập nhật tin tức và mẹo sống xanh mới nhất.
          </p>
        </div>
        <a href="#" className="blog-all-link">
          Xem tất cả <CustomIcon>→</CustomIcon>
        </a>
      </div>
      <div className="blog-grid">
        {BLOG_DATA.map((b, idx) => (
          <a href="#" key={idx} className="blog-post-card">
            <div className="blog-image-wrapper">
              <img src={b.img} alt={b.title} className="blog-post-image" />
            </div>
            <div className="blog-post-content">
              <span className={`blog-post-tag blog-tag-${b.tagColor}`}>
                {b.tag}
              </span>
              <h3 className="blog-post-title">{b.title}</h3>
              <p className="blog-post-excerpt">{b.excerpt}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  </section>
);

// --- Game Section (Placeholder) ---
const GameSection = ({ onStartGame }) => (
  <section id="game" className="game-section blog-content-section">
    <div className="blog-container game-container">
      <div className="game-text-content">
        <h2 className="game-title section-heading-left">
          Mini Game: Hứng Rác Tái Chế
        </h2>
        <p className="game-description">
          Di chuyển thùng rác để hứng các chai nhựa và giấy (♻️). Tránh vỏ chuối
          (🍌) nhé!
        </p>
      </div>
      <div className="game-action-wrapper">
        {/* Đây là phần bạn sẽ đặt GameCanvas hoặc màn hình khởi động game */}
        <div className="game-start-box">
          <h3 className="game-start-title">Sẵn sàng chưa?</h3>
          <p className="game-start-tip">
            Dùng ⬅️ ➡️ hoặc chạm màn hình để di chuyển
          </p>
          <button onClick={onStartGame} className="btn btn-game-primary">
            <CustomIcon>▶️</CustomIcon> Bắt Đầu
          </button>
        </div>
      </div>
    </div>
  </section>
);

// --- Main Component ---
export default function Blog() {
  const [isGameActive, setIsGameActive] = useState(false);

  // Hàm này sẽ được gọi khi người dùng nhấn nút "Bắt Đầu" trong GameSection
  const handleStartGame = () => {
    // Logic để hiển thị Game Canvas thực sự
    setIsGameActive(true);
  };

  return (
    <main className="blog-main-content">
      {/* 1. Hướng Dẫn */}
      <GuideSection />

      {/* 2. Game */}
      <GameSection onStartGame={handleStartGame} />

      {/* 3. Blog */}
      <BlogListingSection />

      {/* Nếu bạn muốn hiển thị canvas game, bạn có thể đặt nó ở đây nếu isGameActive là true */}
      {/* {isGameActive && <GameCanvas />} */}
    </main>
  );
}
