import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Cart() {
  const { t, tProduct, formatPrice, cart, changeQuantity, removeFromCart } = useApp();

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">{t("cart")}</h1>

        <div className="cart-wrapper">
          <div className="cart-items">
            {cart.length === 0 ? (
              <h2>{t("cartEmpty")}</h2>
            ) : (
              cart.map(product => (
                <div className="cart-item" key={product.id}>
                  <img src={product.thumbnail} alt={tProduct(product)} />
                  <div className="cart-item-info">
                    <h3 className="cart-item-title">{tProduct(product)}</h3>
                    <div className="cart-item-price">{formatPrice(product.price)}</div>
                  </div>
                  <div className="quantity">
                    <button onClick={() => changeQuantity(product.id, -1)}>-</button>
                    <span>{product.quantity}</span>
                    <button onClick={() => changeQuantity(product.id, 1)}>+</button>
                  </div>
                  <button className="remove-cart" onClick={() => removeFromCart(product.id)}>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="cart-summary">
            <h2>{t("yourOrder")}</h2>

            <div className="summary-row">
              <span>{t("products")}</span>
              <strong className="cart-total-count">{totalCount}</strong>
            </div>

            <div className="summary-row">
              <span>{t("sum")}</span>
              <strong className="cart-total-price">{formatPrice(totalPrice)}</strong>
            </div>

            <Link to="/checkout" className="btn checkout-btn">{t("checkout")}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
