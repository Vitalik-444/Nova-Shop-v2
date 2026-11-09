import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { getProduct, getProductsCached, getProductReviews, submitProductReview } from "../api";
import { translateMetaText } from "../i18n/productTranslations";
import Stars from "../components/Stars";
import ProductRow from "../components/ProductRow";

function RatingInput({ value, onSelect }) {
  const { t } = useApp();
  const [hover, setHover] = useState(0);
  const active = hover || value;
  const labels = {
    1: t("ratingPoor"),
    2: t("ratingFair"),
    3: t("ratingGood"),
    4: t("ratingVeryGood"),
    5: t("ratingExcellent")
  };

  return (
    <div className="nv-rating-input-wrap">
      <div className="nv-rating-input" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            type="button"
            key={star}
            onMouseEnter={() => setHover(star)}
            onClick={() => onSelect(star)}
            aria-label={`${star}`}
            className={star <= active ? "is-active" : ""}
          >
            <i className={`${star <= active ? "fa-solid" : "fa-regular"} fa-star`}></i>
          </button>
        ))}
      </div>
      {active > 0 && <span className="nv-rating-active-label">{labels[active]}</span>}
    </div>
  );
}

function ReviewForm({ productId, myReview, onSaved }) {
  const { t, showToast } = useApp();
  const [rating, setRating] = useState(myReview ? myReview.rating : 0);
  const [comment, setComment] = useState(myReview ? myReview.comment : "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setRating(myReview ? myReview.rating : 0);
    setComment(myReview ? myReview.comment : "");
  }, [myReview]);

  const onSubmit = async event => {
    event.preventDefault();

    if (!rating) {
      showToast(t("setRating"), "error");
      return;
    }

    setSubmitting(true);
    const result = await submitProductReview(productId, rating, comment.trim());
    setSubmitting(false);

    if (result.success) {
      showToast(t("reviewSaved"), "success");
      onSaved();
    } else {
      showToast(result.message || t("reviewSaveFailed"), "error");
    }
  };

  return (
    <form className="nv-review-form" onSubmit={onSubmit}>
      <div className="nv-form-group">
        <label className="nv-form-label">{t("yourRating")}</label>
        <RatingInput value={rating} onSelect={setRating} />
      </div>
      <div className="nv-form-group">
        <textarea
          className="nv-textarea"
          placeholder={t("reviewPlaceholder")}
          value={comment}
          onChange={event => setComment(event.target.value)}
          rows="4"
        ></textarea>
      </div>
      <button type="submit" className="nv-btn nv-btn-primary" disabled={submitting}>
        <i className={`fa-solid ${myReview ? "fa-check" : "fa-paper-plane"}`}></i>
        <span>{submitting ? t("loading") : myReview ? t("updateReview") : t("leaveReview")}</span>
      </button>
    </form>
  );
}

// Fullscreen Lightbox Modal for Product Images
function GalleryLightbox({ images, currentIndex, title, onClose, onSelectIndex }) {
  const step = dir => {
    const next = (currentIndex + dir + images.length) % images.length;
    onSelectIndex(next);
  };

  useEffect(() => {
    const handleKey = e => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, images.length]);

  return (
    <div className="nv-lightbox-overlay" onClick={onClose}>
      <div className="nv-lightbox-modal" onClick={e => e.stopPropagation()}>
        <button type="button" className="nv-lightbox-close" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="nv-lightbox-stage">
          {images.length > 1 && (
            <button type="button" className="nv-lightbox-arrow nv-lightbox-prev" onClick={() => step(-1)}>
              <i className="fa-solid fa-chevron-left"></i>
            </button>
          )}

          <div className="nv-lightbox-img-wrap">
            <img src={images[currentIndex]} alt={title} className="nv-lightbox-img" />
          </div>

          {images.length > 1 && (
            <button type="button" className="nv-lightbox-arrow nv-lightbox-next" onClick={() => step(1)}>
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          )}
        </div>

        {images.length > 1 && (
          <div className="nv-lightbox-thumbs">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                className={`nv-lightbox-thumb ${idx === currentIndex ? "active" : ""}`}
                onClick={() => onSelectIndex(idx)}
              >
                <img src={img} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Product() {
  const { id } = useParams();
  const productId = Number(id);
  const navigate = useNavigate();
  const {
    t,
    tProduct,
    tCategory,
    formatPrice,
    user,
    language,
    addToCart,
    toggleFavorite,
    isFavorite,
    showToast,
    addViewedProduct
  } = useApp();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState("description");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [skuCopied, setSkuCopied] = useState(false);
  const tabsRef = useRef(null);

  const loadReviews = useCallback(async () => {
    const data = await getProductReviews(productId);
    setReviews(data.reviews || []);
    setMyReview(data.myReview || null);
  }, [productId]);

  const refreshProduct = useCallback(async () => {
    const fresh = await getProduct(productId);
    if (fresh) setProduct(fresh);
  }, [productId]);

  const onReviewSaved = useCallback(() => {
    refreshProduct();
    loadReviews();
  }, [refreshProduct, loadReviews]);

  const ratingDistribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const rounded = Math.min(5, Math.max(1, Math.round(Number(r.rating)) || 5));
      dist[rounded] = (dist[rounded] || 0) + 1;
    });
    return dist;
  }, [reviews]);

  useEffect(() => {
    let active = true;
    setProduct(null);
    setQuantity(1);
    setImageIndex(0);
    setTab("description");
    setLightboxOpen(false);

    if (!productId) {
      navigate("/catalog", { replace: true });
      return undefined;
    }

    (async () => {
      const loaded = await getProduct(productId);
      if (!active) return;

      if (!loaded) {
        showToast(t("productNotFound"), "error");
        navigate("/catalog", { replace: true });
        return;
      }

      setProduct(loaded);
      addViewedProduct(loaded);

      const all = await getProductsCached();
      if (!active) return;
      setRelated(all.filter(item => item.category === loaded.category && item.id !== loaded.id).slice(0, 12));
    })();

    loadReviews();

    return () => {
      active = false;
    };
  }, [productId]);

  if (!product) {
    return (
      <section className="nv-page">
        <div className="container">
          <div className="nv-product-skeleton">
            <div className="nv-gallery-col nv-shimmer" style={{ minHeight: "480px", borderRadius: "24px" }}></div>
            <div className="nv-product-details-col">
              <div className="nv-line nv-shimmer" style={{ width: "35%", height: "24px" }}></div>
              <div className="nv-line nv-shimmer" style={{ width: "85%", height: "40px" }}></div>
              <div className="nv-line nv-shimmer" style={{ width: "45%", height: "24px" }}></div>
              <div className="nv-line nv-shimmer" style={{ width: "60%", height: "60px", marginTop: "20px" }}></div>
              <div className="nv-line nv-shimmer" style={{ width: "100%", height: "140px", marginTop: "20px" }}></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const title = tProduct(product);
  const category = tCategory(product.category);
  const images = product.images && product.images.length ? product.images : [product.thumbnail];
  const favorite = isFavorite(product.id);
  const discount = Math.round(Number(product.discountPercentage) || 0);
  const oldPrice = discount ? product.price / (1 - discount / 100) : null;
  const savings = oldPrice ? oldPrice - product.price : 0;
  const inStock = product.stock === undefined || product.stock > 0;
  const lowStock = inStock && product.stock > 0 && product.stock <= 10;
  const installmentPerMonth = Math.round(product.price / 12);

  const rawShipping = product.shippingInformation || "Ships in 1-2 business days";
  const rawWarranty = product.warrantyInformation || "1 year warranty";
  const rawReturn = product.returnPolicy || "30 days return policy";

  const shippingText = translateMetaText(rawShipping, language);
  const warrantyText = translateMetaText(rawWarranty, language);
  const returnText = translateMetaText(rawReturn, language);

  const specs = [
    [t("brand"), product.brand, "fa-solid fa-tag"],
    [t("category"), category, "fa-solid fa-folder-open"],
    [t("sku"), product.sku || `SKU-${product.id}`, "fa-solid fa-barcode"],
    [t("seller"), product.seller || "NovaShop", "fa-solid fa-store"],
    [t("weight"), product.weight ? `${product.weight} ${t("gram")}` : null, "fa-solid fa-scale-balanced"],
    [t("warranty"), warrantyText, "fa-solid fa-shield-halved"],
    [t("delivery"), shippingText, "fa-solid fa-truck-fast"],
    [t("returnPolicy"), returnText, "fa-solid fa-rotate-left"]
  ].filter(([, value]) => value);

  const buyNow = async () => {
    await addToCart(product.id, quantity);
    navigate("/checkout");
  };

  const copySku = () => {
    if (product.sku) {
      navigator.clipboard?.writeText(product.sku);
      setSkuCopied(true);
      showToast(t("nvSkuCopied") || "SKU copied", "success");
      setTimeout(() => setSkuCopied(false), 2000);
    }
  };

  const shareProduct = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      showToast(t("nvLinkCopied") || "Посилання скопійовано", "success");
    }
  };

  const openReviews = () => {
    setTab("reviews");
    if (tabsRef.current) {
      tabsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const step = direction => {
    setImageIndex(current => (current + direction + images.length) % images.length);
  };

  const tabs = [
    ["description", t("nvDescription") || "Опис", "fa-regular fa-file-lines"],
    ["specs", t("nvSpecs") || "Характеристики", "fa-solid fa-list-check"],
    ["reviews", `${t("nvReviews") || "Відгуки"}${product.reviewsCount ? ` (${product.reviewsCount})` : ""}`, "fa-regular fa-star"],
    ["delivery", t("nvDeliveryAndPayment") || "Доставка та оплата", "fa-solid fa-truck-ramp-box"]
  ];

  return (
    <section className="nv-page nv-product-page-v2">
      <div className="container">
        {/* Modern Top Breadcrumbs & Utility Actions */}
        <div className="nv-product-topbar">
          <nav className="nv-breadcrumbs-modern" aria-label="breadcrumb">
            <Link to="/" className="nv-crumb-home">
              <i className="fa-solid fa-house"></i>
            </Link>
            <i className="fa-solid fa-chevron-right nv-crumb-sep"></i>
            <Link to="/catalog">{t("catalog")}</Link>
            <i className="fa-solid fa-chevron-right nv-crumb-sep"></i>
            <Link to={`/catalog?category=${encodeURIComponent(product.category)}`}>{category}</Link>
            <i className="fa-solid fa-chevron-right nv-crumb-sep"></i>
            <span className="nv-crumb-current">{title}</span>
          </nav>

          <div className="nv-product-top-actions">
            {product.sku && (
              <button
                type="button"
                className="nv-sku-badge"
                onClick={copySku}
                title={t("nvSkuCopied") || "Копіювати артикул"}
              >
                <i className={`fa-solid ${skuCopied ? "fa-check" : "fa-barcode"}`}></i>
                <span>{product.sku}</span>
              </button>
            )}
            <button
              type="button"
              className="nv-action-pill"
              onClick={shareProduct}
              title={t("nvShare") || "Поділитися"}
            >
              <i className="fa-solid fa-share-nodes"></i>
              <span className="nv-hide-mobile">{t("nvShare") || "Поділитися"}</span>
            </button>
            <button
              type="button"
              className={`nv-action-pill nv-fav-pill ${favorite ? "is-favorite" : ""}`}
              onClick={() => toggleFavorite(product.id)}
              aria-label={t("addFavorite")}
            >
              <i className={favorite ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
            </button>
          </div>
        </div>

        {/* Flagship 2-Column Product Showcase */}
        <div className="nv-product-hero-v2">
          {/* LEFT: Premium Visual Presentation */}
          <div className="nv-gallery-col">
            <div className="nv-gallery-card">
              {/* Floating Badges */}
              <div className="nv-gallery-floating-badges">
                {discount > 0 && (
                  <span className="nv-badge-discount-v2">
                    <i className="fa-solid fa-fire"></i> -{discount}%
                  </span>
                )}
                <span className={`nv-stock-badge-pill ${inStock ? "is-stock" : "is-out"}`}>
                  <span className="nv-pulse-dot"></span>
                  {inStock ? (lowStock ? t("nvLeft", { n: product.stock }) : t("nvInStock")) : t("nvOutOfStock")}
                </span>
              </div>

              {/* Fullscreen Zoom Trigger */}
              <button
                type="button"
                className="nv-gallery-zoom-btn"
                onClick={() => setLightboxOpen(true)}
                title={t("nvZoom") || "Збільшити фото"}
              >
                <i className="fa-solid fa-expand"></i>
              </button>

              {/* Main Image Stage */}
              <div className="nv-gallery-stage" onClick={() => setLightboxOpen(true)}>
                <img
                  src={images[imageIndex]}
                  alt={title}
                  className="nv-gallery-hero-img"
                  loading="eager"
                />

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="nv-stage-arrow nv-stage-prev"
                      onClick={e => {
                        e.stopPropagation();
                        step(-1);
                      }}
                      aria-label={t("back")}
                    >
                      <i className="fa-solid fa-chevron-left"></i>
                    </button>
                    <button
                      type="button"
                      className="nv-stage-arrow nv-stage-next"
                      onClick={e => {
                        e.stopPropagation();
                        step(1);
                      }}
                      aria-label={t("next")}
                    >
                      <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  </>
                )}

                {images.length > 1 && (
                  <div className="nv-stage-counter">
                    {imageIndex + 1} / {images.length}
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnails Row */}
            {images.length > 1 && (
              <div className="nv-gallery-thumbs-strip">
                {images.map((image, index) => (
                  <button
                    type="button"
                    key={index}
                    className={`nv-gallery-thumb-item ${index === imageIndex ? "is-active" : ""}`}
                    onClick={() => setImageIndex(index)}
                  >
                    <img src={image} alt={`${title} view ${index + 1}`} loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            {/* 4 Pillars Trust Ribbon */}
            <div className="nv-trust-ribbon">
              <div className="nv-trust-item">
                <div className="nv-trust-icon-box">
                  <i className="fa-solid fa-award"></i>
                </div>
                <div className="nv-trust-text">
                  <strong>{t("nvOriginalProduct") || "100% Оригінал"}</strong>
                  <span>{product.brand ? `${product.brand}` : t("officialWarranty")}</span>
                </div>
              </div>
              <div className="nv-trust-item">
                <div className="nv-trust-icon-box">
                  <i className="fa-solid fa-truck-fast"></i>
                </div>
                <div className="nv-trust-text">
                  <strong>{t("nvFastDispatch") || "Швидка доставка"}</strong>
                  <span>{shippingText}</span>
                </div>
              </div>
              <div className="nv-trust-item">
                <div className="nv-trust-icon-box">
                  <i className="fa-solid fa-rotate-left"></i>
                </div>
                <div className="nv-trust-text">
                  <strong>{t("nvEasyReturns") || "Легке повернення"}</strong>
                  <span>{returnText}</span>
                </div>
              </div>
              <div className="nv-trust-item">
                <div className="nv-trust-icon-box">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <div className="nv-trust-text">
                  <strong>{t("nvOfficialWarranty") || "Офіційна гарантія"}</strong>
                  <span>{warrantyText}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Product Intelligence, Pricing & Purchasing Hub */}
          <div className="nv-product-details-col">
            {/* Badges / Brand & Seller Row */}
            <div className="nv-details-brand-row">
              {product.brand && (
                <Link
                  to={`/catalog?brand=${encodeURIComponent(product.brand)}`}
                  className="nv-brand-pill"
                >
                  <i className="fa-solid fa-tag"></i>
                  <span>{product.brand}</span>
                </Link>
              )}
              <span className="nv-category-pill">
                <i className="fa-solid fa-layer-group"></i>
                <span>{category}</span>
              </span>
              {product.seller && (
                <span className="nv-seller-verified-pill" title={t("nvVerifiedSeller") || "Перевірений продавець"}>
                  <i className="fa-solid fa-circle-check"></i>
                  <span>{product.seller}</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="nv-product-title-v2">{title}</h1>

            {/* Social Proof & Rating Bar */}
            <div className="nv-details-social-bar">
              <button
                type="button"
                className="nv-rating-badge-btn"
                onClick={openReviews}
                title="Переглянути відгуки"
              >
                <div className="nv-stars-wrap">
                  <Stars value={product.rating} />
                </div>
                <strong className="nv-rating-score">{Number(product.rating || 0).toFixed(2)}</strong>
                <span className="nv-reviews-counter">
                  ({product.reviewsCount || reviews.length} {t("nvReviews") || "відгуків"})
                </span>
              </button>

              <span className="nv-social-divider">•</span>

              <div className="nv-meta-status">
                <i className="fa-solid fa-bolt nv-accent-icon"></i>
                <span>{t("nvHits") || "Хіт продажу"}</span>
              </div>
            </div>

            {/* Luxury Price & Finance Card */}
            <div className="nv-hero-price-card">
              <div className="nv-price-main-block">
                <div className="nv-price-primary-row">
                  <span className="nv-price-value-v2">{formatPrice(product.price)}</span>
                  {oldPrice && <span className="nv-price-old-v2">{formatPrice(oldPrice)}</span>}
                </div>

                {savings > 0 && (
                  <div className="nv-savings-tag">
                    <i className="fa-solid fa-piggy-bank"></i>
                    <span>
                      {t("nvSavings") || "Економія"}: <strong>{formatPrice(savings)}</strong> (-{discount}%)
                    </span>
                  </div>
                )}
              </div>

              {/* Installments Teaser */}
              <div className="nv-installment-banner">
                <div className="nv-installment-icon">
                  <i className="fa-solid fa-credit-card"></i>
                </div>
                <div className="nv-installment-info">
                  <strong>{t("nvInstallmentPlan") || "Оплата частинами"}</strong>
                  <span>{t("nvInstallmentFrom", { n: formatPrice(installmentPerMonth) }) || `від ${formatPrice(installmentPerMonth)}/міс без %`}</span>
                </div>
                <div className="nv-installment-banks">
                  <span className="nv-bank-badge mono" title="monobank">mono</span>
                  <span className="nv-bank-badge privat" title="ПриватБанк">PB</span>
                </div>
              </div>
            </div>

            {/* Key Specs Quick Grid (4 items) */}
            <div className="nv-quick-specs-grid">
              {specs.slice(0, 4).map(([label, value, icon]) => (
                <div className="nv-quick-spec-item" key={label}>
                  <i className={icon || "fa-solid fa-circle-info"}></i>
                  <div className="nv-spec-meta">
                    <span className="nv-spec-label">{label}</span>
                    <strong className="nv-spec-val">{value}</strong>
                  </div>
                </div>
              ))}
            </div>

            {/* Primary Action Buttons (Commerce Core) */}
            <div className="nv-purchase-action-box">
              <div className="nv-action-controls-row">
                {/* Quantity Stepper */}
                <div className="nv-qty-stepper-v2">
                  <button
                    type="button"
                    onClick={() => setQuantity(c => Math.max(1, c - 1))}
                    aria-label="Decrease"
                    disabled={quantity <= 1}
                  >
                    <i className="fa-solid fa-minus"></i>
                  </button>
                  <span className="nv-qty-num">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(c => c + 1)}
                    aria-label="Increase"
                  >
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>

                {/* Main Add To Cart */}
                <button
                  type="button"
                  className="nv-btn nv-btn-primary nv-btn-buy-primary"
                  disabled={!inStock}
                  onClick={() => addToCart(product.id, quantity)}
                >
                  <i className="fa-solid fa-cart-shopping"></i>
                  <span>{t("nvAdd") || "У кошик"}</span>
                </button>

                {/* Instant Order Button */}
                <button
                  type="button"
                  className="nv-btn nv-btn-buy-instant"
                  disabled={!inStock}
                  onClick={buyNow}
                  title={t("nvBuyNow") || "Купити зараз"}
                >
                  <i className="fa-solid fa-bolt"></i>
                  <span>{t("nvBuyNow") || "Купити зараз"}</span>
                </button>
              </div>
            </div>

            {/* Service & Delivery Info Box */}
            <div className="nv-service-perks-box">
              <div className="nv-perk-row">
                <div className="nv-perk-icon-circle">
                  <i className="fa-solid fa-truck-fast"></i>
                </div>
                <div className="nv-perk-details">
                  <strong>{t("delivery") || "Доставка"}: {shippingText}</strong>
                  <span>Нова Пошта, кур&apos;єр або поштомат по всій Україні</span>
                </div>
              </div>

              <div className="nv-perk-row">
                <div className="nv-perk-icon-circle">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <div className="nv-perk-details">
                  <strong>{t("warranty") || "Гарантія"}: {warrantyText}</strong>
                  <span>Офіційна гарантія з сервісним обслуговуванням</span>
                </div>
              </div>

              <div className="nv-perk-row">
                <div className="nv-perk-icon-circle">
                  <i className="fa-solid fa-credit-card"></i>
                </div>
                <div className="nv-perk-details">
                  <strong>{t("payment") || "Оплата"}: {t("paymentMethods") || "Зручні способи оплати"}</strong>
                  <span>Карткою онлайн, Apple Pay, Google Pay або при отриманні</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed In-Depth Experience */}
        <div className="nv-tabs-container-v2" ref={tabsRef}>
          <div className="nv-tabs-nav-modern" role="tablist">
            {tabs.map(([key, label, icon]) => (
              <button
                type="button"
                role="tab"
                aria-selected={tab === key}
                key={key}
                className={`nv-tab-pill-btn ${tab === key ? "is-active" : ""}`}
                onClick={() => setTab(key)}
              >
                <i className={icon}></i>
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="nv-tab-panel-v2">
            {/* Description Tab */}
            {tab === "description" && (
              <div className="nv-tab-description-layout">
                <div className="nv-desc-main-text">
                  <h3 className="nv-section-subheading">
                    <i className="fa-solid fa-circle-info"></i>
                    <span>{t("nvDescription") || "Опис товару"}</span>
                  </h3>
                  <p className="nv-desc-paragraph">{product.description}</p>
                </div>

                <div className="nv-desc-highlight-cards">
                  <div className="nv-highlight-card">
                    <div className="nv-highlight-icon">
                      <i className="fa-solid fa-microchip"></i>
                    </div>
                    <h4>Висока продуктивність</h4>
                    <p>Сучасні технології та висока якість збірки для максимальної ефективності кожного дня.</p>
                  </div>
                  <div className="nv-highlight-card">
                    <div className="nv-highlight-icon">
                      <i className="fa-solid fa-shield-virus"></i>
                    </div>
                    <h4>Надійність та безпека</h4>
                    <p>Офіційні стандарти якості та гарантія захисту від виробника.</p>
                  </div>
                  <div className="nv-highlight-card">
                    <div className="nv-highlight-icon">
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                    <h4>Преміальний дизайн</h4>
                    <p>Ергономічні матеріали, стильне оформлення та продумана кожна деталь.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Specifications Tab */}
            {tab === "specs" && (
              <div className="nv-tab-specs-layout">
                <div className="nv-specs-header">
                  <h3 className="nv-section-subheading">
                    <i className="fa-solid fa-sliders"></i>
                    <span>{t("nvFullSpecs") || "Повні технічні характеристики"}</span>
                  </h3>
                  <span className="nv-specs-count">{specs.length} параметрів</span>
                </div>

                <div className="nv-specs-table-v2">
                  {specs.map(([label, value, icon], index) => (
                    <div className="nv-spec-row-v2" key={label} style={{ animationDelay: `${index * 30}ms` }}>
                      <div className="nv-spec-row-left">
                        <i className={icon || "fa-solid fa-circle"}></i>
                        <span>{label}</span>
                      </div>
                      <div className="nv-spec-row-right">
                        <strong>{value}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {tab === "reviews" && (
              <div className="nv-reviews-dashboard-v2">
                <div className="nv-reviews-sidebar">
                  <div className="nv-reviews-card nv-reviews-rating-card">
                    <h3 className="nv-card-heading">
                      <i className="fa-solid fa-chart-simple"></i>
                      <span>{t("rating")}</span>
                    </h3>
                    <div className="nv-rating-hero">
                      <div className="nv-rating-big">{Number(product.rating || 0).toFixed(1)}</div>
                      <div className="nv-rating-hero-meta">
                        <Stars value={product.rating} size="20px" />
                        <span className="nv-rating-count-text">
                          {product.reviewsCount ? t("basedOnReviews", { count: product.reviewsCount }) : t("noRatingsYet")}
                        </span>
                      </div>
                    </div>

                    <div className="nv-rating-bars">
                      {[5, 4, 3, 2, 1].map(stars => {
                        const count = ratingDistribution[stars] || 0;
                        const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                        return (
                          <div className="nv-rating-bar-row" key={stars}>
                            <span className="nv-rating-bar-num">
                              {stars} <i className="fa-solid fa-star"></i>
                            </span>
                            <div className="nv-rating-bar-track">
                              <div className="nv-rating-bar-fill" style={{ width: `${pct}%` }}></div>
                            </div>
                            <span className="nv-rating-bar-qty">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="nv-reviews-card nv-reviews-form-card">
                    <h3 className="nv-card-heading">
                      <i className="fa-solid fa-pen-to-square"></i>
                      <span>{myReview ? t("updateReview") : t("writeReview")}</span>
                    </h3>
                    {user ? (
                      <ReviewForm productId={productId} myReview={myReview} onSaved={onReviewSaved} />
                    ) : (
                      <div className="nv-review-login-prompt">
                        <div className="nv-prompt-icon">
                          <i className="fa-solid fa-lock"></i>
                        </div>
                        <p>{t("loginToReview").replace(/<[^>]*>/g, "")}</p>
                        <Link to="/login" className="nv-btn nv-btn-primary nv-btn-block">
                          <i className="fa-solid fa-arrow-right-to-bracket"></i> {t("loginAction")}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                <div className="nv-reviews-content">
                  <div className="nv-reviews-content-header">
                    <h3>
                      {t("customerReviews")}{" "}
                      <span className="nv-badge-pill">{reviews.length}</span>
                    </h3>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="nv-reviews-empty">
                      <div className="nv-empty-icon-circle">
                        <i className="fa-regular fa-comment-dots"></i>
                      </div>
                      <h4>{t("reviewsEmptyTitle")}</h4>
                      <p>{t("reviewsEmptyDesc")}</p>
                    </div>
                  ) : (
                    <div className="nv-reviews-feed">
                      {reviews.map((review, index) => {
                        const isOwn = myReview && (myReview.id === review.id || user?.id === review.userId);
                        return (
                          <div className={`nv-review-card ${isOwn ? "is-own" : ""}`} key={review.id || index}>
                            <div className="nv-review-top">
                              <div className="nv-review-user">
                                <span className="nv-review-avatar">
                                  {String(review.userName || "?").charAt(0).toUpperCase()}
                                </span>
                                <div>
                                  <div className="nv-review-user-row">
                                    <strong className="nv-review-username">{review.userName}</strong>
                                    {isOwn && <span className="nv-own-badge">{t("yourReviewBadge")}</span>}
                                    <span className="nv-verified-badge" title={t("verifiedBuyer")}>
                                      <i className="fa-solid fa-circle-check"></i> {t("verifiedBuyer")}
                                    </span>
                                  </div>
                                  <span className="nv-review-timestamp">
                                    {new Date(review.createdAt).toLocaleDateString(language === "en" ? "en-US" : "uk-UA", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric"
                                    })}
                                  </span>
                                </div>
                              </div>
                              <div className="nv-review-rating-badge">
                                <Stars value={review.rating} size="15px" />
                              </div>
                            </div>
                            <div className="nv-review-message">
                              <p>{review.comment}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Delivery & Payment Tab */}
            {tab === "delivery" && (
              <div className="nv-tab-delivery-layout">
                <div className="nv-delivery-grid">
                  <div className="nv-delivery-card">
                    <div className="nv-delivery-card-head">
                      <div className="nv-delivery-card-icon">
                        <i className="fa-solid fa-truck"></i>
                      </div>
                      <h4>Способи доставки</h4>
                    </div>
                    <ul className="nv-delivery-list">
                      <li>
                        <strong>Нова Пошта (відділення / поштомат)</strong>
                        <span>Термін доставки: 1-2 дні. Вартість за тарифами перевізника (від 70 ₴). Безкоштовно від 1500 ₴.</span>
                      </li>
                      <li>
                        <strong>Кур&apos;єрська доставка Нова Пошта</strong>
                        <span>До ваших дверей у зручний час. 1-2 дні.</span>
                      </li>
                      <li>
                        <strong>Самовивіз із точок видачі NovaShop</strong>
                        <span>Безкоштовно сьогодні за умови наявності у вашому місті.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="nv-delivery-card">
                    <div className="nv-delivery-card-head">
                      <div className="nv-delivery-card-icon">
                        <i className="fa-solid fa-wallet"></i>
                      </div>
                      <h4>Способи оплати</h4>
                    </div>
                    <ul className="nv-delivery-list">
                      <li>
                        <strong>Онлайн оплата карткою</strong>
                        <span>Visa, Mastercard, Google Pay, Apple Pay без будь-яких комісій.</span>
                      </li>
                      <li>
                        <strong>Оплата при отриманні</strong>
                        <span>Післяплата у відділенні після повної перевірки товару.</span>
                      </li>
                      <li>
                        <strong>Оплата частинами 0%</strong>
                        <span>Розстрочка від Monobank та ПриватБанк до 12 платежів.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="nv-delivery-card">
                    <div className="nv-delivery-card-head">
                      <div className="nv-delivery-card-icon">
                        <i className="fa-solid fa-shield-heart"></i>
                      </div>
                      <h4>Гарантія та сервіс</h4>
                    </div>
                    <ul className="nv-delivery-list">
                      <li>
                        <strong>Офіційна гарантія</strong>
                        <span>{warrantyText}. Обслуговування в авторизованих сервісних центрах.</span>
                      </li>
                      <li>
                        <strong>Легке повернення</strong>
                        <span>{returnText}. 100% повернення коштів без зайвих питань.</span>
                      </li>
                      <li>
                        <strong>Підтримка покупців 24/7</strong>
                        <span>Наша служба турботи завжди на зв&apos;язку для вирішення будь-яких питань.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products Carousel */}
      <ProductRow title={t("relatedProducts")} products={related} />

      {/* Sticky Mobile Buy Bar */}
      <div className="nv-mobile-buy-v2">
        <div className="nv-mobile-buy-info">
          <div className="nv-mobile-price">{formatPrice(product.price)}</div>
          {oldPrice && <div className="nv-mobile-old-price">{formatPrice(oldPrice)}</div>}
        </div>
        <div className="nv-mobile-buy-actions">
          <button
            type="button"
            className={`nv-btn nv-btn-icon nv-mobile-fav-btn ${favorite ? "active" : ""}`}
            onClick={() => toggleFavorite(product.id)}
            aria-label={t("addFavorite")}
          >
            <i className={favorite ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
          </button>
          <button
            type="button"
            className="nv-btn nv-btn-primary nv-mobile-add-btn"
            disabled={!inStock}
            onClick={() => addToCart(product.id, quantity)}
          >
            <i className="fa-solid fa-cart-shopping"></i>
            <span>{t("nvAdd") || "У кошик"}</span>
          </button>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <GalleryLightbox
          images={images}
          currentIndex={imageIndex}
          title={title}
          onClose={() => setLightboxOpen(false)}
          onSelectIndex={setImageIndex}
        />
      )}
    </section>
  );
}
