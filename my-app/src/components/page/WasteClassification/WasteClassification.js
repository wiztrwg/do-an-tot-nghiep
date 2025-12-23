import React, { useState } from "react";
import "./WasteClassification.css";

function WasteClassification() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreview(null);
    setResult(null);
    setLoading(false);
  };

  const handlePredict = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
      const API_URL = "http://localhost:5000/api/predict";

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi dự đoán từ Server.");
      }

      const data = await response.json();
      setResult(data.prediction);
    } catch (error) {
      console.error("Lỗi dự đoán:", error);
      setResult({
        label: `Lỗi Server: ${error.message || "Không xác định"}`,
        confidence: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatConfidence = (conf) => {
    if (typeof conf !== "number") return "0%";
    const safeValue = Math.max(0, Math.min(conf, 1));
    return `${(safeValue * 100).toFixed(1)}%`;
  };

  const confidenceValue =
    typeof result?.confidence === "number" ? result.confidence : 0;
  const confidencePercent = Math.max(0, Math.min(confidenceValue, 1)) * 100;

  return (
    <div className="waste-classification">
      <section className="wc-hero card">
        <div className="wc-hero__label">AI phân loại</div>
        <h1>Phân loại rác gọn gàng</h1>
        <p>Giao diện tối giản: kéo thả ảnh, theo dõi trạng thái và xem kết quả rõ ràng.</p>
        <div className="wc-hero__meta">
          <div>
            <span className="wc-dot wc-dot--green" />
            Kéo thả hoặc chọn ảnh từ thiết bị
          </div>
          <div>
            <span className="wc-dot wc-dot--blue" />
            Trả về nhãn cùng độ tin cậy trực quan
          </div>
          <div>
            <span className="wc-dot wc-dot--amber" />
            Hoạt động tốt nhất với ảnh sáng rõ, ít nhiễu
          </div>
        </div>
      </section>

      <div className="wc-panels">
        <section className="wc-panel wc-panel--upload card">
          <div className="wc-panel__head">
            <div>
              <div className="wc-step">Bước 1</div>
              <h2>Tải ảnh nhận diện</h2>
              <p>Kéo thả hoặc chọn ảnh. Giao diện báo trạng thái khi ảnh sẵn sàng.</p>
            </div>
            <div className="wc-pill">Tối ưu ảnh</div>
          </div>

          <label
            className={`wc-uploader ${selectedImage ? "wc-uploader--ready" : ""}`}
            htmlFor="wc-upload"
          >
            <input
              id="wc-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            <div className="wc-uploader__icon">+</div>
            <div>
              <p className="wc-uploader__title">
                {selectedImage ? "Ảnh đã sẵn sàng" : "Thả ảnh vào đây hoặc bấm để chọn"}
              </p>
              <p className="wc-uploader__hint">
                Hỗ trợ PNG/JPG/JPEG. Đề xuất ảnh <strong>&lt; 5MB</strong>
              </p>
              {selectedImage && (
                <p className="wc-file">{selectedImage.name}</p>
              )}
            </div>
          </label>

          {preview && (
            <div className="wc-shot">
              <div className="wc-shot__bar">
                <span>Xem nhanh</span>
                <span>{formatConfidence(confidenceValue)}</span>
              </div>
              <img src={preview} alt="Xem trước" />
            </div>
          )}

          <div className="wc-panel__actions">
            <button
              className="wc-btn wc-btn--primary"
              onClick={handlePredict}
              disabled={!selectedImage || loading}
            >
              {loading ? "Đang phân tích..." : "Phân loại ngay"}
            </button>
            <button
              className="wc-btn wc-btn--ghost"
              onClick={handleReset}
              disabled={!selectedImage && !preview && !result && !loading}
            >
              Làm mới
            </button>
          </div>

          <div className="wc-steps">
            <div className="wc-step-item">
              <span>01</span>
              <p>Vật thể chiếm khung hình, không bị cắt.</p>
            </div>
            <div className="wc-step-item">
              <span>02</span>
              <p>Nền đơn giản, tránh bóng gắt hoặc ngược sáng.</p>
            </div>
            <div className="wc-step-item">
              <span>03</span>
              <p>Nhấn “Phân loại ngay” và xem kết quả trực tiếp.</p>
            </div>
          </div>
        </section>

        <section className="wc-panel wc-panel--result card">
          <div className="wc-panel__head">
            <div>
              <div className="wc-step">Bước 2</div>
              <h2>Kết quả nhận diện</h2>
              <p>Trạng thái xử lý hiển thị trực tiếp, kèm thanh độ tin cậy dễ đọc.</p>
            </div>
            <div className="wc-pill wc-pill--status">
              {loading ? "Đang xử lý" : result ? "Hoàn tất" : "Chờ ảnh"}
            </div>
          </div>

          <div className="wc-status-line">
            <div
              className={`wc-status-chip ${
                loading ? "is-loading" : result ? "is-done" : ""
              }`}
            >
              {loading
                ? "AI đang phân tích ảnh..."
                : result
                ? "Đã nhận diện xong"
                : "Chưa có ảnh để phân loại"}
            </div>
            <div className="wc-status-hint">
              {result
                ? "Kiểm tra độ tin cậy và xác nhận."
                : "Tải ảnh để bắt đầu phân tích."}
            </div>
          </div>

          {result ? (
            <div className="wc-result-box">
              <div className="wc-result__label">{result.label}</div>
              <div className="wc-confidence">
                <span>Độ tin cậy</span>
                <div className="wc-progress">
                  <div
                    className="wc-progress__bar"
                    style={{ width: `${confidencePercent}%` }}
                  />
                </div>
                <span className="wc-confidence__value">
                  {formatConfidence(confidenceValue)}
                </span>
              </div>
              <p className="wc-result__note">
                Nếu chưa hợp lý, thử chụp gần hơn hoặc đổi góc sáng hơn.
              </p>
            </div>
          ) : (
            <div className="wc-placeholder">
              <p>Chưa có ảnh. Tải ảnh để xem nhãn phân loại và độ tin cậy.</p>
              <p className="wc-placeholder__note">
                Mẹo: nền đơn giản, vật thể rõ ràng giúp AI phân loại chuẩn hơn.
              </p>
            </div>
          )}

          <div className="wc-mini-grid">
            <div className="wc-mini">
              <h4>Trực quan</h4>
              <p>Thanh tiến độ gọn gàng, dễ lướt mắt.</p>
            </div>
            <div className="wc-mini">
              <h4>Trạng thái</h4>
              <p>Chip trạng thái đổi màu theo từng bước.</p>
            </div>
            <div className="wc-mini">
              <h4>Hướng dẫn</h4>
              <p>Gợi ý chụp ảnh đặt ngay dưới kết quả.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default WasteClassification;
