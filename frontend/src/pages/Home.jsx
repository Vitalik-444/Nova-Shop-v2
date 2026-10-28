import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { getProducts } from "../api";
import { preventDefault } from "../utils/format";
import ProductCard from "../components/ProductCard";

const CATEGORY_CARDS = [
  ["fa-laptop", "laptops"],
  ["fa-mobile-screen", "smartphones"],
  ["fa-tv", "televisions"],
  ["fa-headphones", "headphones"],
  ["fa-camera", "photo"],
  ["fa-gamepad", "games"],
  ["fa-shirt", "clothes"],
  ["fa-house", "home"]
];

const ADVANTAGES = [
  ["fa-truck-fast", "fastDelivery", "deliveryUkraine"],
  ["fa-shield-halved", "warranty", "officialWarranty"],
  ["fa-credit-card", "safePayment", "paymentMethods"],
  ["fa-headset", "support247", "alwaysHelp"]
];

export default function Home() {
  const { t } = useApp();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getProducts(8).then(setProducts);
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-left">
            <span className="hero-label">{t("heroLabel")}</span>
            <h1>{t("heroTitle")}</h1>
            <p>{t("heroText")}</p>
            <div className="hero-buttons">
              <Link to="/catalog" className="btn">{t("goCatalog")}</Link>
              <a href="/" className="btn btn-outline" onClick={preventDefault}>{t("sales")}</a>
            </div>
          </div>
          <div className="hero-right">
            <img src="images/banner.png" alt="Banner" />
          </div>
        </div>
      </section>

      <section className="categories section">
        <div className="container">
          <h2 className="title">{t("categories")}</h2>
          <div className="categories-grid">
            {CATEGORY_CARDS.map(([icon, key]) => (
              <div className="category-card" key={key}>
                <i className={`fa-solid ${icon}`}></i>
                <h3>{t(key)}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="popular section">
        <div className="container">
          <h2 className="title">{t("popularProducts")}</h2>
          <div className="products-grid">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="advantages section">
        <div className="container">
          <div className="advantages-grid">
            {ADVANTAGES.map(([icon, title, text]) => (
              <div className="advantage-card" key={title}>
                <i className={`fa-solid ${icon}`}></i>
                <h3>{t(title)}</h3>
                <p>{t(text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
