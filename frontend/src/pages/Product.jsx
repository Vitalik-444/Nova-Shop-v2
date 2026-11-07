import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { getProduct, getProductsCached, getProductReviews, submitProductReview } from "../api";
import Stars from "../components/Stars";
import ProductRow from "../components/ProductRow";

function RatingInput({ value, onSelect }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="nv-rating-input" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          type="button"
          key={star}
          onMouseEnter={() => setHover(star)}
          onClick={() => onSelect(star)}
          aria-label={`${star}`}
        >
          <i className={`${star <= (hover || value) ? "fa-solid" : "fa-regular"} fa-star`}></i>
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ productId, myReview, onSaved }) {
  const { t, showToast } = useApp();
  const [rating, setRating] = useState(myReview ? myReview.rating : 0);
  const [comment, setComment] = useState(myReview ? myReview.comment : "");

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

    const result = await submitProductReview(productId, rating, comment.trim());

    if (result.success) {
      showToast(t("reviewSaved"), "success");
      onSaved();
    } else {
      showToast(result.message || t("reviewSaveFailed"), "error");
    }
  };

  return (
    <form className="nv-review-form" onSubmit={onSubmit}>
      <RatingInput value={rating} onSelect={setRating} />
      <textarea
        className="nv-textarea"
        placeholder={t("reviewPlaceholder")}
        value={comment}
        onChange={event => setComment(event.target.value)}
      ></textarea>
      <button type="submit" className="nv-btn nv-btn-primary">
        {myReview ? t("updateReview") : t("leaveReview")}
      </button>
    </form>
  );
}

export default function Product() {
  const { id } = useParams();
  const productId = Number(id);
  const navigate = useNavigate();
  const { t, tProduct, tCategory, formatPrice, user, language, addToCart, toggleFavorite, isFavorite, showToast, addViewedProduct } = useApp();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState("description");
  const tabsRef = useRef(null);

  const loadReviews = useCallback(async () => {
    const data = await getProductReviews(productId);
    setReviews(data.reviews);
    setMyReview(data.myReview);
  }, [productId]);

  const refreshProduct = useCallback(async () => {
    const fresh = await getProduct(productId);
    if (fresh) setProduct(fresh);
  }, [productId]);

  useEffect(() => {
    let active = true;
    setProduct(null);
    setQuantity(1);
    setImageIndex(0);
    setTab("description");

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
          <div className="nv-product nv-skeleton">
            <div className="nv-gallery-main nv-shimmer"></div>
            <div className="nv-product-info">
              <div className="nv-line nv-shimmer" style={{ width: "30%" }}></div>
              <div className="nv-line nv-line-lg nv-shimmer" style={{ width: "80%" }}></div>
              <div className="nv-line nv-shimmer" style={{ width: "50%" }}></div>
              <div className="nv-line nv-line-lg nv-shimmer" style={{ width: "40%" }}></div>
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
  const inStock = product.stock === undefined || product.stock > 0;
  const lowStock = inStock && product.stock > 0 && product.stock <= 10;

  const specs = [
    [t("brand"), product.brand],
    [t("seller"), product.seller],
    [t("category"), category],
    [t("sku"), product.sku],
    [t("weight"), product.weight ? `${product.weight} ${t("gram")}` : null],
    [t("warranty"), product.warrantyInformation],
    [t("delivery"), product.shippingInformation],
    [t("availability"), product.availabilityStatus],
    [t("returnPolicy"), product.returnPolicy]
  ].filter(([, value]) => value);

  const onReviewSaved = () => {
    refreshProduct();
    loadReviews();
  };

  const buyNow = async () => {
    await addToCart(product.id, quantity);
    navigate("/checkout");
  };

  const openReviews = () => {
    setTab("reviews");
    if (tabsRef.current) tabsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const step = direction => setImageIndex(current => (current + direction + images.length) % images.length);

  const tabs = [
    ["description", t("nvDescription")],
    ["specs", t("nvSpecs")],
    ["reviews", `${t("nvReviews")}${product.reviewsCount ? ` (${product.reviewsCount})` : ""}`]
  ];

  return (
    <section className="nv-page">
      <div className="container">
        <nav className="nv-crumbs" aria-label="breadcrumb">
          <Link to="/">{t("pageHome").replace("NovaShop | ", "")}</Link>
          <i className="fa-solid fa-chevron-right"></i>
          <Link to="/catalog">{t("catalog")}</Link>
          <i className="fa-solid fa-chevron-right"></i>
          <Link to={`/catalog?category=${encodeURIComponent(product.category)}`}>{category}</Link>
        </nav>

        <div className="nv-product">
          <div className="nv-gallery">
            <div className="nv-gallery-main">
              <img src={images[imageIndex]} alt={title} />
              {discount > 0 && <span className="nv-badge">{t("nvDiscount", { n: discount })}</span>}
              {images.length > 1 && (
                <>
                  <button type="button" className="nv-hero-arrow nv-hero-prev" onClick={() => step(-1)} aria-label={t("back")}>
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>
                  <button type="button" className="nv-hero-arrow nv-hero-next" onClick={() => step(1)} aria-label={t("next")}>
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="nv-thumbs">
                {images.map((image, index) => (
                  <button type="button" key={index} className={index === imageIndex ? "active" : ""} onClick={() => setImageIndex(index)}>
                    <img src={image} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="nv-product-info">
            <div className="nv-product-tags">
              <span className="nv-card-meta">{product.brand || category}</span>
              {product.seller && (
                <span className="nv-tag"><i className="fa-solid fa-store"></i> {t("seller")}: {product.seller}</span>
              )}
            </div>
            <h1 className="nv-product-title">{title}</h1>
            <button type="button" className="nv-rating-row nv-rating-link" onClick={openReviews}>
              <Stars value={product.rating} />
              <span>{product.rating}</span>
              <span className="nv-muted">{product.reviewsCount ? `(${product.reviewsCount})` : ""}</span>
            </button>

            <ul className="nv-highlights">
              {specs.slice(0, 4).map(([label, value]) => (
                <li key={label}><span>{label}</span><strong>{value}</strong></li>
              ))}
            </ul>
          </div>

          <aside className="nv-buybox">
            <div className="nv-price-row nv-price-row-lg">
              <span className="nv-price">{formatPrice(product.price)}</span>
              {oldPrice && <span className="nv-old-price">{formatPrice(oldPrice)}</span>}
            </div>
            <span className={`nv-stock${inStock ? " ok" : " out"}`}>
              <i className={inStock ? "fa-solid fa-circle-check" : "fa-solid fa-circle-xmark"}></i>
              {inStock ? (lowStock ? t("nvLeft", { n: product.stock }) : t("nvInStock")) : t("nvOutOfStock")}
            </span>

            <div className="nv-buy-actions">
              <div className="nv-qty">
                <button type="button" onClick={() => setQuantity(current => Math.max(1, current - 1))} aria-label="-">−</button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setQuantity(current => current + 1)} aria-label="+">+</button>
              </div>
              <button
                type="button"
                className={`nv-btn nv-btn-icon${favorite ? " active" : ""}`}
                onClick={() => toggleFavorite(product.id)}
                aria-label={t("addFavorite")}
                aria-pressed={favorite}
              >
                <i className={favorite ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
              </button>
            </div>
            <button type="button" className="nv-btn nv-btn-primary nv-btn-lg nv-btn-block" disabled={!inStock} onClick={() => addToCart(product.id, quantity)}>
              <i className="fa-solid fa-cart-shopping"></i> {t("nvAdd")}
            </button>
            <button type="button" className="nv-btn nv-btn-ghost nv-btn-lg nv-btn-block" disabled={!inStock} onClick={buyNow}>
              {t("nvBuyNow")}
            </button>

            <ul className="nv-perks">
              <li><i className="fa-solid fa-truck-fast"></i> <span>{product.shippingInformation || t("deliveryUkraine")}</span></li>
              <li><i className="fa-solid fa-shield-halved"></i> <span>{product.warrantyInformation || t("officialWarranty")}</span></li>
              {product.returnPolicy && <li><i className="fa-solid fa-rotate-left"></i> <span>{product.returnPolicy}</span></li>}
            </ul>
          </aside>
        </div>

        <div className="nv-tabs-wrap" ref={tabsRef}>
          <div className="nv-tabs" role="tablist">
            {tabs.map(([key, label]) => (
              <button type="button" role="tab" aria-selected={tab === key} key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
                {label}
              </button>
            ))}
          </div>

          <div className="nv-tab-panel">
            {tab === "description" && <p className="nv-description">{product.description}</p>}

            {tab === "specs" && (
              <div className="nv-specs">
                {specs.map(([label, value]) => (
                  <div className="nv-spec-row" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            )}

            {tab === "reviews" && (
              <div className="nv-reviews">
                <div className="nv-reviews-summary">
                  <strong>{product.rating}</strong>
                  <Stars value={product.rating} size="18px" />
                  <span className="nv-muted">{product.reviewsCount || 0}</span>
                </div>
                <div className="nv-reviews-form">
                  {user ? (
                    <ReviewForm productId={productId} myReview={myReview} onSaved={onReviewSaved} />
                  ) : (
                    <p className="nv-muted">
                      {t("loginToReview").replace(/<[^>]*>/g, "")} <Link to="/login" className="nv-link">{t("loginAction")}</Link>
                    </p>
                  )}
                </div>
                <div className="nv-reviews-list">
                  {reviews.length === 0 ? (
                    <p className="nv-muted">{t("noReviews")}</p>
                  ) : (
                    reviews.map((review, index) => (
                      <div className="nv-review" key={review.id || index}>
                        <div className="nv-review-head">
                          <span className="nv-avatar">{String(review.userName || "?").charAt(0).toUpperCase()}</span>
                          <div>
                            <strong>{review.userName}</strong>
                            <span className="nv-muted">
                              {new Date(review.createdAt).toLocaleDateString(language === "en" ? "en-US" : "uk-UA")}
                            </span>
                          </div>
                          <Stars value={review.rating} />
                        </div>
                        <p>{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductRow title={t("relatedProducts")} products={related} />

      <div className="nv-mobile-buy">
        <div>
          <strong>{formatPrice(product.price)}</strong>
          {oldPrice && <span className="nv-old-price">{formatPrice(oldPrice)}</span>}
        </div>
        <button type="button" className="nv-btn nv-btn-primary" disabled={!inStock} onClick={() => addToCart(product.id, quantity)}>
          <i className="fa-solid fa-cart-shopping"></i> {t("nvAdd")}
        </button>
      </div>
    </section>
  );
}
