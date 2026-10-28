import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Header from "./Header";
import Footer from "./Footer";
import Toast from "./Toast";
import Loader from "./Loader";
import ScrollTop from "./ScrollTop";

const TITLE_KEYS = {
  "/": "pageHome",
  "/catalog": "pageCatalog",
  "/cart": "pageCart",
  "/checkout": "pageCheckout",
  "/favorites": "pageFavorites",
  "/login": "pageLogin",
  "/register": "pageRegister",
  "/profile": "pageProfile",
  "/orders": "pageOrders",
  "/admin": "pageAdmin"
};

export default function Layout() {
  const { t } = useApp();
  const { pathname } = useLocation();
  const titleKey = pathname.startsWith("/product/") ? "pageProduct" : TITLE_KEYS[pathname];

  useEffect(() => {
    if (titleKey) document.title = t(titleKey);
  }, [titleKey, t]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <Toast />
      <Loader />
      <ScrollTop />
    </>
  );
}
