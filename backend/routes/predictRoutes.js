// routes/predictRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer"); // Thư viện Multer chuẩn để xử lý file upload
const { runPrediction } = require("../controllers/predictController");

// Cấu hình Multer để lưu file tạm thời vào thư mục 'uploads'
// Thư mục 'uploads/' sẽ được tạo tự động nếu chưa tồn tại.
const upload = multer({ dest: "uploads/" });

// POST /api/predict
// 🔥 SỬA LỖI: Sử dụng middleware Multer.
// upload.single('image') đảm bảo Multer nhận file từ trường 'image'
// và gắn file đó vào req.file, sau đó chuyển quyền điều khiển sang runPrediction.
router.post("/", upload.single("image"), runPrediction);

module.exports = router;
