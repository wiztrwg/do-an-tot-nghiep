import React, { useState, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { UserContext } from "../../../context/UserContext";
import "./Header.css";

const API_BASE = "http://localhost:5000";

function Header() {
  const navigate = useNavigate();

  const { user, setUser } = useContext(UserContext);

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="eco-header">
      <div className="eco-header-container">
        <div className="eco-header-logo" onClick={() => navigate("/")}>
          ♻ EcoAI
        </div>

        <div
          className="eco-header-menu-icon"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </div>

        <nav className={`eco-header-nav ${menuOpen ? "open" : ""}`}>
          <NavLink to="/" className="eco-header-item">
            Trang chủ
          </NavLink>
          <NavLink to="/classify" className="eco-header-item">
            Phân loại AI
          </NavLink>
          <NavLink to="/blog" className="eco-header-item">
            Blog
          </NavLink>
          <NavLink to="/shop" className="eco-header-item">
            Gian hàng xanh
          </NavLink>
          <NavLink to="/cart" className="eco-header-item eco-cart-link">
            🛒
          </NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin" className="eco-header-item">
              Admin
            </NavLink>
          )}
          <NavLink to="/contact" className="eco-header-item">
            Liên hệ
          </NavLink>

          {!user && (
            <>
              <NavLink to="/login" className="eco-header-btn eco-login-btn">
                Đăng nhập
              </NavLink>
              <NavLink
                to="/register"
                className="eco-header-btn eco-register-btn"
              >
                Đăng ký
              </NavLink>
            </>
          )}

          {user && (
            <div className="eco-header-user">
              <div
                className="eco-header-avatar"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {user.avatar ? (
                  <img
                    src={`${API_BASE}/uploads/avatars/${user.avatar}`}
                    alt="avatar"
                    className="eco-avatar-img"
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>

              {dropdownOpen && (
                <div className="eco-header-dropdown">
                  <p className="eco-header-username">{user.name}</p>

                  <NavLink
                    to="/profile"
                    className="eco-header-dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Trang cá nhân
                  </NavLink>

                  {user?.role === "admin" && (
                    <NavLink
                      to="/admin"
                      className="eco-header-dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Quản lý admin
                    </NavLink>
                  )}

                  <button
                    className="eco-header-dropdown-item eco-logout-btn"
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
