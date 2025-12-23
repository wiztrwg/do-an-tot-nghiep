import React from "react";
import "./About.css";

function About() {
  return (
    <div className="about-page">
      <h1>Giới thiệu dự án</h1>
      <p>
        Dự án này là một hệ thống **phân loại rác bằng AI**, giúp nhận diện và
        phân loại rác đúng cách, nâng cao ý thức bảo vệ môi trường.
      </p>

      <section className="about-section">
        <h2>Mục tiêu</h2>
        <ul>
          <li>Hỗ trợ người dùng phân loại rác nhanh chóng và chính xác.</li>
          <li>Tăng cường nhận thức về môi trường.</li>
          <li>Kết hợp công nghệ AI và web để trải nghiệm thân thiện.</li>
        </ul>
      </section>

      <section className="about-section">
        <h2>Công nghệ sử dụng</h2>
        <ul>
          <li>Frontend: React.js, CSS hiện đại</li>
          <li>Backend: Node.js hoặc Flask</li>
          <li>AI: TensorFlow / Keras (.h5 model)</li>
          <li>Hosting / Deployment: Có thể dùng Vercel / Heroku</li>
        </ul>
      </section>

      <section className="about-section">
        <h2>Tác giả</h2>
        <p>
          Phan Minh Trường – Sinh viên ngành Trí tuệ nhân tạo, Đại học Công nghệ
          Thông tin & Truyền thông Việt Hàn.
        </p>
      </section>
    </div>
  );
}

export default About;
