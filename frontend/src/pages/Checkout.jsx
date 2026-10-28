import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { createOrder } from "../api";

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

export default function Checkout() {
  const { t, user, cart, clearCart, showToast, withLoader } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!user) return;
    setForm(current => ({
      ...current,
      name: current.name || user.name,
      email: current.email || user.email
    }));
  }, [user]);

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const bind = field => ({
    value: form[field],
    onChange: event => setForm(current => ({ ...current, [field]: event.target.value }))
  });

  const onSubmit = async event => {
    event.preventDefault();

    if (cart.length === 0) {
      showToast(t("cartEmpty"), "error");
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
      comment: form.comment.trim()
    };

    const result = await withLoader(() => createOrder(customer, cart));

    if (!result.success) {
      showToast(result.message || t("orderCreateFailed"), "error");
      return;
    }

    setForm(EMPTY_FORM);
    clearCart();
    if (result.email_sent) {
      showToast(t("orderCreatedEmail"));
    } else {
      showToast(t("orderCreatedNoEmail"), "error");
    }
    setTimeout(() => navigate("/profile"), 1500);
  };

  return (
    <section className="section">
      <div className="container">
        <div className="auth-wrapper">
          <form id="checkoutForm" className="auth-form checkout-form" onSubmit={onSubmit}>
            <h1 className="title">{t("checkoutTitle")}</h1>

            <div className="checkout-grid">
              <div className="form-group">
                <label>{t("name")}</label>
                <input type="text" className="input" placeholder={t("enterName")} required {...bind("name")} />
              </div>

              <div className="form-group">
                <label>{t("surname")}</label>
                <input type="text" className="input" placeholder={t("enterSurname")} required {...bind("surname")} />
              </div>

              <div className="form-group">
                <label>{t("phone")}</label>
                <input type="tel" className="input" placeholder="+380 XX XXX XX XX" required {...bind("phone")} />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input type="email" className="input" placeholder={t("enterEmail")} required {...bind("email")} />
              </div>

              <div className="form-group">
                <label>{t("city")}</label>
                <input type="text" className="input" placeholder={t("enterCity")} required {...bind("city")} />
              </div>

              <div className="form-group">
                <label>{t("postcode")}</label>
                <input type="text" className="input" placeholder={t("postIndex")} required {...bind("postcode")} />
              </div>

              <div className="form-group checkout-wide">
                <label>{t("address")}</label>
                <input type="text" className="input" placeholder={t("fullAddress")} required {...bind("address")} />
              </div>

              <div className="form-group">
                <label>{t("deliveryMethod")}</label>
                <select className="input" required {...bind("delivery")}>
                  <option value="">{t("chooseDelivery")}</option>
                  <option value="courier">{t("courier")}</option>
                  <option value="post">{t("post")}</option>
                  <option value="pickup">{t("pickup")}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t("paymentMethod")}</label>
                <select className="input" required {...bind("payment")}>
                  <option value="">{t("choosePayment")}</option>
                  <option value="card">{t("cardOnline")}</option>
                  <option value="cash">{t("cashOnDelivery")}</option>
                  <option value="invoice">{t("invoice")}</option>
                </select>
              </div>

              <div className="form-group checkout-wide">
                <label>{t("orderComment")}</label>
                <textarea className="input textarea" placeholder={t("deliveryInfo")} {...bind("comment")}></textarea>
              </div>
            </div>

            <div className="checkout-total">
              <span>{t("orderSum")}</span>
              <strong className="checkout-total-price">{totalPrice.toFixed(2)} $</strong>
            </div>

            <button className="btn auth-btn">{t("confirmOrder")}</button>

            <p className="auth-link">
              <Link to="/cart">{t("returnToCart")}</Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
