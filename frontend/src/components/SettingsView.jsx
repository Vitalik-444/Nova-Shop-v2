import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { updateProfile, updateSettings, changePassword, sendTestEmail } from "../api";

export default function SettingsView() {
  const { t, user, updateUser, language, setLanguage, theme, setTheme, showToast } = useApp();
  const [activeTab, setActiveTab] = useState("profile");

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
    currency: "USD",
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
        currency: s.currency || "USD",
        notifications_order: s.notifications_order !== false,
        notifications_promo: !!s.notifications_promo
      });
    }
  }, [user]);

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

  const handlePreferencesSubmit = async event => {
    event.preventDefault();
    setPrefSaving(true);
    const result = await updateSettings(preferencesForm);
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
    <div className="settings-panel">
      {/* Підвкладки налаштувань */}
      <div className="settings-tabs">
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <i className="fa-regular fa-user"></i> {t("tabProfile")}
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          <i className="fa-solid fa-shield-halved"></i> {t("tabSecurity")}
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "preferences" ? "active" : ""}`}
          onClick={() => setActiveTab("preferences")}
        >
          <i className="fa-solid fa-sliders"></i> {t("tabPreferences")}
        </button>
      </div>

      {/* Вкладка 1: Профіль та адреса */}
      {activeTab === "profile" && (
        <form onSubmit={handleProfileSubmit} className="settings-form">
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

          <div className="admin-modal-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
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

          <div className="admin-modal-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
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
      )}

      {/* Вкладка 2: Безпека */}
      {activeTab === "security" && (
        <form onSubmit={handleSecuritySubmit} className="settings-form">
          <div className="settings-field">
            <label>{t("currentPassword")}</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={securityForm.oldPassword}
              onChange={e => setSecurityForm(c => ({ ...c, oldPassword: e.target.value }))}
            />
          </div>

          <div className="admin-modal-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
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
      )}

      {/* Вкладка 3: Параметри та сповіщення */}
      {activeTab === "preferences" && (
        <form onSubmit={handlePreferencesSubmit} className="settings-form">
          <div className="admin-modal-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div className="settings-field">
              <label>{t("interfaceLanguage")}</label>
              <select
                className="settings-select"
                value={language}
                onChange={e => setLanguage(e.target.value)}
              >
                <option value="uk">🇺🇦 Українська</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>

            <div className="settings-field">
              <label>{t("themeTitle")}</label>
              <select
                className="settings-select"
                value={theme}
                onChange={e => setTheme(e.target.value)}
              >
                <option value="light">☀️ {t("lightTheme")}</option>
                <option value="dark">🌙 {t("darkTheme")}</option>
              </select>
            </div>

            <div className="settings-field">
              <label>{t("preferredCurrency")}</label>
              <select
                className="settings-select"
                value={preferencesForm.currency}
                onChange={e => setPreferencesForm(c => ({ ...c, currency: e.target.value }))}
              >
                <option value="USD">$ USD</option>
                <option value="UAH">₴ UAH</option>
                <option value="EUR">€ EUR</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: "24px" }}>
            <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", fontSize: "15px" }}>
              {t("notificationsTitle")}
            </label>
            <label className="settings-checkbox-label">
              <input
                type="checkbox"
                checked={preferencesForm.notifications_order}
                onChange={e => setPreferencesForm(c => ({ ...c, notifications_order: e.target.checked }))}
              />
              <span>{t("notifyOrders")}</span>
            </label>

            <label className="settings-checkbox-label">
              <input
                type="checkbox"
                checked={preferencesForm.notifications_promo}
                onChange={e => setPreferencesForm(c => ({ ...c, notifications_promo: e.target.checked }))}
              />
              <span>{t("notifyPromos")}</span>
            </label>
          </div>

          <div className="settings-form-actions">
            <button type="submit" className="btn btn-primary" disabled={prefSaving}>
              {prefSaving ? "..." : t("saveChanges")}
            </button>
          </div>

          {/* Блок перевірки відправки листів */}
          <div className="settings-test-email-box">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", marginBottom: "6px" }}>
              <i className="fa-regular fa-paper-plane" style={{ color: "var(--green)" }}></i>
              <span>{t("testEmailTitle")}</span>
            </div>
            <p>
              {t("testEmailDesc", { email: user?.email || "" })}
            </p>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleTestEmail}
              disabled={emailTesting}
            >
              {emailTesting ? t("testEmailSending") : t("testEmailAction")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
