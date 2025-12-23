import React, { useState } from "react";
import "./Contact.css";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate cơ bản
    if (!formData.name || !formData.email || !formData.message) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    // TODO: Gửi dữ liệu lên backend/email service nếu có
    console.log("Form submitted:", formData);

    setSuccess(true);
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="contact-page">
      <h1>Liên hệ</h1>
      <p>Gửi phản hồi hoặc câu hỏi đến chúng tôi</p>

      <form className="contact-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Tên của bạn"
          value={formData.name}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />
        <textarea
          name="message"
          placeholder="Tin nhắn..."
          value={formData.message}
          onChange={handleChange}
        />
        <button type="submit">Gửi</button>
      </form>

      {success && <p className="success-msg">Gửi thành công! Cảm ơn bạn 😊</p>}
    </div>
  );
}

export default Contact;
