import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  adminDeleteProduct,
  adminDeleteUser,
  adminGetOrders,
  adminGetStats,
  adminGetUsers,
  adminSaveProduct,
  adminUpdateOrderStatus,
  adminUpdateUserRole,
  getProducts
} from "../api";
import { formatOrderDate } from "../utils/format";
import { ORDER_STATUS_LABELS } from "./Orders";

function AdminStats() {
  const { t, formatPrice } = useApp();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    const data = await adminGetStats();
    setStats(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="admin-panel" style={{ textAlign: "center", padding: "60px 20px" }}>
        <p className="admin-muted" style={{ fontSize: "16px" }}>{t("loading")}...</p>
      </div>
    );
  }

  if (!stats || !stats.overview) {
    return (
      <div className="admin-panel" style={{ textAlign: "center", padding: "60px 20px" }}>
        <p className="admin-muted">{t("noStats")}</p>
      </div>
    );
  }

  const { overview, dailySales, topProducts, categorySales, lowStockProducts } = stats;

  const maxRevenue = Math.max(...(dailySales.map(d => d.revenue)), 1);

  const totalStatusOrders =
    (overview.deliveredOrders + overview.shippedOrders + overview.paidOrders + overview.pendingOrders + overview.cancelledOrders) || 1;
  const pctDelivered = Math.round((overview.deliveredOrders / totalStatusOrders) * 100);
  const pctShipped = Math.round((overview.shippedOrders / totalStatusOrders) * 100);
  const pctPaid = Math.round((overview.paidOrders / totalStatusOrders) * 100);
  const pctPending = Math.round((overview.pendingOrders / totalStatusOrders) * 100);
  const pctCancelled = Math.round((overview.cancelledOrders / totalStatusOrders) * 100);

  return (
    <div className="admin-panel">
      {/* 1. Top KPI Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon green">
            <i className="fa-solid fa-coins"></i>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">{t("totalRevenue")}</div>
            <div className="admin-stat-value">{formatPrice(overview.totalRevenue)}</div>
            <div className="admin-stat-sub">
              {overview.deliveredOrders} {t("delivered")?.toLowerCase() || "доставлено"}
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon blue">
            <i className="fa-solid fa-box-open"></i>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">{t("totalOrders")}</div>
            <div className="admin-stat-value">{overview.totalOrders}</div>
            <div className="admin-stat-sub">
              {overview.pendingOrders + overview.paidOrders} в обробці
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon purple">
            <i className="fa-solid fa-receipt"></i>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">{t("averageCheck")}</div>
            <div className="admin-stat-value">{formatPrice(overview.averageOrderValue)}</div>
            <div className="admin-stat-sub">
              на 1 замовлення
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon orange">
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">{t("registeredUsers")}</div>
            <div className="admin-stat-value">{overview.totalUsers}</div>
            <div className="admin-stat-sub">
              +{overview.newUsers30d} {t("newUsers30d")?.toLowerCase() || "за 30 днів"}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle Row: Dynamics & Categories */}
      <div className="admin-stats-row">
        <div className="admin-card-box">
          <div className="admin-card-title">
            <span><i className="fa-solid fa-chart-simple" style={{ marginRight: "8px", color: "var(--green)" }}></i>{t("salesDynamics")}</span>
            <span className="admin-card-subtitle">{t("salesDynamicsHint")}</span>
          </div>

          {dailySales && dailySales.length > 0 ? (
            <div style={{ height: "220px", display: "flex", alignItems: "flex-end", gap: "10px", padding: "16px 0 6px 0", borderBottom: "1px solid var(--border)" }}>
              {dailySales.map(item => {
                const heightPct = Math.max(12, Math.round((item.revenue / maxRevenue) * 100));
                return (
                  <div
                    key={item.day}
                    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}
                    title={`${item.day}: ${formatPrice(item.revenue)} (${item.ordersCount} ${t("ordersCount")?.toLowerCase() || "зам."})`}
                  >
                    <div
                      style={{
                        width: "100%",
                        maxWidth: "34px",
                        height: `${heightPct}%`,
                        background: "linear-gradient(180deg, #00A046 0%, rgba(0,160,70,0.65) 100%)",
                        borderRadius: "6px 6px 2px 2px",
                        transition: "height 0.4s ease",
                        cursor: "pointer"
                      }}
                    />
                    <span style={{ fontSize: "11px", color: "var(--gray)", marginTop: "6px", whiteSpace: "nowrap" }}>{item.shortDay}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="admin-muted" style={{ padding: "30px 0", textAlign: "center" }}>Немає замовлень за період</p>
          )}

          {/* Order Status Distribution */}
          <div style={{ marginTop: "24px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "var(--text)" }}>
              {t("orderStatuses")}
            </div>
            <div className="admin-status-bar">
              {pctDelivered > 0 && <div className="admin-status-segment" style={{ width: `${pctDelivered}%`, background: "#10b981" }} title={`Доставлено: ${overview.deliveredOrders}`} />}
              {pctShipped > 0 && <div className="admin-status-segment" style={{ width: `${pctShipped}%`, background: "#3b82f6" }} title={`Відправлено: ${overview.shippedOrders}`} />}
              {pctPaid > 0 && <div className="admin-status-segment" style={{ width: `${pctPaid}%`, background: "#f59e0b" }} title={`В обробці: ${overview.paidOrders}`} />}
              {pctPending > 0 && <div className="admin-status-segment" style={{ width: `${pctPending}%`, background: "#8b5cf6" }} title={`Нове: ${overview.pendingOrders}`} />}
              {pctCancelled > 0 && <div className="admin-status-segment" style={{ width: `${pctCancelled}%`, background: "#ef4444" }} title={`Скасовано: ${overview.cancelledOrders}`} />}
            </div>
            <div className="admin-status-legend">
              <span className="admin-legend-item"><span className="admin-legend-dot" style={{ background: "#10b981" }}></span>Доставлено ({overview.deliveredOrders})</span>
              <span className="admin-legend-item"><span className="admin-legend-dot" style={{ background: "#3b82f6" }}></span>Відправлено ({overview.shippedOrders})</span>
              <span className="admin-legend-item"><span className="admin-legend-dot" style={{ background: "#f59e0b" }}></span>В обробці ({overview.paidOrders})</span>
              <span className="admin-legend-item"><span className="admin-legend-dot" style={{ background: "#8b5cf6" }}></span>Нове ({overview.pendingOrders})</span>
              {overview.cancelledOrders > 0 && <span className="admin-legend-item"><span className="admin-legend-dot" style={{ background: "#ef4444" }}></span>Скасовано ({overview.cancelledOrders})</span>}
            </div>
          </div>
        </div>

        {/* Categories breakdown */}
        <div className="admin-card-box">
          <div className="admin-card-title">
            <span><i className="fa-solid fa-layer-group" style={{ marginRight: "8px", color: "#3b82f6" }}></i>{t("categorySales")}</span>
          </div>
          <div className="admin-cat-list">
            {categorySales && categorySales.map(cat => (
              <div key={cat.category} className="admin-cat-item">
                <div className="admin-cat-header">
                  <span>{cat.category}</span>
                  <span>{formatPrice(cat.revenue)} ({cat.unitsSold} шт.)</span>
                </div>
                <div className="admin-cat-progress">
                  <div className="admin-cat-fill" style={{ width: `${cat.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Top Products + Low Stock Alert */}
      <div className="admin-stats-row">
        {/* Top 5 Products */}
        <div className="admin-card-box">
          <div className="admin-card-title">
            <span><i className="fa-solid fa-trophy" style={{ marginRight: "8px", color: "#f59e0b" }}></i>{t("topProducts")}</span>
          </div>
          <div className="admin-table-wrap" style={{ boxShadow: "none", border: "1px solid var(--border)" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("title")}</th>
                  <th>{t("productCategory")}</th>
                  <th>{t("unitsSold")}</th>
                  <th>{t("revenue")}</th>
                  <th>{t("stock")}</th>
                </tr>
              </thead>
              <tbody>
                {topProducts && topProducts.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {p.thumbnail && <img src={p.thumbnail} alt="" className="admin-thumb" style={{ width: "36px", height: "36px", objectFit: "contain" }} />}
                        <div>
                          <strong>{p.title}</strong>
                          <div className="admin-muted">{formatPrice(p.price)}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td><span className="admin-badge-count">{p.unitsSold}</span></td>
                    <td><strong>{formatPrice(p.revenue)}</strong></td>
                    <td>{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="admin-card-box">
          <div className="admin-card-title">
            <span><i className="fa-solid fa-triangle-exclamation" style={{ marginRight: "8px", color: "#ef4444" }}></i>{t("lowStockAlert")}</span>
            <span className="admin-card-subtitle">{overview.lowStockCount} поз.</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--gray)", marginBottom: "12px" }}>{t("lowStockHint")}</p>
          {lowStockProducts && lowStockProducts.length > 0 ? (
            <div className="admin-table-wrap" style={{ boxShadow: "none", border: "1px solid var(--border)" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t("title")}</th>
                    <th style={{ textAlign: "right" }}>{t("stock")}</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {p.thumbnail && <img src={p.thumbnail} alt="" className="admin-thumb" style={{ width: "30px", height: "30px", objectFit: "contain" }} />}
                          <span style={{ fontSize: "13px" }}>{p.title}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="admin-low-stock-badge">{p.stock} шт.</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-muted" style={{ padding: "20px 0", textAlign: "center" }}>Всі товари в достатній кількості</p>
          )}
        </div>
      </div>
    </div>
  );
}

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
                <td>{formatPrice(order.total)}</td>
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
  const { t, tProduct, tCategory, formatPrice, showToast } = useApp();
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
              <th>{t("discount")}</th>
              <th>{t("stock")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products === null && (
              <tr><td colSpan="8">{t("loading")}</td></tr>
            )}
            {products && products.length === 0 && (
              <tr><td colSpan="8">{t("noProducts")}</td></tr>
            )}
            {products && products.map(product => (
              <tr key={product.id}>
                <td><img src={product.thumbnail} alt="" className="admin-thumb" /></td>
                <td>{tProduct(product)}</td>
                <td>{tCategory(product.category)}</td>
                <td>
                  {product.seller === "NovaShop" || !product.seller ? (
                    <span style={{ fontWeight: "600" }}>NovaShop</span>
                  ) : (
                    <span className="admin-role-badge admin-role-user" style={{ fontSize: "12px" }}>
                      <i className="fa-solid fa-store" style={{ marginRight: "4px" }}></i>
                      {product.seller}
                    </span>
                  )}
                </td>
                <td>{formatPrice(product.price)}</td>
                <td>
                  {Number(product.discountPercentage) > 0 ? (
                    <span style={{
                      background: "rgba(0, 160, 70, 0.12)",
                      color: "var(--green)",
                      fontWeight: "700",
                      fontSize: "12px",
                      padding: "2px 8px",
                      borderRadius: "6px"
                    }}>
                      -{product.discountPercentage}%
                    </span>
                  ) : (
                    <span style={{ color: "var(--gray)", fontSize: "12px" }}>—</span>
                  )}
                </td>
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
  const { t, language, formatPrice, user: currentUser, showToast } = useApp();
  const [users, setUsers] = useState(null);
  const [search, setSearch] = useState("");

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

  const onDeleteUser = async user => {
    if (!window.confirm(`${t("deleteUserConfirm")}\n\n${user.name} (${user.email})`)) return;
    const result = await adminDeleteUser(user.id);
    if (result.success) {
      showToast(t("userDeleted"));
      load();
    } else {
      showToast(result.message || t("userDeleteError"), "error");
    }
  };

  const filteredUsers = (users || []).filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.city || "").toLowerCase().includes(q) ||
      (u.phone || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-panel">
      <div className="admin-filter-bar">
        <input
          type="text"
          className="admin-search-input"
          placeholder={t("searchUsers")}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {users && (
          <span className="admin-muted" style={{ fontSize: "13px" }}>
            {filteredUsers.length} з {users.length} {t("users")?.toLowerCase() || "користувачів"}
          </span>
        )}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>Email</th>
              <th>{t("city")} / {t("phone")}</th>
              <th>{t("ordersCount")}</th>
              <th>{t("spent")}</th>
              <th>{t("role")}</th>
              <th>{t("registration")}</th>
              <th style={{ textAlign: "right", minWidth: "180px" }}></th>
            </tr>
          </thead>
          <tbody>
            {users === null && (
              <tr><td colSpan="8">{t("loading")}</td></tr>
            )}
            {users && filteredUsers.length === 0 && (
              <tr><td colSpan="8">{t("noUsers")}</td></tr>
            )}
            {filteredUsers.map(user => {
              const isSelf = currentUser && currentUser.id === user.id;
              const isAdmin = user.role === "admin";
              return (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                    {isSelf && (
                      <span className="admin-muted" style={{ marginLeft: "8px", fontSize: "12px" }}>
                        ({t("tabProfile")})
                      </span>
                    )}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    {user.city && (
                      <div><i className="fa-solid fa-location-dot" style={{ marginRight: "4px", color: "var(--gray)", fontSize: "11px" }}></i>{user.city}</div>
                    )}
                    {user.phone && (
                      <div className="admin-muted" style={{ fontSize: "12px" }}>{user.phone}</div>
                    )}
                    {!user.city && !user.phone && <span className="admin-muted">—</span>}
                  </td>
                  <td>
                    {user.orders_count > 0 ? (
                      <span className="admin-badge-count">{user.orders_count}</span>
                    ) : (
                      <span className="admin-muted">0</span>
                    )}
                  </td>
                  <td>
                    <strong>{user.total_spent > 0 ? formatPrice(user.total_spent) : "—"}</strong>
                  </td>
                  <td>
                    <span className={`admin-role-badge admin-role-${user.role}`}>
                      {isAdmin ? t("admin") : t("user")}
                    </span>
                  </td>
                  <td>{formatOrderDate(user.created_at, language)}</td>
                  <td>
                    <div className="admin-user-actions">
                      <button
                        type="button"
                        className={`admin-role-btn ${isAdmin ? "admin-role-btn-demote" : "admin-role-btn-promote"}`}
                        disabled={isSelf}
                        title={isSelf ? t("cannotChangeSelf") : undefined}
                        onClick={() => onToggleRole(user)}
                      >
                        <i className={`fa-solid ${isAdmin ? "fa-user-minus" : "fa-shield-halved"}`}></i>
                        <span>{isAdmin ? t("removeRights") : t("makeAdmin")}</span>
                      </button>
                      <button
                        type="button"
                        className="admin-icon-btn admin-btn-danger"
                        disabled={isSelf}
                        title={isSelf ? t("cannotDeleteSelf") : t("deleteUser")}
                        onClick={() => onDeleteUser(user)}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
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
  const [tab, setTab] = useState("stats");

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
          <button className={`admin-tab${tab === "stats" ? " active" : ""}`} onClick={() => setTab("stats")}>
            <i className="fa-solid fa-chart-line" style={{ marginRight: "6px" }}></i>
            {t("adminStats")}
          </button>
          <button className={`admin-tab${tab === "orders" ? " active" : ""}`} onClick={() => setTab("orders")}>
            <i className="fa-solid fa-box" style={{ marginRight: "6px" }}></i>
            {t("adminOrders")}
          </button>
          <button className={`admin-tab${tab === "products" ? " active" : ""}`} onClick={() => setTab("products")}>
            <i className="fa-solid fa-tags" style={{ marginRight: "6px" }}></i>
            {t("adminProducts")}
          </button>
          <button className={`admin-tab${tab === "users" ? " active" : ""}`} onClick={() => setTab("users")}>
            <i className="fa-solid fa-users" style={{ marginRight: "6px" }}></i>
            {t("users")}
          </button>
        </div>

        {tab === "stats" && <AdminStats />}
        {tab === "orders" && <AdminOrders />}
        {tab === "products" && <AdminProducts />}
        {tab === "users" && <AdminUsers />}
      </div>
    </section>
  );
}
