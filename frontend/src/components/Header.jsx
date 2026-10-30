import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Header() {
  const { t, user, cart, favorites, theme, toggleTheme, isDarkTheme, language, setLanguage } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const search = () => {
    const value = query.trim();
    navigate(value ? `/catalog?q=${encodeURIComponent(value)}` : "/catalog");
  };

  const onKeyDown = event => {
    if (event.key === "Enter") {
      event.preventDefault();
      search();
    }
  };

  return (
    <header className="header">
      <div className="header-top">
        <div className="container header-row">
          <Link to="/" className="logo">NovaShop</Link>

          <Link to="/catalog" className="catalog-btn">
            <i className="fa-solid fa-bars"></i>
            <span>{t("catalog")}</span>
          </Link>

          <div className="search">
            <input
              id="globalSearchInput"
              type="text"
              placeholder={t("searchProducts")}
              value={query}
              onChange={event => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
            />
            <button id="globalSearchBtn" onClick={search}>
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
          </div>

          <div className="header-actions">
            <Link to="/favorites" className="action-btn">
              <i className="fa-regular fa-heart"></i>
              <span className="badge favorite-count">{favorites.length}</span>
            </Link>

            <Link to="/cart" className="action-btn">
              <i className="fa-solid fa-cart-shopping"></i>
              <span className="badge cart-count">{cart.length}</span>
            </Link>

            <button className="action-btn" id="themeBtn" onClick={toggleTheme}>
              <i className={isDarkTheme(theme) ? "fa-solid fa-sun" : "fa-solid fa-moon"}></i>
            </button>

            <div className="language-switcher" title={t("language")}>
              <button
                type="button"
                className={language === "uk" ? "active" : ""}
                onClick={() => setLanguage("uk")}
              >
                UA
              </button>
              <button
                type="button"
                className={language === "en" ? "active" : ""}
                onClick={() => setLanguage("en")}
              >
                EN
              </button>
            </div>

            {user ? (
              <Link to="/profile" className="action-btn" title={t("profile")}>
                <i className="fa-solid fa-user-check"></i>
              </Link>
            ) : (
              <Link to="/login" className="action-btn" title={t("loginAction")}>
                <i className="fa-regular fa-user"></i>
              </Link>
            )}

            {user && user.role === "admin" && (
              <Link to="/admin" className="action-btn" title={t("adminPanel")}>
                <i className="fa-solid fa-user-gear"></i>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
