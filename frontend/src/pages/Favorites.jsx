import { useApp } from "../context/AppContext";
import ProductCard from "../components/ProductCard";

export default function Favorites() {
  const { t, favorites } = useApp();

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">{t("favoritesTitle")}</h1>

        <div className="products-grid favorites-grid">
          {favorites.length === 0 ? (
            <h2 className="empty-message">{t("favoritesEmpty")}</h2>
          ) : (
            favorites.map(product => (
              <ProductCard key={product.id} product={product} variant="favorite" />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
