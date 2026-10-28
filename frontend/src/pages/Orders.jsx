import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { getOrders } from "../api";
import { formatOrderDate } from "../utils/format";

export const ORDER_STATUS_LABELS = {
  new: "statusNew",
  processing: "statusProcessing",
  shipped: "statusShipped",
  completed: "statusCompleted",
  cancelled: "statusCancelled"
};

export default function Orders() {
  const { t, language, formatPrice } = useApp();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    getOrders().then(setOrders);
  }, []);

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">{t("ordersTitle")}</h1>

        <div className="orders-list">
          {orders === null && <p className="empty-message">{t("loading")}</p>}

          {orders && orders.length === 0 && <h2 className="empty-message">{t("noOrders")}</h2>}

          {orders && orders.map(order => (
            <div className="order-card" key={order.id}>
              <div className="order-card-header">
                <div>
                  <h3>{t("order", { id: order.id })}</h3>
                  <p className="order-date">{formatOrderDate(order.created_at, language)}</p>
                </div>

                <span className={`order-status order-status-${order.status}`}>
                  {ORDER_STATUS_LABELS[order.status] ? t(ORDER_STATUS_LABELS[order.status]) : order.status}
                </span>
              </div>

              <div className="order-items">
                {order.items.map((item, index) => (
                  <div className="order-item-row" key={index}>
                    <span className="order-item-title">{item.title}</span>
                    <span className="order-item-qty">{item.quantity} {t("pcs")}</span>
                    <span className="order-item-price">{formatPrice(item.price * item.quantity)}$</span>
                  </div>
                ))}
              </div>

              <div className="order-card-footer">
                <span>{t("total")}</span>
                <span className="order-total">{formatPrice(order.total)}$</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
