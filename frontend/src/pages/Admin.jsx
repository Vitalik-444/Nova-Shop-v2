import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  adminDeleteProduct,
  adminGetOrders,
  adminGetUsers,
  adminSaveProduct,
  adminUpdateOrderStatus,
  adminUpdateUserRole,
  getProducts
} from "../api";
import { formatOrderDate } from "../utils/format";
import { ORDER_STATUS_LABELS } from "./Orders";

function AdminOrders() {
  const { t, language, formatPrice, showToast } = useApp();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    adminGetOrders().then(setOrders);
  }, []);

  const onStatusChange = async (id, status) => {
    setOrders(current => current.map(order => (order.id === id ? { ...order, status } : order)));
    const result = await adminUpdateOrderStatus(id, status);
    if (result.success) {
      showToast(t("statusUpdated"));
    } else {
      showToast(result.message || t("statusUpdateError"), "error");
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>№</th>
              <th>{t("buyer")}</th>
              <th>{t("sum")}</th>
              <th>{t("date")}</th>
              <th>{t("status")}</th>
            </tr>
          </thead>
          <tbody>
            {orders === null && (
              <tr><td colSpan="5">{t("loading")}</td></tr>
            )}
            {orders && orders.length === 0 && (
              <tr><td colSpan="5">{t("noAdminOrders")}</td></tr>
            )}
            {orders && orders.map(order => (
              <tr key={order.id}>
                <td>№{order.id}</td>
                <td>
                  {order.user_name}
                  <br />
                  <span className="admin-muted">{order.user_email}</span>
                </td>
                <td>{formatPrice(order.total)}$</td>
                <td>{formatOrderDate(order.created_at, language)}</td>
                <td>
                  <select
                    className="admin-status-select"
                    value={order.status}
                    onChange={event => onStatusChange(order.id, event.target.value)}
                  >
                    {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{t(label)}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductModal({ product, onClose, onSaved }) {
  const { t, showToast } = useApp();
  const [form, setForm] = useState({
    id: product ? product.id : 0,
    title: product ? product.title : "",
    category: product ? product.category : "",
    brand: product ? product.brand || "" : "",
    seller: product ? product.seller || "NovaShop" : "NovaShop",
    price: product ? String(product.price) : "",
    discount: product ? String(product.discountPercentage) : "0",
    stock: product ? String(product.stock) : "0",
    thumbnail: product ? product.thumbnail || "" : "",
    description: product ? product.description || "" : ""
  });

  const bind = field => ({
    value: form[field],
    onChange: event => setForm(current => ({ ...current, [field]: event.target.value }))
  });

  const onSave = async () => {
    const payload = {
      id: Number(form.id) || 0,
      title: form.title.trim(),
      category: form.category.trim(),
      brand: form.brand.trim(),
      seller: form.seller.trim(),
      price: Number(form.price) || 0,
      discountPercentage: Number(form.discount) || 0,
      stock: Number(form.stock) || 0,
      thumbnail: form.thumbnail.trim(),
      description: form.description.trim()
    };

    if (!payload.title || !payload.category || payload.price <= 0) {
      showToast(t("fillProductFields"), "error");
      return;
    }

    const result = await adminSaveProduct(payload);

    if (result.success) {
      showToast(t("productSaved"));
      onSaved();
    } else {
      showToast(result.message || t("saveError"), "error");
    }
  };

  return (
    <div
      className="admin-modal-overlay active"
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="admin-modal">
        <h2>{product ? t("editProduct") : t("newProduct")}</h2>

        <label>{t("productTitle")}</label>
        <input type="text" {...bind("title")} />

        <label>{t("productCategory")}</label>
        <input type="text" placeholder="smartphones, laptops..." {...bind("category")} />

        <label>{t("brand")}</label>
        <input type="text" {...bind("brand")} />

        <label>{t("seller")}</label>
        <input type="text" placeholder="NovaShop" {...bind("seller")} />

        <div className="admin-modal-row">
          <div>
            <label>{t("price")}</label>
            <input type="number" min="0" step="0.01" {...bind("price")} />
          </div>
          <div>
            <label>{t("discount")}</label>
            <input type="number" min="0" max="100" step="0.01" {...bind("discount")} />
          </div>
          <div>
            <label>{t("stock")}</label>
            <input type="number" min="0" step="1" {...bind("stock")} />
          </div>
        </div>

        <label>{t("imageUrl")}</label>
        <input type="text" placeholder="https://..." {...bind("thumbnail")} />

        <label>{t("description")}</label>
        <textarea rows="3" {...bind("description")}></textarea>

        <div className="admin-modal-actions">
          <button className="btn-outline" onClick={onClose}>{t("cancel")}</button>
          <button className="btn" onClick={onSave}>{t("save")}</button>
        </div>
      </div>
    </div>
  );
}

function AdminProducts() {
  const { t, showToast } = useApp();
  const [products, setProducts] = useState(null);
  const [editing, setEditing] = useState(undefined);

  const load = useCallback(async () => {
    setProducts(await getProducts(500));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async id => {
    if (!window.confirm(t("deleteProductConfirm"))) return;
    const result = await adminDeleteProduct(id);
    if (result.success) {
      showToast(t("productDeleted"));
      load();
    } else {
      showToast(result.message || t("deleteError"), "error");
    }
  };

  return (
    <div className="admin-panel">
      <button className="btn" style={{ marginBottom: "15px" }} onClick={() => setEditing(null)}>
        <i className="fa-solid fa-plus"></i> <span>{t("addProduct")}</span>
      </button>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th></th>
              <th>{t("title")}</th>
              <th>{t("category")}</th>
              <th>{t("seller")}</th>
              <th>{t("price")}</th>
              <th>{t("stock")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products === null && (
              <tr><td colSpan="7">{t("loading")}</td></tr>
            )}
            {products && products.length === 0 && (
              <tr><td colSpan="7">{t("noProducts")}</td></tr>
            )}
            {products && products.map(product => (
              <tr key={product.id}>
                <td><img src={product.thumbnail} alt="" className="admin-thumb" /></td>
                <td>{product.title}</td>
                <td>{product.category}</td>
                <td>{product.seller || "NovaShop"}</td>
                <td>{product.price}$</td>
                <td>{product.stock}</td>
                <td className="admin-row-actions">
                  <button className="admin-icon-btn" title={t("edit")} onClick={() => setEditing(product)}>
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button className="admin-icon-btn" title={t("delete")} onClick={() => onDelete(product.id)}>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== undefined && (
        <ProductModal
          key={editing ? editing.id : "new"}
          product={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            load();
          }}
        />
      )}
    </div>
  );
}

function AdminUsers() {
  const { t, language, user: currentUser, showToast } = useApp();
  const [users, setUsers] = useState(null);

  const load = useCallback(async () => {
    setUsers(await adminGetUsers());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onToggleRole = async user => {
    const role = user.role === "admin" ? "user" : "admin";
    const result = await adminUpdateUserRole(user.id, role);
    if (result.success) {
      showToast(t("roleUpdated"));
      load();
    } else {
      showToast(result.message || t("roleUpdateError"), "error");
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>Email</th>
              <th>{t("role")}</th>
              <th>{t("registration")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users === null && (
              <tr><td colSpan="5">{t("loading")}</td></tr>
            )}
            {users && users.length === 0 && (
              <tr><td colSpan="5">{t("noUsers")}</td></tr>
            )}
            {users && users.map(user => {
              const isSelf = currentUser && currentUser.id === user.id;
              return (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`admin-role-badge admin-role-${user.role}`}>
                      {user.role === "admin" ? t("admin") : t("user")}
                    </span>
                  </td>
                  <td>{formatOrderDate(user.created_at, language)}</td>
                  <td>
                    <button
                      className="admin-icon-btn"
                      disabled={isSelf}
                      title={isSelf ? t("cannotChangeSelf") : undefined}
                      onClick={() => onToggleRole(user)}
                    >
                      {user.role === "admin" ? t("removeRights") : t("makeAdmin")}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Admin() {
  const { t, user, ready, showToast } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState("orders");

  useEffect(() => {
    if (!ready) return undefined;

    if (!user) {
      navigate("/login", { replace: true });
      return undefined;
    }

    if (user.role !== "admin") {
      showToast(t("adminOnly"), "error");
      const timer = setTimeout(() => navigate("/", { replace: true }), 800);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [ready, user]);

  if (!ready || !user || user.role !== "admin") return null;

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">{t("adminPanel")}</h1>

        <div className="admin-tabs">
          <button className={`admin-tab${tab === "orders" ? " active" : ""}`} onClick={() => setTab("orders")}>
            {t("adminOrders")}
          </button>
          <button className={`admin-tab${tab === "products" ? " active" : ""}`} onClick={() => setTab("products")}>
            {t("adminProducts")}
          </button>
          <button className={`admin-tab${tab === "users" ? " active" : ""}`} onClick={() => setTab("users")}>
            {t("users")}
          </button>
        </div>

        {tab === "orders" && <AdminOrders />}
        {tab === "products" && <AdminProducts />}
        {tab === "users" && <AdminUsers />}
      </div>
    </section>
  );
}
