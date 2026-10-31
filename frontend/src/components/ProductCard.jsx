import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function ProductCard({ product, variant = "full" }) {
  const { t, tProduct, tCategory, formatPrice, isFavorite, toggleFavorite, addToCart } = useApp();
  const navigate = useNavigate();
  const favorite = variant === "favorite" || isFavorite(product.id);
  const seller = product.seller || "NovaShop";
  const title = tProduct(product);
  const category = tCategory(product.category);

  const open = () => navigate(`/product/${product.id}`);

  const onFavorite = event => {
    event.stopPropagation();
    toggleFavorite(product.id);
  };

  const onCart = event => {
    event.stopPropagation();
    addToCart(product.id);
  };

  const image = (
    <div className="product-image">
      <img src={product.thumbnail} alt={title} />
      <button className={`favorite-btn${favorite ? " favorite-active" : ""}`} onClick={onFavorite}>
        <i className={`${favorite ? "fa-solid" : "fa-regular"} fa-heart`}></i>
      </button>
    </div>
  );

  const cartButton = (
    <button className="cart-btn" onClick={onCart}>
      <i className="fa-solid fa-cart-shopping"></i>
    </button>
  );

  if (variant === "favorite") {
    return (
      <div className="product-card" onClick={open}>
        {image}
        <div className="product-info">
          <h3 className="product-title">{title}</h3>
          <div className="price">{formatPrice(product.price)}</div>
          {cartButton}
        </div>
      </div>
    );
  }

  return (
    <div className="product-card" onClick={open}>
      {image}
      <div className="product-info">
        {variant === "full" ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", gap: "8px" }}>
            <span className="product-category">{category}</span>
            <span className="product-seller-badge" title={`${t("seller")}: ${seller}`}>
              <i className="fa-solid fa-store"></i> {seller}
            </span>
          </div>
        ) : (
          <span className="product-category">{category}</span>
        )}
        <h3 className="product-title">{title}</h3>
        <div className="product-rating">
          <i className="fa-solid fa-star"></i>
          <span>{product.rating}</span>
        </div>
        <div className="product-bottom">
          <div className="price">{formatPrice(product.price)}</div>
          {cartButton}
        </div>
      </div>
    </div>
  );
}
