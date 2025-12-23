// controllers/predictController.js
const { exec } = require("child_process");
const fs = require("fs/promises");
const path = require("path");

// Lệnh Python đã hoạt động
const PYTHON_CMD = "python";

const runPrediction = (req, res) => {
  // 1. Kiểm tra File (Sử dụng req.file từ Multer)
  if (!req.file) {
    // Lỗi này xảy ra nếu Multer không nhận được file (ví dụ: tên trường sai)
    return res.status(400).json({ message: "Không tìm thấy file ảnh." });
  }

  // Dùng đường dẫn tuyệt đối để tránh sai cwd khi exec
  const imagePath = path.resolve(req.file.path);
  const pythonScriptPath = path.join(__dirname, "..", "model", "predict.py");

  // 2. Xây dựng Lệnh Shell (Khắc phục lỗi Encoding/Path)
  // 🔥 SỬA LỖI: Sử dụng "cmd /c" để khắc phục lỗi ký tự có dấu/khoảng trắng
  // "\" được escape thành "\\" trong chuỗi JavaScript
  const pythonCommand = `${PYTHON_CMD} \"${pythonScriptPath}\" \"${imagePath}\"`;
  const command = `cmd /c "${pythonCommand}"`; // <-- THỰC THI QUA CMD SHELL

  // 3. Thực thi Python
  exec(command, async (error, stdout, stderr) => {
    let result = {};

    // Xóa file ảnh đã upload ngay sau khi sử dụng
    try {
      await fs.unlink(imagePath);
    } catch (cleanupError) {
      console.error("Lỗi khi xóa file tạm:", cleanupError.message);
    }

    // 4. Xử lý Lỗi từ Shell/Node.js
    // Nếu Python trả về mã lỗi, vẫn cố parse stdout để lấy thông tin lỗi
    if (error) {
      const cleanStdout = stdout.trim();
      try {
        const parsed = cleanStdout ? JSON.parse(cleanStdout) : null;
        if (parsed?.error) {
          console.error("Lỗi từ Python (predict.py):", parsed.details);
          return res.status(500).json({
            message: "Lỗi trong script dự đoán Python.",
            details: parsed.details,
          });
        }
      } catch (_) {
        // fallthrough
      }

      console.error(
        `Lỗi khi thực thi Python (Node.js error): ${error.message}`
      );
      return res.status(500).json({
        message: "Lỗi server khi chạy mô hình.",
        details: error.message,
        stderr: stderr,
        rawOutput: cleanStdout,
      });
    }

    // 5. Xử lý Kết quả (JSON) từ Python
    try {
      const cleanStdout = stdout.trim();
      result = JSON.parse(cleanStdout);

      // Kiểm tra lỗi nội bộ từ Python
      if (result.error) {
        console.error("Lỗi từ Python (predict.py):", result.details);
        return res.status(500).json({
          message: "Lỗi trong script dự đoán Python.",
          details: result.details,
        });
      }
    } catch (parseError) {
      console.error("Lỗi khi parse kết quả từ Python:", parseError);
      return res.status(500).json({
        message: "Lỗi định dạng kết quả từ mô hình Python.",
        rawOutput: stdout.trim(), // Để debug nếu lỗi vẫn xảy ra
      });
    }

    // 6. Gửi kết quả thành công
    res.status(200).json({
      message: "Dự đoán thành công",
      prediction: result,
    });
  });
};

module.exports = { runPrediction };
