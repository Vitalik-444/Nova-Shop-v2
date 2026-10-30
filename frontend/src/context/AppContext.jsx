import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { I18N, DEFAULT_LANGUAGE } from "../i18n/translations";
import * as api from "../api";
import { getStorage, setStorage, removeStorage } from "../utils/storage";

const AppContext = createContext(null);

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
  const [user, setUserState] = useState(null);
  const [cart, setCartState] = useState([]);
  const [favorites, setFavoritesState] = useState([]);
  const [ready, setReady] = useState(false);
  const [splash, setSplash] = useState(true);
  const [busy, setBusy] = useState(0);
  const [toast, setToast] = useState({ message: "", type: "success", show: false });

  const userRef = useRef(null);
  const cartRef = useRef([]);
  const favoritesRef = useRef([]);
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

  const t = useCallback((key, params = {}) => {
    const dictionary = I18N[language] || I18N[DEFAULT_LANGUAGE];
    let value = dictionary[key] || I18N[DEFAULT_LANGUAGE][key] || key;
    Object.entries(params).forEach(([name, replacement]) => {
      value = value.replaceAll(`{${name}}`, replacement);
    });
    return value;
  }, [language]);

  const locale = language === "en" ? "en-US" : "uk-UA";

  const formatPrice = useCallback(price => new Intl.NumberFormat(locale).format(price), [locale]);

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
      const [serverFavorites, serverCart] = await Promise.all([
        api.fetchServerFavorites(),
        api.fetchServerCart()
      ]);
      setFavoritesLocal(serverFavorites ?? getStorage("favorites", []));
      setCartLocal(serverCart ?? getStorage("cart", []));
    } else {
      setFavoritesLocal(getStorage("favorites", []));
      setCartLocal(getStorage("cart", []));
    }
  }, [setCartLocal, setFavoritesLocal]);

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

  const [themeEffects, setThemeEffects] = useState(() => getStorage("themeEffects", true));
  const [blurPreviews, setBlurPreviews] = useState(() => getStorage("blurPreviews", false));

  useEffect(() => {
    let activeTheme = theme;
    if (theme === "system") {
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      activeTheme = prefersDark ? "dark" : "light";
    }
    const isLight = activeTheme === "light" || activeTheme === "sakura" || activeTheme === "lavender" || activeTheme === "desert" || activeTheme === "leaves";
    document.body.classList.toggle("dark", !isLight);
    document.body.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    setStorage("theme", theme);
  }, [theme]);

  useEffect(() => {
    setStorage("themeEffects", themeEffects);
  }, [themeEffects]);

  useEffect(() => {
    setStorage("blurPreviews", blurPreviews);
    document.body.classList.toggle("blur-previews", blurPreviews);
  }, [blurPreviews]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const toggleTheme = useCallback(() => {
    setTheme(current => (current === "dark" ? "light" : "dark"));
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

  const logout = useCallback(async () => {
    await api.logout();
    applyUser(null);
    setCartLocal([]);
    setFavoritesLocal([]);
    removeStorage("cart");
    removeStorage("favorites");
  }, [applyUser, setCartLocal, setFavoritesLocal]);

  const updateUser = useCallback(updated => {
    applyUser(updated);
  }, [applyUser]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    formatPrice,
    theme,
    setTheme,
    toggleTheme,
    themeEffects,
    setThemeEffects,
    blurPreviews,
    setBlurPreviews,
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
    login,
    register,
    logout
  }), [
    language, setLanguage, t, formatPrice, theme, setTheme, toggleTheme, themeEffects, blurPreviews, user, updateUser, ready, splash, busy,
    withLoader, toast, showToast, cart, addToCart, changeQuantity, removeFromCart, clearCart,
    favorites, isFavorite, toggleFavorite, login, register, logout
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
