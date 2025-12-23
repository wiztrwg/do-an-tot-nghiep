const express = require("express");
const router = express.Router();
const { pool } = require("../database/db");
const authMiddleware = require("../middleware/authMiddleware");
const nodemailer = require("nodemailer");

// Tạo bảng nếu chưa có (tương thích MySQL cũ)
async function ensureOrderTables() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      total INT NOT NULL,
      payment_method VARCHAR(50) DEFAULT 'cod',
      status VARCHAR(50) DEFAULT 'pending',
      shipping_name VARCHAR(255),
      shipping_email VARCHAR(255),
      shipping_phone VARCHAR(50),
      shipping_address VARCHAR(255),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      price INT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);
}

ensureOrderTables().catch((err) =>
  console.error("❌ Không thể tạo bảng orders:", err.message)
);

const sendOrderEmail = async (to, order) => {
  // Nếu chưa cấu hình SMTP thì bỏ qua gửi mail để tránh lỗi
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("⚠️ SMTP chưa cấu hình, bỏ qua gửi email.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const itemsText = order.items
    .map(
      (i) => `- ${i.name} x${i.quantity} - ${i.price.toLocaleString("vi-VN")}đ`
    )
    .join("\n");

  const itemsHtml = order.items
    .map(
      (i) => `
        <tr>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;">${i.name}</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center;">${i.quantity}</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:right;">${i.price.toLocaleString(
            "vi-VN"
          )}đ</td>
        </tr>`
    )
    .join("");

  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: `Xác nhận đơn hàng #${order.id}`,
    text: `Cảm ơn bạn đã đặt hàng.

Mã đơn: ${order.id}
Tổng tiền: ${order.total.toLocaleString("vi-VN")}đ
Phương thức: ${order.payment_method}

Sản phẩm:
${itemsText}

Thông tin nhận:
${order.shipping_name}
${order.shipping_phone || ""} ${order.shipping_email || ""}
${order.shipping_address || ""}

Chúng tôi sẽ liên hệ để xác nhận và giao hàng.
`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;">
      <h2 style="color:#0f9c63;">Cảm ơn bạn đã đặt hàng!</h2>
      <p>Mã đơn: <strong>#${order.id}</strong></p>
      <p>Tổng tiền: <strong>${order.total.toLocaleString("vi-VN")}đ</strong></p>
      <p>Phương thức: <strong>${order.payment_method.toUpperCase()}</strong></p>
      <h3 style="margin-top:16px;">Sản phẩm</h3>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <thead>
          <tr>
            <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left;">Sản phẩm</th>
            <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center;">SL</th>
            <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:right;">Giá</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <h3 style="margin-top:16px;">Thông tin nhận hàng</h3>
      <p><strong>${order.shipping_name || ""}</strong></p>
      <p>${order.shipping_phone || ""}</p>
      <p>${order.shipping_email || ""}</p>
      <p>${order.shipping_address || ""}</p>
      <p style="margin-top:16px;">Chúng tôi sẽ liên hệ để xác nhận và giao hàng.</p>
    </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// POST /api/order
router.post("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const paymentMethod = req.body.paymentMethod || "cod";

  const connection = await pool.getConnection();
  try {
    // Lấy thông tin user
    const [userRows] = await connection.execute(
      "SELECT name, email, phone, address FROM users WHERE id = ?",
      [userId]
    );
    if (!userRows.length) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }
    const userInfo = userRows[0];

    // Lấy giỏ hàng
    const [cartItems] = await connection.execute(
      `SELECT c.id, c.product_id, c.quantity, p.price, p.name
       FROM cart_items c
       JOIN eco_products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [userId]
    );

    if (!cartItems.length) {
      return res.status(400).json({ error: "Giỏ hàng trống" });
    }

    const total = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await connection.beginTransaction();

    const [orderResult] = await connection.execute(
      `INSERT INTO orders 
        (user_id, total, payment_method, shipping_name, shipping_email, shipping_phone, shipping_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        total,
        paymentMethod,
        userInfo.name || "",
        userInfo.email || "",
        userInfo.phone || "",
        userInfo.address || "",
      ]
    );

    const orderId = orderResult.insertId;

    const orderItemsValues = cartItems.map((item) => [
      orderId,
      item.product_id,
      item.quantity,
      item.price,
    ]);

    await connection.query(
      "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
      [orderItemsValues]
    );

    // Xóa giỏ hàng sau khi đặt
    await connection.execute("DELETE FROM cart_items WHERE user_id = ?", [
      userId,
    ]);

    await connection.commit();

    // Gửi email (không chặn response nếu lỗi)
    sendOrderEmail(userInfo.email, {
      id: orderId,
      total,
      payment_method: paymentMethod,
      items: cartItems,
      shipping_name: userInfo.name,
      shipping_phone: userInfo.phone,
      shipping_email: userInfo.email,
      shipping_address: userInfo.address,
    }).catch((err) => console.error("⚠️ Gửi email thất bại:", err.message));

    res.json({
      message: "Đặt hàng thành công",
      orderId,
    });
  } catch (err) {
    await connection.rollback();
    console.error("🔥 Lỗi đặt hàng:", err);
    res.status(500).json({ error: "Đặt hàng thất bại" });
  } finally {
    connection.release();
  }
});

module.exports = router;
