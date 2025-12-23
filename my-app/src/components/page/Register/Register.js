import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Register.css";

const API_BASE = process.env.REACT_APP_API || "http://localhost:5000";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu và xác nhận không khớp");
      setLoading(false);
      return;
    }

    const user = { name, email, password, phone, address };

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Đăng ký thành công!");
        navigate("/login"); // chuyển sang đăng nhập
      } else {
        setErrorMsg(data.error || "Lỗi khi đăng ký");
      }
    } catch (err) {
      setErrorMsg("Không thể kết nối server!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h2 className="register-title">Tạo Tài Khoản</h2>

        {errorMsg && <div className="error-box">{errorMsg}</div>}

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Tên người dùng</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên của bạn"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email hợp lệ"
              required
            />
          </div>

      <div className="form-group">
        <label htmlFor="password">Mật khẩu</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Tối thiểu 6 ký tự"
          minLength="6"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Nhập lại mật khẩu"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone">Số điện thoại</label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Ví dụ: 090xxxxxxx"
        />
      </div>

      <div className="form-group">
        <label htmlFor="address">Địa chỉ</label>
        <input
          type="text"
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Địa chỉ giao hàng"
        />
      </div>

      <button type="submit" className="register-button" disabled={loading}>
        {loading ? "Đang đăng ký..." : "Đăng ký"}
      </button>
    </form>

        <p className="login-link">
          Đã có tài khoản? <NavLink to="/login">Đăng nhập</NavLink>
        </p>
      </div>
    </div>
  );
}

export default Register;
