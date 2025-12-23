import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Cart.css";

const formatPrice = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    v
  );

function Cart() {
  const API_BASE = process.env.REACT_APP_API || "http://localhost:5000";
  const token = useMemo(() => localStorage.getItem("token"), []);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [ordering, setOrdering] = useState(false);

  const normalizeItems = (raw = []) => {
    const FALLBACK =
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80";
    return raw.map((i) => ({
      ...i,
      image:
        i.image && !i.image.startsWith("http")
          ? `${API_BASE}${i.image}`
          : i.image || FALLBACK,
    }));
  };

  const fetchCart = async () => {
    if (!token) {
      setError("Bạn cần đăng nhập để xem giỏ hàng.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`${API_BASE}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không tải được giỏ hàng");
      setItems(Array.isArray(data.items) ? normalizeItems(data.items) : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setProfile(data);
    } catch (_) {}
  };

  useEffect(() => {
    fetchCart();
    fetchProfile();
  }, []);

  const changeQty = (id, delta) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);
    updateQuantity(id, newQty);
  };

  const removeItem = (id) => {
    updateQuantity(id, 0);
  };

  const updateQuantity = async (id, qty) => {
    if (!token) return setError("Bạn cần đăng nhập để cập nhật giỏ hàng.");
    try {
      const res = await fetch(`${API_BASE}/api/cart/item/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: qty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cập nhật giỏ hàng thất bại");
      setNotice(data.message || "Đã cập nhật giỏ hàng");
      fetchCart();
    } catch (err) {
      setError(err.message);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 500000 ? 0 : 25000;
  const total = subtotal + shipping;

  const handlePlaceOrder = async () => {
    if (!token) {
      setError("Bạn cần đăng nhập để đặt hàng.");
      return;
    }
    if (!items.length) {
      setError("Giỏ hàng trống.");
      return;
    }

    setOrdering(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch(`${API_BASE}/api/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Đặt hàng thất bại");
      setNotice(data.message || "Đặt hàng thành công");
      alert("Đặt hàng thành công! Vui lòng kiểm tra email của bạn.");
      fetchCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="cart-page">
      <div className="page-container cart-grid">
        <div>
          <div className="cart-head">
            <p className="tag">Giỏ hàng</p>
            <h1>Những món bạn chọn</h1>
            <p className="muted">
              Quản lý giỏ hàng theo tài khoản. Bạn cần đăng nhập để xem và cập
              nhật giỏ.
            </p>
          </div>

          {error && <div className="cart-alert error">{error}</div>}
          {notice && <div className="cart-alert success">{notice}</div>}

          {loading ? (
            <div className="cart-empty card">
              <p>Đang tải giỏ hàng...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="cart-empty card">
              <p>Chưa có sản phẩm nào trong giỏ.</p>
              <Link to="/shop" className="btn-primary">
                Quay lại gian hàng
              </Link>
            </div>
          ) : (
            <div className="cart-list card">
              {items.map((item) => (
                <div key={item.id} className="cart-item">
                  <div
                    className="cart-thumb"
                    style={{ backgroundImage: `url(${item.image})` }}
                    role="img"
                    aria-label={item.name}
                  />
                  <div className="cart-info">
                    <div className="cart-title">
                      <h3>{item.name}</h3>
                      <span className="pill">{item.badge}</span>
                    </div>
                    <div className="qty-row">
                      <button
                        className="qty-btn"
                        onClick={() => changeQty(item.id, -1)}
                        aria-label="Giảm số lượng"
                      >
                        -
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => changeQty(item.id, 1)}
                        aria-label="Tăng số lượng"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="cart-price">{formatPrice(item.price)}</div>
                  <button
                    className="remove-btn"
                    aria-label="Xóa sản phẩm"
                    onClick={() => removeItem(item.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cart-summary card">
          <h3>Tóm tắt đơn</h3>
          {profile && (
            <div className="checkout-contact">
              <div className="checkout-title">Thông tin nhận hàng</div>
              <p>
                <strong>{profile.name}</strong>
              </p>
              <p>{profile.email}</p>
              {profile.phone && <p>📞 {profile.phone}</p>}
              {profile.address && <p>📍 {profile.address}</p>}
            </div>
          )}
          <div className="summary-row">
            <span>Tạm tính</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Vận chuyển</span>
            <span>{shipping === 0 ? "Miễn phí" : formatPrice(shipping)}</span>
          </div>
          <div className="checkout-contact">
            <div className="checkout-title">Hình thức thanh toán</div>
            <label className="pay-option">
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
              />
              <span>Thanh toán khi nhận hàng (COD)</span>
            </label>
          </div>
          <div className="summary-total">
            <span>Tổng cộng</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="summary-actions">
            <Link to="/shop" className="btn-ghost full">
              Tiếp tục mua sắm
            </Link>
            <button
              className="btn-primary full"
              onClick={handlePlaceOrder}
              disabled={ordering}
            >
              {ordering ? "Đang xử lý..." : "Đặt hàng"}
            </button>
          </div>
          <p className="muted small">
            Ghi chú: Đây là bản demo. Kết nối API cart và thanh toán thực tế để
            hoàn tất tính năng.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Cart;
