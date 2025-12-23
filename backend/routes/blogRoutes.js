const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const { pool } = require("../database/db");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

/* ============================================================================
   MULTER CONFIG - UPLOAD THUMBNAIL
============================================================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/blogs"));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + path.extname(file.originalname);
    cb(null, "thumb_" + unique);
  },
});

const upload = multer({ storage });

/* ============================================================================
   HÀM XÂY CÂY COMMENT (NESTED)
============================================================================ */
function buildCommentTree(comments) {
  const map = {};
  const roots = [];

  comments.forEach((c) => {
    c.replies = [];
    map[c.id] = c;
  });

  comments.forEach((c) => {
    if (c.parent_id) {
      if (map[c.parent_id]) {
        map[c.parent_id].replies.push(c);
      }
    } else {
      roots.push(c);
    }
  });

  return roots;
}

/* ============================================================================
   1. TẠO BÀI VIẾT (ADMIN)
============================================================================ */
router.post("/", authMiddleware, upload.single("thumbnail"), async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!title || !content) {
      return res.status(400).json({ error: "Thiếu dữ liệu bài viết" });
    }

    const thumbnail = req.file ? req.file.filename : null;

    // Admin tạo bài viết sẽ auto duyệt, user thì pending
    const status = userRole === "admin" ? "approved" : "pending";

    await pool.execute(
      `INSERT INTO blog (user_id, title, content, thumbnail, status)
         VALUES (?, ?, ?, ?, ?)`,
      [userId, title, content, thumbnail, status]
    );

    res.json({
      message:
        status === "approved"
          ? "Tạo bài viết thành công"
          : "Đã gửi bài, chờ admin duyệt",
      status,
    });
  } catch (err) {
    console.error("🔥 Lỗi tạo bài viết:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   2. LẤY DANH SÁCH BLOG + LIKE/DISLIKE
============================================================================ */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT 
          b.*, 
          u.name AS author,
          COALESCE((
            SELECT SUM(type = 'like') FROM blog_likes bl WHERE bl.blog_id = b.id
          ), 0) AS likes,
          COALESCE((
            SELECT SUM(type = 'dislike') FROM blog_likes bl2 WHERE bl2.blog_id = b.id
          ), 0) AS dislikes
       FROM blog b
       JOIN users u ON b.user_id = u.id
       WHERE b.status = 'approved'
       ORDER BY b.createdAt DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error("🔥 Lỗi lấy danh sách blog:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   3. LẤY CHI TIẾT BLOG + COMMENT + LIKE/DISLIKE
============================================================================ */
router.get("/:id", async (req, res) => {
  try {
    const blogId = req.params.id;

    // Lấy bài viết
    const [rows] = await pool.execute(
      `SELECT b.*, u.name AS author 
       FROM blog b 
       JOIN users u ON b.user_id = u.id
       WHERE b.id = ?`,
      [blogId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy bài viết" });
    }

    const blog = rows[0];

    // Ẩn bài chưa duyệt với công chúng
    if (blog.status !== "approved") {
      return res.status(403).json({ error: "Bài viết đang chờ duyệt" });
    }

    // Lấy tổng like/dislike của blog
    const [blogReacts] = await pool.execute(
      `SELECT 
         COALESCE(SUM(type = 'like'), 0) AS likes,
         COALESCE(SUM(type = 'dislike'), 0) AS dislikes
       FROM blog_likes
       WHERE blog_id = ?`,
      [blogId]
    );

    const blogLikes = blogReacts[0] || { likes: 0, dislikes: 0 };

    // Lấy tất cả comment + user
    const [comments] = await pool.execute(
      `SELECT c.*, u.name AS userName, u.avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.blog_id = ?
       ORDER BY c.createdAt ASC`,
      [blogId]
    );

    // Lấy like/dislike cho từng comment
    const [commentReactionRows] = await pool.execute(
      `SELECT 
         c.id AS comment_id,
         COALESCE(SUM(cl.type = 'like'), 0) AS likes,
         COALESCE(SUM(cl.type = 'dislike'), 0) AS dislikes
       FROM comments c
       LEFT JOIN comment_likes cl ON cl.comment_id = c.id
       WHERE c.blog_id = ?
       GROUP BY c.id`,
      [blogId]
    );

    const reactMap = {};
    commentReactionRows.forEach((r) => {
      reactMap[r.comment_id] = {
        likes: r.likes || 0,
        dislikes: r.dislikes || 0,
      };
    });

    // Gán likes/dislikes vào comment
    comments.forEach((c) => {
      const reacts = reactMap[c.id] || { likes: 0, dislikes: 0 };
      c.likes = reacts.likes;
      c.dislikes = reacts.dislikes;
    });

    // Xây cây comment
    const commentTree = buildCommentTree(comments);

    res.json({
      ...blog,
      likes: blogLikes.likes,
      dislikes: blogLikes.dislikes,
      comments: commentTree,
    });
  } catch (err) {
    console.error("🔥 Lỗi lấy chi tiết blog:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   3b. DANH SÁCH BÀI CHỜ DUYỆT (ADMIN)
============================================================================ */
router.get(
  "/admin/pending",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const [rows] = await pool.execute(
        `SELECT b.*, u.name AS author
         FROM blog b
         JOIN users u ON b.user_id = u.id
         WHERE b.status = 'pending'
         ORDER BY b.createdAt DESC`
      );

      res.json(rows);
    } catch (err) {
      console.error("🔥 Lỗi lấy bài chờ duyệt:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/* ============================================================================
   3c. DUYỆT / TỪ CHỐI BÀI VIẾT (ADMIN)
============================================================================ */
router.put(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const blogId = req.params.id;
      const { status } = req.body; // 'approved' | 'rejected' | 'pending'

      const allowed = ["approved", "rejected", "pending"];
      if (!allowed.includes(status)) {
        return res.status(400).json({ error: "Trạng thái không hợp lệ" });
      }

      const [result] = await pool.execute(
        "UPDATE blog SET status = ? WHERE id = ?",
        [status, blogId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Không tìm thấy bài viết" });
      }

      res.json({ message: "Cập nhật trạng thái thành công", status });
    } catch (err) {
      console.error("🔥 Lỗi cập nhật trạng thái:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/* ============================================================================
   4. USER COMMENT
============================================================================ */
router.post("/:id/comment", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const blogId = req.params.id;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Nội dung trống" });
    }

    await pool.execute(
      `INSERT INTO comments (blog_id, user_id, content)
       VALUES (?, ?, ?)`,
      [blogId, userId, content]
    );

    res.json({ message: "Đã bình luận" });
  } catch (err) {
    console.error("🔥 Lỗi comment:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   5. USER TRẢ LỜI COMMENT (REPLY)
============================================================================ */
router.post("/:id/comment/:parentId", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const blogId = req.params.id;
    const parentId = req.params.parentId;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Nội dung trống" });
    }

    await pool.execute(
      `INSERT INTO comments (blog_id, user_id, content, parent_id)
       VALUES (?, ?, ?, ?)`,
      [blogId, userId, content, parentId]
    );

    res.json({ message: "Đã trả lời bình luận" });
  } catch (err) {
    console.error("🔥 Lỗi reply:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   6. SỬA COMMENT
============================================================================ */
router.put("/comment/:commentId", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const commentId = req.params.commentId;
    const userId = req.user.id;

    const [rows] = await pool.execute(
      "SELECT user_id FROM comments WHERE id = ?",
      [commentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Comment không tồn tại" });
    }

    if (rows[0].user_id != userId) {
      return res.status(403).json({ error: "Không có quyền sửa" });
    }

    await pool.execute("UPDATE comments SET content = ? WHERE id = ?", [
      content,
      commentId,
    ]);

    res.json({ message: "Đã sửa bình luận" });
  } catch (err) {
    console.error("🔥 Lỗi sửa comment:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   7. XÓA COMMENT (USER HOẶC ADMIN)
============================================================================ */
router.delete("/comment/:commentId", authMiddleware, async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.user.id;
    const userRole = req.user.role; // nếu bạn có gắn role trong token

    const [rows] = await pool.execute(
      "SELECT user_id FROM comments WHERE id = ?",
      [commentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Comment không tồn tại" });
    }

    if (rows[0].user_id != userId && userRole !== "admin") {
      return res.status(403).json({ error: "Không có quyền xoá" });
    }

    await pool.execute("DELETE FROM comments WHERE id = ?", [commentId]);

    res.json({ message: "Đã xoá bình luận" });
  } catch (err) {
    console.error("🔥 Lỗi xóa comment:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   8. REACTION BLOG (LIKE/DISLIKE)
============================================================================ */
router.post("/:id/reaction", authMiddleware, async (req, res) => {
  try {
    const blogId = req.params.id;
    const userId = req.user.id;
    const { type } = req.body; // 'like' | 'dislike'

    if (!["like", "dislike"].includes(type)) {
      return res.status(400).json({ error: "Loại reaction không hợp lệ" });
    }

    await pool.execute(
      `INSERT INTO blog_likes (blog_id, user_id, type)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE type = VALUES(type)`,
      [blogId, userId, type]
    );

    res.json({ message: "Đã cập nhật reaction cho bài viết" });
  } catch (err) {
    console.error("🔥 Lỗi reaction blog:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   9. REACTION COMMENT (LIKE/DISLIKE)
============================================================================ */
router.post(
  "/comment/:commentId/reaction",
  authMiddleware,
  async (req, res) => {
    try {
      const commentId = req.params.commentId;
      const userId = req.user.id;
      const { type } = req.body; // 'like' | 'dislike'

      if (!["like", "dislike"].includes(type)) {
        return res.status(400).json({ error: "Loại reaction không hợp lệ" });
      }

      await pool.execute(
        `INSERT INTO comment_likes (comment_id, user_id, type)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE type = VALUES(type)`,
        [commentId, userId, type]
      );

      res.json({ message: "Đã cập nhật reaction cho bình luận" });
    } catch (err) {
      console.error("🔥 Lỗi reaction comment:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/* ============================================================================
   10. CẬP NHẬT BLOG (ADMIN)
============================================================================ */
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  upload.single("thumbnail"),
  async (req, res) => {
    try {
      const blogId = req.params.id;
      const { title, content } = req.body;
      const thumbnail = req.file ? req.file.filename : null;

      await pool.execute(
        `UPDATE blog 
         SET title = ?, content = ?, thumbnail = COALESCE(?, thumbnail)
         WHERE id = ?`,
        [title, content, thumbnail, blogId]
      );

      res.json({ message: "Cập nhật thành công" });
    } catch (err) {
      console.error("🔥 Lỗi update blog:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/* ============================================================================
   11. XOÁ BLOG (ADMIN)
============================================================================ */
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const blogId = req.params.id;

    await pool.execute("DELETE FROM blog WHERE id = ?", [blogId]);

    res.json({ message: "Đã xoá bài viết" });
  } catch (err) {
    console.error("🔥 Lỗi delete blog:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
