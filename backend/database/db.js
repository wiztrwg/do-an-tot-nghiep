// database/db.js
const mysql = require("mysql2/promise");

// Cấu hình Pool Connection
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "", // THAY THẾ bằng mật khẩu của bạn
  database: "recycling_ai", // THAY THẾ bằng tên database của bạn
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Hàm kiểm tra kết nối
const connectDB = async () => {
  try {
    await pool.getConnection();
    console.log("✅ MySQL connected successfully!");
  } catch (error) {
    console.error("❌ MySQL connection failed:", error.message);
    // Thoát ứng dụng nếu không kết nối được database (tùy chọn)
    // process.exit(1);
  }
};

module.exports = { pool, connectDB };
