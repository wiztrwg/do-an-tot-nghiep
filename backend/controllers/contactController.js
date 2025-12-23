const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendContactEmail = async (req, res) => {
  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ message: "Thiếu thông tin bắt buộc." });
  }

  try {
    const to = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;

    await transporter.sendMail({
      to,
      from,
      replyTo: email,
      subject: `Liên hệ từ ${name}`,
      text: `Tên: ${name}\nEmail: ${email}\n\nNội dung:\n${message}`,
    });

    return res.json({ message: "Gửi liên hệ thành công." });
  } catch (error) {
    console.error("Contact email error:", error);
    return res.status(500).json({ message: "Không gửi được email." });
  }
};

module.exports = { sendContactEmail };
