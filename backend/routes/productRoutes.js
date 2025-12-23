const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { pool } = require("../database/db");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

/* ============================================================================
   UPLOADS CONFIG
   - Lưu ảnh sản phẩm vào /uploads/products
============================================================================ */
const productDir = path.join(__dirname, "..", "uploads", "products");
if (!fs.existsSync(productDir)) fs.mkdirSync(productDir, { recursive: true });

const storage = multer.diskStorage({
  destination: productDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `product_${Date.now()}_${Math.round(
      Math.random() * 1e6
    )}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB mỗi file
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Chỉ hỗ trợ JPG, PNG, WEBP"));
    }
    cb(null, true);
  },
});

/* ============================================================================
   DB INIT (Idempotent)
============================================================================ */
async function ensureShopTables() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS eco_products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price INT NOT NULL,
      badge VARCHAR(255),
      impact VARCHAR(255),
      description TEXT,
      image VARCHAR(255),
      tags VARCHAR(255),
      is_active TINYINT(1) DEFAULT 1,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS eco_product_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      filename VARCHAR(255) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES eco_products(id) ON DELETE CASCADE
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS eco_bundles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      saving VARCHAR(255),
      bonus VARCHAR(255),
      items_json TEXT,
      is_active TINYINT(1) DEFAULT 1,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

ensureShopTables().catch((err) =>
  console.error("❌ Không thể tạo bảng gian hàng:", err.message)
);

const removeFileIfExists = (filename) => {
  if (!filename) return;
  const filePath = path.join(productDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, () => {});
  }
};

const getImagesByProduct = async (productId) => {
  const [rows] = await pool.execute(
    "SELECT filename FROM eco_product_images WHERE product_id = ?",
    [productId]
  );
  return rows.map((r) => r.filename);
};

const replaceImages = async (productId, files) => {
  // xóa file cũ + record cũ
  const oldImages = await getImagesByProduct(productId);
  oldImages.forEach((f) => removeFileIfExists(f));
  await pool.execute("DELETE FROM eco_product_images WHERE product_id = ?", [
    productId,
  ]);

  if (!files || !files.length) return [];

  const values = files.map((f) => [productId, f.filename]);
  await pool.query(
    "INSERT INTO eco_product_images (product_id, filename) VALUES ?",
    [values]
  );
  return files.map((f) => f.filename);
};

/* ============================================================================
   Fallback data (khi chưa có dữ liệu trong DB)
============================================================================ */
const fallbackProducts = [
  {
    id: "seed-1",
    name: "Bình giữ nhiệt tái chế",
    price: 349000,
    badge: "Thép không gỉ 304",
    impact: "Thay thế 540 ly nhựa/năm",
    description:
      "Giữ nóng/lạnh 8h, lót silicone chống tràn, nắp tre tái chế.",
    image:
      "https://images.unsplash.com/photo-1523365280197-f21d6cfc1c67?auto=format&fit=crop&w=800&q=80",
    tags: "reuse,steel",
  },
  {
    id: "seed-2",
    name: "Bộ dụng cụ ăn mang đi",
    price: 289000,
    badge: "Tre hữu cơ",
    impact: "Giảm 320 bộ muỗng nĩa dùng một lần",
    description: "Hộp đựng bã mía, muỗng nĩa inox, túi vải gấp gọn.",
    image:
      "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=800&q=80",
    tags: "reusable,travel",
  },
  {
    id: "seed-3",
    name: "Xà phòng rửa bát sinh học",
    price: 129000,
    badge: "100% phân hủy",
    impact: "Không microplastic",
    description:
      "Chiết xuất vỏ cam & dừa, an toàn cho da và hệ thống nước thải.",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    tags: "home,bio",
  },
];

const fallbackBundles = [
  {
    id: "bundle-1",
    title: "Combo mang đi không rác",
    saving: "Tiết kiệm 18%",
    bonus: "Tặng sticker #NoPlastic",
    items: ["Bình giữ nhiệt", "Dụng cụ ăn", "Túi tote"],
  },
  {
    id: "bundle-2",
    title: "Combo nhà bếp xanh",
    saving: "Tiết kiệm 15%",
    bonus: "Giao hàng carbon-neutral",
    items: [
      "Nước rửa bát sinh học",
      "Túi zip tái sử dụng",
      "Khăn lau cellulose",
    ],
  },
];

const mapProduct = (row, images = []) => ({
  id: row.id,
  name: row.name,
  price: row.price,
  badge: row.badge,
  impact: row.impact,
  description: row.description,
  image: row.image
    ? `/uploads/products/${row.image}`
    : "https://via.placeholder.com/400x240?text=Eco+Product",
  tags: row.tags || "",
  images:
    images.length > 0
      ? images.map((fn) => `/uploads/products/${fn}`)
      : row.image
      ? [`/uploads/products/${row.image}`]
      : [],
});

/* ============================================================================
   GET /api/products -> danh sách sản phẩm đang active
============================================================================ */
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM eco_products WHERE is_active = 1 ORDER BY createdAt DESC"
    );
    const ids = rows.map((r) => r.id);
    let imagesMap = {};
    if (ids.length) {
      const [imgs] = await pool.query(
        "SELECT product_id, filename FROM eco_product_images WHERE product_id IN (?)",
        [ids]
      );
      imagesMap = imgs.reduce((acc, curr) => {
        acc[curr.product_id] = acc[curr.product_id] || [];
        acc[curr.product_id].push(curr.filename);
        return acc;
      }, {});
    }

    if (!rows.length) {
      return res.json({ items: fallbackProducts, source: "fallback" });
    }

    res.json({
      items: rows.map((r) => mapProduct(r, imagesMap[r.id] || [])),
      source: "database",
    });
  } catch (err) {
    console.error("🔥 Lỗi lấy danh sách sản phẩm:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   GET /api/products/admin -> danh sách đầy đủ (admin)
============================================================================ */
router.get("/admin", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM eco_products ORDER BY createdAt DESC"
    );
    res.json({ items: rows.map(mapProduct), source: "database" });
  } catch (err) {
    console.error("🔥 Lỗi lấy danh sách sản phẩm (admin):", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   GET /api/products/:id -> chi tiết sản phẩm (public, chỉ active)
============================================================================ */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      "SELECT * FROM eco_products WHERE id = ? AND is_active = 1 LIMIT 1",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    }

    const images = await getImagesByProduct(id);
    return res.json(mapProduct(rows[0], images));
  } catch (err) {
    console.error("🔥 Lỗi lấy chi tiết sản phẩm:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   POST /api/products (admin) -> tạo sản phẩm
============================================================================ */
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const { name, price, badge, impact, description, tags } = req.body;

      if (!name || !price) {
        return res.status(400).json({ error: "Thiếu tên hoặc giá" });
      }

      const priceNum = parseInt(price, 10);
      if (Number.isNaN(priceNum) || priceNum <= 0) {
        return res.status(400).json({ error: "Giá không hợp lệ" });
      }

      const image = req.files?.[0]?.filename || null;

      const [result] = await pool.execute(
        `INSERT INTO eco_products 
          (name, price, badge, impact, description, image, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, priceNum, badge, impact, description, image, tags]
      );

      res.json({
        message: "Đã tạo sản phẩm",
        product: {
          id: result.insertId,
          name,
          price: priceNum,
          badge,
          impact,
          description,
          image: image ? `/uploads/products/${image}` : null,
          tags,
        },
      });

      // lưu nhiều ảnh vào bảng images
      if (req.files && req.files.length) {
        const values = req.files.map((f) => [result.insertId, f.filename]);
        await pool.query(
          "INSERT INTO eco_product_images (product_id, filename) VALUES ?",
          [values]
        );
      }
    } catch (err) {
      console.error("🔥 Lỗi tạo sản phẩm:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/* ============================================================================
   PUT /api/products/:id (admin) -> cập nhật sản phẩm
============================================================================ */
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, price, badge, impact, description, tags } = req.body;
      const priceNum =
        typeof price !== "undefined" ? parseInt(price, 10) : undefined;

      const fields = [];
      const values = [];

      if (name) {
        fields.push("name = ?");
        values.push(name);
      }
      if (!Number.isNaN(priceNum) && priceNum > 0) {
        fields.push("price = ?");
        values.push(priceNum);
      }
      if (badge !== undefined) {
        fields.push("badge = ?");
        values.push(badge);
      }
      if (impact !== undefined) {
        fields.push("impact = ?");
        values.push(impact);
      }
      if (description !== undefined) {
        fields.push("description = ?");
        values.push(description);
      }
      if (tags !== undefined) {
        fields.push("tags = ?");
        values.push(tags);
      }

      const newFiles = req.files || [];
      if (newFiles.length) {
        const cover = newFiles[0].filename;
        fields.push("image = ?");
        values.push(cover);
      }

      if (!fields.length) {
        return res.status(400).json({ error: "Không có trường cập nhật" });
      }

      values.push(id);

      // Lấy ảnh cũ để dọn khi có ảnh mới
      let oldImage = null;
      if (newFiles.length) {
        const [current] = await pool.execute(
          "SELECT image FROM eco_products WHERE id = ?",
          [id]
        );
        if (current.length) {
          oldImage = current[0].image;
        }
      }

      const [result] = await pool.execute(
        `UPDATE eco_products SET ${fields.join(", ")} WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
      }

      if (newFiles.length && oldImage && oldImage !== newFiles[0].filename) {
        removeFileIfExists(oldImage);
      }

      if (newFiles.length) {
        await replaceImages(id, newFiles);
      }

      res.json({ message: "Đã cập nhật sản phẩm" });
    } catch (err) {
      console.error("🔥 Lỗi cập nhật sản phẩm:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/* ============================================================================
   DELETE /api/products/:id (admin) -> soft delete
============================================================================ */
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const [current] = await pool.execute(
        "SELECT image FROM eco_products WHERE id = ?",
        [id]
      );

      const [result] = await pool.execute(
        "UPDATE eco_products SET is_active = 0 WHERE id = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
      }

      // Nếu muốn xoá hẳn ảnh khi ẩn, bỏ comment dòng dưới:
      // removeFileIfExists(current?.[0]?.image);

      res.json({ message: "Đã ẩn sản phẩm" });
    } catch (err) {
      console.error("🔥 Lỗi xoá sản phẩm:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/* ============================================================================
   GET /api/products/bundles -> danh sách combo
============================================================================ */
router.get("/bundles", async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM eco_bundles WHERE is_active = 1 ORDER BY createdAt DESC"
    );

    if (!rows.length) {
      return res.json({ items: fallbackBundles, source: "fallback" });
    }

    const bundles = rows.map((row) => ({
      id: row.id,
      title: row.title,
      saving: row.saving,
      bonus: row.bonus,
      items: row.items_json ? JSON.parse(row.items_json) : [],
    }));

    res.json({ items: bundles, source: "database" });
  } catch (err) {
    console.error("🔥 Lỗi lấy combo:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================================
   POST /api/products/bundles (admin)
============================================================================ */
router.post(
  "/bundles",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { title, saving, bonus, items } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Thiếu tiêu đề combo" });
      }

      const itemList = Array.isArray(items)
        ? items
        : typeof items === "string"
        ? items.split(",").map((i) => i.trim()).filter(Boolean)
        : [];

      const [result] = await pool.execute(
        `INSERT INTO eco_bundles (title, saving, bonus, items_json)
         VALUES (?, ?, ?, ?)`,
        [title, saving, bonus, JSON.stringify(itemList)]
      );

      res.json({
        message: "Đã tạo combo",
        bundle: {
          id: result.insertId,
          title,
          saving,
          bonus,
          items: itemList,
        },
      });
    } catch (err) {
      console.error("🔥 Lỗi tạo combo:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/* ============================================================================
   PUT /api/products/bundles/:id (admin)
============================================================================ */
router.put(
  "/bundles/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, saving, bonus, items } = req.body;

      const fields = [];
      const values = [];

      if (title !== undefined) {
        fields.push("title = ?");
        values.push(title);
      }
      if (saving !== undefined) {
        fields.push("saving = ?");
        values.push(saving);
      }
      if (bonus !== undefined) {
        fields.push("bonus = ?");
        values.push(bonus);
      }
      if (items !== undefined) {
        const itemList = Array.isArray(items)
          ? items
          : typeof items === "string"
          ? items.split(",").map((i) => i.trim()).filter(Boolean)
          : [];
        fields.push("items_json = ?");
        values.push(JSON.stringify(itemList));
      }

      if (!fields.length) {
        return res.status(400).json({ error: "Không có trường cập nhật" });
      }

      values.push(id);

      const [result] = await pool.execute(
        `UPDATE eco_bundles SET ${fields.join(", ")} WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Không tìm thấy combo" });
      }

      res.json({ message: "Đã cập nhật combo" });
    } catch (err) {
      console.error("🔥 Lỗi cập nhật combo:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/* ============================================================================
   DELETE /api/products/bundles/:id (admin) -> soft delete
============================================================================ */
router.delete(
  "/bundles/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const [result] = await pool.execute(
        "UPDATE eco_bundles SET is_active = 0 WHERE id = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Không tìm thấy combo" });
      }

      res.json({ message: "Đã ẩn combo" });
    } catch (err) {
      console.error("🔥 Lỗi xoá combo:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
