import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Admin.css";

const API_BASE = process.env.REACT_APP_API || "http://localhost:5000";
const parseJSONSafe = async (res) => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (_) {
    return { error: text || "Response không phải JSON" };
  }
};

const emptyProduct = {
  id: null,
  name: "",
  price: "",
  badge: "",
  impact: "",
  description: "",
  tags: "",
  imageFiles: [],
};

function Admin() {
  const navigate = useNavigate();

  const token = useMemo(() => localStorage.getItem("token"), []);
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    []
  );
  const isAdmin = token && user.role === "admin";

  const [activeTab, setActiveTab] = useState("blog");

  const [pendingBlogs, setPendingBlogs] = useState([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionKey, setActionKey] = useState("");
  const [search, setSearch] = useState("");
  const [unauthorized, setUnauthorized] = useState(false);

  const [products, setProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productNotice, setProductNotice] = useState("");
  const [productError, setProductError] = useState("");
  const [productAction, setProductAction] = useState("");
  const [productForm, setProductForm] = useState(emptyProduct);

  const loadData = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const pendingPromise = fetch(`${API_BASE}/api/blog/admin/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const approvedPromise = fetch(`${API_BASE}/api/blog`);

      const [pendingRes, approvedRes] = await Promise.all([
        pendingPromise,
        approvedPromise,
      ]);

      if (pendingRes.status === 401 || pendingRes.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      const pendingData = await pendingRes.json();
      const approvedData = await approvedRes.json();

      setPendingBlogs(Array.isArray(pendingData) ? pendingData : []);
      setApprovedCount(Array.isArray(approvedData) ? approvedData.length : 0);
    } catch (err) {
      console.error("Load admin data error:", err);
      setError("Không thể tải dữ liệu, hãy thử lại.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, navigate, token]);

  const loadProducts = useCallback(async () => {
    if (!isAdmin) return;

    setProductLoading(true);
    setProductError("");
    setProductNotice("");

    try {
      const res = await fetch(`${API_BASE}/api/products/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      const data = await parseJSONSafe(res);
      const items = Array.isArray(data.items) ? data.items : [];
      const normalized = items.map((p) => {
        const normalizeUrl = (url) =>
          url && !url.startsWith("http") ? `${API_BASE}${url}` : url;
        const images = Array.isArray(p.images)
          ? p.images.map((u) => normalizeUrl(u))
          : [];

        return {
          ...p,
          image: normalizeUrl(p.image),
          images,
        };
      });
      setProducts(normalized);
    } catch (err) {
      console.error("Load products error:", err);
      setProductError("Không thể tải danh sách sản phẩm.");
    } finally {
      setProductLoading(false);
    }
  }, [isAdmin, navigate, token]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (!isAdmin) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }

    loadData();
  }, [isAdmin, loadData, navigate, token]);

  useEffect(() => {
    if (activeTab === "products" && isAdmin) {
      loadProducts();
    }
  }, [activeTab, isAdmin, loadProducts]);

  const handleUpdateStatus = async (blogId, status) => {
    if (!isAdmin) return;

    setActionKey(`${blogId}-${status}`);
    setError("");
    setNotice("");

    try {
      const res = await fetch(`${API_BASE}/api/blog/${blogId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Cập nhật thất bại");
      }

      setPendingBlogs((prev) => prev.filter((b) => b.id !== blogId));
      if (status === "approved") {
        setApprovedCount((count) => count + 1);
        setNotice("Đã duyệt bài viết thành công.");
      } else if (status === "rejected") {
        setNotice("Đã từ chối bài viết.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionKey("");
    }
  };

  const filteredBlogs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return pendingBlogs;
    return pendingBlogs.filter(
      (b) =>
        b.title?.toLowerCase().includes(keyword) ||
        b.author?.toLowerCase().includes(keyword)
    );
  }, [pendingBlogs, search]);

  const renderSkeleton = () => (
    <div className="admin-card skeleton">
      <div className="skeleton-line wide"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line short"></div>
    </div>
  );

  const resetProductForm = () => {
    setProductForm(emptyProduct);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    setProductError("");
    setProductNotice("");

    const { id, name, price, badge, impact, description, tags, imageFiles } =
      productForm;

    if (!name || !price) {
      setProductError("Vui lòng nhập tên và giá sản phẩm.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("badge", badge);
    formData.append("impact", impact);
    formData.append("description", description);
    formData.append("tags", tags);
    if (imageFiles && imageFiles.length) {
      imageFiles.forEach((file) => formData.append("images", file));
    }

    const isEdit = Boolean(id);
    const url = isEdit
      ? `${API_BASE}/api/products/${id}`
      : `${API_BASE}/api/products`;
    const method = isEdit ? "PUT" : "POST";
    setProductAction(isEdit ? `edit-${id}` : "create");

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await parseJSONSafe(res);
      if (!res.ok) {
        throw new Error(data.error || "Thao tác thất bại");
      }

      await loadProducts();
      resetProductForm();
      setProductNotice(isEdit ? "Đã cập nhật sản phẩm." : "Đã tạo sản phẩm.");
    } catch (err) {
      setProductError(err.message);
    } finally {
      setProductAction("");
    }
  };

  const handleProductEdit = (product) => {
    setProductForm({
      id: product.id,
      name: product.name || "",
      price: product.price || "",
      badge: product.badge || "",
      impact: product.impact || "",
      description: product.description || "",
      tags: product.tags || "",
      imageFiles: [],
    });
    setProductNotice("");
    setProductError("");
  };

  const handleProductDelete = async (id) => {
    if (!isAdmin) return;
    setProductAction(`delete-${id}`);
    setProductError("");
    setProductNotice("");

    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseJSONSafe(res);
      if (!res.ok) {
        throw new Error(data.error || "Xóa thất bại");
      }
      await loadProducts();
      setProductNotice("Đã ẩn sản phẩm.");
    } catch (err) {
      setProductError(err.message);
    } finally {
      setProductAction("");
    }
  };

  if (unauthorized) {
    return (
      <div className="admin-page">
        <div className="admin-empty">
          <p>Bạn không có quyền truy cập trang quản trị.</p>
          <button className="admin-btn ghost" onClick={() => navigate("/")}>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div>
          <p className="admin-pill">Bảng điều khiển</p>
          <h1>Quản trị nội dung</h1>
          <p className="admin-desc">
            Duyệt bài viết từ cộng đồng, theo dõi tiến độ xuất bản và giữ chất
            lượng nội dung luôn xanh.
          </p>
          <div className="admin-hero-actions">
            <button
              className="admin-btn primary"
              onClick={() => navigate("/blog/create")}
            >
              + Tạo bài mới
            </button>
            <button
              className="admin-btn ghost"
              onClick={loadData}
              disabled={loading}
            >
              ⟳ Tải lại
            </button>
          </div>
          <div className="admin-tabs">
            <button
              className={`tab-btn ${activeTab === "blog" ? "active" : ""}`}
              onClick={() => setActiveTab("blog")}
            >
              Bài viết
            </button>
            <button
              className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
              onClick={() => setActiveTab("products")}
            >
              Sản phẩm
            </button>
          </div>
        </div>

        <div className="admin-hero-metrics">
          <div className="metric-card">
            <p>Chờ duyệt</p>
            <h3>{pendingBlogs.length}</h3>
            <span>Bài từ cộng đồng</span>
          </div>
          <div className="metric-card">
            <p>Đã xuất bản</p>
            <h3>{approvedCount}</h3>
            <span>Bài hiển thị công khai</span>
          </div>
          <div className="metric-card">
            <p>Quyền</p>
            <h3>{user.role || "admin"}</h3>
            <span>{user.email}</span>
          </div>
        </div>
      </section>

      {activeTab === "blog" && (
        <section className="admin-section">
          <div className="admin-section-head">
            <div>
              <p className="admin-pill muted">Moderation</p>
              <h2>Bài viết chờ duyệt</h2>
              <p className="admin-desc muted">
                Kiểm tra nhanh tiêu đề, người gửi và cập nhật trạng thái chỉ với
                một nhấp.
              </p>
            </div>

            <div className="admin-actions">
              <input
                type="text"
                placeholder="Tìm theo tiêu đề hoặc tác giả..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="admin-alert error">{error}</div>}
          {notice && <div className="admin-alert success">{notice}</div>}

          {loading ? (
            <div className="admin-grid">
              {Array.from({ length: 3 }).map((_, idx) => (
                <React.Fragment key={idx}>{renderSkeleton()}</React.Fragment>
              ))}
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="admin-empty">
              <p>Hiện không có bài nào chờ duyệt.</p>
              <button className="admin-btn ghost" onClick={loadData}>
                Tải lại
              </button>
            </div>
          ) : (
            <div className="admin-grid">
              {filteredBlogs.map((blog) => {
                const createdAt = blog.createdAt ? new Date(blog.createdAt) : null;

                return (
                  <div className="admin-card" key={blog.id}>
                    <div className="admin-card-head">
                      <div>
                        <p className="admin-meta">
                          #{blog.id} • {blog.author || "Ẩn danh"}
                        </p>
                        <h3>{blog.title}</h3>
                      </div>
                      <span className="admin-badge">Chờ duyệt</span>
                    </div>

                    <p className="admin-snippet">
                      {(blog.content || "").slice(0, 180)}
                      {(blog.content || "").length > 180 ? "..." : ""}
                    </p>

                    <div className="admin-card-foot">
                      <div className="admin-meta">
                        {createdAt
                          ? `${createdAt.toLocaleDateString(
                              "vi-VN"
                            )} • ${createdAt.toLocaleTimeString("vi-VN")}`
                          : "Không rõ thời gian"}
                      </div>
                      <div className="admin-card-actions">
                        <button
                          className="admin-btn ghost"
                          onClick={() => handleUpdateStatus(blog.id, "rejected")}
                          disabled={actionKey === `${blog.id}-rejected`}
                        >
                          {actionKey === `${blog.id}-rejected`
                            ? "Đang từ chối..."
                            : "Từ chối"}
                        </button>
                        <button
                          className="admin-btn primary"
                          onClick={() => handleUpdateStatus(blog.id, "approved")}
                          disabled={actionKey === `${blog.id}-approved`}
                        >
                          {actionKey === `${blog.id}-approved`
                            ? "Đang duyệt..."
                            : "Duyệt bài"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === "products" && (
        <section className="admin-section">
          <div className="admin-section-head">
            <div>
              <p className="admin-pill muted">Gian hàng</p>
              <h2>Quản lý sản phẩm</h2>
              <p className="admin-desc muted">
                Thêm mới, chỉnh sửa hoặc ẩn sản phẩm đang bán trong trang Gian
                hàng xanh.
              </p>
            </div>
            <div className="admin-actions">
              <button
                className="admin-btn ghost"
                onClick={loadProducts}
                disabled={productLoading}
              >
                ⟳ Tải danh sách
              </button>
              <button className="admin-btn ghost" onClick={resetProductForm}>
                + Sản phẩm mới
              </button>
            </div>
          </div>

          {productError && (
            <div className="admin-alert error">{productError}</div>
          )}
          {productNotice && (
            <div className="admin-alert success">{productNotice}</div>
          )}

          <div className="product-admin-grid">
            <div className="product-list">
              {productLoading ? (
                <div className="admin-empty">Đang tải sản phẩm...</div>
              ) : products.length === 0 ? (
                <div className="admin-empty">
                  <p>Chưa có sản phẩm nào.</p>
                </div>
              ) : (
                products.map((p) => (
                  <div className="product-card-admin" key={p.id}>
                  <div className="product-card-head">
                    <div>
                      <p className="admin-meta">#{p.id}</p>
                      <h3>{p.name}</h3>
                      <p className="admin-snippet">{p.description}</p>
                    </div>
                      {p.image && (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="product-thumb-admin"
                        />
                      )}
                  </div>
                    <div className="product-meta-row">
                      <span className="pill">{p.badge}</span>
                      <span className="pill strong">{p.impact}</span>
                      <span className="price">{p.price} đ</span>
                    </div>
                    {p.images && p.images.length > 0 && (
                      <div className="product-meta-row thumbs">
                        {p.images.slice(0, 3).map((img) => (
                          <img
                            key={img}
                            src={img}
                            alt={p.name}
                            className="product-thumb-mini"
                          />
                        ))}
                        {p.images.length > 3 && (
                          <span className="pill">+{p.images.length - 3} ảnh</span>
                        )}
                      </div>
                    )}
                    <div className="admin-card-actions">
                      <button
                        className="admin-btn ghost"
                        onClick={() => handleProductEdit(p)}
                      >
                        Sửa
                      </button>
                      <button
                        className="admin-btn primary"
                        onClick={() => handleProductDelete(p.id)}
                        disabled={productAction === `delete-${p.id}`}
                      >
                        {productAction === `delete-${p.id}`
                          ? "Đang ẩn..."
                          : "Ẩn sản phẩm"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="product-form-card">
              <h3>{productForm.id ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</h3>
              <form className="product-form" onSubmit={handleProductSubmit}>
                <label>
                  Tên sản phẩm
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Giá (đ)
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Badge / Chất liệu
                  <input
                    type="text"
                    value={productForm.badge}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        badge: e.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Tác động môi trường
                  <input
                    type="text"
                    value={productForm.impact}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        impact: e.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Mô tả
                  <textarea
                    rows="3"
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Tags (phân tách bằng dấu phẩy)
                  <input
                    type="text"
                    value={productForm.tags}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        tags: e.target.value,
                      }))
                    }
                    placeholder="reuse, home, eco"
                  />
                </label>
                <label>
                  Ảnh sản phẩm
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        imageFiles: e.target.files ? Array.from(e.target.files) : [],
                      }))
                    }
                  />
                </label>

                <div className="admin-card-actions form-actions">
                  <button
                    type="button"
                    className="admin-btn ghost"
                    onClick={resetProductForm}
                  >
                    Làm mới
                  </button>
                  <button
                    type="submit"
                    className="admin-btn primary"
                    disabled={
                      productAction === "create" ||
                      productAction === `edit-${productForm.id}`
                    }
                  >
                    {productAction
                      ? "Đang lưu..."
                      : productForm.id
                      ? "Cập nhật"
                      : "Thêm mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Admin;
