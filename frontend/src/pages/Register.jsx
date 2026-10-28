import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Register() {
  const { t, register, showToast, withLoader } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");

  const onSubmit = async event => {
    event.preventDefault();
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName || !normalizedEmail || !password || !repeat) {
      showToast(t("fillAllFields"), "error");
      return;
    }
    if (password !== repeat) {
      showToast(t("passwordsMismatch"), "error");
      return;
    }
    if (password.length < 6) {
      showToast(t("minPassword"), "error");
      return;
    }

    const result = await withLoader(() => register(trimmedName, normalizedEmail, password));

    if (!result.success) {
      showToast(result.message || t("registerFailed"), "error");
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
    setRepeat("");
    showToast(t("registerSuccess"));
    setTimeout(() => navigate("/profile"), 1000);
  };

  return (
    <section className="section">
      <div className="container">
        <div className="auth-wrapper">
          <form id="registerForm" className="auth-form" onSubmit={onSubmit}>
            <h1 className="title">{t("registerTitle")}</h1>

            <div className="form-group">
              <label>{t("name")}</label>
              <input
                type="text"
                className="input"
                placeholder={t("enterName")}
                value={name}
                onChange={event => setName(event.target.value)}
                required
              />
            </div>

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

            <div className="form-group">
              <label>{t("repeatPassword")}</label>
              <input
                type="password"
                className="input"
                placeholder={t("repeatPassword")}
                value={repeat}
                onChange={event => setRepeat(event.target.value)}
                required
              />
            </div>

            <button className="btn auth-btn">{t("createAccount")}</button>

            <p className="auth-link">
              <span>{t("alreadyRegistered")}</span>
              <Link to="/login">{t("loginAction")}</Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
