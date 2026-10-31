import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { I18N, DEFAULT_LANGUAGE } from "../i18n/translations";
import { getProductTitle, getCategoryTitle, PRODUCT_TRANSLATIONS_UK, CATEGORY_TRANSLATIONS_UK, CATEGORY_TRANSLATIONS_EN } from "../i18n/productTranslations";
import * as api from "../api";
import { getStorage, setStorage, removeStorage } from "../utils/storage";

export const CURRENCY_RATES = {
  USD: { symbol: "$", rate: 1 },
  UAH: { symbol: "₴", rate: 41.5 },
  EUR: { symbol: "€", rate: 0.92 }
};

const AppContext = createContext(null);

export const THEME_FAMILIES = [
  "default", "system", "midnight", "forest", "crimson",
  "violet", "rose", "amoled", "sakura", "autumn", "halloween",
  "newyear", "snow", "desert", "love", "leaves", "ocean",
  "gold", "cyber", "lavender"
];

export const THEMES = [
  "default", "system", "midnight", "forest", "crimson",
  "violet", "rose", "amoled", "sakura", "autumn", "halloween",
  "newyear", "snow", "desert", "love", "leaves", "ocean",
  "gold", "cyber", "lavender", "dark", "light"
];

export const THEME_COLORS = {
  // Dark variants
  default: { bg: "#121212", accent: "#00A046" },
  dark: { bg: "#121212", accent: "#00A046" },
  midnight: { bg: "#060a14", accent: "#3b82f6" },
  forest: { bg: "#060d09", accent: "#22c55e" },
  crimson: { bg: "#0a0506", accent: "#ef233c" },
  violet: { bg: "#09060f", accent: "#a855f7" },
  rose: { bg: "#0d0609", accent: "#ff4d8d" },
  amoled: { bg: "#000000", accent: "#f5f5f5" },
  "sakura-dark": { bg: "#14080d", accent: "#f472b6" },
  autumn: { bg: "#140b06", accent: "#e8832a" },
  halloween: { bg: "#0b0614", accent: "#ff7a00" },
  newyear: { bg: "#1a0509", accent: "#ff2d4f" },
  snow: { bg: "#08111f", accent: "#7dd3fc" },
  "desert-dark": { bg: "#160f09", accent: "#f97316" },
  love: { bg: "#1b0716", accent: "#ff3d74" },
  "leaves-dark": { bg: "#091208", accent: "#4ade80" },
  ocean: { bg: "#041018", accent: "#06b6d4" },
  gold: { bg: "#0c0905", accent: "#d4a73a" },
  cyber: { bg: "#08060f", accent: "#00e5ff" },
  "lavender-dark": { bg: "#0e0a19", accent: "#a78bfa" },

  // Light variants
  "default-light": { bg: "#f5f5f5", accent: "#00A046" },
  light: { bg: "#f5f5f5", accent: "#00A046" },
  "midnight-light": { bg: "#f0f4fc", accent: "#2563eb" },
  "forest-light": { bg: "#f0f9f3", accent: "#16a34a" },
  "crimson-light": { bg: "#fcf1f2", accent: "#dc2626" },
  "violet-light": { bg: "#f7f2fd", accent: "#9333ea" },
  "rose-light": { bg: "#fdf2f6", accent: "#e11d48" },
  "amoled-light": { bg: "#ffffff", accent: "#111111" },
  sakura: { bg: "#fdf0f3", accent: "#e8527f" },
  "autumn-light": { bg: "#faf3eb", accent: "#d97706" },
  "halloween-light": { bg: "#fbf5ff", accent: "#ea580c" },
  "newyear-light": { bg: "#fff5f6", accent: "#e11d48" },
  "snow-light": { bg: "#f0f8ff", accent: "#0284c7" },
  desert: { bg: "#f6e9d0", accent: "#c8571e" },
  "love-light": { bg: "#fef2f6", accent: "#e11d48" },
  leaves: { bg: "#eef6e6", accent: "#3f9a2b" },
  "ocean-light": { bg: "#f0fafd", accent: "#0891b2" },
  "gold-light": { bg: "#fbf8ee", accent: "#ca8a04" },
  "cyber-light": { bg: "#f3f6ff", accent: "#0284c7" },
  lavender: { bg: "#f4f1fb", accent: "#7c5cdb" },
};

export function isDarkTheme(th) {
  if (th === "system") {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  if (th === "light" || th === "sakura" || th === "desert" || th === "leaves" || th === "lavender") {
    return false;
  }
  if (th.endsWith("-light")) {
    return false;
  }
  return true;
}

export function getThemeFamily(th) {
  if (!th || th === "system") return "system";
  if (th === "light" || th === "dark" || th === "default") return "default";
  return th.replace(/-light$|-dark$/, "");
}

export function getThemeVariant(family, wantDark) {
  if (family === "system") return "system";
  if (family === "default") return wantDark ? "dark" : "light";
  if (family === "sakura") return wantDark ? "sakura-dark" : "sakura";
  if (family === "desert") return wantDark ? "desert-dark" : "desert";
  if (family === "leaves") return wantDark ? "leaves-dark" : "leaves";
  if (family === "lavender") return wantDark ? "lavender-dark" : "lavender";
  return wantDark ? family : `${family}-light`;
}

export function useApp() {
  return useContext(AppContext);
}

function readLanguage() {
  const stored = localStorage.getItem("language");
  return I18N[stored] ? stored : DEFAULT_LANGUAGE;
}

export function AppProvider({ children }) {
  const [language, setLanguageState] = useState(readLanguage);
  const [theme, setTheme] = useState(() => getStorage("theme", "light") || "light");
  const [themeEffects, setThemeEffects] = useState(() => getStorage("themeEffects", true));
  const [blurPreviews, setBlurPreviews] = useState(() => getStorage("blurPreviews", false));
  const [scrollTopButton, setScrollTopButton] = useState(() => getStorage("scrollTopButton", true));
  const [defaultCurrency, setDefaultCurrency] = useState(() => getStorage("defaultCurrency", "USD"));
  const [defaultSort, setDefaultSort] = useState(() => getStorage("defaultSort", "default"));
  const [user, setUserState] = useState(null);
  const [cart, setCartState] = useState([]);
  const [favorites, setFavoritesState] = useState([]);
  const [viewedProducts, setViewedProductsState] = useState(() => getStorage("viewed_products", []));
  const [ready, setReady] = useState(false);
  const [splash, setSplash] = useState(true);
  const [busy, setBusy] = useState(0);
  const [toast, setToast] = useState({ message: "", type: "success", show: false });

  const userRef = useRef(null);
  const cartRef = useRef([]);
  const favoritesRef = useRef([]);
  const viewedRef = useRef(getStorage("viewed_products", []));
  const toastTimer = useRef(null);

  const applyUser = useCallback(value => {
    userRef.current = value;
    setUserState(value);
  }, []);

  const setCartLocal = useCallback(list => {
    cartRef.current = list;
    setCartState(list);
  }, []);

  const setFavoritesLocal = useCallback(list => {
    favoritesRef.current = list;
    setFavoritesState(list);
  }, []);

  const setViewedProductsLocal = useCallback(list => {
    viewedRef.current = list;
    setViewedProductsState(list);
    setStorage("viewed_products", list);
  }, []);

  const t = useCallback((key, params = {}) => {
    const dictionary = I18N[language] || I18N[DEFAULT_LANGUAGE];
    let value = dictionary[key] || I18N[DEFAULT_LANGUAGE][key] || key;
    Object.entries(params).forEach(([name, replacement]) => {
      value = value.replaceAll(`{${name}}`, replacement);
    });
    return value;
  }, [language]);

  const tProduct = useCallback((productOrTitle) => {
    return getProductTitle(productOrTitle, language);
  }, [language]);

  const tCategory = useCallback((categoryOrSlug) => {
    return getCategoryTitle(categoryOrSlug, language);
  }, [language]);

  const locale = language === "en" ? "en-US" : "uk-UA";

  const formatPrice = useCallback((amount) => {
    const num = Number(amount) || 0;
    const cfg = CURRENCY_RATES[defaultCurrency] || CURRENCY_RATES.USD;
    const converted = num * cfg.rate;
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: Number.isInteger(converted) ? 0 : 2,
      maximumFractionDigits: 2
    }).format(converted);
    return `${formatted} ${cfg.symbol}`;
  }, [defaultCurrency, locale]);

  const showToast = useCallback((message, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ message, type, show: true });
    toastTimer.current = setTimeout(() => {
      setToast(current => ({ ...current, show: false }));
    }, 3000);
  }, []);

  const withLoader = useCallback(async task => {
    setBusy(count => count + 1);
    try {
      return await task();
    } finally {
      setBusy(count => Math.max(0, count - 1));
    }
  }, []);

  const loadUserData = useCallback(async currentUser => {
    if (currentUser) {
      const [serverFavorites, serverCart, serverViewed] = await Promise.all([
        api.fetchServerFavorites(),
        api.fetchServerCart(),
        api.fetchServerViewed()
      ]);
      setFavoritesLocal(serverFavorites ?? getStorage("favorites", []));
      setCartLocal(serverCart ?? getStorage("cart", []));
      if (serverViewed && serverViewed.length) {
        setViewedProductsLocal(serverViewed);
      } else {
        const local = getStorage("viewed_products", []);
        if (local && local.length) {
          api.syncViewed(local);
        }
        setViewedProductsLocal(local || []);
      }
    } else {
      setFavoritesLocal(getStorage("favorites", []));
      setCartLocal(getStorage("cart", []));
      setViewedProductsLocal(getStorage("viewed_products", []));
    }
  }, [setCartLocal, setFavoritesLocal, setViewedProductsLocal]);

  useEffect(() => {
    let active = true;
    let timer;
    (async () => {
      const me = await api.fetchMe();
      if (!active) return;
      applyUser(me);
      await loadUserData(me);
      if (!active) return;
      setReady(true);
      timer = setTimeout(() => setSplash(false), 500);
    })();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [applyUser, loadUserData]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const apply = () => {
      let resolved = theme;
      if (theme === "system") {
        resolved = media.matches ? "light" : "dark";
      }
      document.documentElement.dataset.theme = resolved;
      document.body.setAttribute("data-theme", resolved);
      const isDark = isDarkTheme(resolved);
      document.body.classList.toggle("dark", isDark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[resolved]?.bg || "#121212");
      document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", isDark ? "dark" : "light");
    };
    apply();
    setStorage("theme", theme);
    if (theme !== "system") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.effects = themeEffects ? "on" : "off";
    setStorage("themeEffects", themeEffects);
  }, [themeEffects]);

  useEffect(() => {
    setStorage("blurPreviews", blurPreviews);
    document.body.classList.toggle("blur-thumbs", blurPreviews);
    document.documentElement.classList.toggle("blur-thumbs", blurPreviews);
  }, [blurPreviews]);

  useEffect(() => {
    setStorage("scrollTopButton", scrollTopButton);
  }, [scrollTopButton]);

  useEffect(() => {
    setStorage("defaultCurrency", defaultCurrency);
  }, [defaultCurrency]);

  useEffect(() => {
    setStorage("defaultSort", defaultSort);
  }, [defaultSort]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const toggleTheme = useCallback(() => {
    setTheme(current => {
      if (current === "system") {
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        return prefersDark ? "light" : "dark";
      }
      const currentlyDark = isDarkTheme(current);
      const family = getThemeFamily(current);
      return getThemeVariant(family, !currentlyDark);
    });
  }, []);

  const resetSettings = useCallback(() => {
    setLanguage("uk");
    setTheme("light");
    setThemeEffects(true);
    setBlurPreviews(false);
    setScrollTopButton(true);
    setDefaultCurrency("USD");
    setDefaultSort("default");
  }, [setLanguage]);

  const clearSearchHistory = useCallback(() => {
    removeStorage("recent_searches");
    removeStorage("search_history");
  }, []);

  const clearAppCache = useCallback(() => {
    const keysToKeep = [
      "theme", "themeEffects", "blurPreviews", "scrollTopButton",
      "defaultCurrency", "defaultSort", "language", "token"
    ];
    Object.keys(localStorage).forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  const setLanguage = useCallback(value => {
    if (!I18N[value]) return;
    localStorage.setItem("language", value);
    setLanguageState(value);
  }, []);

  const persistCart = useCallback(next => {
    setCartLocal(next);
    if (userRef.current) {
      api.syncCart(next);
    } else {
      setStorage("cart", next);
    }
  }, [setCartLocal]);

  const persistFavorites = useCallback(next => {
    setFavoritesLocal(next);
    if (userRef.current) {
      api.syncFavorites(next);
    } else {
      setStorage("favorites", next);
    }
  }, [setFavoritesLocal]);

  const addToCart = useCallback(async (id, quantity = 1) => {
    const product = await api.getProduct(id);
    if (!product) return;
    const current = cartRef.current;
    const exists = current.some(item => item.id === product.id);
    const next = exists
      ? current.map(item => (item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item))
      : [...current, { ...product, quantity }];
    persistCart(next);
    showToast(t("productAdded"));
  }, [persistCart, showToast, t]);

  const changeQuantity = useCallback((id, delta) => {
    const next = cartRef.current.map(item => {
      if (item.id !== id) return item;
      const quantity = item.quantity + delta;
      return { ...item, quantity: quantity <= 0 ? 1 : quantity };
    });
    persistCart(next);
  }, [persistCart]);

  const removeFromCart = useCallback(id => {
    persistCart(cartRef.current.filter(item => item.id !== id));
    showToast(t("productRemoved"));
  }, [persistCart, showToast, t]);

  const clearCart = useCallback(() => {
    persistCart([]);
  }, [persistCart]);

  const isFavorite = useCallback(
    id => favorites.some(item => Number(item.id) === Number(id)),
    [favorites]
  );

  const toggleFavorite = useCallback(async id => {
    const numericId = Number(id);
    const product = await api.getProduct(numericId);
    if (!product) return;
    const current = favoritesRef.current;
    const exists = current.some(item => Number(item.id) === numericId);
    if (exists) {
      persistFavorites(current.filter(item => Number(item.id) !== numericId));
      showToast(t("removedFavorite"));
    } else {
      persistFavorites([...current, product]);
      showToast(t("addedFavorite"));
    }
  }, [persistFavorites, showToast, t]);

  const clearFavorites = useCallback(() => {
    persistFavorites([]);
  }, [persistFavorites]);

  const login = useCallback(async (email, password) => {
    const result = await api.login(email, password);
    if (result.success) {
      applyUser(result.user);
      await loadUserData(result.user);
    }
    return result;
  }, [applyUser, loadUserData]);

  const register = useCallback(async (name, email, password) => {
    const result = await api.register(name, email, password);
    if (result.success) {
      applyUser(result.user);
      await loadUserData(result.user);
    }
    return result;
  }, [applyUser, loadUserData]);

  const addViewedProduct = useCallback(product => {
    if (!product || !product.id) return;
    const current = viewedRef.current || [];
    const filtered = current.filter(p => Number(p.id) !== Number(product.id));
    const updated = [{ ...product, viewedAt: new Date().toISOString() }, ...filtered].slice(0, 50);
    setViewedProductsLocal(updated);

    if (userRef.current) {
      api.recordServerViewed(product.id);
    }
  }, [setViewedProductsLocal]);

  const clearViewedProducts = useCallback(async () => {
    setViewedProductsLocal([]);
    if (userRef.current) {
      await api.clearServerViewed();
    }
  }, [setViewedProductsLocal]);

  const logout = useCallback(async () => {
    await api.logout();
    applyUser(null);
    setCartLocal([]);
    setFavoritesLocal([]);
    setViewedProductsLocal([]);
    removeStorage("cart");
    removeStorage("favorites");
    removeStorage("viewed_products");
  }, [applyUser, setCartLocal, setFavoritesLocal, setViewedProductsLocal]);

  const updateUser = useCallback(updated => {
    applyUser(updated);
  }, [applyUser]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    tProduct,
    tCategory,
    formatPrice,
    theme,
    setTheme,
    toggleTheme,
    isDarkTheme,
    getThemeFamily,
    getThemeVariant,
    themeEffects,
    setThemeEffects,
    blurPreviews,
    setBlurPreviews,
    scrollTopButton,
    setScrollTopButton,
    defaultCurrency,
    setDefaultCurrency,
    defaultSort,
    setDefaultSort,
    resetSettings,
    clearSearchHistory,
    clearAppCache,
    user,
    updateUser,
    ready,
    loaderVisible: splash || busy > 0,
    withLoader,
    toast,
    showToast,
    cart,
    addToCart,
    changeQuantity,
    removeFromCart,
    clearCart,
    favorites,
    isFavorite,
    toggleFavorite,
    clearFavorites,
    viewedProducts,
    addViewedProduct,
    clearViewedProducts,
    login,
    register,
    logout
  }), [
    language, setLanguage, t, tProduct, tCategory, formatPrice, theme, setTheme, toggleTheme, themeEffects, blurPreviews,
    scrollTopButton, defaultCurrency, defaultSort, resetSettings, clearSearchHistory, clearAppCache,
    user, updateUser, ready, splash, busy,
    withLoader, toast, showToast, cart, addToCart, changeQuantity, removeFromCart, clearCart,
    favorites, isFavorite, toggleFavorite, clearFavorites, viewedProducts, addViewedProduct, clearViewedProducts,
    login, register, logout
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
