require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectDB } = require("./database/db");
const predictRoutes = require("./routes/predictRoutes");
const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const contactRoutes = require("./routes/contactRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve avatar images
app.use(
  "/uploads/avatars",
  express.static(path.join(__dirname, "uploads", "avatars"))
);

// Serve blog thumbnail images
app.use(
  "/uploads/blogs",
  express.static(path.join(__dirname, "uploads", "blogs"))
);
app.use(
  "/uploads/products",
  express.static(path.join(__dirname, "uploads", "products"))
);

// Routes
app.use("/api/predict", predictRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/contact", contactRoutes);

app.get("/", (req, res) => res.send("API Server is running..."));

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
