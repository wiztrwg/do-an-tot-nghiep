import React, { useState, useEffect, useContext } from "react";
import "./Contact.css";
import { UserContext } from "../../../context/UserContext";

function Contact() {
  const { user } = useContext(UserContext);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const API_BASE = "http://localhost:5000";

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      name: prev.name || user.name || "",
      email: prev.email || user.email || "",
    }));
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    setSending(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const payload = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const message =
          (isJson && payload?.message) ||
          (typeof payload === "string" && payload) ||
          "Gửi liên hệ thất bại.";
        throw new Error(message);
      }

      setSuccess(true);
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      setError(err.message || "Không gửi được liên hệ.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero__content">
          <span className="about-pill">About Us</span>
          <h1>Đồ án tốt nghiệp về AI & Deep Learning</h1>
          <p>
            Dự án tập trung vào bài toán phân loại rác thải bằng thị giác máy
            tính, hướng tới ứng dụng thực tế cho phân loại rác thông minh.
          </p>
        </div>
      </section>

      <section className="about-section">
        <div className="about-card">
          <h2>Đồ án tốt nghiệp</h2>
          <p>
            Phần này được đặt trang trọng ngay sau phần Hero, nhấn mạnh đây là
            công trình nghiên cứu về AI & Deep Learning nhằm hỗ trợ phân loại
            rác thải chính xác và hiệu quả.
          </p>
        </div>
        <div className="about-card">
          <h2>Dataset</h2>
          <p>
            Garbage Classification Dataset được xử lý và làm sạch trước khi
            huấn luyện. Tập dữ liệu được chia rõ ràng theo tỉ lệ Train/Val/Test
            để đánh giá chất lượng mô hình một cách khách quan.
          </p>
        </div>
      </section>

      <section className="about-section">
        <div className="about-card about-card--full">
          <h2>Công nghệ sử dụng</h2>
          <p>
            Tech Stack được thiết kế hiện đại, thể hiện đầy đủ từ mô hình AI
            (EfficientNet/MobileNet) đến hạ tầng Backend/Database và giao diện
            người dùng.
          </p>
          <div className="tech-grid">
            <div className="tech-card tech-python">
              <span>Python</span>
              <small>Tiền xử lý dữ liệu, huấn luyện mô hình</small>
            </div>
            <div className="tech-card tech-tensorflow">
              <span>TensorFlow</span>
              <small>EfficientNet / MobileNet</small>
            </div>
            <div className="tech-card tech-react">
              <span>React</span>
              <small>Giao diện người dùng</small>
            </div>
            <div className="tech-card tech-node">
              <span>Node.js / Express</span>
              <small>API & xử lý nghiệp vụ</small>
            </div>
            <div className="tech-card tech-db">
              <span>MySQL</span>
              <small>Lưu trữ dữ liệu</small>
            </div>
            <div className="tech-card tech-ai">
              <span>Computer Vision</span>
              <small>Pipeline nhận diện rác thải</small>
            </div>
          </div>
        </div>
      </section>

      <section className="about-contact">
        <div className="about-contact__intro">
          <h2>Liên hệ</h2>
          <p>Gửi phản hồi hoặc câu hỏi để chúng tôi hỗ trợ bạn nhanh nhất.</p>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Tên của bạn"
            value={formData.name}
            onChange={handleChange}
            disabled={sending}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            disabled={sending}
          />
          <textarea
            name="message"
            placeholder="Tin nhắn..."
            value={formData.message}
            onChange={handleChange}
            disabled={sending}
          />
          <button type="submit" disabled={sending}>
            {sending ? "Đang gửi..." : "Gửi liên hệ"}
          </button>
        </form>

        {success && (
          <p className="success-msg">Gửi thành công! Cảm ơn bạn 😊</p>
        )}
        {error && <p className="error-msg">{error}</p>}
      </section>
    </div>
  );
}

export default Contact;
