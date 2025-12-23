# ==============================
# FIX TF LOGS (đặt trước TF import)
# ==============================
import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import sys
import json
import numpy as np
from PIL import Image
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.resnet50 import preprocess_input

IMG_SIZE = (224, 224)

MODEL_FILENAME = "model_resnet50.h5"
MODEL_PATH = os.path.join(os.path.dirname(__file__), MODEL_FILENAME)

# Nếu bạn muốn map nhãn chuẩn theo đúng thứ tự lúc train,
# hãy tạo file classes.json đặt cạnh predict.py
# Ví dụ nội dung classes.json:
# ["battery","glass","metal","organic","paper","plastic"]
CLASSES_JSON = os.path.join(os.path.dirname(__file__), "classes.json")

def load_class_names(num_classes: int):
    # 1) Ưu tiên classes.json nếu có
    if os.path.exists(CLASSES_JSON):
        with open(CLASSES_JSON, "r", encoding="utf-8") as f:
            names = json.load(f)
        if isinstance(names, list) and len(names) == num_classes:
            return names
        # nếu file có nhưng sai độ dài -> báo lỗi rõ ràng
        raise ValueError(
            f"classes.json length={len(names)} but model outputs num_classes={num_classes}"
        )

    # 2) Fallback: tạo tên lớp mặc định để không crash
    return [f"class_{i}" for i in range(num_classes)]

# ------------------------------
# LOAD MODEL
# ------------------------------
try:
    model = load_model(MODEL_PATH)
    num_classes = int(model.output_shape[-1])
    CLASS_NAMES = load_class_names(num_classes)
except Exception as e:
    print(json.dumps({"error": "Failed to init predictor", "details": str(e)}))
    sys.exit(1)

def predict(image_path: str):
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    img = Image.open(image_path).convert("RGB")
    img = img.resize(IMG_SIZE)

    x = np.expand_dims(np.array(img), axis=0)
    x = preprocess_input(x)

    preds = model.predict(x, verbose=0)[0]
    idx = int(np.argmax(preds))

    # an toàn tuyệt đối
    if idx < 0 or idx >= len(CLASS_NAMES):
        raise ValueError(
            f"Predicted index {idx} out of CLASS_NAMES range {len(CLASS_NAMES)}"
        )

    top3_idx = np.argsort(preds)[-3:][::-1]
    top3 = []
    for i in top3_idx:
        label = CLASS_NAMES[i] if i < len(CLASS_NAMES) else f"class_{i}"
        top3.append({"label": label, "confidence": round(float(preds[i]), 4)})

    return {
        "label": CLASS_NAMES[idx],
        "confidence": round(float(preds[idx]), 4),
        "top3": top3,
        "num_classes": len(CLASS_NAMES),
    }

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            raise ValueError("Usage: python predict.py <image_path>")

        result = predict(sys.argv[1])
        print(json.dumps(result))  # CHỈ JSON
    except Exception as e:
        print(json.dumps({"error": "Prediction failed", "details": str(e)}))
        sys.exit(1)
