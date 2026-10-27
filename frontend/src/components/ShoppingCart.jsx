
import { useState } from "react";
import { Minus, Plus, Trash2, X, ShoppingBag } from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

// Add your business WhatsApp number later.
// Include country code, without + or spaces.
const BUSINESS_WHATSAPP = "";

const ShoppingCart = ({ cart, setCart, onClose }) => {
  const [customer, setCustomer] = useState({
    customer_name: "",
    phone_number: "",
    email: "",
    delivery_address: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successOrder, setSuccessOrder] = useState(null);

  const updateQuantity = (productId, change) => {
    setCart((previousCart) =>
      previousCart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                cartQuantity: Math.min(
                  item.stock_quantity,
                  item.cartQuantity + change
                ),
              }
            : item
        )
        .filter((item) => item.cartQuantity > 0)
    );
  };

  const removeItem = (productId) => {
    setCart((previousCart) =>
      previousCart.filter((item) => item.id !== productId)
    );
  };

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.cartQuantity,
    0
  );

  const handleChange = (event) => {
    setCustomer({
      ...customer,
      [event.target.name]: event.target.value,
    });
  };

  const handleCheckout = async (event) => {
    event.preventDefault();
    setError("");

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/orders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...customer,
          items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.cartQuantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          typeof data === "object"
            ? Object.values(data).flat(Infinity).join(" ")
            : "Unable to place your order.";

        throw new Error(message || "Unable to place your order.");
      }

      setSuccessOrder(data);
      setCart([]);

      // Refresh the product list so the displayed stock is current.
      window.dispatchEvent(new Event("products-updated"));
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  
    const continueToWhatsApp = () => {
    if (!BUSINESS_WHATSAPP) {
        setError(
        "WhatsApp is not configured yet. Please contact the store directly."
        );
        return;
    }

    const message = [
        `Hello OCTOBER! I have placed order #${successOrder.id}.`,
        "",
        "Please help me confirm payment and delivery details.",
        "",
        ...successOrder.items.map(
        (item) =>
            `${item.product_name} x ${item.quantity} — ₹${Number(
            item.subtotal
            ).toFixed(2)}`
        ),
        "",
        `Order total: ₹${Number(successOrder.total_amount).toFixed(2)}`,
        `Customer name: ${successOrder.customer_name}`,
        `Phone: ${successOrder.phone_number}`,
        "",
        "Please confirm the payment method, payment status and delivery arrangements with me.",
    ].join("\n");

    const whatsappUrl =
        `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(message)}`;

    window.open(
        whatsappUrl,
        "_blank",
        "noopener,noreferrer"
    );
    };


  return (
    <div className="cart-overlay">
      <section className="cart-panel" aria-label="Shopping cart">
        <header className="cart-header">
          <div>
            <p className="cart-eyebrow">OCTOBER | THRIFT AND CREATE</p>
            <h2>{successOrder ? "Order placed" : "Your shopping bag"}</h2>
          </div>

          <button
            type="button"
            className="cart-icon-button"
            onClick={onClose}
            aria-label="Close shopping cart"
          >
            <X size={22} />
          </button>
        </header>

        {successOrder ? (
          <div className="cart-success">
            <ShoppingBag size={36} />
            <h3>Thank you for your order!</h3>
            <p>Order number: #{successOrder.id}</p>
            <p>
              Total: ₹{Number(successOrder.total_amount).toFixed(2)}
            </p>
            
            <p>
            Your order request has been received! Thank you for choosing OCTOBER.
            Please click the WhatsApp button below to contact our store. We'll discuss and confirm your payment and delivery details with you directly.
            Your order will be confirmed and packed only after we have discussed and agreed on these details through WhatsApp.
            </p>
            {error && (
            <p className="cart-error" role="alert">
                {error}
            </p>
            )}
            
            <button
              type="button"
              className="cart-checkout-button"
              onClick={continueToWhatsApp}
            >
              Contact Our Store on WhatsApp
            </button>

            <button
              type="button"
              className="cart-secondary-button"
              onClick={onClose}
            >
              Continue shopping
            </button>
          </div>
        ) : cart.length === 0 ? (
          <div className="cart-empty">
            <ShoppingBag size={38} />
            <h3>Your bag is waiting</h3>
            <p>Discover something special from our thrift collection.</p>
            <button
              type="button"
              className="cart-checkout-button"
              onClick={onClose}
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item) => (
                <article className="cart-item" key={item.id}>
                  {item.image ? (
                    <img
                      className="cart-item-image"
                      src={
                        item.image.startsWith("http")
                          ? item.image
                          : `${API_URL}${item.image}`
                      }
                      alt={item.name}
                    />
                  ) : (
                    <div className="cart-item-placeholder">
                      <ShoppingBag size={24} />
                    </div>
                  )}

                  <div className="cart-item-details">
                    <h3>{item.name}</h3>
                    <p>₹{Number(item.price).toFixed(2)}</p>

                    <div className="cart-quantity">
                      <button
                        type="button"
                        aria-label={`Decrease ${item.name} quantity`}
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus size={14} />
                      </button>

                      <span>{item.cartQuantity}</span>

                      <button
                        type="button"
                        aria-label={`Increase ${item.name} quantity`}
                        disabled={
                          item.cartQuantity >= item.stock_quantity
                        }
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-end">
                    <strong>
                      ₹
                      {(
                        Number(item.price) * item.cartQuantity
                      ).toFixed(2)}
                    </strong>
                    <button
                      type="button"
                      className="cart-remove-button"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="cart-total">
              <span>Subtotal</span>
              <strong>₹{total.toFixed(2)}</strong>
            </div>

            <p className="cart-note">
              Final availability and delivery arrangements will be confirmed
              by OCTOBER. Payment is coordinated through WhatsApp.
            </p>

            <form className="cart-checkout-form" onSubmit={handleCheckout}>
              <h3>Delivery details</h3>

              <label>
                Full name
                <input
                  name="customer_name"
                  value={customer.customer_name}
                  onChange={handleChange}
                  required
                  maxLength={150}
                  autoComplete="name"
                />
              </label>

              <label>
                Phone number
                <input
                  name="phone_number"
                  value={customer.phone_number}
                  onChange={handleChange}
                  required
                  maxLength={20}
                  type="tel"
                  autoComplete="tel"
                />
              </label>

              <label>
                Email (optional)
                <input
                  name="email"
                  value={customer.email}
                  onChange={handleChange}
                  type="email"
                  autoComplete="email"
                />
              </label>

              <label>
                Delivery address
                <textarea
                  name="delivery_address"
                  value={customer.delivery_address}
                  onChange={handleChange}
                  required
                  autoComplete="street-address"
                  rows={3}
                />
              </label>

              {error && <p className="cart-error" role="alert">{error}</p>}

              <button
                type="submit"
                className="cart-checkout-button"
                disabled={loading}
              >
                {loading ? "Placing order..." : "Place order"}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
};

export default ShoppingCart;
