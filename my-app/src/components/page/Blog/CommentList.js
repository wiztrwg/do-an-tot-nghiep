import React from "react";
import CommentItem from "./CommentItem";

const CommentList = ({ comments, blogId, reload }) => {
  // Nếu comments chưa có hoặc rỗng → hiển thị thông báo
  if (!comments || comments.length === 0) {
    return <p>Chưa có bình luận nào.</p>;
  }

  return (
    <div className="comment-list">
      {comments.map((c) => (
        <CommentItem key={c.id} comment={c} blogId={blogId} reload={reload} />
      ))}
    </div>
  );
};

export default CommentList;
