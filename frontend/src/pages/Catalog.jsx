import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { getCategories, getProducts } from "../api";
import ProductCard from "../components/ProductCard";

const PAGE_SIZE = 12;
const MAX_PAGE_BUTTONS = 7;

export default function Catalog() {
  const { t } = useApp();
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState(urlQuery);
  const [sort, setSort] = useState("default");
  const [page, setPage] = useState(1);

  useEffect(() => {
    getProducts(200).then(setProducts);
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setSearch(urlQuery);
    setPage(1);
  }, [urlQuery]);

  const filtered = useMemo(() => {
    let list = [...products];

    if (category !== "all") {
      list = list.filter(product => product.category === category);
    }

    const value = search.trim().toLowerCase();
    if (value) {
      list = list.filter(product => product.title.toLowerCase().includes(value));
    }

    switch (sort) {
      case "priceAsc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "priceDesc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "title":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    return list;
  }, [products, category, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  let startPage = Math.max(1, currentPage - Math.floor(MAX_PAGE_BUTTONS / 2));
  let endPage = startPage + MAX_PAGE_BUTTONS - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - MAX_PAGE_BUTTONS + 1);
  }
  const pageNumbers = [];
  for (let number = startPage; number <= endPage; number++) pageNumbers.push(number);

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">{t("catalogTitle")}</h1>

        <div className="catalog-top">
          <input
            type="text"
            className="catalog-search"
            placeholder={t("searchProducts")}
            value={search}
            onChange={event => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          <select
            className="catalog-sort"
            value={sort}
            onChange={event => {
              setSort(event.target.value);
              setPage(1);
            }}
          >
            <option value="default">{t("sortDefault")}</option>
            <option value="priceAsc">{t("sortPriceAsc")}</option>
            <option value="priceDesc">{t("sortPriceDesc")}</option>
            <option value="rating">{t("sortRating")}</option>
            <option value="title">{t("sortTitle")}</option>
          </select>
        </div>

        <div className="catalog-layout">
          <aside className="catalog-sidebar">
            <h3>{t("categories")}</h3>
            <div className="categories-list">
              <div
                className={`category-filter${category === "all" ? " active" : ""}`}
                onClick={() => {
                  setCategory("all");
                  setPage(1);
                }}
              >
                {t("allProducts")}
              </div>
              {categories.map(item => (
                <div
                  key={item.slug}
                  className={`category-filter${category === item.slug ? " active" : ""}`}
                  onClick={() => {
                    setCategory(item.slug);
                    setPage(1);
                  }}
                >
                  {item.name}
                </div>
              ))}
            </div>
          </aside>

          <section className="catalog-content">
            <div className="products-grid catalog-products">
              {pageItems.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div
              className="catalog-pagination"
              style={{ marginTop: "24px", display: "flex", gap: "8px", alignItems: "center" }}
            >
              <button
                className="btn"
                disabled={currentPage === 1}
                onClick={() => setPage(Math.max(1, currentPage - 1))}
              >
                {t("back")}
              </button>
              {pageNumbers.map(number => (
                <button
                  key={number}
                  className="btn"
                  style={number === currentPage ? { background: "var(--green)", color: "#fff" } : undefined}
                  onClick={() => setPage(number)}
                >
                  {number}
                </button>
              ))}
              <button
                className="btn"
                disabled={currentPage === totalPages}
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              >
                {t("next")}
              </button>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
