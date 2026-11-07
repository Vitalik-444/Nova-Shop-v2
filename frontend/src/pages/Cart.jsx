import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { getProductsCached } from "../api";
import ProductCard from "../components/ProductCard";

export default function Cart() {
  const { t, tProduct, tCategory, formatPrice, cart, changeQuantity, removeFromCart } = useApp();
  const [all, setAll] = useState([]);

  useEffect(() => {
    getProductsCached().then(setAll);
  }, []);

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const recommended = useMemo(() => {
    if (!cart.length) return [];
    const inCart = new Set(cart.map(item => Number(item.id)));
    const categories = new Set(cart.map(item => item.category));
    return all.filter(product => categories.has(product.category) && !inCart.has(product.id)).slice(0, 4);
  }, [all, cart]);

  if (cart.length === 0) {
    return (
      <section className="nv-page">
        <div className="container">
          <h1 className="nv-page-title">{t("cart")}</h1>
          <div className="nv-empty">
            <i className="fa-solid fa-cart-shopping"></i>
            <h3>{t("cartEmpty")}</h3>
            <p>{t("nvEmptyCartHint")}</p>
            <Link to="/catalog" className="nv-btn nv-btn-primary">{t("nvToCatalog")}</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="nv-page">
      <div className="container">
        <h1 className="nv-page-title">{t("cart")} <span className="nv-muted">{totalCount}</span></h1>

        <div className="nv-cart">
          <div className="nv-cart-items">
            {cart.map(item => (
              <div className="nv-cart-item" key={item.id}>
                <Link to={`/product/${item.id}`} className="nv-cart-img">
                  <img src={item.thumbnail} alt={tProduct(item)} loading="lazy" />
                </Link>
                <div className="nv-cart-info">
                  <span className="nv-card-meta">{tCategory(item.category)}</span>
                  <Link to={`/product/${item.id}`} className="nv-cart-title">{tProduct(item)}</Link>
                  <span className="nv-muted">{formatPrice(item.price)}</span>
                </div>
                <div className="nv-qty">
                  <button type="button" onClick={() => changeQuantity(item.id, -1)} aria-label="-">−</button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => changeQuantity(item.id, 1)} aria-label="+">+</button>
                </div>
                <strong className="nv-cart-line">{formatPrice(item.price * item.quantity)}</strong>
                <button type="button" className="nv-icon-btn nv-cart-remove" onClick={() => removeFromCart(item.id)} aria-label={t("delete")}>
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            ))}
            <Link to="/catalog" className="nv-link nv-cart-continue">
              <i className="fa-solid fa-arrow-left"></i> {t("nvContinue")}
            </Link>
          </div>

          <aside className="nv-summary">
            <h2>{t("yourOrder")}</h2>
            <div className="nv-summary-row">
              <span>{t("products")}</span>
              <strong>{totalCount}</strong>
            </div>
            <div className="nv-summary-row nv-summary-total">
              <span>{t("sum")}</span>
              <strong>{formatPrice(totalPrice)}</strong>
            </div>
            <Link to="/checkout" className="nv-btn nv-btn-primary nv-btn-lg nv-btn-block">{t("checkout")}</Link>
          </aside>
        </div>

        {recommended.length > 0 && (
          <div className="nv-cart-reco">
            <div className="nv-section-head"><h2>{t("nvAlsoBuy")}</h2></div>
            <div className="nv-grid">
              {recommended.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
