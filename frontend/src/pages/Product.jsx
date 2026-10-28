import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { getProduct, getProducts, getProductReviews, submitProductReview } from "../api";
import ProductCard from "../components/ProductCard";

function Stars({ value, onSelect }) {
  return [1, 2, 3, 4, 5].map(star => (
    <i
      key={star}
      className={`${star <= value ? "fa-solid" : "fa-regular"} fa-star`}
      onClick={onSelect ? () => onSelect(star) : undefined}
    ></i>
  ));
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
    <form className="review-form" onSubmit={onSubmit}>
      <div className="star-input">
        <Stars value={rating} onSelect={setRating} />
      </div>
      <div className="form-group">
        <textarea
          className="input textarea"
          placeholder={t("reviewPlaceholder")}
          value={comment}
          onChange={event => setComment(event.target.value)}
        ></textarea>
      </div>
      <button type="submit" className="btn">
        {myReview ? t("updateReview") : t("leaveReview")}
      </button>
    </form>
  );
}

export default function Product() {
  const { id } = useParams();
  const productId = Number(id);
  const navigate = useNavigate();
  const { t, user, language, addToCart, toggleFavorite, isFavorite, showToast } = useApp();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState(1);

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
      const images = loaded.images && loaded.images.length ? loaded.images : [loaded.thumbnail];
      setMainImage(images[0]);

      const all = await getProducts(500);
      if (!active) return;
      setRelated(
        all.filter(item => item.category === loaded.category && item.id !== loaded.id).slice(0, 4)
      );
    })();

    loadReviews();

    return () => {
      active = false;
    };
  }, [productId]);

  if (!product) return null;

  const images = product.images && product.images.length ? product.images : [product.thumbnail];
  const favorite = isFavorite(product.id);
  const oldPrice = product.discountPercentage
    ? (product.price / (1 - product.discountPercentage / 100)).toFixed(2)
    : null;

  const specs = [
    [t("brand"), product.brand],
    [t("seller"), product.seller],
    [t("category"), product.category],
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

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="product-page">
            <div className="product-gallery">
              <div className="gallery-preview">
                <img id="mainImage" src={mainImage} alt={product.title} />
              </div>

              <div className="gallery-list" id="galleryList">
                {images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={product.title}
                    onClick={() => setMainImage(image)}
                  />
                ))}
              </div>
            </div>

            <div className="product-details">
              <span className="product-brand">
                {product.brand || product.category}
                {product.seller && (
                  <span className="product-seller-badge" style={{ marginLeft: "8px" }}>
                    <i className="fa-solid fa-store"></i> {t("seller")}: {product.seller}
                  </span>
                )}
              </span>

              <h1 className="product-name">{product.title}</h1>

              <div className="product-rating">
                <i className="fa-solid fa-star"></i>
                <span id="productRating">{product.rating}</span>
                <span id="productReviewsCount" className="reviews-count">
                  {product.reviewsCount ? `(${product.reviewsCount})` : ""}
                </span>
              </div>

              <div className="product-price">
                <span className="current-price" id="productPrice">{product.price} $</span>
                {oldPrice && <span className="old-price" id="oldPrice">{oldPrice} $</span>}
              </div>

              <p className="product-description" id="productDescription">{product.description}</p>

              <div className="product-actions">
                <div className="quantity-box">
                  <button onClick={() => setQuantity(current => Math.max(1, current - 1))}>−</button>
                  <span id="quantity">{quantity}</span>
                  <button onClick={() => setQuantity(current => current + 1)}>+</button>
                </div>

                <button className="btn" id="addCart" onClick={() => addToCart(product.id, quantity)}>
                  <i className="fa-solid fa-cart-shopping"></i>
                  <span>{t("addToCart")}</span>
                </button>

                <button
                  className={`btn-outline${favorite ? " favorite-active" : ""}`}
                  id="addFavorite"
                  onClick={() => toggleFavorite(product.id)}
                >
                  <i className={favorite ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
                  <span>{t("addFavorite")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="title">{t("specifications")}</h2>
          <div className="specifications" id="specifications">
            {specs.map(([label, value]) => (
              <div className="spec-row" key={label}>
                <span>{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="title">{t("reviews")}</h2>

          <div className="reviews-form-wrap">
            {user ? (
              <ReviewForm productId={productId} myReview={myReview} onSaved={onReviewSaved} />
            ) : (
              <p className="reviews-login-hint">{t("loginToReview")}</p>
            )}
          </div>

          <div className="reviews-list">
            {reviews.length === 0 ? (
              <p className="reviews-empty">{t("noReviews")}</p>
            ) : (
              reviews.map((review, index) => (
                <div className="review-card" key={review.id || index}>
                  <div className="review-head">
                    <span className="review-author">{review.userName}</span>
                    <span className="review-stars">
                      <Stars value={review.rating} />
                    </span>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString(language === "en" ? "en-US" : "uk-UA")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="title">{t("relatedProducts")}</h2>
          <div className="products-grid" id="relatedProducts">
            {related.map(item => (
              <ProductCard key={item.id} product={item} variant="compact" />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
