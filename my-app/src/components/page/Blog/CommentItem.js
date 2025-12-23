// src/components/page/Blog/CommentItem.js
import React, { useState } from "react";
import "./Comment.css";

const CommentItem = ({ comment, blogId, reload }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const [replyOpen, setReplyOpen] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  // LIKE / DISLIKE COMMENT
  const handleReaction = async (type) => {
    if (!token) return alert("Bạn cần đăng nhập!");

    await fetch(
      `http://localhost:5000/api/blog/comment/${comment.id}/reaction`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      }
    );

    reload();
  };

  // DELETE COMMENT
  const deleteComment = async () => {
    if (!token) return alert("Bạn cần đăng nhập!");

    if (!window.confirm("Bạn có muốn xoá bình luận này?")) return;

    await fetch(`http://localhost:5000/api/blog/comment/${comment.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    reload();
  };

  // EDIT COMMENT
  const saveEdit = async () => {
    await fetch(`http://localhost:5000/api/blog/comment/${comment.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: editContent }),
    });

    setEditOpen(false);
    reload();
  };

  // REPLY COMMENT
  const submitReply = async () => {
    if (!replyContent.trim()) return;

    await fetch(
      `http://localhost:5000/api/blog/${blogId}/comment/${comment.id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: replyContent }),
      }
    );

    setReplyContent("");
    setReplyOpen(false);
    reload();
  };

  return (
    <div className="fb-comment-box">
      {/* Avatar */}
      <img
        src={`http://localhost:5000/uploads/avatars/${comment.avatar}`}
        alt=""
        className="fb-comment-avatar"
      />

      <div className="fb-comment-content">
        {/* Name */}
        <div className="fb-comment-name">{comment.userName}</div>

        {/* Content OR Edit input */}
        {!editOpen ? (
          <div className="fb-comment-text">{comment.content}</div>
        ) : (
          <textarea
            className="fb-edit-box"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
        )}

        {/* Action buttons */}
        <div className="fb-comment-actions">
          <span onClick={() => handleReaction("like")}>👍 {comment.likes}</span>

          <span onClick={() => handleReaction("dislike")}>
            👎 {comment.dislikes}
          </span>

          <span onClick={() => setReplyOpen(!replyOpen)}>Trả lời</span>

          {/* Edit + Delete: chỉ dành cho chính chủ hoặc admin */}
          {(user?.id === comment.user_id || user?.role === "admin") && (
            <>
              <span onClick={() => setEditOpen(!editOpen)}>Sửa</span>
              <span onClick={deleteComment}>Xoá</span>
            </>
          )}

          {/* Time */}
          <span className="fb-comment-time">
            {new Date(comment.createdAt).toLocaleString()}
          </span>
        </div>

        {/* Reply box */}
        {replyOpen && (
          <div className="fb-reply-box">
            <textarea
              placeholder="Viết phản hồi..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
            <button onClick={submitReply}>Gửi</button>
          </div>
        )}

        {/* EDIT save/cancel */}
        {editOpen && (
          <div className="fb-edit-actions">
            <button onClick={saveEdit}>Lưu</button>
            <button onClick={() => setEditOpen(false)}>Hủy</button>
          </div>
        )}

        {/* Render replies (nested) */}
        {comment.replies?.length > 0 && (
          <div className="fb-comment-replies">
            {comment.replies.map((child) => (
              <CommentItem
                key={child.id}
                comment={child}
                blogId={blogId}
                reload={reload}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
