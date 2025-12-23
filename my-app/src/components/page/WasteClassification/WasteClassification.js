import React, { useState } from "react";
import "./WasteClassification.css";

function WasteClassification() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

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
      const prediction = data.prediction;
      setResult(prediction);
      if (prediction?.label) {
        const normalized = prediction.label.toLowerCase();
        const displayLabel =
          guidanceByLabel[normalized]?.title || prediction.label;
        setHistory((prev) => [
          {
            id: Date.now(),
            label: prediction.label,
            displayLabel,
            confidence:
              typeof prediction.confidence === "number"
                ? prediction.confidence
                : 0,
            time: new Date().toISOString(),
            preview,
          },
          ...prev,
        ]);
      }
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

  const guidanceByLabel = {
    battery: {
      title: "Pin, ắc quy",
      handling:
        "Không bỏ vào rác sinh hoạt. Thu gom riêng và mang đến điểm thu hồi pin/ắc quy hoặc trung tâm tái chế có xử lý chất thải nguy hại.",
      reuse:
        "Không tái chế tại nhà. Ưu tiên thu gom an toàn để tránh rò rỉ hóa chất.",
    },
    glass: {
      title: "Thủy tinh",
      handling:
        "Rửa sạch, để khô và phân loại riêng. Bỏ vào thùng rác tái chế hoặc điểm thu gom thủy tinh.",
      reuse:
        "Có thể tận dụng làm lọ cắm hoa, hộp đựng, hoặc trang trí nếu không bị nứt vỡ.",
    },
    metal: {
      title: "Kim loại",
      handling:
        "Làm sạch, loại bỏ thức ăn/dầu mỡ. Ép dẹt nếu có thể để tiết kiệm diện tích. Bỏ vào thùng tái chế kim loại.",
      reuse:
        "Tận dụng lon, hộp kim loại làm chậu cây, hộp bút hoặc đồ trang trí.",
    },
    organic: {
      title: "Rác hữu cơ",
      handling:
        "Tách riêng, hạn chế lẫn nhựa/kim loại. Ưu tiên ủ phân compost hoặc bỏ vào thùng rác hữu cơ.",
      reuse:
        "Ủ phân hữu cơ cho cây trồng. Có thể dùng bã cà phê, vỏ trứng làm phân bón tự nhiên.",
    },
    paper: {
      title: "Giấy",
      handling:
        "Giữ sạch và khô. Không trộn giấy dính dầu mỡ. Bỏ vào thùng tái chế giấy.",
      reuse:
        "Tái sử dụng làm giấy ghi chú, bọc quà, hoặc đồ thủ công (origami, collage).",
    },
    plastic: {
      title: "Nhựa",
      handling:
        "Rửa sạch, để khô. Tháo nắp, bóp dẹt chai/lọ. Phân loại theo ký hiệu nhựa nếu có.",
      reuse:
        "Tái dùng chai/lọ làm chậu cây, hộp đựng. Hạn chế tái dùng với nhựa dùng một lần.",
    },
  };

  const normalizedLabel =
    typeof result?.label === "string" ? result.label.toLowerCase() : "";
  const guidance = guidanceByLabel[normalizedLabel] || null;

  const formatTime = (iso) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("vi-VN");
  };

  return (
    <div className="waste-classification">
      <section className="wc-hero">
        <div className="wc-hero__content">
          <span className="wc-hero__badge">TRỢ LÝ AI PHÂN LOẠI RÁC</span>
          <h1>
            Phân loại rác thông minh
            <br />
            Cùng trợ lý AI ✨
          </h1>
          <p>
            Sử dụng công nghệ thị giác máy tính để nhận diện rác thải nhanh chóng
            và gợi ý các giải pháp tái chế bền vững.
          </p>
          <a className="wc-hero__cta" href="#wc-workspace">
            Bắt đầu quét ngay ✨
          </a>
        </div>
      </section>

      <section className="wc-workspace" id="wc-workspace">
        <div className="wc-workspace__inner">
          <div className="wc-card wc-card--upload">
            <div className="wc-card__title">
              <span className="wc-icon" aria-hidden="true">
                📷
              </span>
              <h2>Tải ảnh rác thải lên</h2>
            </div>

          <label
            className={`wc-dropzone ${selectedImage ? "is-ready" : ""}`}
            htmlFor="wc-upload"
          >
            <input
              id="wc-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {preview ? (
              <div className="wc-dropzone__preview">
                <img src={preview} alt="Xem trước" />
              </div>
            ) : (
              <>
                <div className="wc-dropzone__icon" aria-hidden="true">
                  ⬆️
                </div>
                <div>
                  <p className="wc-dropzone__title">Kéo thả ảnh vào đây</p>
                  <p className="wc-dropzone__hint">
                    AI sẽ tự động nhận diện rác thải ✨
                  </p>
                </div>
              </>
            )}
            {selectedImage && <p className="wc-file">{selectedImage.name}</p>}
          </label>

          <button
            className="wc-action"
            onClick={handlePredict}
            disabled={!selectedImage || loading}
          >
            {loading ? "Đang phân tích..." : "✨ Phân tích bằng AI"}
          </button>
        </div>

          <div className="wc-card wc-card--result">
            <div className="wc-result">
              {loading && (
                <div className="wc-result__state is-loading">
                  <span className="wc-brain" aria-hidden="true" />
                  AI đang phân tích ảnh...
                </div>
              )}

              {!loading && result && (
                <div className="wc-result__content">
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
                  {guidance && (
                    <div className="wc-guides">
                      <div className="wc-guide-card">
                        <div className="wc-guide__title">Hướng dẫn xử lý</div>
                        <p>{guidance.handling}</p>
                      </div>
                      <div className="wc-guide-card wc-guide-card--alt">
                        <div className="wc-guide__title">
                          Ý tưởng tái chế ✨
                        </div>
                        <p>{guidance.reuse}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!loading && !result && (
                <div className="wc-result__state">
                  <span className="wc-brain" aria-hidden="true" />
                  Hãy tải ảnh lên để AI bắt đầu công việc ✨
                </div>
              )}
            </div>

            <div className="wc-result__meta">
              {result ? "Kết quả đã sẵn sàng" : "Chưa có ảnh để phân loại"}
            </div>

            <button className="wc-reset" onClick={handleReset}>
              Làm mới
            </button>
          </div>
        </div>
      </section>

      <section className="wc-history">
        <div className="wc-history__inner">
          <h2>Lịch sử phân loại</h2>
          <p>Theo dõi các lần phân loại gần đây để so sánh kết quả.</p>
          {history.length === 0 ? (
            <div className="wc-history__empty">
              Chưa có lịch sử. Hãy phân loại một bức ảnh để bắt đầu.
            </div>
          ) : (
            <div className="wc-history__grid">
              {history.map((item) => (
                <div className="wc-history__card" key={item.id}>
                  <div className="wc-history__thumb">
                    {item.preview ? (
                      <img src={item.preview} alt={item.displayLabel} />
                    ) : (
                      <span>Ảnh</span>
                    )}
                  </div>
                  <div className="wc-history__info">
                    <div className="wc-history__label">
                      {item.displayLabel}
                    </div>
                    <div className="wc-history__meta">
                      <span>{formatConfidence(item.confidence)}</span>
                      <span>{formatTime(item.time)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default WasteClassification;
