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
          <NavLink to="/shop" className="eco-header-item">
            Cửa hàng
          </NavLink>
          <NavLink to="/blog" className="eco-header-item">
            Blog
          </NavLink>
          <NavLink to="/contact" className="eco-header-item">
            About Us
          </NavLink>
          <NavLink to="/cart" className="eco-header-item eco-cart-link">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="eco-cart-icon"
            >
              <path
                fill="currentColor"
                d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM6.2 6l.8 4h10.5l1.6-4H6.2zM5.3 3H2v2h1.8l2.2 10.4c.1.7.7 1.1 1.4 1.1h10.6v-2H7.7l-.3-1.5H18c.6 0 1.1-.4 1.3-1l2-5.2c.2-.6-.2-1.3-.9-1.3H6.2L5.7 3.8C5.6 3.3 5 3 4.4 3z"
              />
            </svg>
          </NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin" className="eco-header-item">
              Admin
            </NavLink>
          )}

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
