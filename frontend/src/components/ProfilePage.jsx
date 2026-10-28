import OrderTimeline from "./OrderTimeline";
import { useEffect, useState } from "react";
import { ArrowLeft, LogOut, Package, UserRound } from "lucide-react";
import "./ProfilePage.css";

const API_URL = "http://127.0.0.1:8000";

const ProfilePage = ({ user, accessToken, onBack, onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  // Load orders belonging to the logged-in user.
  useEffect(() => {
    const controller = new AbortController();

    const loadOrders = async () => {
      try {
        const response = await fetch(`${API_URL}/api/orders/my/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        });

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
      const response = await fetch(
        `${API_URL}/api/orders/${orderId}/cancel/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
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
                <div className="profile-order-items">
                  {order.items.map((item, index) => (
                    <p key={`${order.id}-${item.product}-${index}`}>
                      {item.product_name} × {item.quantity}
                      <span>₹{Number(item.subtotal).toFixed(2)}</span>
                    </p>
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
    </main>
  );
};

export default ProfilePage;
