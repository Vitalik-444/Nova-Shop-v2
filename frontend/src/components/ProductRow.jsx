import { useRef } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import ProductCard from "./ProductCard";

export default function ProductRow({ title, to, products }) {
  const { t } = useApp();
  const scroller = useRef(null);

  if (!products.length) return null;

  const scroll = direction => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="nv-section">
      <div className="container">
        <div className="nv-section-head">
          <h2>{title}</h2>
          <div className="nv-section-tools">
            {to && (
              <Link to={to} className="nv-link">
                {t("nvAll")} <i className="fa-solid fa-arrow-right"></i>
              </Link>
            )}
            <button type="button" className="nv-icon-btn" onClick={() => scroll(-1)} aria-label={t("back")}>
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button type="button" className="nv-icon-btn" onClick={() => scroll(1)} aria-label={t("next")}>
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div className="nv-row" ref={scroller}>
          {products.map(product => (
            <div className="nv-row-item" key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
