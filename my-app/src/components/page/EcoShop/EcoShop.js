import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EcoShop.css";

const API_BASE = process.env.REACT_APP_API || "http://localhost:5000";
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80";

function EcoShop() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cartError, setCartError] = useState("");
  const [cartNotice, setCartNotice] = useState("");
  const [cartLoadingId, setCartLoadingId] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const pRes = await fetch(`${API_BASE}/api/products`);
        const pData = await pRes.json();

        const pItems = Array.isArray(pData.items) ? pData.items : [];
        const normalizedProducts = pItems.map((item) => ({
          id: item.id || item.name,
          name: item.name,
          price: item.price
            ? new Intl.NumberFormat("vi-VN").format(item.price) + "đ"
            : item.price,
          badge: item.badge || "",
          impact: item.impact || "",
          desc: item.description || "",
          image:
            item.image && !item.image.startsWith("http")
              ? `${API_BASE}${item.image}`
              : item.image || item.images?.[0]
              ? item.images[0].startsWith("http")
                ? item.images[0]
                : `${API_BASE}${item.images[0]}`
              : FALLBACK_IMAGE,
        }));

        setProducts(normalizedProducts);
      } catch (err) {
        console.error("Load shop data error:", err);
        setError("Không tải được dữ liệu gian hàng. Thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCategory = (item) => {
    const badge = (item.badge || "").toLowerCase();
    const name = (item.name || "").toLowerCase();
    const desc = (item.desc || "").toLowerCase();
    const haystack = `${badge} ${name} ${desc}`;
    if (haystack.includes("tre") || haystack.includes("bamboo")) return "bamboo";
    if (haystack.includes("tái") || haystack.includes("reuse")) return "reuse";
    return "all";
  };

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((item) => {
      const category = getCategory(item);
      const matchesTab = activeTab === "all" || activeTab === category;
      const matchesQuery =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.desc.toLowerCase().includes(term);
      return matchesTab && matchesQuery;
    });
  }, [products, activeTab, query]);

  const handleAddToCart = async (productId) => {
    if (!productId) return;
    if (!token) {
      navigate("/login");
      return;
    }

    setCartError("");
    setCartNotice("");
    setCartLoadingId(productId);

    try {
      const res = await fetch(`${API_BASE}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thêm vào giỏ được");
      setCartNotice("Đã thêm vào giỏ. Xem giỏ hàng để thanh toán.");
    } catch (err) {
      setCartError(err.message);
    } finally {
      setCartLoadingId(null);
    }
  };

  return (
    <div className="eco-shop">
      <section className="shop-section shop-hero">
        <div className="page-container shop-hero-inner">
          <div className="shop-hero-copy">
            <p className="eyebrow">Giải pháp bền vững cho tương lai</p>
            <h1>
              Hành động nhỏ,
              <br />
              <span className="accent-italic">tác động lớn.</span>
            </h1>
            <p className="shop-hero-sub">
              Bắt đầu hành trình sống xanh của bạn ngay hôm nay với những sản
              phẩm thân thiện nhất.
            </p>
            <div className="shop-hero-actions">
              <a href="#collection" className="btn-primary">
                Săn đồ xanh ngay
              </a>
              <a href="#mission" className="btn-ghost light">
                Tại sao là chúng tôi?
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="mission" className="shop-section shop-mission">
        <div className="page-container shop-mission-inner">
          <div className="shop-mission-line" />
          <h2>Sứ mệnh của GreenLife</h2>
          <p>
            "Chúng tôi tin rằng việc thay đổi thói quen tiêu dùng không nhất
            thiết phải là những bước đi khổng lồ. Chỉ cần một chiếc ống hút tre,
            một túi vải hay một bình nước cá nhân — đó chính là sự khởi đầu của
            cuộc cách mạng xanh."
          </p>
        </div>
      </section>

      <section id="collection" className="shop-section shop-products">
        <div className="page-container">
          <div className="shop-section-head">
            <div>
              <p className="tag">Bộ sưu tập xanh</p>
              <h2>Sản phẩm nổi bật</h2>
              <p className="muted">
                Chọn những món đồ thân thiện để bắt đầu lối sống xanh.
              </p>
            </div>
            <div className="shop-tabs">
              <button
                type="button"
                className={`shop-tab ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                Tất cả
              </button>
              <button
                type="button"
                className={`shop-tab ${activeTab === "bamboo" ? "active" : ""}`}
                onClick={() => setActiveTab("bamboo")}
              >
                Đồ tre
              </button>
              <button
                type="button"
                className={`shop-tab ${activeTab === "reuse" ? "active" : ""}`}
                onClick={() => setActiveTab("reuse")}
              >
                Tái sử dụng
              </button>
            </div>
          </div>

          <div className="shop-search-row">
            <div className="shop-search">
              <span aria-hidden="true">🔍</span>
              <input
                type="search"
                placeholder="Tìm kiếm quà tặng..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>

          {error && <div className="shop-alert">{error}</div>}
          {cartError && <div className="shop-alert">{cartError}</div>}
          {cartNotice && <div className="shop-alert success">{cartNotice}</div>}
          {loading ? (
            <p className="muted">Đang tải sản phẩm...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="muted">Chưa có sản phẩm nào.</p>
          ) : (
            <div className="shop-grid">
              {filteredProducts.map((item) => (
                <article key={item.id} className="product-card card">
                  <div
                    className="product-thumb"
                    style={{ backgroundImage: `url(${item.image})` }}
                    role="img"
                    aria-label={item.name}
                  />
                  <div className="product-info">
                    <div className="product-top">
                      <p className="mini-tag">
                        {getCategory(item) === "bamboo"
                          ? "Đồ tre"
                          : getCategory(item) === "reuse"
                          ? "Tái sử dụng"
                          : "Khác"}
                      </p>
                    </div>
                    <h3>{item.name}</h3>
                    <p className="muted">{item.desc}</p>
                    <div className="product-meta">
                      <span className="product-price">{item.price}</span>
                      <button
                        className="ghost-link"
                        onClick={() => handleAddToCart(item.id)}
                        disabled={cartLoadingId === item.id}
                      >
                        {cartLoadingId === item.id
                          ? "Đang thêm..."
                          : "Thêm vào giỏ"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

export default EcoShop;
