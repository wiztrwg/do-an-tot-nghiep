// backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../database/db");
const authMiddleware = require("../middleware/authMiddleware");

const fileUpload = require("express-fileupload");
const path = require("path");
const fs = require("fs");

// Enable file upload
router.use(
  fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // limit 5MB (backend vẫn kiểm tra lại)
    abortOnLimit: false,
  })
);

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Make sure folder exists
const avatarDir = path.join(__dirname, "..", "uploads", "avatars");
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

// Đảm bảo bảng users có cột phone và address (tương thích MySQL cũ không hỗ trợ IF NOT EXISTS)
async function ensureUserContactColumns() {
  const addColumnIfMissing = async (col, ddl) => {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS cnt
       FROM information_schema.COLUMNS
       WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = ?`,
      [col]
    );
    if (!rows[0].cnt) {
      await pool.execute(`ALTER TABLE users ADD COLUMN ${ddl}`);
    }
  };

  try {
    await addColumnIfMissing("phone", "phone VARCHAR(50) NULL");
    await addColumnIfMissing("address", "address VARCHAR(255) NULL");
  } catch (e) {
    console.error("⚠️ Không thể thêm cột phone/address:", e.message);
  }
}

ensureUserContactColumns();

/* ----------------------------------
   📌 REGISTER
---------------------------------- */
router.post("/register", async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  try {
    const [exists] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (exists.length > 0) {
      return res.status(400).json({ error: "Email đã tồn tại" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await pool.execute(
      "INSERT INTO users (name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashed, phone || null, address || null]
    );

    res.json({ message: "Đăng ký thành công" });
  } catch (err) {
    console.log("🔥 ERROR REGISTER:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

/* ----------------------------------
   📌 LOGIN
---------------------------------- */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(400).json({ error: "Email không tồn tại" });
    }

    const user = rows[0];

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ error: "Sai mật khẩu" });
    }

    // Determine role (fallback: treat configured admin email as admin)
    const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";
    const userRole = user.role || (user.email === adminEmail ? "admin" : "user");

    const token = jwt.sign(
      { id: user.id, email: user.email, role: userRole },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: userRole,
        avatar: user.avatar || null,
        phone: user.phone || "",
        address: user.address || "",
      },
    });
  } catch (err) {
    console.log("🔥 ERROR LOGIN:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

/* ----------------------------------
   📌 GET PROFILE (cần JWT)
---------------------------------- */
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, name, email, avatar, role, phone, address FROM users WHERE id = ?",
      [req.user.id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Không tìm thấy user" });

    const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";
    const profile = rows[0];
    profile.role =
      profile.role || (profile.email === adminEmail ? "admin" : "user");

    res.json(profile);
  } catch (err) {
    console.log("🔥 ERROR GET PROFILE:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

/* ----------------------------------
   📌 UPDATE PROFILE (cần JWT)
---------------------------------- */
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const name = req.body.name?.trim();
    const newPassword = req.body.password;
    const phone = req.body.phone?.trim();
    const address = req.body.address?.trim();

    let avatarFilename = null;

    /* -----------------------
       🖼 XỬ LÝ AVATAR UPLOAD
    --------------------------- */
    if (req.files && req.files.avatar) {
      const avatar = req.files.avatar;

      // 1️⃣ Allowed types
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(avatar.mimetype)) {
        return res.status(400).json({ error: "Chỉ hỗ trợ JPG, PNG hoặc WEBP" });
      }

      // 2️⃣ Max size = 3MB
      const maxSize = 3 * 1024 * 1024;
      if (avatar.size > maxSize) {
        return res.status(400).json({ error: "Ảnh quá lớn! Tối đa 3MB" });
      }

      // 3️⃣ Create safe name
      const ext = path.extname(avatar.name).toLowerCase();
      avatarFilename = `avatar_${userId}_${Date.now()}${ext}`;

      const savePath = path.join(avatarDir, avatarFilename);

      // 4️⃣ Save file
      await avatar.mv(savePath);

      // 5️⃣ Remove old avatar
      try {
        const [old] = await pool.execute(
          "SELECT avatar FROM users WHERE id = ?",
          [userId]
        );
        if (old.length && old[0].avatar) {
          const oldPath = path.join(avatarDir, old[0].avatar);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      } catch (e) {}
    }

    /* -----------------------
       📝 CẬP NHẬT DATABASE
    --------------------------- */
    const updates = [];
    const values = [];

    if (name) {
      updates.push("name = ?");
      values.push(name);
    }

    if (newPassword && newPassword.length >= 6) {
      const hashed = await bcrypt.hash(newPassword, 10);
      updates.push("password = ?");
      values.push(hashed);
    }

    if (avatarFilename) {
      updates.push("avatar = ?");
      values.push(avatarFilename);
    }

    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone || null);
    }

    if (address !== undefined) {
      updates.push("address = ?");
      values.push(address || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Không có trường nào để cập nhật" });
    }

    values.push(userId);
    await pool.execute(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    // return updated user
    const [newUser] = await pool.execute(
      "SELECT id, name, email, avatar, role, phone, address FROM users WHERE id = ?",
      [userId]
    );

    const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";
    const updated = newUser[0];
    updated.role =
      updated.role || (updated.email === adminEmail ? "admin" : "user");

    res.json({ message: "Cập nhật thành công", user: updated });
  } catch (err) {
    console.log("🔥 ERROR UPDATE PROFILE:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

module.exports = router;
