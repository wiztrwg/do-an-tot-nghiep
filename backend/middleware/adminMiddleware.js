const { pool } = require("../database/db");

module.exports = async function (req, res, next) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";

    // If JWT already contains admin role, allow immediately
    if (req.user && req.user.role === "admin") {
      return next();
    }

    const userId = req.user.id;

    // Check DB role (and fallback to email match if role missing)
    const [rows] = await pool.execute(
      "SELECT email, role FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: "Admin access only" });
    }

    const dbUser = rows[0];
    const isAdmin = dbUser.role === "admin" || dbUser.email === adminEmail;

    if (!isAdmin) {
      return res.status(403).json({ error: "Admin access only" });
    }

    next();
  } catch (err) {
    console.error("adminMiddleware error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
