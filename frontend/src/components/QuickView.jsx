import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Stars from "./Stars";

export default function QuickView({ product, onClose }) {
  const { t, tProduct, tCategory, tDescription, formatPrice, addToCart, toggleFavorite, isFavorite } = useApp();
  const title = tProduct(product);
  const favorite = isFavorite(product.id);
  const oldPrice = product.discountPercentage
    ? product.price / (1 - product.discountPercentage / 100)
    : null;
  const inStock = product.stock === undefined || product.stock > 0;

  useEffect(() => {
    const onKey = event => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="nv-modal-backdrop" onClick={onClose}>
      <div className="nv-modal" role="dialog" aria-modal="true" aria-label={title} onClick={event => event.stopPropagation()}>
        <button type="button" className="nv-modal-close" onClick={onClose} aria-label={t("nvClose")}>
          <i className="fa-solid fa-xmark"></i>
        </button>
        <div className="nv-modal-media">
          <img src={product.thumbnail} alt={title} />
        </div>
        <div className="nv-modal-body">
          <span className="nv-card-meta">{tCategory(product.category)}</span>
          <h2>{title}</h2>
          <div className="nv-rating-row">
            <Stars value={product.rating} />
            <span>{product.rating}</span>
            {product.reviewsCount ? <span className="nv-muted">({product.reviewsCount})</span> : null}
          </div>
          <div className="nv-price-row">
            <span className="nv-price">{formatPrice(product.price)}</span>
            {oldPrice && <span className="nv-old-price">{formatPrice(oldPrice)}</span>}
          </div>
          <p className="nv-modal-text">{tDescription(product)}</p>
          <span className={`nv-stock${inStock ? " ok" : " out"}`}>
            <i className={inStock ? "fa-solid fa-circle-check" : "fa-solid fa-circle-xmark"}></i>
            {inStock ? t("nvInStock") : t("nvOutOfStock")}
          </span>
          <div className="nv-modal-actions">
            <button type="button" className="nv-btn nv-btn-primary" disabled={!inStock} onClick={() => addToCart(product.id)}>
              <i className="fa-solid fa-cart-shopping"></i> {t("nvAdd")}
            </button>
            <button
              type="button"
              className={`nv-btn nv-btn-icon${favorite ? " active" : ""}`}
              onClick={() => toggleFavorite(product.id)}
              aria-label={t("addFavorite")}
            >
              <i className={favorite ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
            </button>
            <Link to={`/product/${product.id}`} className="nv-btn nv-btn-ghost" onClick={onClose}>
              {t("nvOpenProduct")}
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
