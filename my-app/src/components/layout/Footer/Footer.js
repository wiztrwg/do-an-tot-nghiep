import React from "react";
import "./Footer.css";
import { NavLink } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Cột 1 - Logo & mô tả */}
        <div className="footer-section">
          <h2 className="footer-logo">Phân Loại Rác AI</h2>
          <p className="footer-desc">
            Hệ thống phân loại rác sử dụng trí tuệ nhân tạo, giúp nâng cao ý
            thức bảo vệ môi trường và xây dựng tương lai xanh.
          </p>
        </div>

        {/* Cột 2 - Điều hướng */}
        <div className="footer-section">
          <h3>Liên kết</h3>
          <ul className="footer-links">
            <li>
              <NavLink to="/">Trang chủ</NavLink>
            </li>
            <li>
              <NavLink to="/classify">Phân loại AI</NavLink>
            </li>
            <li>
              <NavLink to="/guide">Hướng dẫn</NavLink>
            </li>
            <li>
              <NavLink to="/about">Giới thiệu</NavLink>
            </li>
            <li>
              <NavLink to="/contact">Liên hệ</NavLink>
            </li>
            <li>
              <NavLink to="/shop">Gian hàng xanh</NavLink>
            </li>
          </ul>
        </div>

        {/* Cột 3 - Liên hệ */}
        <div className="footer-section">
          <h3>Thông tin liên hệ</h3>
          <p>Email: contact@phanloairac.com</p>
          <p>Hotline: 0123 456 789</p>
          <p>Địa chỉ: Đà Nẵng, Việt Nam</p>
        </div>
      </div>

      <div className="footer-bottom">
        © 2025 Phân Loại Rác AI — All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
