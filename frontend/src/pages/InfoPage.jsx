import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function InfoPage({ tab: activeTab = "delivery" }) {
  const { t, language } = useApp();

  const isEn = language === "en";

  // Set document title & scroll to top
  useEffect(() => {
    const titles = {
      delivery: isEn ? "NovaShop | Delivery" : "NovaShop | Доставка",
      payment: isEn ? "NovaShop | Payment" : "NovaShop | Оплата",
      warranty: isEn ? "NovaShop | Warranty" : "NovaShop | Гарантія",
      about: isEn ? "NovaShop | About Us" : "NovaShop | Про нас",
      contacts: isEn ? "NovaShop | Contacts" : "NovaShop | Контакти",
      news: isEn ? "NovaShop | News" : "NovaShop | Новини"
    };
    document.title = titles[activeTab] || "NovaShop";
    window.scrollTo(0, 0);
  }, [activeTab, isEn]);

  // Track search state for tracking widget
  const [trackNumber, setTrackNumber] = useState("");
  const [trackResult, setTrackResult] = useState(null);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!trackNumber.trim()) return;
    setTrackResult({
      code: trackNumber.trim(),
      status: isEn ? "In transit to destination city" : "Прямує до міста призначення",
      carrier: trackNumber.startsWith("204") ? (isEn ? "Nova Poshta" : "Нова Пошта") : (isEn ? "NovaShop Logistics" : "Служба доставки NovaShop"),
      date: isEn ? "Estimated delivery: Tomorrow, 14:00" : "Орієнтовна доставка: Завтра, 14:00"
    });
  };

  // Feedback form state
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "consultation",
    message: ""
  });

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormData({ name: "", email: "", phone: "", subject: "consultation", message: "" });
    }, 4000);
  };

  // News tag filter & modal state
  const [newsTag, setNewsTag] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState(null);

  // FAQ state
  const [openFaq, setOpenFaq] = useState({});
  const toggleFaq = (idx) => {
    setOpenFaq(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const groupLabel = ["delivery", "payment", "warranty"].includes(activeTab)
    ? (isEn ? "For customers" : "Покупцям")
    : (isEn ? "Company" : "Компанія");

  const currentTabInfo = {
    delivery: {
      title: isEn ? "Delivery across Ukraine" : "Доставка замовлень по Україні",
      subtitle: isEn 
        ? "Fast, secure, and fully insured shipping to any location. Free delivery on orders over 1500 ₴."
        : "Швидка, надійна та 100% застрахована доставка. Безкоштовно для замовлень від 1500 ₴.",
      icon: "fa-truck-fast"
    },
    payment: {
      title: isEn ? "Convenient & Secure Payment" : "Зручні та безпечні способи оплати",
      subtitle: isEn
        ? "Choose between online payment, pay on delivery, 0% installments, or business invoices."
        : "Оплата онлайн, при отриманні у відділенні, розстрочка 0% від Monobank та ПриватБанк, або безготівковий розрахунок.",
      icon: "fa-credit-card"
    },
    warranty: {
      title: isEn ? "Official Warranty & Returns" : "Офіційна гарантія та повернення",
      subtitle: isEn
        ? "100% original products, manufacturer warranty up to 36 months, and 14 days easy returns."
        : "Лише оригінальна сертифікована техніка, офіційна гарантія до 36 місяців та просте повернення протягом 14 днів.",
      icon: "fa-shield-halved"
    },
    about: {
      title: isEn ? "About NovaShop" : "Про інтернет-магазин NovaShop",
      subtitle: isEn
        ? "High-tech next-generation electronics store powered by smart shopping and 24/7 AI-Assistant Nova."
        : "Сучасний інтернет-магазин нового покоління: високі технології, чесні ціни та персональний AI-помічник Нова.",
      icon: "fa-building"
    },
    contacts: {
      title: isEn ? "Contacts & Support" : "Контакти та служба турботи",
      subtitle: isEn
        ? "We are here to help 7 days a week. Visit our Kyiv showroom or reach out via phone, email, or chat."
        : "Ми завжди на зв'язку 7 днів на тиждень. Завітайте до флагманського шоуруму або зверніться онлайн.",
      icon: "fa-phone-volume"
    },
    news: {
      title: isEn ? "News & Announcements" : "Новини та події NovaShop",
      subtitle: isEn
        ? "Latest store updates, promotions, reviews, and technology insights."
        : "Свіжі оновлення асортименту, акційні пропозиції, огляди новинок та технологічні новини.",
      icon: "fa-newspaper"
    }
  }[activeTab] || { title: "", subtitle: "", icon: "fa-circle-info" };

  return (
    <div className="container info-container">
      {/* Breadcrumbs */}
      <nav className="info-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/"><i className="fa-solid fa-house"></i> {isEn ? "Home" : "Головна"}</Link>
        <span className="sep">/</span>
        <span>{groupLabel}</span>
        <span className="sep">/</span>
        <strong style={{ color: "var(--nv-text)" }}>{currentTabInfo.title.split(" ")[0]}</strong>
      </nav>

      {/* Page Header */}
      <header className="info-header">
        <h1>
          <span className="info-header-icon">
            <i className={`fa-solid ${currentTabInfo.icon}`}></i>
          </span>
          {currentTabInfo.title}
        </h1>
        <p>{currentTabInfo.subtitle}</p>
      </header>

      {/* TAB CONTENT: DELIVERY */}
      {activeTab === "delivery" && (
        <section className="info-tab-content">
          <div className="info-grid">
            <div className="info-card">
              <div className="info-card-top">
                <div className="info-card-icon"><i className="fa-solid fa-box"></i></div>
                <span className="info-badge info-badge-green">{isEn ? "Popular" : "Популярно"}</span>
              </div>
              <h3>{isEn ? "Nova Poshta — Branch & Parcel Locker" : "Нова Пошта — Відділення та Поштомат"}</h3>
              <p>
                {isEn 
                  ? "Fast delivery to any Nova Poshta branch or contactless parcel locker across Ukraine." 
                  : "Швидка доставка до найближчого відділення або поштомату Нової Пошти у вашому місті."}
              </p>
              <div className="info-card-meta">
                <div className="info-card-meta-row">
                  <span>{isEn ? "Delivery time:" : "Термін доставки:"}</span>
                  <strong>1 – 2 {isEn ? "days" : "дні"}</strong>
                </div>
                <div className="info-card-meta-row">
                  <span>{isEn ? "Cost:" : "Вартість:"}</span>
                  <strong style={{ color: "var(--nv-accent)" }}>{isEn ? "Free from 1500 ₴" : "Безкоштовно від 1500 ₴"}</strong>
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-top">
                <div className="info-card-icon"><i className="fa-solid fa-person-walking-luggage"></i></div>
                <span className="info-badge info-badge-blue">{isEn ? "To your door" : "До дверей"}</span>
              </div>
              <h3>{isEn ? "Courier Delivery" : "Кур'єрська доставка до дверей"}</h3>
              <p>
                {isEn
                  ? "Courier delivery right to your home or office address. Convenient call 30-60 mins prior."
                  : "Кур'єр доставить замовлення прямо до ваших дверей у зручний для вас проміжок часу."}
              </p>
              <div className="info-card-meta">
                <div className="info-card-meta-row">
                  <span>{isEn ? "Delivery time:" : "Термін доставки:"}</span>
                  <strong>1 – 2 {isEn ? "days" : "дні"}</strong>
                </div>
                <div className="info-card-meta-row">
                  <span>{isEn ? "Cost:" : "Вартість:"}</span>
                  <strong style={{ color: "var(--nv-accent)" }}>{isEn ? "Free from 3000 ₴" : "Безкоштовно від 3000 ₴"}</strong>
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-top">
                <div className="info-card-icon"><i className="fa-solid fa-store"></i></div>
                <span className="info-badge info-badge-green">{isEn ? "Instant 0 ₴" : "Миттєво 0 ₴"}</span>
              </div>
              <h3>{isEn ? "Flagship Showroom Pickup" : "Самовивіз із флагманського шоуруму"}</h3>
              <p>
                {isEn
                  ? "Pick up in our Kyiv store (Khreshchatyk 24). Inspect the gadget, test accessories, get advice."
                  : "Забирайте покупку в нашому шоурумі у центрі Києва. Можливість оглянути та протестувати пристрій."}
              </p>
              <div className="info-card-meta">
                <div className="info-card-meta-row">
                  <span>{isEn ? "Readiness:" : "Готовність:"}</span>
                  <strong>{isEn ? "Ready in 15 mins" : "Через 15 хв після замовлення"}</strong>
                </div>
                <div className="info-card-meta-row">
                  <span>{isEn ? "Cost:" : "Вартість:"}</span>
                  <strong style={{ color: "var(--nv-accent)" }}>0 ₴</strong>
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-top">
                <div className="info-card-icon"><i className="fa-solid fa-envelope"></i></div>
                <span className="info-badge">{isEn ? "All regions" : "Вся Україна"}</span>
              </div>
              <h3>{isEn ? "Ukrposhta Express" : "Укрпошта Експрес"}</h3>
              <p>
                {isEn
                  ? "Affordable delivery to over 11,000 postal branches across Ukraine, including rural settlements."
                  : "Економічна доставка до будь-якого з 11 000+ відділень по всій території України."}
              </p>
              <div className="info-card-meta">
                <div className="info-card-meta-row">
                  <span>{isEn ? "Delivery time:" : "Термін доставки:"}</span>
                  <strong>2 – 4 {isEn ? "days" : "дні"}</strong>
                </div>
                <div className="info-card-meta-row">
                  <span>{isEn ? "Cost:" : "Вартість:"}</span>
                  <strong style={{ color: "var(--nv-accent)" }}>{isEn ? "Free from 1200 ₴" : "Безкоштовно від 1200 ₴"}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tracking Widget */}
          <div className="info-card" style={{ marginBottom: "36px" }}>
            <h3 style={{ marginBottom: "8px" }}>
              <i className="fa-solid fa-location-crosshairs" style={{ color: "var(--nv-accent)", marginRight: "8px" }}></i>
              {isEn ? "Track your order shipment" : "Відстежити статус посилки"}
            </h3>
            <p style={{ margin: "0 0 16px" }}>
              {isEn ? "Enter your Nova Poshta tracking number (TTN) or NovaShop order ID:" : "Введіть номер експрес-накладної (ТТН) або номер вашого замовлення NovaShop:"}
            </p>
            <form onSubmit={handleTrackSubmit} style={{ display: "flex", gap: "10px", flexWrap: "wrap", maxWidth: "600px" }}>
              <input
                type="text"
                placeholder={isEn ? "e.g. 20450891234567 or #1042" : "Наприклад: 20450891234567 або #1042"}
                value={trackNumber}
                onChange={e => setTrackNumber(e.target.value)}
                style={{ flex: "1 1 240px", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--nv-line)", background: "var(--nv-panel-2)", color: "var(--nv-text)" }}
              />
              <button type="submit" className="nv-btn nv-btn-primary" style={{ padding: "12px 24px" }}>
                <i className="fa-solid fa-magnifying-glass"></i> {isEn ? "Track" : "Відстежити"}
              </button>
            </form>

            {trackResult && (
              <div style={{ marginTop: "16px", padding: "14px 18px", borderRadius: "10px", background: "rgba(var(--nv-accent-rgb), 0.1)", border: "1px solid rgba(var(--nv-accent-rgb), 0.3)" }}>
                <strong style={{ color: "var(--nv-accent)" }}>{trackResult.carrier} • {trackResult.code}</strong>
                <div style={{ fontSize: "14px", marginTop: "4px" }}>{trackResult.status}</div>
                <div style={{ fontSize: "12px", color: "var(--nv-muted)", marginTop: "2px" }}>{trackResult.date}</div>
              </div>
            )}
          </div>

          {/* Delivery Steps */}
          <h2 className="info-section-title">
            <i className="fa-solid fa-arrows-split-up-and-left" style={{ color: "var(--nv-accent)" }}></i>
            {isEn ? "How your delivery works" : "Як відбувається доставка"}
          </h2>
          <div className="info-steps-grid">
            <div className="info-step-card">
              <div className="info-step-number">01</div>
              <h4>{isEn ? "Order Confirmation" : "Підтвердження"}</h4>
              <p>{isEn ? "Instant item reservation in warehouse and automated order packaging check." : "Товар автоматично резервується на складі після підтвердження замовлення."}</p>
            </div>
            <div className="info-step-card">
              <div className="info-step-number">02</div>
              <h4>{isEn ? "Careful Packaging" : "Бережне пакування"}</h4>
              <p>{isEn ? "Air-bubble protection, tamper-evident security seal, serial number recording." : "Надійний захист електроніки від ударів, фірмова захисна пломба контролю відкриття."}</p>
            </div>
            <div className="info-step-card">
              <div className="info-step-number">03</div>
              <h4>{isEn ? "Same-Day Dispatch" : "Швидка відправка"}</h4>
              <p>{isEn ? "Orders placed before 17:00 are dispatched the very same day." : "Замовлення, оформлені до 17:00, передаються до служби доставки в той самий день."}</p>
            </div>
            <div className="info-step-card">
              <div className="info-step-number">04</div>
              <h4>{isEn ? "Inspection & Receipt" : "Огляд та отримання"}</h4>
              <p>{isEn ? "Inspect your parcel upon delivery. 100% shipment insurance covers any transport risks." : "Ви маєте право оглянути пристрій перед оплатою у присутності оператора."}</p>
            </div>
          </div>

          {/* FAQ */}
          <h2 className="info-section-title">
            <i className="fa-regular fa-circle-question" style={{ color: "var(--nv-accent)" }}></i>
            {isEn ? "Frequently Asked Questions about Delivery" : "Поширені запитання про доставку"}
          </h2>
          <div className="info-faq-list">
            {[
              {
                q: isEn ? "What if the parcel arrives damaged?" : "Що робити, якщо коробка або товар пошкоджені під час доставки?",
                a: isEn
                  ? "All NovaShop shipments are 100% insured. If you notice any damage during inspection at the post office, simply ask the courier/operator to draw up an inspection act (Акт огляду) and reject the parcel. We will immediately ship you a replacement or issue a full refund."
                  : "Усі відправлення NovaShop застраховані на повну вартість. Якщо ви помітили пошкодження пакування або товару під час огляду, складіть разом з оператором пошти Акт огляду та відмовтеся від отримання. Ми миттєво відправимо вам новий пристрій або повернемо кошти."
              },
              {
                q: isEn ? "How long does Nova Poshta hold my parcel?" : "Скільки днів посилка зберігається у відділенні Нової Пошти?",
                a: isEn
                  ? "Standard storage period is 7 calendar days from the moment the parcel arrives at your branch. If you need to extend storage, please contact our support team."
                  : "Термін безкоштовного зберігання посилки становить 7 календарних днів з моменту прибуття у відділення. За необхідності подовжити зберігання, зв'яжіться з нашою підтримкою."
              },
              {
                q: isEn ? "Can I inspect the product before paying?" : "Чи можу я відкрити коробку та перевірити пристрій перед оплатою?",
                a: isEn
                  ? "Yes, absolutely! With both Cash on Delivery and Showroom pickup, you have full right to open and inspect the contents prior to completing the payment."
                  : "Так, обов'язково! При замовленні післяплатою або самовивозом ви маєте повне право відкрити коробку та оглянути гаджет перед тим, як сплачувати кошти."
              }
            ].map((faq, i) => (
              <div className="info-faq-item" key={i}>
                <button
                  type="button"
                  className={`info-faq-btn${openFaq[i] ? " open" : ""}`}
                  onClick={() => toggleFaq(i)}
                >
                  <span>{faq.q}</span>
                  <i className="fa-solid fa-chevron-down"></i>
                </button>
                {openFaq[i] && <div className="info-faq-body">{faq.a}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB CONTENT: PAYMENT */}
      {activeTab === "payment" && (
        <section className="info-tab-content">
          <div className="info-grid">
            <div className="info-card">
              <div className="info-card-top">
                <div className="info-card-icon"><i className="fa-solid fa-credit-card"></i></div>
                <span className="info-badge info-badge-green">0% {isEn ? "Fee" : "Комісія"}</span>
              </div>
              <h3>{isEn ? "Online Card Payment" : "Онлайн-оплата банківською карткою"}</h3>
              <p>
                {isEn
                  ? "Pay instantly with Visa, Mastercard, Apple Pay, or Google Pay via secure payment gateways."
                  : "Миттєва та безпечна оплата картками Visa, Mastercard, Apple Pay або Google Pay без жодних додаткових комісій."}
              </p>
              <div className="info-card-meta">
                <div className="info-card-meta-row">
                  <span>{isEn ? "Supported cards:" : "Підтримувані картки:"}</span>
                  <strong>Visa, Mastercard, Prostir</strong>
                </div>
                <div className="info-card-meta-row">
                  <span>{isEn ? "Security:" : "Захист:"}</span>
                  <strong style={{ color: "var(--nv-accent)" }}>3D-Secure 2.0</strong>
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-top">
                <div className="info-card-icon"><i className="fa-solid fa-hand-holding-dollar"></i></div>
                <span className="info-badge">{isEn ? "Pay on receipt" : "При отриманні"}</span>
              </div>
              <h3>{isEn ? "Cash on Delivery" : "Післяплата (при отриманні)"}</h3>
              <p>
                {isEn
                  ? "Pay cash or card at the post office or to the courier after you thoroughly inspect the goods."
                  : "Оплата готівкою або карткою у відділенні пошти чи кур'єру після повного огляду та перевірки товару."}
              </p>
              <div className="info-card-meta">
                <div className="info-card-meta-row">
                  <span>{isEn ? "Carrier fee:" : "Комісія пошти:"}</span>
                  <strong>20 ₴ + 2% {isEn ? "(Nova Poshta rate)" : "(тариф Нової Пошти)"}</strong>
                </div>
                <div className="info-card-meta-row">
                  <span>{isEn ? "Prepayment:" : "Передоплата:"}</span>
                  <strong style={{ color: "var(--nv-accent)" }}>{isEn ? "0 ₴ for most items" : "Не потрібна"}</strong>
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-top">
                <div className="info-card-icon"><i className="fa-solid fa-chart-pie"></i></div>
                <span className="info-badge info-badge-green">0% {isEn ? "Interest" : "Переплат"}</span>
              </div>
              <h3>{isEn ? "Installments 0% (Monobank & Privat)" : "Оплата частинами 0%"}</h3>
              <p>
                {isEn
                  ? "Split your payment into up to 10 equal monthly payments with zero interest via Monobank or PrivatBank."
                  : "Розподіліть суму покупки на строк до 10 місяців без відсотків і переплат через Monobank, ПриватБанк або А-Банк."}
              </p>
              <div className="info-card-meta">
                <div className="info-card-meta-row">
                  <span>{isEn ? "Available banks:" : "Банки-партнери:"}</span>
                  <strong>Mono, Privat, A-Bank</strong>
                </div>
                <div className="info-card-meta-row">
                  <span>{isEn ? "Terms:" : "Строк:"}</span>
                  <strong style={{ color: "var(--nv-accent)" }}>2 – 10 {isEn ? "months" : "місяців"}</strong>
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-top">
                <div className="info-card-icon"><i className="fa-solid fa-file-invoice-dollar"></i></div>
                <span className="info-badge">{isEn ? "Legal entities" : "Для юросіб"}</span>
              </div>
              <h3>{isEn ? "Invoice for Business (with VAT)" : "Безготівковий розрахунок (з ПДВ)"}</h3>
              <p>
                {isEn
                  ? "Full package of accounting documents, VAT invoice via Vchasno / M.E.Doc, contracts for legal entities."
                  : "Безготівкова оплата за рахунком-фактурою з ПДВ. Повний пакет первинних документів у системі Вчасно чи M.E.Doc."}
              </p>
              <div className="info-card-meta">
                <div className="info-card-meta-row">
                  <span>{isEn ? "Documents:" : "Документи:"}</span>
                  <strong>{isEn ? "Contract, Act, VAT" : "Договір, Видаткова, ПН"}</strong>
                </div>
                <div className="info-card-meta-row">
                  <span>{isEn ? "Invoicing:" : "Виставлення:"}</span>
                  <strong style={{ color: "var(--nv-accent)" }}>{isEn ? "Within 15 mins" : "Протягом 15 хвилин"}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Security Banner */}
          <div className="info-callout">
            <div className="info-callout-text">
              <h3>
                <i className="fa-solid fa-lock" style={{ color: "var(--nv-accent)", marginRight: "8px" }}></i>
                {isEn ? "Bank-Grade Payment Security" : "Банківський рівень безпеки платежів"}
              </h3>
              <p>
                {isEn
                  ? "All transactions are processed through 256-bit encrypted SSL channels complying with international PCI DSS Level 1 standards. We do not store your credit card credentials."
                  : "Усі платежі проходять через захищені протоколи шифрування за міжнародним стандартом PCI DSS Level 1. Ваші платіжні реквізити не зберігаються на наших серверах."}
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span className="info-badge info-badge-green" style={{ fontSize: "13px", padding: "8px 16px" }}>
                <i className="fa-solid fa-shield-check"></i> PCI DSS Compliant
              </span>
            </div>
          </div>

          {/* FAQ */}
          <h2 className="info-section-title">
            <i className="fa-regular fa-circle-question" style={{ color: "var(--nv-accent)" }}></i>
            {isEn ? "Payment FAQ" : "Поширені запитання про оплату"}
          </h2>
          <div className="info-faq-list">
            {[
              {
                q: isEn ? "How do I order with 0% installment?" : "Як оформити покупку товару в розстрочку?",
                a: isEn
                  ? "During checkout, select 'Installments 0%', pick your bank (Monobank, PrivatBank, or A-Bank), choose the number of monthly payments, and confirm the request directly in your mobile banking app in a few seconds."
                  : "Під час оформлення замовлення виберіть спосіб «Оплата частинами 0%», вкажіть ваш банк (Monobank або ПриватБанк), кількість платежів та підтвердіть запит у додатку банку на телефоні."
              },
              {
                q: isEn ? "Is there a currency conversion fee for foreign cards?" : "Чи є додаткова комісія при оплаті закордонною карткою?",
                a: isEn
                  ? "All prices are charged in Ukrainian Hryvnia (UAH). If your card is in USD, EUR, or another currency, conversion will follow your issuing bank's exchange rate."
                  : "Списання здійснюється у гривні (UAH). Якщо ваша картка відкрита в іншій валюті (USD, EUR тощо), конвертація відбувається за поточним курсом вашого банку."
              }
            ].map((faq, i) => (
              <div className="info-faq-item" key={i}>
                <button
                  type="button"
                  className={`info-faq-btn${openFaq[i + 10] ? " open" : ""}`}
                  onClick={() => toggleFaq(i + 10)}
                >
                  <span>{faq.q}</span>
                  <i className="fa-solid fa-chevron-down"></i>
                </button>
                {openFaq[i + 10] && <div className="info-faq-body">{faq.a}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB CONTENT: WARRANTY */}
      {activeTab === "warranty" && (
        <section className="info-tab-content">
          <div className="info-grid">
            <div className="info-card">
              <div className="info-card-top">
                <div className="info-card-icon"><i className="fa-solid fa-certificate"></i></div>
                <span className="info-badge info-badge-green">{isEn ? "100% Genuine" : "100% Оригінал"}</span>
              </div>
              <h3>{isEn ? "Official Manufacturer Warranty" : "Офіційна гарантія виробника"}</h3>
              <p>
                {isEn
                  ? "All electronic devices and accessories sold by NovaShop are genuine, officially imported, and covered by standard manufacturer warranty from 12 to 36 months."
                  : "Кожен товар має офіційну гарантію від виробника терміном від 12 до 36 місяців з гарантійним талоном установленого зразка."}
              </p>
              <div className="info-card-meta">
                <div className="info-card-meta-row">
                  <span>{isEn ? "Coverage:" : "Термін:"}</span>
                  <strong style={{ color: "var(--nv-accent)" }}>12 – 36 {isEn ? "months" : "місяців"}</strong>
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-top">
                <div className="info-card-icon"><i className="fa-solid fa-rotate-left"></i></div>
                <span className="info-badge info-badge-blue">14 {isEn ? "Days Return" : "Днів на обмін"}</span>
              </div>
              <h3>{isEn ? "14-Day Money Back Guarantee" : "Повернення та обмін 14 днів"}</h3>
              <p>
                {isEn
                  ? "Under the Ukrainian Consumer Protection Law, you can exchange or return any product within 14 days if it has not been used and original packaging is preserved."
                  : "Відповідно до Закону України «Про захист прав споживачів», ви можете обміняти або повернути товар належної якості протягом 14 днів без зайвих питань."}
              </p>
              <div className="info-card-meta">
                <div className="info-card-meta-row">
                  <span>{isEn ? "Refund speed:" : "Термін повернення коштів:"}</span>
                  <strong>1 – 3 {isEn ? "banking days" : "банківські дні"}</strong>
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-top">
                <div className="info-card-icon"><i className="fa-solid fa-screwdriver-wrench"></i></div>
                <span className="info-badge">{isEn ? "Service" : "Сервіс"}</span>
              </div>
              <h3>{isEn ? "120+ Authorized Service Centers" : "Мережа авторизованих сервісів"}</h3>
              <p>
                {isEn
                  ? "Need repair? Access over 120 certified service centers nationwide or send the device to NovaShop support free of charge via postal courier."
                  : "Понад 120 авторизованих сервісних центрів по Україні. Безкоштовна пересилка несправного пристрою через Нову Пошту для діагностики."}
              </p>
              <div className="info-card-meta">
                <div className="info-card-meta-row">
                  <span>{isEn ? "Shipping for warranty:" : "Доставка на ремонт:"}</span>
                  <strong style={{ color: "var(--nv-accent)" }}>0 ₴ ({isEn ? "covered by NovaShop" : "за рахунок магазину"})</strong>
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-top">
                <div className="info-card-icon"><i className="fa-solid fa-shield-virus"></i></div>
                <span className="info-badge info-badge-green">Nova Care+</span>
              </div>
              <h3>{isEn ? "Nova Care+ Extended Protection" : "Розширена програма Nova Care+"}</h3>
              <p>
                {isEn
                  ? "Optional comprehensive protection covering accidental screen drops, liquid spills, and instant gadget replacement during repair."
                  : "Додатковий захист вашого девайсу від випадкового розбиття дисплею, потрапляння рідини або миттєва видача підмінного фонду."}
              </p>
              <div className="info-card-meta">
                <div className="info-card-meta-row">
                  <span>{isEn ? "Replacement device:" : "Підмінний пристрій:"}</span>
                  <strong>{isEn ? "Provided immediately" : "Надається на час ремонту"}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Return Steps */}
          <h2 className="info-section-title">
            <i className="fa-solid fa-list-check" style={{ color: "var(--nv-accent)" }}></i>
            {isEn ? "How to return or exchange a product" : "Як повернути або обміняти товар (4 прості кроки)"}
          </h2>
          <div className="info-steps-grid">
            <div className="info-step-card">
              <div className="info-step-number">01</div>
              <h4>{isEn ? "Check conditions" : "Перевірте стан"}</h4>
              <p>{isEn ? "Ensure device is in mint condition without scratches, original box and accessories intact." : "Товар не повинен мати слідів використання, заводські плівки та пломби збережені."}</p>
            </div>
            <div className="info-step-card">
              <div className="info-step-number">02</div>
              <h4>{isEn ? "Contact support" : "Залиште заявку"}</h4>
              <p>{isEn ? "Call our hotline or submit request in your profile/chat with assistant Nova." : "Зателефонуйте на гарячу лінію або напишіть у чат асистенту Нова для отримання номера повернення."}</p>
            </div>
            <div className="info-step-card">
              <div className="info-step-number">03</div>
              <h4>{isEn ? "Send the package" : "Надішліть посилку"}</h4>
              <p>{isEn ? "Send via Nova Poshta or bring it directly to our Kyiv showroom." : "Надішліть товар Новою Поштою або принесіть особисто до флагманського шоуруму в Києві."}</p>
            </div>
            <div className="info-step-card">
              <div className="info-step-number">04</div>
              <h4>{isEn ? "Receive refund/replacement" : "Отримайте кошти"}</h4>
              <p>{isEn ? "Refund processed to your card within 1-3 days after warehouse inspection." : "Повернення коштів на вашу картку або відправка нового пристрою протягом 1–3 днів."}</p>
            </div>
          </div>
        </section>
      )}

      {/* TAB CONTENT: ABOUT US */}
      {activeTab === "about" && (
        <section className="info-tab-content">
          <div className="info-card" style={{ marginBottom: "32px", padding: "36px" }}>
            <span className="info-badge info-badge-green" style={{ marginBottom: "12px" }}>
              {isEn ? "Next-Gen E-Commerce" : "Інтернет-магазин нового покоління"}
            </span>
            <h2 style={{ fontSize: "28px", fontWeight: "900", margin: "0 0 16px", color: "var(--nv-text)" }}>
              {isEn ? "Empowering Your Digital Lifestyle with NovaShop" : "NovaShop — майбутнє розумного та комфортного онлайн-шопінгу"}
            </h2>
            <p style={{ fontSize: "16px", lineHeight: "1.7", color: "var(--nv-muted)", margin: "0 0 20px" }}>
              {isEn
                ? "Founded with a passion for future technologies, NovaShop combines an expansive catalog of certified gadgets with lightning-fast delivery and personalized shopping guidance. We believe finding the right laptop, smartphone, or smart device should be inspiring and effortless."
                : "NovaShop створений для тих, хто цінує якість, технологічність і свій час. Ми об'єднали понад 10 000 сертифікованих товарів від провідних світових брендів, швидку логістику та штучний інтелект Нова, що допомагає підібрати ідеальну техніку під будь-який бюджет і задачі."}
            </p>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <Link to="/catalog" className="nv-btn nv-btn-primary">
                <i className="fa-solid fa-boxes-stacked"></i> {isEn ? "Explore Catalog" : "Перейти до каталогу"}
              </Link>
              <Link to="/assistant" className="nv-btn nv-btn-ghost">
                <i className="fa-solid fa-wand-magic-sparkles"></i> {isEn ? "Meet AI Assistant Nova" : "Познайомитись з асистентом Нова"}
              </Link>
            </div>
          </div>

          {/* Stats Counters */}
          <div className="info-stats-grid">
            <div className="info-stat-box">
              <div className="info-stat-value">50,000+</div>
              <div className="info-stat-label">{isEn ? "Happy Customers" : "Задоволених покупців"}</div>
            </div>
            <div className="info-stat-box">
              <div className="info-stat-value">10,000+</div>
              <div className="info-stat-label">{isEn ? "Certified Products" : "Оригінальних товарів"}</div>
            </div>
            <div className="info-stat-box">
              <div className="info-stat-value">99.4%</div>
              <div className="info-stat-label">{isEn ? "Positive Reviews" : "Позитивних відгуків"}</div>
            </div>
            <div className="info-stat-box">
              <div className="info-stat-value">24 / 7</div>
              <div className="info-stat-label">{isEn ? "Support & AI Assistance" : "Підтримка та AI-помічник"}</div>
            </div>
          </div>

          {/* Key Advantages */}
          <h2 className="info-section-title">
            <i className="fa-solid fa-award" style={{ color: "var(--nv-accent)" }}></i>
            {isEn ? "Why Customers Choose NovaShop" : "Чому обирають NovaShop"}
          </h2>
          <div className="info-grid">
            <div className="info-card">
              <div className="info-card-icon"><i className="fa-solid fa-check-double"></i></div>
              <h3>{isEn ? "100% Genuine Guarantee" : "Прямі контракти з брендами"}</h3>
              <p>{isEn ? "Direct supplies from authorized distributors of Apple, ASUS, Samsung, Sony, Lenovo, Xiaomi." : "Працюємо виключно з офіційними дистриб'юторами техніки. Жодних підробок чи 'сірих' пристроїв."}</p>
            </div>
            <div className="info-card">
              <div className="info-card-icon"><i className="fa-solid fa-bolt"></i></div>
              <h3>{isEn ? "Ultra-Fast Dispatch" : "Швидкість відправки"}</h3>
              <p>{isEn ? "Own modern fulfillment warehouse ensures 95% of orders ship within 2 hours of payment." : "Власний логістичний центр дозволяє комплектувати та передавати перевізнику 95% замовлень за 2 години."}</p>
            </div>
            <div className="info-card">
              <div className="info-card-icon"><i className="fa-solid fa-robot"></i></div>
              <h3>{isEn ? "AI-Powered Experience" : "Інтелектуальний підбір"}</h3>
              <p>{isEn ? "Our AI-assistant Nova analyzes specs, comparisons, and customer ratings in real time." : "Штучний інтелект Нова допоможе порівняти характеристики, знайти найкращу ціну та відповість на запитання."}</p>
            </div>
            <div className="info-card">
              <div className="info-card-icon"><i className="fa-solid fa-leaf"></i></div>
              <h3>{isEn ? "Eco & Trade-In Support" : "Турбота про довкілля та Trade-In"}</h3>
              <p>{isEn ? "Recycle your old gadgets and receive bonuses toward your new high-tech gear." : "Програма обміну старих гаджетів Trade-In та правильна утилізація відпрацьованих акумуляторів."}</p>
            </div>
          </div>
        </section>
      )}

      {/* TAB CONTENT: CONTACTS */}
      {activeTab === "contacts" && (
        <section className="info-tab-content">
          <div className="info-contacts-layout">
            <div>
              <div className="info-contact-cards">
                <div className="info-contact-card">
                  <div className="label"><i className="fa-solid fa-phone" style={{ color: "var(--nv-accent)" }}></i> {isEn ? "Hotline" : "Гаряча лінія"}</div>
                  <a href="tel:+380637417980" className="val">+380 63 741 79 80</a>
                  <div style={{ fontSize: "12px", color: "var(--nv-muted)", marginTop: "4px" }}>{isEn ? "Multi-channel, free" : "Багатоканальний"}</div>
                </div>

                <div className="info-contact-card">
                  <div className="label"><i className="fa-solid fa-envelope" style={{ color: "var(--nv-accent)" }}></i> {isEn ? "Email Support" : "Електронна пошта"}</div>
                  <a href="mailto:nova444shop@gmail.com" className="val">nova444shop@gmail.com</a>
                  <div style={{ fontSize: "12px", color: "var(--nv-muted)", marginTop: "4px" }}>support@novashop.ua</div>
                </div>

                <div className="info-contact-card">
                  <div className="label"><i className="fa-solid fa-location-dot" style={{ color: "var(--nv-accent)" }}></i> {isEn ? "Showroom" : "Шоурум і видача"}</div>
                  <div className="val">{isEn ? "Kyiv, Khreshchatyk 24" : "Київ, вул. Хрещатик, 24"}</div>
                  <div style={{ fontSize: "12px", color: "var(--nv-muted)", marginTop: "4px" }}>{isEn ? "Metro Khreshchatyk" : "ст. м. Хрещатик"}</div>
                </div>

                <div className="info-contact-card">
                  <div className="label"><i className="fa-solid fa-clock" style={{ color: "var(--nv-accent)" }}></i> {isEn ? "Working Hours" : "Графік роботи"}</div>
                  <div className="val">{isEn ? "Mon–Sun: 09:00 – 20:00" : "Пн–Нд: 09:00 – 20:00"}</div>
                  <div style={{ fontSize: "12px", color: "var(--nv-accent)", marginTop: "4px" }}>{isEn ? "Online orders 24/7" : "Онлайн-замовлення 24/7"}</div>
                </div>
              </div>

              {/* Showroom info card */}
              <div className="info-card" style={{ marginBottom: "20px" }}>
                <h3 style={{ marginBottom: "10px" }}>
                  <i className="fa-solid fa-store" style={{ color: "var(--nv-accent)", marginRight: "8px" }}></i>
                  {isEn ? "Flagship NovaShop Showroom & Hub" : "Флагманський шоурум NovaShop у Києві"}
                </h3>
                <p style={{ margin: "0 0 14px" }}>
                  {isEn
                    ? "Experience cutting-edge gadgets in person! Visit our cyber-lounge showroom to test smartphones, try gaming laptops, apply screen protectors, or pick up online orders."
                    : "Завітайте до нашого сучасного простору в серці столиці: огляд і тестування ноутбуків, консультації експертів, поклейка захисного скла та безкоштовний самовивіз."}
                </p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <a
                    href="https://maps.google.com/?q=Khreshchatyk+24+Kyiv"
                    target="_blank"
                    rel="noreferrer"
                    className="nv-btn nv-btn-ghost"
                    style={{ fontSize: "13px", padding: "8px 16px" }}
                  >
                    <i className="fa-solid fa-map-location-dot"></i> {isEn ? "Open in Google Maps" : "Відкрити на карті"}
                  </a>
                  <a
                    href="https://t.me/"
                    target="_blank"
                    rel="noreferrer"
                    className="nv-btn nv-btn-ghost"
                    style={{ fontSize: "13px", padding: "8px 16px" }}
                  >
                    <i className="fa-brands fa-telegram"></i> Telegram
                  </a>
                </div>
              </div>
            </div>

            {/* Contact / Feedback Form */}
            <div className="info-form-card">
              <h3>{isEn ? "Send Us a Message" : "Напишіть нам повідомлення"}</h3>
              <p>{isEn ? "Have a question or feedback? We reply within 15 minutes." : "Маєте запитання чи пропозицію? Наш консультант відповість протягом 15 хвилин."}</p>

              {formSubmitted ? (
                <div className="info-form-success">
                  <i className="fa-solid fa-circle-check" style={{ fontSize: "24px" }}></i>
                  <div>
                    <strong>{isEn ? "Thank you!" : "Дякуємо за звернення!"}</strong>
                    <div style={{ fontSize: "13px", marginTop: "2px" }}>
                      {isEn ? "Your message has been received. Our manager will contact you shortly." : "Ваше повідомлення успішно надіслано. Менеджер зв'яжеться з вами найближчим часом."}
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit}>
                  <div className="info-form-field">
                    <label>{isEn ? "Your Name *" : "Ваше ім'я *"}</label>
                    <input
                      type="text"
                      required
                      placeholder={isEn ? "e.g. Alex" : "Наприклад: Олександр"}
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="info-form-field">
                      <label>{isEn ? "Phone *" : "Телефон *"}</label>
                      <input
                        type="tel"
                        required
                        placeholder="+380 XX XXX XX XX"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="info-form-field">
                      <label>Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="info-form-field">
                    <label>{isEn ? "Topic" : "Тема звернення"}</label>
                    <select
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    >
                      <option value="consultation">{isEn ? "Product Consultation" : "Консультація щодо товару"}</option>
                      <option value="delivery">{isEn ? "Delivery & Payment" : "Доставка та оплата"}</option>
                      <option value="warranty">{isEn ? "Warranty & Returns" : "Гарантія та повернення"}</option>
                      <option value="partnership">{isEn ? "B2B & Partnership" : "Корпоративні замовлення / Співпраця"}</option>
                      <option value="other">{isEn ? "Other question" : "Інше питання"}</option>
                    </select>
                  </div>

                  <div className="info-form-field">
                    <label>{isEn ? "Message *" : "Текст повідомлення *"}</label>
                    <textarea
                      rows={4}
                      required
                      placeholder={isEn ? "Write your inquiry here..." : "Опишіть ваше запитання або побажання..."}
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                    ></textarea>
                  </div>

                  <button type="submit" className="nv-btn nv-btn-primary" style={{ width: "100%", padding: "14px" }}>
                    <i className="fa-solid fa-paper-plane"></i> {isEn ? "Send Message" : "Надіслати повідомлення"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      {/* TAB CONTENT: NEWS */}
      {activeTab === "news" && (
        <section className="info-tab-content">
          {/* Tag filters */}
          <div className="info-news-filters">
            {[
              { id: "all", label: isEn ? "All News" : "Всі новини" },
              { id: "promo", label: isEn ? "Promotions" : "Акції та знижки" },
              { id: "update", label: isEn ? "Store Updates" : "Оновлення магазину" },
              { id: "tech", label: isEn ? "Tech Insights" : "Гаджети та огляди" }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                className={`info-filter-chip${newsTag === f.id ? " active" : ""}`}
                onClick={() => setNewsTag(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* News articles grid */}
          <div className="info-news-grid">
            {[
              {
                id: 1,
                tag: "update",
                tagLabel: isEn ? "AI & Tech" : "AI та інновації",
                date: "15.11.2026",
                readTime: isEn ? "3 min read" : "3 хв читання",
                title: isEn ? "Nova 2.0 AI Assistant Launched at NovaShop" : "Запуск оновленого AI-помічника Нова 2.0 у NovaShop",
                excerpt: isEn
                  ? "Meet the upgraded neural model capable of matching tech by complex requirements, real-time stock checks, and smart price comparisons."
                  : "Зустрічайте оновлений штучний інтелект: підбір техніки за параметрами, швидкий аналіз наявності та порівняння цін у прямому ефірі.",
                content: isEn
                  ? "We are thrilled to present Nova 2.0 — our proprietary AI assistant trained on extensive product catalogs. Nova understands natural language questions like 'Find me a gaming laptop with RTX graphics under 40,000 ₴' and instantly provides verified options. Test Nova today via the floating chat button!"
                  : "Ми раді представити Nova 2.0 — персонального консультанта нового покоління. Тепер Нова розуміє розмовні запити на кшталт 'Порадь ультрабук для програмування до 35 000 грн', аналізує відгуки покупців та допомагає оформити замовлення без черг. Спробуйте прямо зараз!"
              },
              {
                id: 2,
                tag: "promo",
                tagLabel: isEn ? "Promotion" : "Спецпропозиція",
                date: "12.11.2026",
                readTime: isEn ? "2 min read" : "2 хв читання",
                title: isEn ? "Nova Black Weekend: Up to 40% Off Laptops & Gadgets" : "Nova Black Weekend: Знижки до 40% на флагманські ноутбуки та гаджети",
                excerpt: isEn
                  ? "Exclusive seasonal discount festival across smartphones, smartwatches, acoustics, and PC gaming peripherals."
                  : "Сезонний розпродаж у NovaShop: грандіозні знижки на топові моделі смартфонів, бездротові навушники та геймерську периферію.",
                content: isEn
                  ? "Take advantage of our biggest seasonal event! Over 500 items are participating in the Nova Black Weekend with discounts up to 40%. All promotional items include full official manufacturer warranty and free delivery across Ukraine for orders over 1500 ₴."
                  : "Не пропустіть головну подію місяця! Понад 500 товарів зі знижками до -40%. До кожного акційного товару додається офіційна гарантія та діє безкоштовна доставка Новою Поштою. Акція діє до закінчення складських залишків."
              },
              {
                id: 3,
                tag: "update",
                tagLabel: isEn ? "Showroom" : "Відкриття",
                date: "08.11.2026",
                readTime: isEn ? "4 min read" : "4 хв читання",
                title: isEn ? "NovaShop Opens Flagship Cyber Showroom in Kyiv" : "NovaShop відкриває новий інтерактивний шоурум у центрі Києва",
                excerpt: isEn
                  ? "A new high-tech experiential hub on Khreshchatyk featuring open gadget test zones, express pick-up, and gaming stations."
                  : "Інноваційний простір на Хрещатику, 24: відкрита тестова зона новинок електроніки, express-видача замовлень за 5 хвилин і кібер-лаунж.",
                content: isEn
                  ? "Our flagship store at Khreshchatyk 24 is now officially open! We have created an experiential space where you can get hands-on with the latest flagship devices, test display color accuracy, listen to Hi-Fi audio gear, and enjoy complimentary coffee while our technicians set up your new device."
                  : "Запрошуємо до нашого флагманського магазину за адресою вул. Хрещатик, 24! Це не просто пункт видачі, а справжній простір для техно-ентузіастів: тестуйте флагмани до покупки, клейте преміальне бронескло та отримуйте професійні консультації наших експертів."
              },
              {
                id: 4,
                tag: "tech",
                tagLabel: isEn ? "Review" : "Огляд техніки",
                date: "03.11.2026",
                readTime: isEn ? "5 min read" : "5 хв читання",
                title: isEn ? "Top 5 Ultra-Light Laptops for Remote Work and Travel" : "ТОП-5 ультрабуків 2026 для віддаленої роботи та подорожей",
                excerpt: isEn
                  ? "Detailed comparison of battery stamina, weight under 1.2kg, and OLED display brightness for digital nomads."
                  : "Детальний розбір моделей з вагою до 1.2 кг, автономністю понад 14 годин та захищеними OLED-екранами.",
                content: isEn
                  ? "Looking for an ultra-portable workstation? We benchmarked the five leading lightweight laptops of 2026 across battery life under heavy multitasking, keyboard ergonomics, and outdoor screen readability. Explore our top picks with special discount bundles in the NovaShop catalog."
                  : "Шукаєте надійний лептоп для частих поїздок та роботи з кав'ярень? Наші експерти протестували п'ять лідерів ринку з OLED-матрицями, процесорами з низьким енергоспоживанням та тривалою автономністю. Перегляньте готові комплекти в нашому каталозі зі знижкою!"
              },
              {
                id: 5,
                tag: "promo",
                tagLabel: isEn ? "Cashback" : "Кешбек",
                date: "28.10.2026",
                readTime: isEn ? "2 min read" : "2 хв читання",
                title: isEn ? "5% Instant Cashback on Monobank & NovaPay Payments" : "Кешбек 5% на бонусний рахунок при оплаті через Monobank та NovaPay",
                excerpt: isEn
                  ? "Earn bonus points directly in your NovaShop account and save on your next gadget upgrades."
                  : "Отримуйте приємні бонуси на власний баланс NovaShop та використовуйте їх для 100% оплати наступних аксесуарів.",
                content: isEn
                  ? "Every online order paid using Monobank or NovaPay now awards 5% cashback directly into your NovaShop personal account balance. Accumulated bonus points do not expire and can be applied toward any future purchases."
                  : "Купуйте ще вигідніше! Оплачуйте замовлення карткою Monobank або через NovaPay та отримуйте 5% кешбеку на бонусний рахунок у профілі NovaShop. Бонуси можна використовувати для оплати до 100% вартості нових покупок."
              },
              {
                id: 6,
                tag: "tech",
                tagLabel: isEn ? "Guide" : "Гід покупця",
                date: "20.10.2026",
                readTime: isEn ? "4 min read" : "4 хв читання",
                title: isEn ? "Smart Home Automation: Getting Started Without Breaking the Bank" : "Розумний дім: з чого почати автоматизацію оселі без великих витрат",
                excerpt: isEn
                  ? "Essential guide to smart sockets, climate sensors, and Zigbee hubs that bring comfort to your apartment."
                  : "Гід з вибору розумних розеток, датчиків мікроклімату та бездротових хабів для комфортного та безпечного житла.",
                content: isEn
                  ? "Smart living is easier than ever. In this guide, we break down essential devices for smart energy management, automated light scenes, and security alerts that you can install in under an hour without specialized tools."
                  : "Створити затишний та енергоефективний простір набагато простіше, ніж здається. Ми зібрали базовий стартовий набір датчиків, реле та розумних ламп, які легко налаштувати зі смартфона за 15 хвилин. Усі компоненти доступні в категорії 'Розумний дім' NovaShop."
              }
            ]
              .filter(art => newsTag === "all" || art.tag === newsTag)
              .map(article => (
                <article className="info-news-card" key={article.id}>
                  <div className="info-news-thumb">
                    <div className="info-news-thumb-icon">
                      <i className={`fa-solid ${article.tag === "promo" ? "fa-tags" : article.tag === "tech" ? "fa-laptop-code" : "fa-bullhorn"}`}></i>
                    </div>
                  </div>
                  <div className="info-news-body">
                    <div className="info-news-meta">
                      <span className="info-badge info-badge-green">{article.tagLabel}</span>
                      <span><i className="fa-regular fa-calendar"></i> {article.date}</span>
                      <span><i className="fa-regular fa-clock"></i> {article.readTime}</span>
                    </div>
                    <h3>{article.title}</h3>
                    <p>{article.excerpt}</p>
                    <button
                      type="button"
                      className="info-news-btn"
                      onClick={() => setSelectedArticle(article)}
                    >
                      {isEn ? "Read Full Story" : "Читати повністю"} <i className="fa-solid fa-arrow-right"></i>
                    </button>
                  </div>
                </article>
              ))}
          </div>

          {/* Article Modal */}
          {selectedArticle && (
            <div className="info-modal-backdrop" onClick={() => setSelectedArticle(null)}>
              <div className="info-modal" onClick={e => e.stopPropagation()}>
                <button
                  type="button"
                  className="info-modal-close"
                  onClick={() => setSelectedArticle(null)}
                  aria-label="Close"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
                <div className="info-news-meta" style={{ marginBottom: "14px" }}>
                  <span className="info-badge info-badge-green">{selectedArticle.tagLabel}</span>
                  <span><i className="fa-regular fa-calendar"></i> {selectedArticle.date}</span>
                  <span><i className="fa-regular fa-clock"></i> {selectedArticle.readTime}</span>
                </div>
                <h2 style={{ fontSize: "24px", fontWeight: "800", margin: "0 0 16px", color: "var(--nv-text)" }}>
                  {selectedArticle.title}
                </h2>
                <div style={{ fontSize: "15px", lineHeight: "1.7", color: "var(--nv-muted)", marginBottom: "24px" }}>
                  <p>{selectedArticle.excerpt}</p>
                  <p>{selectedArticle.content}</p>
                </div>
                <button
                  type="button"
                  className="nv-btn nv-btn-primary"
                  onClick={() => setSelectedArticle(null)}
                >
                  {isEn ? "Close" : "Зрозуміло"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
