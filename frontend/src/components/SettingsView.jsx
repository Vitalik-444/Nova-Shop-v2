import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  useApp,
  THEME_FAMILIES,
  THEME_COLORS,
  isDarkTheme,
  getThemeFamily,
  getThemeVariant
} from "../context/AppContext";
import { updateProfile, updateSettings, changePassword, sendTestEmail } from "../api";

function swatchStyle(family, wantDark) {
  if (family === "system") {
    return {
      "--sw-bg": `linear-gradient(135deg, ${THEME_COLORS.light.bg} 50%, ${THEME_COLORS.dark.bg} 50%)`,
      "--sw-accent": THEME_COLORS.dark.accent
    };
  }
  const variant = getThemeVariant(family, wantDark);
  const colors = THEME_COLORS[variant] || THEME_COLORS[family] || THEME_COLORS.dark;
  return {
    "--sw-bg": colors.bg,
    "--sw-accent": colors.accent
  };
}

function SwitchRow({ title, hint, checked, onChange }) {
  return (
    <div className="settings-row">
      <div className="settings-text">
        <strong>{title}</strong>
        <span>{hint}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        className={checked ? "switch is-on" : "switch"}
        onClick={() => onChange(!checked)}
      >
        <span className="switch-knob" />
      </button>
    </div>
  );
}

export default function SettingsView() {
  const {
    t,
    user,
    updateUser,
    language,
    setLanguage,
    theme,
    setTheme,
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
    clearCart,
    showToast
  } = useApp();

  const [doneAction, setDoneAction] = useState("");

  const triggerDone = (id, fn) => {
    fn();
    setDoneAction(id);
    setTimeout(() => {
      setDoneAction(curr => (curr === id ? "" : curr));
    }, 2200);
  };

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    avatarUrl: "",
    city: "",
    address: ""
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Security Form state
  const [securityForm, setSecurityForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [securitySaving, setSecuritySaving] = useState(false);

  // Preferences Form state
  const [preferencesForm, setPreferencesForm] = useState({
    currency: defaultCurrency || "USD",
    notifications_order: true,
    notifications_promo: false
  });
  const [prefSaving, setPrefSaving] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        phone: user.phone || "",
        avatarUrl: user.avatarUrl || "",
        city: user.city || "",
        address: user.address || ""
      });

      const s = user.settings || {};
      setPreferencesForm({
        currency: s.currency || defaultCurrency || "USD",
        notifications_order: s.notifications_order !== false,
        notifications_promo: !!s.notifications_promo
      });
    }
  }, [user, defaultCurrency]);

  const handleProfileSubmit = async event => {
    event.preventDefault();
    if (!profileForm.name.trim()) {
      showToast(t("fillRequiredFields"), "error");
      return;
    }

    setProfileSaving(true);
    const result = await updateProfile(profileForm);
    setProfileSaving(false);

    if (result && result.success) {
      updateUser(result.user);
      showToast(t("profileUpdatedSuccess"));
    } else {
      showToast(result && result.message ? result.message : "Помилка оновлення", "error");
    }
  };

  const handleSecuritySubmit = async event => {
    event.preventDefault();
    if (!securityForm.oldPassword || !securityForm.newPassword) {
      showToast(t("fillAllFields"), "error");
      return;
    }
    if (securityForm.newPassword.length < 6) {
      showToast(t("minPassword"), "error");
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      showToast(t("passwordsMismatch"), "error");
      return;
    }

    setSecuritySaving(true);
    const result = await changePassword(securityForm.oldPassword, securityForm.newPassword);
    setSecuritySaving(false);

    if (result && result.success) {
      showToast(t("passwordChangedSuccess"));
      setSecurityForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      showToast(result && result.message ? result.message : "Помилка зміни пароля", "error");
    }
  };

  const handleNotificationsSubmit = async event => {
    event.preventDefault();
    setPrefSaving(true);
    const result = await updateSettings({
      notifications_order: preferencesForm.notifications_order,
      notifications_promo: preferencesForm.notifications_promo,
      currency: defaultCurrency
    });
    setPrefSaving(false);

    if (result && result.success) {
      updateUser(result.user);
      showToast(t("settingsSavedSuccess"));
    } else {
      showToast(result && result.message ? result.message : "Помилка збереження", "error");
    }
  };

  const handleTestEmail = async () => {
    setEmailTesting(true);
    const result = await sendTestEmail();
    setEmailTesting(false);

    if (result && result.success) {
      showToast(result.message || "Лист надіслано");
    } else {
      showToast(result && result.message ? result.message : "Помилка відправки листа", "error");
    }
  };

  return (
    <div className="settings-page">
      <div className="section-heading">
        <p className="eyebrow">{t("settingsEyebrow")}</p>
        <h2>{t("settingsTitle")}</h2>
        <p className="section-subtitle">{t("settingsSub")}</p>
      </div>

      <div className="settings-grid">
        {/* Мова / Language */}
        <div className="settings-card">
          <h3>
            <i className="fa-solid fa-language"></i> {t("settingsLanguage")}
          </h3>
          <div className="settings-row column">
            <div className="settings-text">
              <span>{t("settingsLanguageHint")}</span>
            </div>
            <div className="segmented" role="radiogroup" aria-label={t("settingsLanguage")}>
              <button
                type="button"
                role="radio"
                aria-checked={language === "uk"}
                className={`segment ${language === "uk" ? "active" : ""}`}
                onClick={() => setLanguage("uk")}
              >
                {language === "uk" && <i className="fa-solid fa-check"></i>} 🇺🇦 Українська
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={language === "en"}
                className={`segment ${language === "en" ? "active" : ""}`}
                onClick={() => setLanguage("en")}
              >
                {language === "en" && <i className="fa-solid fa-check"></i>} 🇬🇧 English
              </button>
            </div>
          </div>
        </div>

        {/* Оформлення / Appearance */}
        <div className="settings-card">
          <h3>
            <i className="fa-solid fa-palette"></i> {t("settingsAppearance")}
          </h3>

          <div className="settings-row">
            <div className="settings-text">
              <strong>{t("settingsThemeMode")}</strong>
              <span>{t("settingsThemeModeHint")}</span>
            </div>
            <div className="segmented-control" role="group" aria-label={t("settingsThemeMode")}>
              <button
                type="button"
                className={`segment ${!isDarkTheme(theme) ? "active" : ""}`}
                onClick={() => {
                  const fam = getThemeFamily(theme);
                  setTheme(getThemeVariant(fam, false));
                }}
              >
                <i className="fa-solid fa-sun"></i> {t("themeLightMode")}
              </button>
              <button
                type="button"
                className={`segment ${isDarkTheme(theme) ? "active" : ""}`}
                onClick={() => {
                  const fam = getThemeFamily(theme);
                  setTheme(getThemeVariant(fam, true));
                }}
              >
                <i className="fa-solid fa-moon"></i> {t("themeDarkMode")}
              </button>
            </div>
          </div>

          <div className="settings-row column">
            <div className="settings-text">
              <strong>{t("settingsTheme")}</strong>
              <span>{t("settingsThemeHint")}</span>
            </div>
            <div className="theme-grid" role="radiogroup" aria-label={t("settingsTheme")}>
              {THEME_FAMILIES.map(family => {
                const isDark = isDarkTheme(theme);
                const isActive = getThemeFamily(theme) === family;
                const themeName = t(`theme.${family}`) || family;
                return (
                  <button
                    key={family}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    className={`theme-option ${isActive ? "active" : ""}`}
                    onClick={() => {
                      if (family === "system") {
                        setTheme("system");
                      } else {
                        setTheme(getThemeVariant(family, isDark));
                      }
                    }}
                    title={themeName}
                  >
                    <span className="theme-swatch" style={swatchStyle(family, isDark)}>
                      <span className="swatch-stripe" />
                      {isActive && (
                        <svg
                          className="swatch-check"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span className="theme-name">{themeName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <SwitchRow
            title={t("settingsEffects")}
            hint={t("settingsEffectsHint")}
            checked={themeEffects}
            onChange={setThemeEffects}
          />

          <SwitchRow
            title={t("settingsBlur")}
            hint={t("settingsBlurHint")}
            checked={blurPreviews}
            onChange={setBlurPreviews}
          />

          <SwitchRow
            title={t("settingsScrollTop")}
            hint={t("settingsScrollTopHint")}
            checked={scrollTopButton}
            onChange={setScrollTopButton}
          />
        </div>

        {/* Магазин та перегляд / Browsing */}
        <div className="settings-card">
          <h3>
            <i className="fa-solid fa-sliders"></i> {t("settingsBrowsing")}
          </h3>
          <div className="settings-row">
            <div className="settings-text">
              <strong>{t("settingsCurrency")}</strong>
              <span>{t("settingsCurrencyHint")}</span>
            </div>
            <select
              className="settings-select"
              value={defaultCurrency}
              aria-label={t("settingsCurrency")}
              onChange={event => setDefaultCurrency(event.target.value)}
            >
              <option value="USD">$ USD</option>
              <option value="UAH">₴ UAH</option>
              <option value="EUR">€ EUR</option>
            </select>
          </div>

          <div className="settings-row">
            <div className="settings-text">
              <strong>{t("settingsDefaultSort")}</strong>
              <span>{t("settingsDefaultSortHint")}</span>
            </div>
            <select
              className="settings-select"
              value={defaultSort}
              aria-label={t("settingsDefaultSort")}
              onChange={event => setDefaultSort(event.target.value)}
            >
              <option value="popular">{t("sortPopular")}</option>
              <option value="price_asc">{t("sortPriceAsc")}</option>
              <option value="price_desc">{t("sortPriceDesc")}</option>
              <option value="rating">{t("sortRating")}</option>
              <option value="newest">{t("sortNewest")}</option>
            </select>
          </div>
        </div>

        {/* Профіль та доставка (якщо авторизований) */}
        {user ? (
          <>
            <div className="settings-card">
              <h3>
                <i className="fa-regular fa-user"></i> {t("sectionProfile")}
              </h3>
              <form onSubmit={handleProfileSubmit}>
                <div className="settings-field">
                  <label>{t("fullName")}</label>
                  <input
                    type="text"
                    required
                    placeholder={t("namePlaceholder")}
                    value={profileForm.name}
                    onChange={e => setProfileForm(c => ({ ...c, name: e.target.value }))}
                  />
                </div>

                <div className="admin-modal-row" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="settings-field">
                    <label>{t("phoneNumber")}</label>
                    <input
                      type="tel"
                      placeholder="+380 XX XXX XX XX"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(c => ({ ...c, phone: e.target.value }))}
                    />
                  </div>
                  <div className="settings-field">
                    <label>{t("avatarUrl")}</label>
                    <input
                      type="text"
                      placeholder="https://... photo.jpg"
                      value={profileForm.avatarUrl}
                      onChange={e => setProfileForm(c => ({ ...c, avatarUrl: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="admin-modal-row" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="settings-field">
                    <label>{t("defaultCity")}</label>
                    <input
                      type="text"
                      placeholder={t("cityPlaceholder")}
                      value={profileForm.city}
                      onChange={e => setProfileForm(c => ({ ...c, city: e.target.value }))}
                    />
                  </div>
                  <div className="settings-field">
                    <label>{t("defaultAddress")}</label>
                    <input
                      type="text"
                      placeholder={t("addressPlaceholder")}
                      value={profileForm.address}
                      onChange={e => setProfileForm(c => ({ ...c, address: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="settings-form-actions">
                  <button type="submit" className="btn btn-primary" disabled={profileSaving}>
                    {profileSaving ? "..." : t("saveChanges")}
                  </button>
                </div>
              </form>
            </div>

            <div className="settings-card">
              <h3>
                <i className="fa-solid fa-shield-halved"></i> {t("sectionSecurity")}
              </h3>
              <form onSubmit={handleSecuritySubmit}>
                <div className="settings-field">
                  <label>{t("currentPassword")}</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={securityForm.oldPassword}
                    onChange={e => setProfileForm(c => ({ ...c, oldPassword: e.target.value }))}
                  />
                </div>

                <div className="admin-modal-row" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="settings-field">
                    <label>{t("newPassword")}</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder={t("passwordMinPlaceholder")}
                      value={securityForm.newPassword}
                      onChange={e => setSecurityForm(c => ({ ...c, newPassword: e.target.value }))}
                    />
                  </div>
                  <div className="settings-field">
                    <label>{t("confirmPassword")}</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder={t("confirmPasswordPlaceholder")}
                      value={securityForm.confirmPassword}
                      onChange={e => setSecurityForm(c => ({ ...c, confirmPassword: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="settings-form-actions">
                  <button type="submit" className="btn btn-primary" disabled={securitySaving}>
                    {securitySaving ? "..." : t("changePasswordAction")}
                  </button>
                </div>
              </form>
            </div>

            <div className="settings-card">
              <h3>
                <i className="fa-regular fa-bell"></i> {t("sectionNotifications")}
              </h3>
              <form onSubmit={handleNotificationsSubmit}>
                <label className="settings-checkbox-label" style={{ marginBottom: "10px" }}>
                  <input
                    type="checkbox"
                    checked={preferencesForm.notifications_order}
                    onChange={e =>
                      setPreferencesForm(c => ({ ...c, notifications_order: e.target.checked }))
                    }
                  />
                  <span>{t("notifyOrders")}</span>
                </label>

                <label className="settings-checkbox-label">
                  <input
                    type="checkbox"
                    checked={preferencesForm.notifications_promo}
                    onChange={e =>
                      setPreferencesForm(c => ({ ...c, notifications_promo: e.target.checked }))
                    }
                  />
                  <span>{t("notifyPromos")}</span>
                </label>

                <div className="settings-form-actions" style={{ marginTop: "16px" }}>
                  <button type="submit" className="btn btn-primary" disabled={prefSaving}>
                    {prefSaving ? "..." : t("saveChanges")}
                  </button>
                </div>
              </form>

              <div className="settings-test-email-box" style={{ marginTop: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", marginBottom: "6px" }}>
                  <i className="fa-regular fa-paper-plane" style={{ color: "var(--green)" }}></i>
                  <span>{t("testEmailTitle")}</span>
                </div>
                <p>{t("testEmailDesc", { email: user?.email || "" })}</p>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleTestEmail}
                  disabled={emailTesting}
                >
                  {emailTesting ? t("testEmailSending") : t("testEmailAction")}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div
            className="settings-card"
            style={{
              background: "var(--surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px"
            }}
          >
            <div>
              <strong style={{ display: "block", marginBottom: "4px" }}>{t("guest")}</strong>
              <span style={{ fontSize: "13px", color: "var(--gray)" }}>{t("guestSettingsNote")}</span>
            </div>
            <Link to="/login" className="btn btn-primary" style={{ padding: "10px 20px" }}>
              {t("loginAction")}
            </Link>
          </div>
        )}

        {/* Ваші дані / Data */}
        <div className="settings-card">
          <h3>
            <i className="fa-solid fa-database"></i> {t("settingsData")}
          </h3>
          <div className="settings-row">
            <div className="settings-text">
              <strong>{t("settingsClearSearch")}</strong>
              <span>{t("settingsClearSearchHint")}</span>
            </div>
            <button
              type="button"
              className={`settings-action-btn ${doneAction === "search" ? "done" : ""}`}
              onClick={() => triggerDone("search", () => {
                clearSearchHistory();
                showToast(t("settingsDone"));
              })}
            >
              {doneAction === "search" ? t("settingsDone") : t("settingsClear")}
            </button>
          </div>

          <div className="settings-row">
            <div className="settings-text">
              <strong>{t("settingsClearCartFav")}</strong>
              <span>{t("settingsClearCartFavHint")}</span>
            </div>
            <button
              type="button"
              className={`settings-action-btn ${doneAction === "cart" ? "done" : ""}`}
              onClick={() => triggerDone("cart", () => {
                clearCart();
                showToast(t("settingsDone"));
              })}
            >
              {doneAction === "cart" ? t("settingsDone") : t("settingsClear")}
            </button>
          </div>

          <div className="settings-row">
            <div className="settings-text">
              <strong>{t("settingsClearCache")}</strong>
              <span>{t("settingsClearCacheHint")}</span>
            </div>
            <button
              type="button"
              className={`settings-action-btn ${doneAction === "cache" ? "done" : ""}`}
              onClick={() => triggerDone("cache", () => {
                clearAppCache();
                showToast(t("settingsDone"));
              })}
            >
              {doneAction === "cache" ? t("settingsDone") : t("settingsClear")}
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="settings-reset"
        onClick={() => triggerDone("reset", () => {
          resetSettings();
          showToast(t("settingsDone"));
        })}
      >
        <i className="fa-solid fa-rotate-left"></i>{" "}
        {doneAction === "reset" ? t("settingsDone") : t("settingsReset")}
      </button>
    </div>
  );
}
