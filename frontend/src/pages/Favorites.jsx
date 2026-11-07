import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import ProductCard from "../components/ProductCard";

export default function Favorites() {
  const { t, favorites } = useApp();

  return (
    <section className="nv-page">
      <div className="container">
        <h1 className="nv-page-title">{t("favoritesTitle")} {favorites.length > 0 && <span className="nv-muted">{favorites.length}</span>}</h1>

        {favorites.length === 0 ? (
          <div className="nv-empty">
            <i className="fa-regular fa-heart"></i>
            <h3>{t("favoritesEmpty")}</h3>
            <Link to="/catalog" className="nv-btn nv-btn-primary">{t("nvToCatalog")}</Link>
          </div>
        ) : (
          <div className="nv-grid">
            {favorites.map(product => (
              <ProductCard key={product.id} product={product} variant="favorite" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
