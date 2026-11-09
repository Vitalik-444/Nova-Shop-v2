import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp, CURRENCY_RATES } from "../context/AppContext";
import { getCategories, getProductsCached } from "../api";
import { getStorage, setStorage } from "../utils/storage";
import { getCategoryIcon } from "../utils/categoryIcons";
import ProductCard from "../components/ProductCard";
import Skeletons from "../components/Skeleton";

const PAGE_SIZE = 12;
const MAX_PAGE_BUTTONS = 7;
const RATING_STEPS = [4.5, 4, 3];

const EMPTY_FILTERS = { min: "", max: "", rating: 0, seller: "", discount: false, stock: false };

export default function Catalog() {
  const { t, tProduct, tCategory, defaultSort, defaultCurrency } = useApp();
  const [params, setParams] = useSearchParams();
  const urlQuery = params.get("q") || "";
  const category = params.get("category") || "all";
  const brand = params.get("brand") || "";
  const urlSort = params.get("sort") || "";
  const urlDeals = params.get("deals") === "1";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, discount: urlDeals });
  const [sort, setSort] = useState(() => urlSort || defaultSort || "default");
  const [view, setView] = useState(() => getStorage("catalog_view", "grid"));
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const rate = (CURRENCY_RATES[defaultCurrency] || CURRENCY_RATES.USD).rate;
  const symbol = (CURRENCY_RATES[defaultCurrency] || CURRENCY_RATES.USD).symbol;

  useEffect(() => {
    getProductsCached().then(list => {
      setProducts(list);
      setLoading(false);
    });
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (urlSort) setSort(urlSort);
  }, [urlSort]);

  useEffect(() => {
    setFilters(current => ({ ...current, discount: urlDeals }));
  }, [urlDeals]);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
      const onKey = event => {
        if (event.key === "Escape") setDrawerOpen(false);
      };
      window.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", onKey);
      };
    }
    return undefined;
  }, [drawerOpen]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const changeFilter = (key, value) => setFilters(current => ({ ...current, [key]: value }));

  const changeView = value => {
    setView(value);
    setStorage("catalog_view", value);
  };

  const matchesSearch = product => {
    const value = urlQuery.trim().toLowerCase();
    if (!value) return true;
    const titleEn = (product.titleEn || product.title || "").toLowerCase();
    const titleUk = (product.titleUk || "").toLowerCase();
    const brandName = (product.brand || "").toLowerCase();
    return titleEn.includes(value) || titleUk.includes(value) || brandName.includes(value) || tProduct(product).toLowerCase().includes(value);
  };

  const searched = useMemo(() => products.filter(matchesSearch), [products, urlQuery, tProduct]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    searched.forEach(product => {
      counts[product.category] = (counts[product.category] || 0) + 1;
    });
    return counts;
  }, [searched]);

  const sellers = useMemo(() => [...new Set(searched.map(product => product.seller).filter(Boolean))].sort(), [searched]);

  const filtered = useMemo(() => {
    const min = filters.min === "" ? null : Number(filters.min);
    const max = filters.max === "" ? null : Number(filters.max);
    let list = searched.filter(product => {
      if (category !== "all" && product.category !== category) return false;
      if (brand && product.brand !== brand) return false;
      const converted = product.price * rate;
      if (min !== null && converted < min) return false;
      if (max !== null && converted > max) return false;
      if (filters.rating && (product.rating || 0) < filters.rating) return false;
      if (filters.seller && product.seller !== filters.seller) return false;
      if (filters.discount && !(product.discountPercentage > 0)) return false;
      if (filters.stock && !(product.stock > 0)) return false;
      return true;
    });

    list = [...list];
    switch (sort) {
      case "priceAsc":
      case "price_asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "priceDesc":
      case "price_desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "title":
        list.sort((a, b) => tProduct(a).localeCompare(tProduct(b)));
        break;
      case "popular":
        list.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
        break;
      case "newest":
        list.sort((a, b) => b.id - a.id);
        break;
      default:
        break;
    }
    return list;
  }, [searched, category, brand, filters, sort, rate, tProduct]);

  useEffect(() => {
    setPage(1);
  }, [urlQuery, category, brand, filters, sort]);

  const chips = [];
  if (urlQuery) chips.push({ key: "q", label: `"${urlQuery}"`, clear: () => setParam("q", "") });
  if (category !== "all") {
    const found = categories.find(item => item.slug === category);
    chips.push({ key: "category", label: tCategory(found || category), clear: () => setParam("category", "") });
  }
  if (brand) chips.push({ key: "brand", label: brand, clear: () => setParam("brand", "") });
  if (filters.min !== "" || filters.max !== "") {
    chips.push({
      key: "price",
      label: `${filters.min !== "" ? filters.min : "0"} – ${filters.max !== "" ? filters.max : "∞"} ${symbol}`,
      clear: () => setFilters(current => ({ ...current, min: "", max: "" }))
    });
  }
  if (filters.rating) chips.push({ key: "rating", label: `★ ${t("nvRatingFrom", { n: filters.rating })}`, clear: () => changeFilter("rating", 0) });
  if (filters.seller) chips.push({ key: "seller", label: filters.seller, clear: () => changeFilter("seller", "") });
  if (filters.discount) chips.push({ key: "discount", label: t("nvOnlyDiscount"), clear: () => { changeFilter("discount", false); setParam("deals", ""); } });
  if (filters.stock) chips.push({ key: "stock", label: t("nvOnlyStock"), clear: () => changeFilter("stock", false) });

  const resetAll = () => {
    setFilters(EMPTY_FILTERS);
    setParams(new URLSearchParams(), { replace: true });
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const shown = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  let startPage = Math.max(1, currentPage - Math.floor(MAX_PAGE_BUTTONS / 2));
  let endPage = startPage + MAX_PAGE_BUTTONS - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - MAX_PAGE_BUTTONS + 1);
  }
  const pageNumbers = [];
  for (let number = startPage; number <= endPage; number++) pageNumbers.push(number);

  const goToPage = number => {
    setPage(number);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filterPanel = (
    <>
      <div className="nv-filter-block">
        <h4>{t("categories")}</h4>
        <div className="nv-filter-cats">
          <button type="button" className={category === "all" ? "active" : ""} onClick={() => setParam("category", "")}>
            <span><i className="fa-solid fa-boxes-stacked"></i> {t("allProducts")}</span>
            <em>{searched.length}</em>
          </button>
          {categories.filter(item => categoryCounts[item.slug]).map(item => (
            <button type="button" key={item.slug} className={category === item.slug ? "active" : ""} onClick={() => setParam("category", item.slug)}>
              <span><i className={`fa-solid ${getCategoryIcon(item.slug)}`}></i> {tCategory(item)}</span>
              <em>{categoryCounts[item.slug]}</em>
            </button>
          ))}
        </div>
      </div>

      <div className="nv-filter-block">
        <h4>{t("nvPrice")}, {symbol}</h4>
        <div className="nv-price-inputs">
          <input type="number" min="0" inputMode="numeric" placeholder={t("nvFrom")} value={filters.min} onChange={event => changeFilter("min", event.target.value)} />
          <span>–</span>
          <input type="number" min="0" inputMode="numeric" placeholder={t("nvTo")} value={filters.max} onChange={event => changeFilter("max", event.target.value)} />
        </div>
      </div>

      <div className="nv-filter-block">
        <h4>{t("nvRating")}</h4>
        <div className="nv-rating-filter">
          <button type="button" className={!filters.rating ? "active" : ""} onClick={() => changeFilter("rating", 0)}>{t("nvAny")}</button>
          {RATING_STEPS.map(step => (
            <button type="button" key={step} className={filters.rating === step ? "active" : ""} onClick={() => changeFilter("rating", step)}>
              <i className="fa-solid fa-star"></i> {t("nvRatingFrom", { n: step })}
            </button>
          ))}
        </div>
      </div>

      {sellers.length > 1 && (
        <div className="nv-filter-block">
          <h4>{t("nvSeller")}</h4>
          <select className="nv-select" value={filters.seller} onChange={event => changeFilter("seller", event.target.value)}>
            <option value="">{t("nvAny")}</option>
            {sellers.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
      )}

      <div className="nv-filter-block">
        <label className="nv-check">
          <input type="checkbox" checked={filters.discount} onChange={event => changeFilter("discount", event.target.checked)} />
          <span>{t("nvOnlyDiscount")}</span>
        </label>
        <label className="nv-check">
          <input type="checkbox" checked={filters.stock} onChange={event => changeFilter("stock", event.target.checked)} />
          <span>{t("nvOnlyStock")}</span>
        </label>
      </div>

      {chips.length > 0 && (
        <button type="button" className="nv-btn nv-btn-ghost nv-btn-block" onClick={resetAll}>
          <i className="fa-solid fa-rotate-left"></i> {t("nvResetFilters")}
        </button>
      )}
    </>
  );

  return (
    <section className="nv-page">
      <div className="container">
        <h1 className="nv-page-title">{t("catalogTitle")}</h1>

        <div className="nv-toolbar">
          <button type="button" className="nv-btn nv-btn-ghost nv-filter-trigger" onClick={() => setDrawerOpen(true)}>
            <i className="fa-solid fa-sliders"></i> {t("nvFilters")}
            {chips.length > 0 && <span className="nv-count nv-count-inline">{chips.length}</span>}
          </button>
          <span className="nv-found">{t("nvFound", { n: filtered.length })}</span>
          <div className="nv-toolbar-right">
            <select
              className="nv-select"
              value={sort}
              onChange={event => setSort(event.target.value)}
              aria-label={t("sortDefault")}
            >
              <option value="default">{t("sortDefault")}</option>
              <option value="popular">{t("sortPopular")}</option>
              <option value="priceAsc">{t("sortPriceAsc")}</option>
              <option value="priceDesc">{t("sortPriceDesc")}</option>
              <option value="rating">{t("sortRating")}</option>
              <option value="title">{t("sortTitle")}</option>
              <option value="newest">{t("sortNewest")}</option>
            </select>
            <div className="nv-view-toggle">
              <button type="button" className={view === "grid" ? "active" : ""} onClick={() => changeView("grid")} aria-label={t("nvGrid")} title={t("nvGrid")}>
                <i className="fa-solid fa-table-cells-large"></i>
              </button>
              <button type="button" className={view === "list" ? "active" : ""} onClick={() => changeView("list")} aria-label={t("nvList")} title={t("nvList")}>
                <i className="fa-solid fa-list"></i>
              </button>
            </div>
          </div>
        </div>

        {chips.length > 0 && (
          <div className="nv-chips">
            {chips.map(chip => (
              <button type="button" className="nv-chip" key={chip.key} onClick={chip.clear}>
                {chip.label} <i className="fa-solid fa-xmark"></i>
              </button>
            ))}
            <button type="button" className="nv-chip-reset" onClick={resetAll}>{t("nvResetFilters")}</button>
          </div>
        )}

        <div className="nv-catalog">
          <div className={`nv-drawer-backdrop${drawerOpen ? " active" : ""}`} onClick={() => setDrawerOpen(false)}></div>
          <aside className={`nv-filters${drawerOpen ? " active" : ""}`}>
            <div className="nv-filters-head">
              <h3>{t("nvFilters")}</h3>
              <button type="button" className="nv-action" onClick={() => setDrawerOpen(false)} aria-label={t("nvClose")}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            {filterPanel}
            <button type="button" className="nv-btn nv-btn-primary nv-btn-block nv-filters-apply" onClick={() => setDrawerOpen(false)}>
              {t("nvFound", { n: filtered.length })}
            </button>
          </aside>

          <div className="nv-catalog-main">
            {loading ? (
              <Skeletons count={PAGE_SIZE} layout={view} />
            ) : filtered.length === 0 ? (
              <div className="nv-empty">
                <i className="fa-regular fa-face-frown"></i>
                <h3>{t("nvNothing")}</h3>
                <p>{t("nvNothingHint")}</p>
                <button type="button" className="nv-btn nv-btn-primary" onClick={resetAll}>{t("nvResetFilters")}</button>
              </div>
            ) : (
              <>
                <div className={view === "list" ? "nv-list" : "nv-grid nv-grid-catalog"}>
                  {shown.map(product => (
                    <ProductCard key={product.id} product={product} layout={view} />
                  ))}
                </div>
                <div className="catalog-pagination">
                  <button className="btn" disabled={currentPage === 1} onClick={() => goToPage(Math.max(1, currentPage - 1))}>
                    {t("back")}
                  </button>
                  {pageNumbers.map(number => (
                    <button
                      key={number}
                      className={`btn${number === currentPage ? " active" : ""}`}
                      onClick={() => goToPage(number)}
                    >
                      {number}
                    </button>
                  ))}
                  <button className="btn" disabled={currentPage === totalPages} onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}>
                    {t("next")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
