// src/components/page/Blog/BlogList.js
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Blog.css";

const API_BASE = process.env.REACT_APP_API || "http://localhost:5000";

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = useMemo(() => localStorage.getItem("token"), []);
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    []
  );
  const canCreate = !!token && user.role === "admin";

  useEffect(() => {
    fetch(`${API_BASE}/api/blog`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBlogs(data);
        } else if (Array.isArray(data.blogs)) {
          setBlogs(data.blogs);
        } else {
          setBlogs([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch blog error:", err);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="blog-page">
        <div className="blog-hero shimmer">
          <div className="hero-copy">
            <div className="pill"></div>
            <div className="title"></div>
            <div className="desc"></div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="blog-page">
      <section className="blog-hero">
        <div className="hero-copy">
          <p className="hero-pill">Blog môi trường</p>
          <h1>Góc nhìn xanh & câu chuyện tái chế</h1>
          <p className="hero-desc">
            Những bài viết mới nhất về môi trường, tái chế và lối sống bền vững.
            Khám phá kiến thức, kinh nghiệm và cập nhật xu hướng.
          </p>
          <div className="hero-actions">
            <Link className="btn-primary" to="/blog">
              Xem bài mới
            </Link>
            {canCreate && (
              <Link className="btn-ghost" to="/blog/create">
                + Viết bài
              </Link>
            )}
          </div>
        </div>
        <div className="hero-card">
          <div className="hero-badge">Nổi bật</div>
          <h3>Thói quen xanh mỗi ngày</h3>
          <p>
            Từ phân loại rác tại nguồn đến tái sử dụng đồ cũ, từng bước nhỏ tạo
            nên thay đổi lớn cho hành tinh.
          </p>
          <div className="hero-stats">
            <div>
              <span className="stat-number">{blogs.length}</span>
              <span className="stat-label">Bài viết</span>
            </div>
            <div>
              <span className="stat-number">24k</span>
              <span className="stat-label">Lượt đọc</span>
            </div>
          </div>
        </div>
      </section>

      <section className="blog-section">
        <div className="section-head">
          <div>
            <p className="section-pill">Bài mới</p>
            <h2>Tin nóng & câu chuyện</h2>
            <p className="section-desc">
              Cập nhật nhanh các chủ đề về tái chế, môi trường và cộng đồng.
            </p>
          </div>
        </div>

        {blogs.length === 0 ? (
          <div className="empty-state">
            <p>Chưa có bài viết nào.</p>
            {canCreate && <Link to="/blog/create">Viết bài đầu tiên</Link>}
          </div>
        ) : (
          <div className="blog-grid">
            {blogs.map((blog) => (
              <Link to={`/blog/${blog.id}`} key={blog.id} className="blog-card">
                <div className="card-thumb">
                  {blog.thumbnail ? (
                    <img
                      src={`${API_BASE}/uploads/blogs/${blog.thumbnail}`}
                      alt={blog.title}
                    />
                  ) : (
                    <div className="thumb-fallback">Eco</div>
                  )}
                  <span className="card-badge">
                    {new Date(blog.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>

                <div className="card-body">
                  <div className="card-meta">
                    <span className="meta-dot"></span>
                    <span>{blog.author || "Tác giả"}</span>
                  </div>
                  <h3 className="card-title">{blog.title}</h3>
                  <p className="card-desc">
                    {(blog.content || "").slice(0, 120)}
                    {(blog.content || "").length > 120 ? "..." : ""}
                  </p>
                  <div className="card-footer">
                    <div className="chip">#môi trường</div>
                    <div className="chip">#tái chế</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
