import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import ProductCard from "./ProductCard";

export default function ViewedProductsView() {
  const { t, viewedProducts, clearViewedProducts, showToast } = useApp();

  const handleClear = () => {
    if (window.confirm(t("clearViewedConfirm"))) {
      clearViewedProducts();
      showToast(t("clearViewed"), "info");
    }
  };

  return (
    <div className="viewed-products-view">
      <div className="viewed-header">
        <div>
          <span className="eyebrow">// {t("tabViewed").toUpperCase()}</span>
          <h2 className="viewed-title">
            {t("tabViewed")}
            {viewedProducts.length > 0 && (
              <span className="count-pill">{viewedProducts.length}</span>
            )}
          </h2>
          <p className="viewed-subtitle">{t("viewedEmptyHint")}</p>
        </div>
        {viewedProducts.length > 0 && (
          <button
            type="button"
            className="clear-history-btn"
            onClick={handleClear}
            title={t("clearViewed")}
          >
            <i className="fa-solid fa-trash-can"></i>
            <span>{t("clearViewed")}</span>
          </button>
        )}
      </div>

      {viewedProducts.length === 0 ? (
        <div className="viewed-empty">
          <div className="empty-icon-wrap">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <h3>{t("viewedEmpty")}</h3>
          <p>{t("viewedEmptyHint")}</p>
          <Link to="/catalog" className="btn empty-cta-btn">
            <i className="fa-solid fa-bag-shopping"></i> {t("allProducts") || "До каталогу"}
          </Link>
        </div>
      ) : (
        <div className="products-grid viewed-grid">
          {viewedProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
