import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { getCategories, getProductsCached } from "../api";
import { getStorage, setStorage } from "../utils/storage";
import { getCategoryIcon } from "../utils/categoryIcons";

function SearchBox() {
  const { t, tProduct, formatPrice } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState([]);
  const box = useRef(null);

  useEffect(() => {
    const onDown = event => {
      if (box.current && !box.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const onFocus = () => {
    setOpen(true);
    setRecent(getStorage("recent_searches", []).slice(0, 6));
    if (!products.length) getProductsCached().then(setProducts);
  };

  const value = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!value) return [];
    return products
      .filter(product => {
        const titleEn = (product.titleEn || product.title || "").toLowerCase();
        const titleUk = (product.titleUk || "").toLowerCase();
        const brand = (product.brand || "").toLowerCase();
        return titleEn.includes(value) || titleUk.includes(value) || brand.includes(value) || tProduct(product).toLowerCase().includes(value);
      })
      .slice(0, 6);
  }, [products, value, tProduct]);

  const items = value ? matches : [];

  const submit = text => {
    const term = (text ?? query).trim();
    if (term) {
      const history = getStorage("recent_searches", []);
      const updated = [term, ...history.filter(h => h.toLowerCase() !== term.toLowerCase())].slice(0, 10);
      setStorage("recent_searches", updated);
      setStorage("search_history", updated);
    }
    setOpen(false);
    setActive(-1);
    navigate(term ? `/catalog?q=${encodeURIComponent(term)}` : "/catalog");
  };

  const onKeyDown = event => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(current => Math.min(items.length - 1, current + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(current => Math.max(-1, current - 1));
    } else if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (active >= 0 && items[active]) {
        setOpen(false);
        navigate(`/product/${items[active].id}`);
      } else {
        submit();
      }
    }
  };

  return (
    <div className="nv-search" ref={box}>
      <i className="fa-solid fa-magnifying-glass nv-search-icon"></i>
      <input
        type="text"
        value={query}
        placeholder={t("searchProducts")}
        aria-label={t("nvSearchLabel")}
        onFocus={onFocus}
        onChange={event => {
          setQuery(event.target.value);
          setActive(-1);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {query && (
        <button type="button" className="nv-search-clear" onClick={() => setQuery("")} aria-label={t("nvClear")}>
          <i className="fa-solid fa-xmark"></i>
        </button>
      )}
      <button type="button" className="nv-search-btn" onClick={() => submit()} aria-label={t("nvSearchLabel")}>
        {t("nvSearchLabel")}
      </button>

      {open && (
        <div className="nv-dropdown nv-search-panel">
          {!value && recent.length > 0 && (
            <>
              <div className="nv-dropdown-title">{t("nvRecent")}</div>
              {recent.map(item => (
                <button type="button" className="nv-suggest" key={item} onClick={() => { setQuery(item); submit(item); }}>
                  <i className="fa-solid fa-clock-rotate-left"></i>
                  <span>{item}</span>
                </button>
              ))}
            </>
          )}
          {value && items.length === 0 && <div className="nv-dropdown-empty">{t("nvSearchEmpty")}</div>}
          {items.length > 0 && (
            <>
              <div className="nv-dropdown-title">{t("nvSuggested")}</div>
              {items.map((product, index) => (
                <Link
                  to={`/product/${product.id}`}
                  key={product.id}
                  className={`nv-suggest${index === active ? " active" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  <img src={product.thumbnail} alt="" loading="lazy" />
                  <span className="nv-suggest-title">{tProduct(product)}</span>
                  <strong>{formatPrice(product.price)}</strong>
                </Link>
              ))}
              <button type="button" className="nv-suggest-all" onClick={() => submit()}>
                {t("nvShowAll")} <i className="fa-solid fa-arrow-right"></i>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MiniCart() {
  const { t, tProduct, formatPrice, cart, changeQuantity, removeFromCart } = useApp();
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onDown = event => {
      if (box.current && !box.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="nv-pop" ref={box}>
      <button type="button" className="nv-action" onClick={() => setOpen(value => !value)} aria-label={t("cart")} aria-expanded={open}>
        <i className="fa-solid fa-cart-shopping"></i>
        {count > 0 && <span className="nv-count">{count}</span>}
      </button>
      {open && (
        <div className="nv-dropdown nv-minicart">
          {cart.length === 0 ? (
            <div className="nv-dropdown-empty">
              <i className="fa-solid fa-cart-shopping"></i>
              <span>{t("nvCartEmpty")}</span>
            </div>
          ) : (
            <>
              <div className="nv-minicart-list">
                {cart.map(item => (
                  <div className="nv-minicart-item" key={item.id}>
                    <Link to={`/product/${item.id}`}>
                      <img src={item.thumbnail} alt="" />
                    </Link>
                    <div className="nv-minicart-info">
                      <Link to={`/product/${item.id}`} className="nv-minicart-title">{tProduct(item)}</Link>
                      <div className="nv-minicart-row">
                        <div className="nv-qty nv-qty-sm">
                          <button type="button" onClick={() => changeQuantity(item.id, -1)} aria-label="-">−</button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => changeQuantity(item.id, 1)} aria-label="+">+</button>
                        </div>
                        <strong>{formatPrice(item.price * item.quantity)}</strong>
                      </div>
                    </div>
                    <button type="button" className="nv-minicart-remove" onClick={() => removeFromCart(item.id)} aria-label={t("delete")}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                ))}
              </div>
              <div className="nv-minicart-total">
                <span>{t("nvMiniCartTotal")}</span>
                <strong>{formatPrice(total)}</strong>
              </div>
              <div className="nv-minicart-actions">
                <Link to="/cart" className="nv-btn nv-btn-ghost">{t("nvOpenCart")}</Link>
                <Link to="/checkout" className="nv-btn nv-btn-primary">{t("nvCheckout")}</Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { t, tCategory, user, favorites, theme, toggleTheme, isDarkTheme, language, setLanguage, cart } = useApp();
  const { pathname } = useLocation();
  const [categories, setCategories] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuBox = useRef(null);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onDown = event => {
      if (menuBox.current && !menuBox.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="header nv-header">
      <div className="container nv-header-row">
        <button type="button" className="nv-action nv-burger" onClick={() => setDrawerOpen(true)} aria-label={t("nvOpenMenu")}>
          <i className="fa-solid fa-bars"></i>
        </button>

        <Link to="/" className="logo nv-logo">NovaShop</Link>

        <div className="nv-pop nv-catalog-pop" ref={menuBox}>
          <button type="button" className={`nv-catalog-btn${menuOpen ? " active" : ""}`} onClick={() => setMenuOpen(value => !value)} aria-expanded={menuOpen}>
            <i className={menuOpen ? "fa-solid fa-xmark" : "fa-solid fa-table-cells-large"}></i>
            <span>{t("catalog")}</span>
          </button>
          {menuOpen && (
            <div className="nv-dropdown nv-mega">
              <Link to="/catalog" className="nv-mega-all">
                <i className="fa-solid fa-boxes-stacked"></i>
                <span>{t("nvAllCategories")}</span>
              </Link>
              <div className="nv-mega-grid">
                {categories.map(item => (
                  <Link to={`/catalog?category=${encodeURIComponent(item.slug)}`} className="nv-mega-item" key={item.slug}>
                    <i className={`fa-solid ${getCategoryIcon(item.slug)}`}></i>
                    <span>{tCategory(item)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <SearchBox />

        <div className="nv-actions">
          <button type="button" className="nv-action nv-hide-sm" onClick={toggleTheme} aria-label={t("theme")}>
            <i className={isDarkTheme(theme) ? "fa-solid fa-sun" : "fa-solid fa-moon"}></i>
          </button>
          <div className="nv-lang nv-hide-sm" title={t("language")}>
            <button type="button" className={language === "uk" ? "active" : ""} onClick={() => setLanguage("uk")}>UA</button>
            <button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>EN</button>
          </div>
          <Link to="/favorites" className="nv-action" aria-label={t("favoritesTitle")}>
            <i className="fa-regular fa-heart"></i>
            {favorites.length > 0 && <span className="nv-count">{favorites.length}</span>}
          </Link>
          <MiniCart />
          {user ? (
            <Link to="/profile" className="nv-action" title={t("profile")} aria-label={t("profile")}>
              <i className="fa-solid fa-user-check"></i>
            </Link>
          ) : (
            <Link to="/login" className="nv-action" title={t("loginAction")} aria-label={t("loginAction")}>
              <i className="fa-regular fa-user"></i>
            </Link>
          )}
          {user && user.role === "admin" && (
            <Link to="/admin" className="nv-action nv-hide-sm" title={t("adminPanel")} aria-label={t("adminPanel")}>
              <i className="fa-solid fa-user-gear"></i>
            </Link>
          )}
        </div>
      </div>

      <div className={`nv-drawer-backdrop${drawerOpen ? " active" : ""}`} onClick={() => setDrawerOpen(false)}></div>
      <aside className={`nv-drawer${drawerOpen ? " active" : ""}`} aria-hidden={!drawerOpen}>
        <div className="nv-drawer-head">
          <span className="logo">NovaShop</span>
          <button type="button" className="nv-action" onClick={() => setDrawerOpen(false)} aria-label={t("nvClose")}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="nv-drawer-links">
          <Link to="/cart"><i className="fa-solid fa-cart-shopping"></i> {t("cart")} {cartCount > 0 && <b>{cartCount}</b>}</Link>
          <Link to="/favorites"><i className="fa-regular fa-heart"></i> {t("favoritesTitle")} {favorites.length > 0 && <b>{favorites.length}</b>}</Link>
          {user ? (
            <Link to="/profile"><i className="fa-solid fa-user-check"></i> {t("profile")}</Link>
          ) : (
            <Link to="/login"><i className="fa-regular fa-user"></i> {t("loginAction")}</Link>
          )}
          {user && user.role === "admin" && (
            <Link to="/admin"><i className="fa-solid fa-user-gear"></i> {t("adminPanel")}</Link>
          )}
          <Link to="/settings"><i className="fa-solid fa-gear"></i> {t("settingsTitle")}</Link>
        </div>
        <div className="nv-drawer-tools">
          <button type="button" className="nv-btn nv-btn-ghost" onClick={toggleTheme}>
            <i className={isDarkTheme(theme) ? "fa-solid fa-sun" : "fa-solid fa-moon"}></i>
          </button>
          <div className="nv-lang">
            <button type="button" className={language === "uk" ? "active" : ""} onClick={() => setLanguage("uk")}>UA</button>
            <button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>EN</button>
          </div>
        </div>
        <div className="nv-dropdown-title">{t("categories")}</div>
        <div className="nv-drawer-cats">
          <Link to="/catalog"><i className="fa-solid fa-boxes-stacked"></i> {t("nvAllCategories")}</Link>
          {categories.map(item => (
            <Link to={`/catalog?category=${encodeURIComponent(item.slug)}`} key={item.slug}>
              <i className={`fa-solid ${getCategoryIcon(item.slug)}`}></i> {tCategory(item)}
            </Link>
          ))}
        </div>
      </aside>
    </header>
  );
}
