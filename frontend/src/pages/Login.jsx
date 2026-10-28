import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Login() {
  const { t, login, showToast, withLoader } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async event => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      showToast(t("fillAllFields"), "error");
      return;
    }

    const result = await withLoader(() => login(normalizedEmail, password));

    if (!result.success) {
      showToast(result.message || t("loginFailed"), "error");
      return;
    }

    showToast(t("welcome") + result.user.name);
    setTimeout(() => navigate("/profile"), 1000);
  };

  return (
    <section className="section">
      <div className="container">
        <div className="auth-wrapper">
          <form id="loginForm" className="auth-form" onSubmit={onSubmit}>
            <h1 className="title">{t("loginTitle")}</h1>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="input"
                placeholder={t("enterEmail")}
                value={email}
                onChange={event => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>{t("password")}</label>
              <input
                type="password"
                className="input"
                placeholder={t("enterPassword")}
                value={password}
                onChange={event => setPassword(event.target.value)}
                required
              />
            </div>

            <button className="btn auth-btn">{t("loginAction")}</button>

            <p className="auth-link">
              <span>{t("noAccount")}</span>
              <Link to="/register">{t("registerAction")}</Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
