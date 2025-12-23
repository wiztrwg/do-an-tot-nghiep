const express = require("express");
const router = express.Router();
const { pool } = require("../database/db");
const authMiddleware = require("../middleware/authMiddleware");

// Tạo bảng giỏ hàng nếu chưa có
async function ensureCartTables() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_cart_user_product (user_id, product_id)
    )
  `);
}

ensureCartTables().catch((err) =>
  console.error("❌ Không thể tạo bảng giỏ hàng:", err.message)
);

// Helper: Lấy ảnh đầu tiên của product
const getFirstImage = async (productIds) => {
  if (!productIds.length) return {};
  const [rows] = await pool.query(
    "SELECT product_id, MIN(filename) AS filename FROM eco_product_images WHERE product_id IN (?) GROUP BY product_id",
    [productIds]
  );
  return rows.reduce((acc, cur) => {
    acc[cur.product_id] = cur.filename;
    return acc;
  }, {});
};

// GET /api/cart - danh sách giỏ hàng theo user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.execute(
      `SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.badge, p.impact, p.description, p.image
       FROM cart_items c
       JOIN eco_products p ON c.product_id = p.id
       WHERE c.user_id = ? AND p.is_active = 1`,
      [userId]
    );

    const productIds = rows.map((r) => r.product_id);
    const firstImages = await getFirstImage(productIds);

    const items = rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      quantity: r.quantity,
      name: r.name,
      price: r.price,
      badge: r.badge,
      impact: r.impact,
      description: r.description,
      image:
        firstImages[r.product_id] || r.image
          ? `/uploads/products/${firstImages[r.product_id] || r.image}`
          : null,
    }));

    res.json({ items });
  } catch (err) {
    console.error("🔥 Lỗi lấy giỏ hàng:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/cart - thêm sản phẩm (upsert)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) return res.status(400).json({ error: "Thiếu productId" });
    const qty = parseInt(quantity, 10);
    if (Number.isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: "Số lượng không hợp lệ" });
    }

    // kiểm tra sản phẩm tồn tại và active
    const [prod] = await pool.execute(
      "SELECT id FROM eco_products WHERE id = ? AND is_active = 1",
      [productId]
    );
    if (!prod.length) {
      return res.status(404).json({ error: "Sản phẩm không tồn tại hoặc đã ẩn" });
    }

    await pool.execute(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [userId, productId, qty]
    );

    res.json({ message: "Đã thêm vào giỏ" });
  } catch (err) {
    console.error("🔥 Lỗi thêm giỏ hàng:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/cart/item/:id - cập nhật số lượng
router.put("/item/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const qty = parseInt(req.body.quantity, 10);

    if (Number.isNaN(qty) || qty < 0) {
      return res.status(400).json({ error: "Số lượng không hợp lệ" });
    }

    if (qty === 0) {
      await pool.execute("DELETE FROM cart_items WHERE id = ? AND user_id = ?", [
        id,
        userId,
      ]);
      return res.json({ message: "Đã xóa sản phẩm khỏi giỏ" });
    }

    const [result] = await pool.execute(
      "UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?",
      [qty, id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy sản phẩm trong giỏ" });
    }

    res.json({ message: "Đã cập nhật số lượng" });
  } catch (err) {
    console.error("🔥 Lỗi cập nhật giỏ hàng:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/cart/item/:id - xóa sản phẩm
router.delete("/item/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const [result] = await pool.execute(
      "DELETE FROM cart_items WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy sản phẩm trong giỏ" });
    }
    res.json({ message: "Đã xóa sản phẩm khỏi giỏ" });
  } catch (err) {
    console.error("🔥 Lỗi xóa sản phẩm giỏ hàng:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
