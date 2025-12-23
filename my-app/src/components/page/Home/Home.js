import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const API_BASE = process.env.REACT_APP_API || "http://localhost:5000";
const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80";
const FALLBACK_BLOG_IMAGE =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80";

function Home() {
  const [products, setProducts] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [blogLoading, setBlogLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setProductLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/products`);
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        const normalized = items.map((item) => ({
          id: item.id || item.name,
          name: item.name,
          price: item.price
            ? new Intl.NumberFormat("vi-VN").format(item.price) + "đ"
            : item.price,
          badge: item.badge || "",
          image:
            item.image && !item.image.startsWith("http")
              ? `${API_BASE}${item.image}`
              : item.image || item.images?.[0]
              ? item.images[0].startsWith("http")
                ? item.images[0]
                : `${API_BASE}${item.images[0]}`
              : FALLBACK_PRODUCT_IMAGE,
        }));
        setProducts(normalized.slice(0, 4));
      } catch (err) {
        console.error("Load products error:", err);
        setProducts([]);
      } finally {
        setProductLoading(false);
      }
    };

    const fetchBlogs = async () => {
      setBlogLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/blog`);
        const data = await res.json();
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data.blogs)
          ? data.blogs
          : [];
        const normalized = items.map((item) => ({
          id: item.id,
          title: item.title,
          content: item.content || "",
          thumbnail: item.thumbnail
            ? `${API_BASE}/uploads/blogs/${item.thumbnail}`
            : FALLBACK_BLOG_IMAGE,
        }));
        setBlogs(normalized.slice(0, 2));
      } catch (err) {
        console.error("Load blogs error:", err);
        setBlogs([]);
      } finally {
        setBlogLoading(false);
      }
    };

    fetchProducts();
    fetchBlogs();
  }, []);

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero__content home-anim-fade">
          <h1>
            Mỗi hành động nhỏ,
            <br />
            Vạn thay đổi xanh
          </h1>
          <p>
            Tham gia cộng đồng GreenLife để học cách phân loại rác thải, mua sắm
            các sản phẩm bền vững và cập nhật kiến thức bảo vệ môi trường mỗi
            ngày.
          </p>
          <div className="home-hero__actions">
            <a href="#phan-loai" className="home-btn home-btn--primary home-btn--pill">
              Bắt đầu phân loại
            </a>
            <a href="#cua-hang" className="home-btn home-btn--light home-btn--pill">
              Ghé thăm cửa hàng
            </a>
          </div>
        </div>
      </section>

      <section id="phan-loai" className="home-guide">
        <div className="home-section-title home-section-title--center">
          <span>Hướng dẫn</span>
          <h2>Phân Loại Rác Tại Nguồn</h2>
          <div className="home-title-line"></div>
        </div>

        <div className="home-guide__grid">
          <div className="home-guide__card home-guide__card--organic">
            <div className="home-guide__icon">HC</div>
            <h3>Rác Hữu Cơ</h3>
            <p>Thức ăn thừa, rau quả hư, lá cây, vỏ trứng...</p>
            <ul>
              <li>Có thể ủ làm phân bón</li>
              <li>Phân hủy tự nhiên nhanh</li>
            </ul>
          </div>

          <div className="home-guide__card home-guide__card--recyclable">
            <div className="home-guide__icon">TC</div>
            <h3>Rác Tái Chế</h3>
            <p>Giấy báo, vỏ lon, chai nhựa, hộp kim loại...</p>
            <ul>
              <li>Thu gom để tái sản xuất</li>
              <li>Giảm khai thác tài nguyên</li>
            </ul>
          </div>

          <div className="home-guide__card home-guide__card--residual">
            <div className="home-guide__icon">VC</div>
            <h3>Rác Vô Cơ</h3>
            <p>Khẩu trang, sành sứ vỡ, bỉm, băng vệ sinh...</p>
            <ul>
              <li>Không thể tái chế</li>
              <li>Cần xử lý tập trung</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="cua-hang" className="home-store">
        <div className="home-store__leaf"></div>
        <div className="home-section-head home-section-head--split">
          <div>
            <span>Cửa hàng xanh</span>
            <h2>Sản Phẩm</h2>
          </div>
          <Link to="/shop" className="home-link">
            Xem tất cả
          </Link>
        </div>

        {productLoading ? (
          <p className="home-muted">Đang tải sản phẩm...</p>
        ) : products.length === 0 ? (
          <p className="home-muted">Chưa có sản phẩm.</p>
        ) : (
          <div className="home-products">
            {products.map((item, index) => (
              <div key={item.id || index} className="home-product">
                <div
                  className="home-product__thumb"
                  style={{ backgroundImage: `url(${item.image})` }}
                  role="img"
                  aria-label={item.name}
                >
                  {item.badge && index === 0 && (
                    <div className="home-badge">Mới</div>
                  )}
                </div>
                <div className="home-product__body">
                  <span className="home-product__tag">
                    {item.badge || "Sản phẩm xanh"}
                  </span>
                  <h4>{item.name}</h4>
                  <p className="home-price">{item.price || "Liên hệ"}</p>
                  <button className="home-btn home-btn--outline">
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="blog" className="home-blog">
        <div className="home-section-head home-section-head--blog">
          <div>
            <h2>Bài Viết Mới Nhất</h2>
            <p>Cập nhật tin tức và mẹo vặt sống xanh mỗi ngày</p>
          </div>
          <Link to="/blog" className="home-link home-link--light">
            Xem tất cả
          </Link>
        </div>

        {blogLoading ? (
          <p className="home-muted">Đang tải bài viết...</p>
        ) : blogs.length === 0 ? (
          <p className="home-muted">Chưa có bài viết nào.</p>
        ) : (
          <div className="home-blog__grid">
            {blogs.map((item) => (
              <article key={item.id} className="home-blog__card">
                <div
                  className="home-blog__thumb"
                  style={{ backgroundImage: `url(${item.thumbnail})` }}
                  role="img"
                  aria-label={item.title}
                />
                <div className="home-blog__body">
                  <h3>{item.title}</h3>
                  <p>
                    {(item.content || "").slice(0, 120)}
                    {(item.content || "").length > 120 ? "..." : ""}
                  </p>
                  <Link to={`/blog/${item.id}`} className="home-blog__link">
                    Đọc tiếp
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
