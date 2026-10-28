import OrderTimeline from "./OrderTimeline";
import { useEffect, useState } from "react";
import { ArrowLeft, LogOut, Package, UserRound } from "lucide-react";
import "./ProfilePage.css";
import { authenticatedFetch } from "../utils/authFetch";


const API_URL = "http://127.0.0.1:8000";

const ProfilePage = ({ user, accessToken, onBack, onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [expandedDeliveryOrders, setExpandedDeliveryOrders] = useState([]);

  // Load orders belonging to the logged-in user.
  useEffect(() => {
    const controller = new AbortController();

    const loadOrders = async () => {
      try {
        const response = await authenticatedFetch(
          `${API_URL}/api/orders/my/`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            signal: controller.signal,
          },
          {
            onTokensUpdated: (newToken) => {
              // The helper also saves this token to localStorage.
              // App state will be synchronized in our next step.
              console.log("Access token refreshed successfully.");
            },
            onSessionExpired: () => {
              setError("Your session has expired. Please log in again.");
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "Your session has expired. Please log in again."
              : "Unable to load your orders."
          );
        }

        const data = await response.json();

        setOrders(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    return () => controller.abort();
  }, [accessToken]);

  // Cancel an order.
  const handleCancelOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) return;

    setCancellingOrderId(orderId);

    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/orders/${orderId}/cancel/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
        {
          onTokensUpdated: () => {
            console.log("Access token refreshed successfully.");
          },
          onSessionExpired: () => {
            setError("Your session has expired. Please log in again.");
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Unable to cancel this order.");
        return;
      }

      // Update the order status immediately without reloading the page.
      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order.id === orderId
            ? { ...order, status: "cancelled" }
            : order
        )
      );

      alert("Your order has been cancelled successfully.");
    } catch (err) {
      console.error("Cancellation error:", err);
      alert("Unable to connect to the server. Please try again.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  return (
    <main className="profile-page">
      <button className="profile-back" onClick={onBack}>
        <ArrowLeft size={17} /> Back to store
      </button>

      <header className="profile-heading">
        <p className="profile-eyebrow">YOUR OCTOBER ACCOUNT</p>
        <h1>My Profile</h1>
        <p>Manage your account and keep track of your orders.</p>
      </header>

      <section className="profile-card">
        <div className="profile-card-title">
          <UserRound size={22} />
          <h2>Personal information</h2>
        </div>

        <dl className="profile-details">
          <div>
            <dt>Username</dt>
            <dd>{user.username}</dd>
          </div>

          <div>
            <dt>Full name</dt>
            <dd>
              {[user.first_name, user.last_name].filter(Boolean).join(" ") ||
                "Not provided"}
            </dd>
          </div>

          <div>
            <dt>Email</dt>
            <dd>{user.email || "Not provided"}</dd>
          </div>

          <div>
            <dt>Account ID</dt>
            <dd>{user.id}</dd>
          </div>
        </dl>
      </section>

      <section className="profile-orders">
        <div className="profile-card-title">
          <Package size={22} />
          <h2>My Orders</h2>
        </div>

        {loading && <p>Loading your orders...</p>}

        {error && <p className="profile-error">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <div className="profile-empty">
            <Package size={32} />
            <h3>No orders yet</h3>
            <p>Your orders will appear here after you place one.</p>
          </div>
        )}

        {!loading &&
          !error &&
          orders.map((order) => {
            const orderStatus = order.status?.toLowerCase();

            const canCancel = [
              "pending",
              "confirmed",
              "processing",
            ].includes(orderStatus);

            return (
              <article className="profile-order" key={order.id}>
                <div className="profile-order-header">
                  <div>
                    <strong>Order #{order.id}</strong>
                    <p>
                      {new Date(order.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>

                  <span
                    className={`profile-status status-${orderStatus}`}
                  >
                    {orderStatus?.replaceAll("_", " ")}
                  </span>
                </div>
                <OrderTimeline status={orderStatus} />     
                <section className="delivery-details-card">
                  <button
                    type="button"
                    className="delivery-details-toggle"
                    aria-expanded={expandedDeliveryOrders.includes(order.id)}
                    onClick={() => {
                      setExpandedDeliveryOrders((previous) =>
                        previous.includes(order.id)
                          ? previous.filter((id) => id !== order.id)
                          : [...previous, order.id]
                      );
                    }}
                  >
                    <span>Delivery Details</span>
                    <span className="delivery-toggle-action">
                      {expandedDeliveryOrders.includes(order.id)
                        ? "Hide details −"
                        : "View details +"}
                    </span>
                  </button>

                  {expandedDeliveryOrders.includes(order.id) && (
                    <div className="delivery-details-content">
                      <div className="delivery-details-grid">
                        <div>
                          <span>Customer</span>
                          <strong>{order.customer_name}</strong>
                        </div>

                        <div>
                          <span>Phone</span>
                          <strong>{order.phone_number}</strong>
                        </div>

                        <div>
                          <span>Email</span>
                          <strong>{order.email || "Not provided"}</strong>
                        </div>

                        <div className="delivery-address">
                          <span>Delivery address</span>
                          <strong>{order.delivery_address}</strong>
                        </div>
                      </div>

                      <div className="shipment-details">
                        <h4>Shipment Information</h4>

                        <p>
                          <span>Courier</span>
                          <strong>{order.courier_name || "Not assigned yet"}</strong>
                        </p>

                        <p>
                          <span>Tracking number</span>
                          <strong>{order.tracking_number || "Not available yet"}</strong>
                        </p>

                        <p>
                          <span>Shipped on</span>
                          <strong>
                            {order.shipped_at
                              ? new Date(order.shipped_at).toLocaleString("en-IN")
                              : "Not shipped yet"}
                          </strong>
                        </p>

                        <p>
                          <span>Delivered on</span>
                          <strong>
                            {order.delivered_at
                              ? new Date(order.delivered_at).toLocaleString("en-IN")
                              : "Not delivered yet"}
                          </strong>
                        </p>

                        {order.tracking_url && (
                          <a
                            href={order.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shipment-tracking-link"
                          >
                            Track shipment →
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </section>


                <div className="profile-order-items">
                  {order.items.map((item, index) => (
                    <button
                      type="button"
                      className="profile-product-item"
                      key={`${order.id}-${item.product}-${index}`}
                      onClick={() => setSelectedProduct(item)}
                      aria-label={`View details for ${item.product_name}`}
                    >
                      {item.product_image ? (
                        <img
                          className="profile-product-image"
                          src={item.product_image}
                          alt={item.product_name}
                        />
                      ) : (
                        <div className="profile-product-image profile-product-placeholder">
                          No image
                        </div>
                      )}
                      <div className="profile-product-info">
                        <strong>{item.product_name}</strong>
                        <span>Size: {item.product_size || "Not specified"}</span>
                        <span>Condition: {item.product_condition || "Not specified"}</span>
                        <span>Quantity: {item.quantity}</span>
                      </div>

                      <div className="profile-product-price">
                        <strong>₹{Number(item.price_at_purchase).toFixed(2)}</strong>
                        <span>Subtotal: ₹{Number(item.subtotal).toFixed(2)}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="profile-order-total">
                  <span>Order total</span>
                  <strong>
                    ₹{Number(order.total_amount).toFixed(2)}
                  </strong>
                </div>

                <p className="profile-order-note">
                  For payment and delivery updates, please contact our store
                  through WhatsApp.
                </p>

                {/* Show cancellation only for eligible order statuses. */}
                {canCancel && (
                  <button
                    type="button"
                    className="cancel-order-button"
                    disabled={cancellingOrderId === order.id}
                    onClick={() => handleCancelOrder(order.id)}
                  >
                    {cancellingOrderId === order.id
                      ? "Cancelling..."
                      : "Cancel Order"}
                  </button>
                )}
              </article>
            );
          })}
      </section>

      <button className="profile-logout" onClick={onLogout}>
        <LogOut size={17} /> Log out
      </button>
      
      {selectedProduct && (
        <div
          className="product-detail-overlay"
          onClick={() => setSelectedProduct(null)}
        >
          <section
            className="product-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="product-detail-close"
              onClick={() => setSelectedProduct(null)}
              aria-label="Close product details"
            >
              ×
            </button>

            {selectedProduct.product_image ? (
              <img
                className="product-detail-image"
                src={selectedProduct.product_image}
                alt={selectedProduct.product_name}
              />
            ) : (
              <div className="product-detail-image product-detail-placeholder">
                No image available
              </div>
            )}

            <div className="product-detail-content">
              <p className="profile-eyebrow">OCTOBER · THRIFT AND CREATE</p>
              <h2 id="product-detail-title">
                {selectedProduct.product_name}
              </h2>

              <p className="product-detail-price">
                ₹{Number(selectedProduct.price_at_purchase).toFixed(2)}
              </p>

              <p>
                {selectedProduct.product_description ||
                  "No description available."}
              </p>

              <dl className="product-detail-specs">
                <div>
                  <dt>Category</dt>
                  <dd>{selectedProduct.product_category || "Not specified"}</dd>
                </div>
                <div>
                  <dt>Size</dt>
                  <dd>{selectedProduct.product_size || "Not specified"}</dd>
                </div>
                <div>
                  <dt>Condition</dt>
                  <dd>{selectedProduct.product_condition || "Not specified"}</dd>
                </div>
                <div>
                  <dt>Quantity ordered</dt>
                  <dd>{selectedProduct.quantity}</dd>
                </div>
              </dl>
            </div>
          </section>
        </div>
      )}

    </main>
  );
};

export default ProfilePage;
