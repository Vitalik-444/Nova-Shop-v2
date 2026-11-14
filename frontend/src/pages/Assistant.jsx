import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

const ABILITIES = [
  { icon: "fa-magnifying-glass", title: "aiAbility1Title", text: "aiAbility1Text" },
  { icon: "fa-tags", title: "aiAbility2Title", text: "aiAbility2Text" },
  { icon: "fa-box-open", title: "aiAbility3Title", text: "aiAbility3Text" },
  { icon: "fa-wand-magic-sparkles", title: "aiAbility4Title", text: "aiAbility4Text" },
  { icon: "fa-layer-group", title: "aiAbility5Title", text: "aiAbility5Text" },
  { icon: "fa-language", title: "aiAbility6Title", text: "aiAbility6Text" },
];

const GALLERY = [
  "/images/nova-office.jpg",
  "/images/nova-portrait.jpg",
];

export default function Assistant() {
  const { t } = useApp();

  // відкриває існуючий чат-віджет (public/js/assistant.js)
  const openChat = (promptText) => {
    const btn = document.getElementById("nova-assistant-btn");
    const win = document.getElementById("nova-assistant-window");
    if (btn && !(win && win.classList.contains("open"))) btn.click();
    if (typeof promptText === "string" && promptText) {
      setTimeout(() => {
        const input = document.querySelector(".nova-assistant-input");
        if (input) {
          input.value = promptText;
          input.focus();
        }
      }, 150);
    }
  };

  return (
    <div className="container ai-page">
      <section className="ai-hero">
        <div className="ai-hero-text">
          <span className="ai-badge">{t("aiBadge")}</span>
          <h1>{t("aiTitle")}</h1>
          <p>{t("aiIntro")}</p>
          <div className="ai-hero-actions">
            <button type="button" className="ai-btn" onClick={openChat}>
              <i className="fa-solid fa-comments"></i> {t("aiStartChat")}
            </button>
            <Link to="/catalog" className="ai-btn ai-btn-ghost">{t("goCatalog")}</Link>
          </div>
        </div>
        <div className="ai-hero-photo">
          <img src="/images/nova-full.jpg" alt="Nova — AI" loading="lazy" />
        </div>
      </section>

      <section>
        <h2 className="ai-section-title">{t("aiCanTitle")}</h2>
        <div className="ai-grid">
          {ABILITIES.map((a) => (
            <div className="ai-card" key={a.title}>
              <div className="ai-card-icon"><i className={`fa-solid ${a.icon}`}></i></div>
              <h3>{t(a.title)}</h3>
              <p>{t(a.text)}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="ai-section-title">{t("aiExamplesTitle")}</h2>
        <div className="ai-examples">
          {["aiEx1", "aiEx2", "aiEx3", "aiEx4"].map((k) => (
            <button type="button" className="ai-chip" key={k} onClick={() => openChat(t(k))}>
              “{t(k)}”
            </button>
          ))}
        </div>
      </section>

      <section className="ai-gallery">
        {GALLERY.map((src) => (
          <img key={src} src={src} alt="Nova" loading="lazy" />
        ))}
      </section>
    </div>
  );
}
