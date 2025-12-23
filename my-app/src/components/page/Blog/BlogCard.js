import React from "react";
import { Link } from "react-router-dom";
import "./BlogCard.css";

function BlogCard({ blog }) {
  const thumbSrc = blog.thumbnail
    ? `http://localhost:5000/uploads/blogs/${blog.thumbnail}`
    : "https://via.placeholder.com/600x360?text=No+Image";

  const excerpt =
    blog.excerpt ||
    (blog.content
      ? blog.content.length > 120
        ? blog.content.substring(0, 120) + "..."
        : blog.content
      : "Nội dung đang cập nhật.");

  return (
    <Link to={`/blog/${blog.id}`} className="blog-card">
      <img
        src={thumbSrc}
        alt={blog.title || "Bài viết"}
        className="blog-image"
        loading="lazy"
        onError={(e) => {
          if (e.target.dataset.fallback) return;
          e.target.dataset.fallback = "1";
          e.target.src = "https://via.placeholder.com/600x360?text=Image+Error";
        }}
      />

      <div className="blog-content">
        <span className="blog-category">{blog.category || "Tin mới"}</span>

        <h3 className="blog-card-title">{blog.title}</h3>

        <p className="blog-card-desc">{excerpt}</p>

        <div className="blog-footer">
          <span>{blog.author || "Admin"}</span>
          <span>{new Date(blog.createdAt).toLocaleDateString("vi-VN")}</span>
        </div>
      </div>
    </Link>
  );
}

export default BlogCard;
