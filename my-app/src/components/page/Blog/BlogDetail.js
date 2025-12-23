import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CommentList from "./CommentList";
import "./BlogDetail.css";
import "./Comment.css";

const API_BASE = process.env.REACT_APP_API || "http://localhost:5000";

const BlogDetail = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");

  const token = localStorage.getItem("token");

  // ==========================
  // HÀM LOAD BLOG (COMMENT + LIKE)
  // ==========================
  const fetchBlog = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/blog/${id}`);
      const data = await res.json();
      setBlog(data);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi fetch chi tiết blog:", error);
    }
  };

  // LIKE / DISLIKE BLOG
  const handleBlogReaction = async (type) => {
    if (!token) return alert("Bạn cần đăng nhập");

    await fetch(`${API_BASE}/api/blog/${id}/reaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type }),
    });

    fetchBlog(); // <<< luôn có hàm reload hợp lệ
  };

  // COMMENT BLOG
  const handleSubmitComment = async () => {
    if (!token) return alert("Bạn cần đăng nhập");
    if (!commentContent.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/blog/${id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: commentContent }),
      });

      const data = await res.json();
      if (res.ok && !data.error) {
        setCommentContent("");
        fetchBlog();
      } else {
        alert(data.error || "Không thể gửi bình luận");
      }
    } catch (err) {
      console.error("Lỗi gửi bình luận:", err);
    }
  };

  useEffect(() => {
    fetchBlog();
  }, []);

  if (loading) return <p>Đang tải...</p>;
  if (!blog) return <p>Không tìm thấy bài viết</p>;

  return (
    <div className="blog-detail-container">
      <h1 className="blog-detail-title">{blog.title}</h1>

      <p className="blog-author">Viết bởi: {blog.author}</p>

      {blog.thumbnail && (
        <img
          src={`http://localhost:5000/uploads/blogs/${blog.thumbnail}`}
          alt="Thumbnail"
          className="blog-thumbnail"
        />
      )}

      <div className="blog-content">{blog.content}</div>

      {/* LIKE / DISLIKE BLOG */}
      <div className="blog-reaction-box">
        <button
          className="react-btn like-btn"
          onClick={() => handleBlogReaction("like")}
        >
          👍 {blog.likes}
        </button>

        <button
          className="react-btn dislike-btn"
          onClick={() => handleBlogReaction("dislike")}
        >
          👎 {blog.dislikes}
        </button>
      </div>

      <h2 className="comment-title">Bình luận</h2>

      <div className="comment-form">
        <textarea
          placeholder="Viết bình luận của bạn..."
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
        />
        <button onClick={handleSubmitComment}>Gửi bình luận</button>
      </div>

      {/* LUÔN TRUYỀN fetchBlog LÀM reload */}
      <CommentList comments={blog.comments} blogId={id} reload={fetchBlog} />
    </div>
  );
};

export default BlogDetail;
