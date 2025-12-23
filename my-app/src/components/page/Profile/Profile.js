// src/pages/Profile.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

const API_BASE = process.env.REACT_APP_API || "http://localhost:5000";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetch(`${API_BASE}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          // token invalid or other
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        } else {
          setUser(data);
          setName(data.name || "");
          setPhone(data.phone || "");
          setAddress(data.address || "");
          localStorage.setItem("user", JSON.stringify(data));
          if (data.avatar) {
            setPreview(`${API_BASE}/uploads/avatars/${data.avatar}`);
          }
        }
      })
      .catch(() => {
        navigate("/login");
      });
  }, [navigate]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const formData = new FormData();
    if (name) formData.append("name", name);
    if (password) formData.append("password", password);
    formData.append("phone", phone || "");
    formData.append("address", address || "");
    if (avatarFile) formData.append("avatar", avatarFile);

    try {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMsg("Cập nhật thành công");
        setUser(data.user);
        // update localStorage user
        localStorage.setItem("user", JSON.stringify(data.user));
        // if server returns avatar name, preview is already updated
      } else {
        setMsg(data.error || "Cập nhật thất bại");
      }
    } catch (err) {
      setMsg("Lỗi kết nối");
    } finally {
      setLoading(false);
      setPassword(""); // clear password input
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user)
    return (
      <div className="profile-page">
        <p>Đang tải...</p>
      </div>
    );

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2>Trang cá nhân</h2>

        <div className="profile-avatar-section">
          <div className="profile-avatar-preview">
            {preview ? (
              <img src={preview} alt="avatar" />
            ) : (
              <div className="profile-avatar-placeholder">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            id="avatar"
            onChange={handleAvatarChange}
            style={{ display: "none" }}
          />
          <label htmlFor="avatar" className="btn btn-upload">
            Chọn avatar
          </label>
        </div>

        <form className="profile-form" onSubmit={handleUpdate}>
          <label>Tên</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />

          <label>Email</label>
          <input value={user.email} disabled />

          <label>Số điện thoại</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="090xxxxxxx"
          />

          <label>Địa chỉ</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Địa chỉ giao hàng"
          />

          <label>Mật khẩu mới (để trống nếu không đổi)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tối thiểu 6 ký tự"
          />

          <div className="profile-actions">
            <button type="submit" className="btn btn-save" disabled={loading}>
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>

            <button
              type="button"
              className="btn btn-logout"
              onClick={handleLogout}
            >
              Đăng xuất
            </button>
          </div>
        </form>

        {msg && <p className="profile-msg">{msg}</p>}
      </div>
    </div>
  );
}

export default Profile;
