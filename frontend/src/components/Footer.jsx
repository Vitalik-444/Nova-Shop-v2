import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Footer() {
  const { t } = useApp();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">NovaShop</div>
            <p>{t("footerText")}</p>
          </div>

          <div>
            <h3 className="footer-title">{t("buyers")}</h3>
            <div className="footer-links">
              <Link to="/delivery">{t("delivery")}</Link>
              <Link to="/payment">{t("payment")}</Link>
              <Link to="/warranty">{t("warranty")}</Link>
            </div>
          </div>

          <div>
            <h3 className="footer-title">{t("company")}</h3>
            <div className="footer-links">
              <Link to="/about">{t("aboutUs")}</Link>
              <Link to="/contacts">{t("contacts")}</Link>
              <Link to="/news">{t("news")}</Link>
            </div>
          </div>

          <div>
            <h3 className="footer-title">{t("contacts")}</h3>
            <div className="footer-links">
              <a href="tel:+380637417980">+380 63 741 79 80</a>
              <a href="mailto:nova444shop@gmail.com">nova444shop@gmail.com</a>
              <Link to="/assistant">{t("aiFooterLink")}</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 NovaShop</p>
          <p>{t("allRights")}</p>
        </div>
      </div>
    </footer>
  );
}
