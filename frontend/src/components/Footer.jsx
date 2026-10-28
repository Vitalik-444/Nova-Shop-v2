import { useApp } from "../context/AppContext";
import { preventDefault } from "../utils/format";

function FooterLink({ children }) {
  return <a href="/" onClick={preventDefault}>{children}</a>;
}

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
              <FooterLink>{t("delivery")}</FooterLink>
              <FooterLink>{t("payment")}</FooterLink>
              <FooterLink>{t("warranty")}</FooterLink>
            </div>
          </div>

          <div>
            <h3 className="footer-title">{t("company")}</h3>
            <div className="footer-links">
              <FooterLink>{t("aboutUs")}</FooterLink>
              <FooterLink>{t("contacts")}</FooterLink>
              <FooterLink>{t("news")}</FooterLink>
            </div>
          </div>

          <div>
            <h3 className="footer-title">{t("contacts")}</h3>
            <div className="footer-links">
              <FooterLink>+380 XX XXX XX XX</FooterLink>
              <FooterLink>info@novashop.ua</FooterLink>
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
