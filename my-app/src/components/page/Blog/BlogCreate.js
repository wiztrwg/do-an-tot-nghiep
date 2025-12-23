import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BlogCreate.css";

function BlogCreate() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [thumbnail, setThumbnail] = useState(null);

  const token = localStorage.getItem("token");
  const API_BASE = process.env.REACT_APP_API || "http://localhost:5000";

  if (!token) {
    return <p>Bạn cần đăng nhập để tạo bài viết.</p>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);

    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }

    try {
      const res = await fetch(`${API_BASE}/api/blog`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
      } else {
        alert(
          data.status === "pending"
            ? "Đã gửi bài, chờ admin duyệt."
            : "Tạo bài viết thành công!"
        );
        navigate("/blog");
      }
    } catch (err) {
      console.error("Lỗi tạo blog:", err);
    }
  };

  return (
    <div className="blog-create-container">
      <h1>Tạo bài viết mới</h1>

      <form className="blog-form" onSubmit={handleSubmit}>
        <label>Tiêu đề</label>
        <input
          type="text"
          placeholder="Nhập tiêu đề..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label>Nội dung</label>
        <textarea
          rows="10"
          placeholder="Nhập nội dung bài viết..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />

        <label>Thumbnail</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setThumbnail(e.target.files[0])}
        />

        <button type="submit" className="btn-submit">
          Đăng bài
        </button>
      </form>
    </div>
  );
}

export default BlogCreate;
