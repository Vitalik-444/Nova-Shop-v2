import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { createOrder } from "../api";
import { isValidPhone, formatPhoneNumber } from "../utils/format";

const EMPTY_FORM = {
  name: "",
  surname: "",
  phone: "",
  email: "",
  city: "",
  postcode: "",
  address: "",
  delivery: "",
  payment: "",
  comment: ""
};

const DELIVERY = [
  ["courier", "fa-truck"],
  ["post", "fa-box"],
  ["pickup", "fa-store"]
];

const PAYMENT = [
  ["card", "cardOnline", "fa-credit-card"],
  ["cash", "cashOnDelivery", "fa-money-bill-wave"],
  ["invoice", "invoice", "fa-file-invoice"]
];

export default function Checkout() {
  const { t, tProduct, language, formatPrice, user, cart, clearCart, showToast, withLoader } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [step, setStep] = useState(1);
  const [doneMessage, setDoneMessage] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const formRef = useRef(null);
  const phoneRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    setForm(current => ({
      ...current,
      name: current.name || user.name,
      email: current.email || user.email,
      phone: current.phone || user.phone || "",
      city: current.city || user.city || "",
      address: current.address || user.address || ""
    }));
  }, [user]);

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const bind = field => ({
    value: form[field],
    onChange: event => setForm(current => ({ ...current, [field]: event.target.value }))
  });

  const handlePhoneChange = event => {
    const val = event.target.value;
    setForm(current => ({ ...current, phone: val }));
    if (phoneTouched) {
      if (!val.trim()) {
        setPhoneError("");
        if (phoneRef.current) phoneRef.current.setCustomValidity("");
      } else if (!isValidPhone(val)) {
        setPhoneError(t("invalidPhone"));
        if (phoneRef.current) phoneRef.current.setCustomValidity(t("invalidPhone"));
      } else {
        setPhoneError("");
        if (phoneRef.current) phoneRef.current.setCustomValidity("");
      }
    }
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    const val = form.phone.trim();
    if (!val) {
      setPhoneError("");
      if (phoneRef.current) phoneRef.current.setCustomValidity("");
      return;
    }
    if (!isValidPhone(val)) {
      setPhoneError(t("invalidPhone"));
      if (phoneRef.current) phoneRef.current.setCustomValidity(t("invalidPhone"));
    } else {
      setPhoneError("");
      if (phoneRef.current) phoneRef.current.setCustomValidity("");
      const formatted = formatPhoneNumber(val);
      if (formatted !== form.phone) {
        setForm(current => ({ ...current, phone: formatted }));
      }
    }
  };

  const invalidIn = target => {
    if (!formRef.current) return null;
    const fields = formRef.current.querySelectorAll(`[data-step="${target}"]`);
    return Array.from(fields).find(el => !el.checkValidity()) || null;
  };

  const validate = target => {
    if (target === 1) {
      setPhoneTouched(true);
      const isPhoneValid = isValidPhone(form.phone);
      if (phoneRef.current) {
        if (!form.phone.trim()) {
          phoneRef.current.setCustomValidity("");
        } else if (!isPhoneValid) {
          phoneRef.current.setCustomValidity(t("invalidPhone"));
        } else {
          phoneRef.current.setCustomValidity("");
        }
      }
      if (form.phone.trim() && !isPhoneValid) {
        setPhoneError(t("invalidPhone"));
      } else {
        setPhoneError("");
      }
    }

    const bad = invalidIn(target);
    if (!bad) return true;
    setStep(target);
    setTimeout(() => bad.reportValidity(), 0);
    return false;
  };

  const next = () => {
    if (validate(step)) setStep(current => Math.min(3, current + 1));
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      showToast(t("cartEmpty"), "error");
      return;
    }

    for (const target of [1, 2, 3]) {
      if (!validate(target)) return;
    }

    if (!isValidPhone(form.phone)) {
      setStep(1);
      setPhoneTouched(true);
      setPhoneError(t("invalidPhone"));
      if (phoneRef.current) {
        phoneRef.current.setCustomValidity(t("invalidPhone"));
        phoneRef.current.focus();
        phoneRef.current.reportValidity();
      }
      showToast(t("invalidPhone"), "error");
      return;
    }

    const customer = {
      name: form.name.trim(),
      surname: form.surname.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      city: form.city.trim(),
      postcode: form.postcode.trim(),
      address: form.address.trim(),
      delivery: form.delivery,
      payment: form.payment,
      comment: form.comment.trim(),
      language
    };

    const result = await withLoader(() => createOrder(customer, cart));

    if (!result.success) {
      showToast(result.message || t("orderCreateFailed"), "error");
      return;
    }

    const message = result.email_sent ? t("orderCreatedEmail") : t("orderCreatedNoEmail");
    setDoneMessage(message);
    setForm(EMPTY_FORM);
    clearCart();
    showToast(message, result.email_sent ? "success" : "error");
    setTimeout(() => navigate("/profile"), 1500);
  };

  const onSubmit = event => {
    event.preventDefault();
    if (step < 3) next();
    else submitOrder();
  };

  if (doneMessage) {
    return (
      <section className="nv-page">
        <div className="container">
          <div className="nv-empty nv-success">
            <i className="fa-solid fa-circle-check"></i>
            <h3>{doneMessage}</h3>
            <Link to="/profile" className="nv-btn nv-btn-primary">{t("profile")}</Link>
          </div>
        </div>
      </section>
    );
  }

  if (cart.length === 0) {
    return (
      <section className="nv-page">
        <div className="container">
          <h1 className="nv-page-title">{t("checkoutTitle")}</h1>
          <div className="nv-empty">
            <i className="fa-solid fa-cart-shopping"></i>
            <h3>{t("cartEmpty")}</h3>
            <p>{t("nvEmptyCartHint")}</p>
            <Link to="/catalog" className="nv-btn nv-btn-primary">{t("nvToCatalog")}</Link>
          </div>
        </div>
      </section>
    );
  }

  const steps = [t("nvStep1"), t("nvStep2"), t("nvStep3")];

  return (
    <section className="nv-page">
      <div className="container">
        <h1 className="nv-page-title">{t("checkoutTitle")}</h1>

        <ol className="nv-steps">
          {steps.map((label, index) => {
            const number = index + 1;
            const state = number < step ? "done" : number === step ? "current" : "";
            return (
              <li key={label} className={state}>
                <button type="button" disabled={number > step} onClick={() => setStep(number)}>
                  <span>{number < step ? <i className="fa-solid fa-check"></i> : number}</span>
                  {label}
                </button>
              </li>
            );
          })}
        </ol>

        <div className="nv-checkout">
          <form className="nv-checkout-form" ref={formRef} onSubmit={onSubmit} noValidate>
            <div hidden={step !== 1}>
              <h2>{t("nvStep1")}</h2>
              <div className="nv-form-grid">
                <div className="form-group">
                  <label>{t("name")}</label>
                  <input type="text" className="input" data-step="1" placeholder={t("enterName")} required {...bind("name")} />
                </div>
                <div className="form-group">
                  <label>{t("surname")}</label>
                  <input type="text" className="input" data-step="1" placeholder={t("enterSurname")} required {...bind("surname")} />
                </div>
                <div className="form-group">
                  <label>{t("phone")}</label>
                  <input
                    ref={phoneRef}
                    type="tel"
                    className={`input${phoneError ? " input-error" : ""}`}
                    data-step="1"
                    placeholder="+380 XX XXX XX XX"
                    required
                    value={form.phone}
                    onChange={handlePhoneChange}
                    onBlur={handlePhoneBlur}
                  />
                  {phoneError ? (
                    <span className="form-error-msg"><i className="fa-solid fa-circle-exclamation"></i> {phoneError}</span>
                  ) : (
                    <span className="form-hint-msg">{t("phoneHint")}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="input" data-step="1" placeholder={t("enterEmail")} required {...bind("email")} />
                </div>
              </div>
            </div>

            <div hidden={step !== 2}>
              <h2>{t("nvStep2")}</h2>
              <div className="nv-options">
                {DELIVERY.map(([value, icon]) => (
                  <label className={`nv-option${form.delivery === value ? " active" : ""}`} key={value}>
                    <input
                      type="radio"
                      name="delivery"
                      data-step="2"
                      value={value}
                      required
                      checked={form.delivery === value}
                      onChange={() => setForm(current => ({ ...current, delivery: value }))}
                    />
                    <i className={`fa-solid ${icon}`}></i>
                    <span>{t(value)}</span>
                  </label>
                ))}
              </div>
              <div className="nv-form-grid">
                <div className="form-group">
                  <label>{t("city")}</label>
                  <input type="text" className="input" data-step="2" placeholder={t("enterCity")} required {...bind("city")} />
                </div>
                <div className="form-group">
                  <label>{t("postcode")}</label>
                  <input type="text" className="input" data-step="2" placeholder={t("postIndex")} required {...bind("postcode")} />
                </div>
                <div className="form-group nv-wide">
                  <label>{t("address")}</label>
                  <input type="text" className="input" data-step="2" placeholder={t("fullAddress")} required {...bind("address")} />
                </div>
              </div>
            </div>

            <div hidden={step !== 3}>
              <h2>{t("nvStep3")}</h2>
              <div className="nv-options">
                {PAYMENT.map(([value, label, icon]) => (
                  <label className={`nv-option${form.payment === value ? " active" : ""}`} key={value}>
                    <input
                      type="radio"
                      name="payment"
                      data-step="3"
                      value={value}
                      required
                      checked={form.payment === value}
                      onChange={() => setForm(current => ({ ...current, payment: value }))}
                    />
                    <i className={`fa-solid ${icon}`}></i>
                    <span>{t(label)}</span>
                  </label>
                ))}
              </div>
              <div className="form-group">
                <label>{t("orderComment")}</label>
                <textarea className="input textarea" placeholder={t("deliveryInfo")} {...bind("comment")}></textarea>
              </div>
            </div>

            <div className="nv-checkout-nav">
              {step > 1 ? (
                <button type="button" className="nv-btn nv-btn-ghost nv-btn-lg" onClick={() => setStep(step - 1)}>
                  <i className="fa-solid fa-arrow-left"></i> {t("nvBack")}
                </button>
              ) : (
                <Link to="/cart" className="nv-btn nv-btn-ghost nv-btn-lg">
                  <i className="fa-solid fa-arrow-left"></i> {t("returnToCart")}
                </Link>
              )}
              {step < 3 ? (
                <button type="submit" className="nv-btn nv-btn-primary nv-btn-lg">
                  {t("nvNext")} <i className="fa-solid fa-arrow-right"></i>
                </button>
              ) : (
                <button type="submit" className="nv-btn nv-btn-primary nv-btn-lg">
                  <i className="fa-solid fa-lock"></i> {t("confirmOrder")}
                </button>
              )}
            </div>
          </form>

          <aside className="nv-summary">
            <h2>{t("nvYourItems")}</h2>
            <div className="nv-summary-items">
              {cart.map(item => (
                <div className="nv-summary-item" key={item.id}>
                  <img src={item.thumbnail} alt="" loading="lazy" />
                  <div>
                    <span>{tProduct(item)}</span>
                    <small className="nv-muted">{item.quantity} {t("nvPcs")}</small>
                  </div>
                  <strong>{formatPrice(item.price * item.quantity)}</strong>
                </div>
              ))}
            </div>
            <div className="nv-summary-row">
              <span>{t("products")}</span>
              <strong>{totalCount}</strong>
            </div>
            <div className="nv-summary-row nv-summary-total">
              <span>{t("orderSum")}</span>
              <strong>{formatPrice(totalPrice)}</strong>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
