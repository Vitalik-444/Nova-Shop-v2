import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { getCategories, getProductsCached } from "../api";
import { getCategoryIcon } from "../utils/categoryIcons";
import ProductRow from "../components/ProductRow";
import Skeletons from "../components/Skeleton";

const ADVANTAGES = [
  ["fa-truck-fast", "fastDelivery", "deliveryUkraine"],
  ["fa-shield-halved", "warranty", "officialWarranty"],
  ["fa-credit-card", "safePayment", "paymentMethods"],
  ["fa-headset", "support247", "alwaysHelp"]
];

function Hero({ products }) {
  const { t, tProduct, formatPrice } = useApp();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  const deal = useMemo(
    () => [...products].sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0))[0],
    [products]
  );
  const fresh = useMemo(() => [...products].sort((a, b) => b.id - a.id)[0], [products]);
  const maxDiscount = deal ? Math.round(deal.discountPercentage || 0) : 0;

  const slides = [
    {
      key: "main",
      label: t("heroLabel"),
      title: t("heroTitle"),
      text: t("heroText"),
      to: "/catalog",
      cta: t("goCatalog"),
      image: "images/banner.png",
      product: null
    },
    {
      key: "deals",
      label: t("nvDeals"),
      title: t("nvSlide2Title", { n: maxDiscount || 10 }),
      text: t("nvSlide2Text"),
      to: "/catalog?deals=1",
      cta: t("nvSlideCta"),
      image: deal ? deal.thumbnail : "images/banner.png",
      product: deal
    },
    {
      key: "new",
      label: t("nvNew"),
      title: t("nvSlide3Title"),
      text: t("nvSlide3Text"),
      to: "/catalog?sort=newest",
      cta: t("nvSlideCta"),
      image: fresh ? fresh.thumbnail : "images/banner.png",
      product: fresh
    }
  ];

  useEffect(() => {
    if (paused) return undefined;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    timer.current = setInterval(() => setIndex(current => (current + 1) % slides.length), 6500);
    return () => clearInterval(timer.current);
  }, [paused, slides.length]);

  const go = value => setIndex((value + slides.length) % slides.length);

  return (
    <section className="nv-hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="container">
        <div className="nv-hero-frame">
          {slides.map((slide, slideIndex) => (
            <div className={`nv-slide nv-slide-${slide.key}${slideIndex === index ? " active" : ""}`} key={slide.key} aria-hidden={slideIndex !== index}>
              <div className="nv-slide-text">
                <span className="nv-eyebrow">{slide.label}</span>
                <h1>{slide.title}</h1>
                <p>{slide.text}</p>
                <div className="nv-slide-actions">
                  <Link to={slide.to} className="nv-btn nv-btn-primary nv-btn-lg" tabIndex={slideIndex === index ? 0 : -1}>
                    {slide.cta} <i className="fa-solid fa-arrow-right"></i>
                  </Link>
                  {slide.product && (
                    <Link to={`/product/${slide.product.id}`} className="nv-slide-product" tabIndex={slideIndex === index ? 0 : -1}>
                      <span>{tProduct(slide.product)}</span>
                      <strong>{formatPrice(slide.product.price)}</strong>
                    </Link>
                  )}
                </div>
              </div>
              <div className="nv-slide-art">
                <img src={slide.image} alt="" loading={slideIndex === 0 ? "eager" : "lazy"} />
              </div>
            </div>
          ))}
          <button type="button" className="nv-hero-arrow nv-hero-prev" onClick={() => go(index - 1)} aria-label={t("back")}>
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <button type="button" className="nv-hero-arrow nv-hero-next" onClick={() => go(index + 1)} aria-label={t("next")}>
            <i className="fa-solid fa-chevron-right"></i>
          </button>
          <div className="nv-dots">
            {slides.map((slide, dotIndex) => (
              <button
                type="button"
                key={slide.key}
                className={dotIndex === index ? "active" : ""}
                onClick={() => setIndex(dotIndex)}
                aria-label={`${dotIndex + 1}`}
              ></button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { t, tCategory, viewedProducts } = useApp();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProductsCached().then(list => {
      setProducts(list);
      setLoading(false);
    });
    getCategories().then(setCategories);
  }, []);

  const hits = useMemo(
    () => [...products].sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0) || (b.rating || 0) - (a.rating || 0)).slice(0, 12),
    [products]
  );
  const fresh = useMemo(() => [...products].sort((a, b) => b.id - a.id).slice(0, 12), [products]);
  const deals = useMemo(
    () => products.filter(product => product.discountPercentage > 0).sort((a, b) => b.discountPercentage - a.discountPercentage).slice(0, 12),
    [products]
  );
  const brands = useMemo(() => {
    const counts = new Map();
    products.forEach(product => {
      if (product.brand) counts.set(product.brand, (counts.get(product.brand) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name]) => name);
  }, [products]);

  return (
    <>
      <Hero products={products} />

      <section className="nv-section nv-section-tight">
        <div className="container">
          <div className="nv-cats">
            {categories.slice(0, 12).map(item => (
              <Link to={`/catalog?category=${encodeURIComponent(item.slug)}`} className="nv-cat" key={item.slug}>
                <span className="nv-cat-icon"><i className={`fa-solid ${getCategoryIcon(item.slug)}`}></i></span>
                <span className="nv-cat-name">{tCategory(item)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <section className="nv-section">
          <div className="container">
            <div className="nv-section-head"><h2>{t("nvHits")}</h2></div>
            <Skeletons count={4} />
          </div>
        </section>
      ) : (
        <>
          <ProductRow title={t("nvHits")} to="/catalog?sort=popular" products={hits} />
          <ProductRow title={t("nvDeals")} to="/catalog?deals=1" products={deals} />
          <ProductRow title={t("nvNew")} to="/catalog?sort=newest" products={fresh} />
        </>
      )}

      {brands.length > 0 && (
        <section className="nv-section">
          <div className="container">
            <div className="nv-section-head"><h2>{t("nvBrands")}</h2></div>
            <div className="nv-brands">
              {brands.map(name => (
                <Link to={`/catalog?brand=${encodeURIComponent(name)}`} className="nv-brand" key={name}>{name}</Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {viewedProducts.length > 0 && (
        <ProductRow title={t("nvViewed")} products={viewedProducts.slice(0, 12)} />
      )}

      <section className="nv-section">
        <div className="container">
          <div className="nv-adv">
            {ADVANTAGES.map(([icon, title, text]) => (
              <div className="nv-adv-item" key={title}>
                <span className="nv-adv-icon"><i className={`fa-solid ${icon}`}></i></span>
                <div>
                  <h3>{t(title)}</h3>
                  <p>{t(text)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
