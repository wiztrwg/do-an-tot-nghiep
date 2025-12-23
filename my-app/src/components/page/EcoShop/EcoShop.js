import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./EcoShop.css";

const API_BASE = process.env.REACT_APP_API || "http://localhost:5000";
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80";

function EcoShop() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("token"), []);
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cartError, setCartError] = useState("");
  const [cartNotice, setCartNotice] = useState("");
  const [cartLoadingId, setCartLoadingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const [pRes, bRes] = await Promise.all([
          fetch(`${API_BASE}/api/products`),
          fetch(`${API_BASE}/api/products/bundles`),
        ]);

        const pData = await pRes.json();
        const bData = await bRes.json();

        const pItems = Array.isArray(pData.items) ? pData.items : [];
        const bItems = Array.isArray(bData.items) ? bData.items : [];

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

        const normalizedBundles = bItems.map((bundle) => ({
          id: bundle.id || bundle.title,
          title: bundle.title,
          saving: bundle.saving,
          items: bundle.items || [],
          bonus: bundle.bonus,
        }));

        setProducts(normalizedProducts);
        setBundles(normalizedBundles);
      } catch (err) {
        console.error("Load shop data error:", err);
        setError("Không tải được dữ liệu gian hàng. Thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      <section className="shop-hero">
        <div className="page-container hero-grid">
          <div className="shop-hero-copy">
            <p className="eyebrow">Gian hàng xanh</p>
            <h1>
              Mua sắm những món đồ
              <br />
              giúp bạn sống xanh hơn.
            </h1>
            <p className="shop-hero-sub">
              Chọn các sản phẩm đã được sàng lọc về vật liệu, vòng đời và khả
              năng tái chế. Giảm nhựa dùng một lần, ưu tiên bao bì tái sử dụng,
              giao hàng trung hòa carbon.
            </p>
            <div className="shop-actions">
              <a href="#products" className="btn-primary">
                Xem sản phẩm
              </a>
              <Link to="/contact" className="btn-ghost">
                Nhận tư vấn miễn phí
              </Link>
            </div>
            <div className="shop-pills">
              <span>Đóng gói không nhựa</span>
              <span>Ưu tiên nguồn Việt Nam</span>
              <span>1% doanh thu cho trồng cây</span>
            </div>
          </div>

          <div className="shop-hero-card">
            <div className="shop-hero-card-head">
              <p className="tag">Cam kết xanh</p>
              <p className="muted">Mỗi đơn hàng đều được đo dấu chân carbon.</p>
            </div>
            <ul className="shop-hero-list">
              <li>
                <span>♻</span>
                <div>
                  <h4>Tái chế & tái sử dụng</h4>
                  <p>Ưu tiên vật liệu vòng đời dài, có điểm thu hồi rõ ràng.</p>
                </div>
              </li>
              <li>
                <span>🌱</span>
                <div>
                  <h4>Nguồn gốc minh bạch</h4>
                  <p>Nhà cung cấp được kiểm tra chứng chỉ hữu cơ/FSC.</p>
                </div>
              </li>
              <li>
                <span>🚚</span>
                <div>
                  <h4>Giao nhanh, ít phát thải</h4>
                  <p>Đóng gói giấy, hoàn trả hộp carton cho lần giao tiếp theo.</p>
                </div>
              </li>
            </ul>
            <div className="shop-hero-foot">
              <p>
                <strong>Đặt trước 17h</strong> giao trong ngày tại HN/ĐN/HCM.
              </p>
              <Link to="/contact">Xem chính sách giao hàng →</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="products" className="shop-products">
        <div className="page-container">
          <div className="shop-section-head">
            <div>
              <p className="tag">Sản phẩm nổi bật</p>
              <h2>Đồ dùng xanh cho mỗi ngày</h2>
              <p className="muted">
                Chọn những món bạn thực sự dùng hàng ngày để giảm rác thải nhựa
                rõ rệt.
              </p>
            </div>
            <Link to="/contact" className="btn-ghost small">
              Đặt câu hỏi về sản phẩm
            </Link>
          </div>

          {error && <div className="shop-alert">{error}</div>}
          {cartError && <div className="shop-alert">{cartError}</div>}
          {cartNotice && <div className="shop-alert success">{cartNotice}</div>}
          {loading ? (
            <p className="muted">Đang tải sản phẩm...</p>
          ) : products.length === 0 ? (
            <p className="muted">Chưa có sản phẩm nào.</p>
          ) : (
            <div className="shop-grid">
              {products.map((item) => (
                <article key={item.id} className="product-card card">
                  <div
                    className="product-thumb"
                    style={{ backgroundImage: `url(${item.image})` }}
                    role="img"
                    aria-label={item.name}
                  />
                  <div className="product-info">
                    <div className="product-top">
                      <p className="mini-tag">{item.badge}</p>
                      <p className="product-impact">{item.impact}</p>
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

      <section className="shop-impact">
        <div className="page-container impact-grid">
          <div className="impact-card">
            <p className="tag">Vì sao chọn</p>
            <h3>Đi cùng hành trình sống xanh</h3>
            <p className="muted">
              Chúng tôi làm việc trực tiếp với các nhóm sản xuất địa phương,
              ưu tiên vật liệu tự nhiên, giảm quãng đường vận chuyển và tái sử
              dụng bao bì tối đa.
            </p>
            <ul className="impact-list">
              <li>Chứng nhận hữu cơ/FSC đối với tre, gỗ, cotton.</li>
              <li>Thu hồi sản phẩm cuối vòng đời để tái chế đúng chuẩn.</li>
              <li>Đo lường CO₂ và đóng góp 1% doanh thu cho trồng rừng.</li>
            </ul>
          </div>

          <div className="impact-highlight">
            <div className="impact-row">
              <div>
                <h4>16.240</h4>
                <p className="muted">Đơn hàng đã giao</p>
              </div>
              <div>
                <h4>48.6 tấn</h4>
                <p className="muted">Rác nhựa ước tính đã tránh</p>
              </div>
            </div>
            <div className="impact-row">
              <div>
                <h4>3 thành phố</h4>
                <p className="muted">Kho gần để giảm phát thải vận chuyển</p>
              </div>
              <div>
                <h4>4.9 ★</h4>
                <p className="muted">Điểm hài lòng từ khách hàng</p>
              </div>
            </div>
            <div className="impact-note">
              <p>
                Mỗi đơn hàng đều kèm hướng dẫn phân loại bao bì và địa điểm thu
                hồi gần nhất.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="shop-bundles">
        <div className="page-container">
          <div className="shop-section-head">
            <div>
              <p className="tag">Combo đề xuất</p>
              <h2>Bắt đầu dễ dàng với bộ sản phẩm chọn sẵn</h2>
              <p className="muted">
                Tối ưu cho nhu cầu phổ biến: mang đi, bếp núc và chăm sóc cá
                nhân.
              </p>
            </div>
            <a className="btn-primary small" href="#products">
              Xem chi tiết
            </a>
          </div>

          {bundles.length > 0 ? (
            <div className="bundle-grid">
              {bundles.map((bundle) => (
                <div key={bundle.id} className="bundle-card card">
                  <div className="bundle-head">
                    <h3>{bundle.title}</h3>
                    <span className="mini-tag">{bundle.saving}</span>
                  </div>
                  <ul>
                    {bundle.items.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                  <p className="bundle-bonus">{bundle.bonus}</p>
                  <div className="bundle-actions">
                    <button className="btn-primary small">Đặt ngay</button>
                    <button className="btn-ghost small">Tư vấn thêm</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Chưa có combo nào.</p>
          )}
        </div>
      </section>

      <section className="shop-cta">
        <div className="page-container cta-card">
          <div>
            <p className="tag">Tặng cây cùng bạn</p>
            <h3>1 đơn hàng = 1 cây xanh trồng tại miền Trung</h3>
            <p className="muted">
              Bạn sẽ nhận email xác nhận vị trí cây trồng sau khi đơn hoàn tất.
              Hãy cùng lan tỏa thói quen mua sắm có trách nhiệm.
            </p>
          </div>
          <div className="cta-actions">
            <a href="#products" className="btn-primary">
              Chọn sản phẩm
            </a>
            <Link to="/about" className="btn-ghost">
              Đọc thêm cam kết
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default EcoShop;
