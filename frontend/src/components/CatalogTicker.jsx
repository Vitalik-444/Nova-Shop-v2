import { useApp } from "../context/AppContext";

const TICKER_CONFIG = [
  { icon: "fa-solid fa-fire", key: "tickerItem1" },
  { icon: "fa-solid fa-truck-fast", key: "tickerItem2" },
  { icon: "fa-solid fa-shield-halved", key: "tickerItem3" },
  { icon: "fa-solid fa-gift", key: "tickerItem4" },
  { icon: "fa-solid fa-star", key: "tickerItem5" }
];

export default function CatalogTicker() {
  const { t } = useApp();

  // Duplicate items for continuous seamless marquee loop
  const displayItems = [...TICKER_CONFIG, ...TICKER_CONFIG];

  return (
    <div className="catalog-ticker" role="marquee" aria-label={t("tickerBadge")}>
      <div className="catalog-ticker-badge">
        <span className="ticker-pulse-dot" aria-hidden="true"></span>
        <i className="fa-solid fa-bolt" aria-hidden="true"></i>
        <span>{t("tickerBadge")}</span>
      </div>

      <div className="catalog-ticker-track-wrap">
        <div className="catalog-ticker-track">
          {displayItems.map((item, idx) => (
            <span key={idx} className="catalog-ticker-item">
              <i className={item.icon} aria-hidden="true"></i>
              <span>{t(item.key)}</span>
              <span className="catalog-ticker-sep" aria-hidden="true">•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
