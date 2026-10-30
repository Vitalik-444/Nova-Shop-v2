import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { addProduct, deleteMyProduct, getCategories, getMyProducts, getOrders } from "../api";
import SettingsView from "../components/SettingsView";

const EMPTY_FORM = {
  title: "",
  category: "",
  brand: "",
  price: "",
  discount: "0",
  stock: "1",
  thumbnail: "",
  description: ""
};

function SellerModal({ open, onClose, onSaved }) {
  const { t, user, showToast } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (!open) setForm(EMPTY_FORM);
  }, [open]);

  const bind = field => ({
    value: form[field],
    onChange: event => setForm(current => ({ ...current, [field]: event.target.value }))
  });

  const onSubmit = async event => {
    event.preventDefault();

    const title = form.title.trim();
    const category = form.category.trim();
    const price = parseFloat(form.price.replace(",", "."));

    if (!title || !category || isNaN(price) || price <= 0) {
      showToast(t("fillRequiredFields"), "error");
      return;
    }

    setSaving(true);

    const result = await addProduct({
      title,
      category,
      brand: form.brand.trim(),
      price,
      discountPercentage: parseFloat(form.discount) || 0,
      stock: parseInt(form.stock, 10) || 1,
      thumbnail: form.thumbnail.trim(),
      description: form.description.trim()
    });

    setSaving(false);

    if (result && result.success) {
      showToast(t("productPublished"));
      onClose();
      onSaved();
    } else {
      const message = result && result.message ? result.message : "Помилка додавання товару";
      showToast(message, "error");
      if (message.includes("авториз")) {
        setTimeout(() => navigate("/login"), 1500);
      }
    }
  };

  return (
    <div
      className={`admin-modal-overlay${open ? " active" : ""}`}
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="admin-modal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0 }}>{t("addNewProduct")}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "var(--text)" }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <label>{t("productTitle")}</label>
          <input type="text" required placeholder="Наприклад: Бездротові навушники Pro" {...bind("title")} />

          <div className="admin-modal-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <label>{t("productCategory")}</label>
              <input type="text" list="categoriesDatalist" required placeholder="smartphones, laptops..." {...bind("category")} />
              <datalist id="categoriesDatalist">
                {categories.map(item => (
                  <option key={item.slug} value={item.slug}>{item.name}</option>
                ))}
              </datalist>
            </div>
            <div>
              <label>{t("brand")}</label>
              <input type="text" placeholder="Apple, Samsung або свій" {...bind("brand")} />
            </div>
          </div>

          <div className="admin-modal-row">
            <div>
              <label>{t("price")}</label>
              <input type="number" min="0.01" step="0.01" required placeholder="99.99" {...bind("price")} />
            </div>
            <div>
              <label>{t("discount")}</label>
              <input type="number" min="0" max="100" step="1" {...bind("discount")} />
            </div>
            <div>
              <label>{t("stock")}</label>
              <input type="number" min="1" step="1" required {...bind("stock")} />
            </div>
          </div>

          <label>{t("seller")}</label>
          <input
            type="text"
            readOnly
            disabled
            value={user ? user.name : ""}
            style={{ opacity: 0.85, background: "var(--border)", cursor: "not-allowed" }}
          />

          <label>{t("imageUrl")}</label>
          <input type="text" placeholder="https://example.com/photo.jpg або images/banner.png" {...bind("thumbnail")} />

          <label>{t("description")}</label>
          <textarea rows="3" placeholder="Детальний опис товару..." {...bind("description")}></textarea>

          <div className="admin-modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>{t("cancel")}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "..." : t("publishProduct")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Profile({ defaultTab = "overview" }) {
  const { t, user, cart, favorites, toggleTheme, logout, showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(defaultTab || tabFromUrl || "overview");
  const sellerSection = useRef(null);
  const [ordersCount, setOrdersCount] = useState(null);
  const [myProducts, setMyProducts] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    } else if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [tabFromUrl, defaultTab]);

  const loadMyProducts = useCallback(async () => {
    const products = await getMyProducts();
    setMyProducts(Array.isArray(products) ? products : []);
  }, []);

  useEffect(() => {
    getOrders().then(orders => setOrdersCount(orders ? orders.length : 0));
    loadMyProducts();
  }, [loadMyProducts]);

  if (!user) return null;

  const onLogout = async () => {
    await logout();
    showToast(t("loggedOut"));
    setTimeout(() => navigate("/login"), 800);
  };

  const onDelete = async id => {
    if (!window.confirm(t("confirmDeleteProduct"))) return;
    const result = await deleteMyProduct(id);
    if (result && result.success) {
      showToast(t("productDeleted"));
      loadMyProducts();
    } else {
      showToast(result && result.message ? result.message : "Помилка видалення", "error");
    }
  };

  const productsCount = myProducts ? myProducts.length : 0;

  return (
    <section className="section">
      <div className="container">
        <div className="profile-layout">
          <aside className="profile-sidebar">
            <div className="profile-avatar" style={{ overflow: "hidden" }}>
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={event => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <i className="fa-solid fa-user"></i>
              )}
            </div>
            <h2 id="profileName">{user.name}</h2>
            <p id="profileEmail">{user.email}</p>
            {user.phone && (
              <p style={{ fontSize: "13px", color: "var(--gray)", marginTop: "-10px", marginBottom: "15px" }}>
                <i className="fa-solid fa-phone" style={{ marginRight: "6px" }}></i>
                {user.phone}
              </p>
            )}
            <button className="btn logout-btn" onClick={onLogout}>{t("logout")}</button>
          </aside>

          <section className="profile-content">
            <h1 className="title">{t("account")}</h1>

            <div className="profile-tabs">
              <button
                type="button"
                className={`profile-tab-btn ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("overview");
                  setSearchParams({});
                }}
              >
                <i className="fa-solid fa-gauge-high"></i>
                <span>{t("tabOverview")}</span>
              </button>
              <button
                type="button"
                className={`profile-tab-btn ${activeTab === "settings" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("settings");
                  setSearchParams({ tab: "settings" });
                }}
              >
                <i className="fa-solid fa-gear"></i>
                <span>{t("settingsTitle")}</span>
              </button>
            </div>

            {activeTab === "settings" ? (
              <SettingsView />
            ) : (
              <>
                <div className="profile-cards">
                  <div className="profile-card">
                    <i className="fa-solid fa-cart-shopping"></i>
                    <h3>{t("cart")}</h3>
                    <p>{t("itemsCount", { count: cart.length })}</p>
                    <Link to="/cart">{t("goTo")}</Link>
                  </div>

                  <div className="profile-card">
                    <i className="fa-solid fa-heart"></i>
                    <h3>{t("favoritesTitle")}</h3>
                    <p>{t("itemsCount", { count: favorites.length })}</p>
                    <Link to="/favorites">{t("goTo")}</Link>
                  </div>

                  <div className="profile-card">
                    <i className="fa-solid fa-bag-shopping"></i>
                    <h3>{t("orders")}</h3>
                    <p>
                      {ordersCount === null || ordersCount === 0
                        ? t("noOrdersShort")
                        : t("ordersCount", { count: ordersCount })}
                    </p>
                    <Link to="/orders">{t("ordersHistory")}</Link>
                  </div>

                  <div className="profile-card">
                    <i className="fa-solid fa-circle-half-stroke"></i>
                    <h3>{t("theme")}</h3>
                    <p>{t("lightDark")}</p>
                    <button className="btn-outline" id="profileTheme" onClick={toggleTheme}>{t("switchAction")}</button>
                  </div>

                  <div className="profile-card">
                    <i className="fa-solid fa-store"></i>
                    <h3>{t("myProducts")}</h3>
                    <p>{t("itemsCount", { count: productsCount })}</p>
                    <a
                      href="/"
                      onClick={event => {
                        event.preventDefault();
                        sellerSection.current.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      {t("manage")}
                    </a>
                  </div>

                  <div className="profile-card">
                    <i className="fa-solid fa-gear"></i>
                    <h3>{t("settingsTitle")}</h3>
                    <p>{t("settingsDesc")}</p>
                    <a
                      href="#settings"
                      onClick={event => {
                        event.preventDefault();
                        setActiveTab("settings");
                        setSearchParams({ tab: "settings" });
                      }}
                    >
                      {t("settingsAction")}
                    </a>
                  </div>
                </div>

                <div className="profile-seller-section" ref={sellerSection}>
                  <div className="seller-section-header">
                    <div>
                      <h2>{t("sellerCabinet")}</h2>
                      <p className="seller-desc">{t("sellerCabinetDesc")}</p>
                    </div>
                    <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
                      <i className="fa-solid fa-plus"></i> <span>{t("addNewProduct")}</span>
                    </button>
                  </div>

                  <div className="seller-products-container">
                    {myProducts === null && <div className="seller-loading">{t("loading")}</div>}

                    {myProducts && myProducts.length === 0 && (
                      <div className="seller-empty-state">
                        <i className="fa-solid fa-box-open"></i>
                        <p>{t("noSellerProducts")}</p>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ marginTop: "15px" }}
                          onClick={() => setModalOpen(true)}
                        >
                          <i className="fa-solid fa-plus"></i> {t("addNewProduct")}
                        </button>
                      </div>
                    )}

                    {myProducts && myProducts.map(product => (
                      <div className="seller-product-card" key={product.id}>
                        <img
                          src={product.thumbnail || "images/banner.png"}
                          alt={product.title}
                          className="seller-product-img"
                          onError={event => {
                            event.currentTarget.src = "images/banner.png";
                          }}
                        />
                        <div className="seller-product-body">
                          <div className="product-seller-badge">
                            <i className="fa-solid fa-store"></i> {product.seller || user.name}
                          </div>
                          <div className="seller-product-cat">{product.category}</div>
                          <h4 className="seller-product-title" title={product.title}>{product.title}</h4>
                          <div className="seller-product-meta">
                            <div className="seller-product-price">{product.price}$</div>
                            <div style={{ fontSize: "13px", color: "var(--gray)" }}>
                              <i className="fa-solid fa-warehouse"></i> {product.stock} шт.
                            </div>
                          </div>
                          <div className="seller-product-actions">
                            <Link to={`/product/${product.id}`} target="_blank" className="btn btn-outline btn-sm">
                              <i className="fa-regular fa-eye"></i> Переглянути
                            </Link>
                            <button
                              type="button"
                              className="btn-sm seller-btn-delete"
                              title="Видалити товар"
                              onClick={() => onDelete(product.id)}
                            >
                              <i className="fa-regular fa-trash-can"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      <SellerModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={loadMyProducts} />
    </section>
  );
}
