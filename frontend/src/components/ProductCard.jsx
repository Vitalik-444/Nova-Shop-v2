import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Stars from "./Stars";
import QuickView from "./QuickView";

export default function ProductCard({ product, variant = "full", layout = "grid" }) {
  const { t, tProduct, tCategory, formatPrice, isFavorite, toggleFavorite, addToCart } = useApp();
  const [quick, setQuick] = useState(false);
  const favorite = variant === "favorite" || isFavorite(product.id);
  const title = tProduct(product);
  const discount = Math.round(Number(product.discountPercentage) || 0);
  const oldPrice = discount ? product.price / (1 - discount / 100) : null;
  const inStock = product.stock === undefined || product.stock > 0;
  const link = `/product/${product.id}`;

  return (
    <article className={`nv-card${layout === "list" ? " nv-card-list" : ""}`}>
      <div className="nv-card-media">
        <Link to={link} className="nv-card-imglink" tabIndex={-1} aria-hidden="true">
          <img src={product.thumbnail} alt={title} loading="lazy" decoding="async" width="300" height="300" />
        </Link>
        {discount > 0 && <span className="nv-badge">{t("nvDiscount", { n: discount })}</span>}
        <button
          type="button"
          className={`nv-icon-btn nv-fav${favorite ? " active" : ""}`}
          onClick={() => toggleFavorite(product.id)}
          aria-label={t("addFavorite")}
          aria-pressed={favorite}
        >
          <i className={favorite ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
        </button>
        <button type="button" className="nv-quick" onClick={() => setQuick(true)}>
          <i className="fa-regular fa-eye"></i> {t("nvQuickView")}
        </button>
      </div>

      <div className="nv-card-body">
        <span className="nv-card-meta">{tCategory(product.category)}</span>
        <h3 className="nv-card-title">
          <Link to={link}>{title}</Link>
        </h3>
        <div className="nv-rating-row">
          <Stars value={product.rating} />
          <span>{product.rating}</span>
          {product.reviewsCount ? <span className="nv-muted">({product.reviewsCount})</span> : null}
        </div>
        {layout === "list" && product.description && <p className="nv-card-desc">{product.description}</p>}
        <div className="nv-card-bottom">
          <div className="nv-price-col">
            <span className="nv-price">{formatPrice(product.price)}</span>
            {oldPrice && <span className="nv-old-price">{formatPrice(oldPrice)}</span>}
          </div>
          <button
            type="button"
            className="nv-cart-btn"
            disabled={!inStock}
            onClick={() => addToCart(product.id)}
            aria-label={t("nvAdd")}
            title={inStock ? t("nvAdd") : t("nvOutOfStock")}
          >
            <i className="fa-solid fa-cart-plus"></i>
          </button>
        </div>
      </div>

      {quick && <QuickView product={product} onClose={() => setQuick(false)} />}
    </article>
  );
}
