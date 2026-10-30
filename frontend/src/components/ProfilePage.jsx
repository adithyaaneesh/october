
import OrderTimeline from "./OrderTimeline";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  LogOut,
  Package,
  UserRound,
  Pencil,
  X,
  Save,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
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

  // Edit profile state.
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [profileForm, setProfileForm] = useState({
    username: user?.username || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
  });

  // Change password state.
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

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
            onTokensUpdated: () => {
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

  // Handle profile form changes.
  const handleProfileChange = (event) => {
    setProfileForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  // Save profile details.
  const handleSaveProfile = async (event) => {
    event.preventDefault();

    setSavingProfile(true);
    setProfileMessage("");
    setProfileError("");

    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/accounts/profile/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: profileForm.username.trim(),
            first_name: profileForm.first_name.trim(),
            last_name: profileForm.last_name.trim(),
            email: profileForm.email.trim(),
          }),
        },
        {
          onTokensUpdated: () => {
            console.log("Access token refreshed successfully.");
          },
          onSessionExpired: () => {
            setProfileError(
              "Your session has expired. Please log in again."
            );
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const messages = Object.entries(data)
          .filter(([key]) => key !== "message")
          .map(([key, value]) => {
            const details = Array.isArray(value)
              ? value.join(" ")
              : typeof value === "string"
                ? value
                : JSON.stringify(value);

            return `${key}: ${details}`;
          });

        throw new Error(
          messages.join("\n") || "Unable to update your profile."
        );
      }

      setProfileForm(data.user);
      setProfileMessage("Your profile has been updated successfully.");
      setIsEditingProfile(false);

      // Synchronize the updated user with App.jsx.
      window.dispatchEvent(
        new CustomEvent("october:profile-updated", {
          detail: data.user,
        })
      );
    } catch (err) {
      setProfileError(err.message || "Unable to update your profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle password form changes.
  const handlePasswordChange = (event) => {
    setPasswordForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  // Submit a password change request.
  const handleSavePassword = async (event) => {
    event.preventDefault();

    setSavingPassword(true);
    setPasswordMessage("");
    setPasswordError("");

    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/accounts/change-password/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(passwordForm),
        },
        {
          onTokensUpdated: () => {
            console.log("Access token refreshed successfully.");
          },
          onSessionExpired: () => {
            setPasswordError(
              "Your session has expired. Please log in again."
            );
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const messages = Object.entries(data)
          .map(([key, value]) => {
            const details = Array.isArray(value)
              ? value.join(" ")
              : typeof value === "string"
                ? value
                : JSON.stringify(value);

            return `${key}: ${details}`;
          });

        throw new Error(
          messages.join("\n") || "Unable to change your password."
        );
      }

      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      setShowPasswords({
        current: false,
        new: false,
        confirm: false,
      });

      setIsChangingPassword(false);
      setPasswordMessage(
        "Password changed successfully. For security, log out and sign in again."
      );
    } catch (err) {
      setPasswordError(
        err.message || "Unable to change your password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

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

      {/* Personal information and profile editing. */}
      <section className="profile-card">
        <div className="profile-card-title profile-card-title-actions">
          <div className="profile-card-heading">
            <UserRound size={22} />
            <h2>Personal information</h2>
          </div>

          {!isEditingProfile && (
            <button
              type="button"
              className="edit-profile-button"
              onClick={() => {
                setProfileForm({
                  username: user?.username || "",
                  first_name: user?.first_name || "",
                  last_name: user?.last_name || "",
                  email: user?.email || "",
                });
                setProfileMessage("");
                setProfileError("");
                setIsEditingProfile(true);
              }}
            >
              <Pencil size={15} /> Edit profile
            </button>
          )}
        </div>

        {profileMessage && (
          <p className="profile-success" role="status">
            {profileMessage}
          </p>
        )}

        {profileError && (
          <p className="profile-error" role="alert">
            {profileError}
          </p>
        )}

        {isEditingProfile ? (
          <form className="profile-edit-form" onSubmit={handleSaveProfile}>
            <label>
              Username
              <input
                name="username"
                value={profileForm.username}
                onChange={handleProfileChange}
                required
                autoComplete="username"
              />
            </label>

            <label>
              First name
              <input
                name="first_name"
                value={profileForm.first_name}
                onChange={handleProfileChange}
                autoComplete="given-name"
              />
            </label>

            <label>
              Last name
              <input
                name="last_name"
                value={profileForm.last_name}
                onChange={handleProfileChange}
                autoComplete="family-name"
              />
            </label>

            <label>
              Email
              <input
                type="email"
                name="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                autoComplete="email"
              />
            </label>

            <div className="profile-edit-actions">
              <button
                type="submit"
                className="profile-save-button"
                disabled={savingProfile}
              >
                <Save size={16} />
                {savingProfile ? "Saving..." : "Save changes"}
              </button>

              <button
                type="button"
                className="profile-cancel-edit-button"
                disabled={savingProfile}
                onClick={() => {
                  setIsEditingProfile(false);
                  setProfileError("");
                  setProfileForm({
                    username: user?.username || "",
                    first_name: user?.first_name || "",
                    last_name: user?.last_name || "",
                    email: user?.email || "",
                  });
                }}
              >
                <X size={16} /> Cancel
              </button>
            </div>
          </form>
        ) : (
          <dl className="profile-details">
            <div>
              <dt>Username</dt>
              <dd>{user?.username}</dd>
            </div>

            <div>
              <dt>Full name</dt>
              <dd>
                {[user?.first_name, user?.last_name]
                  .filter(Boolean)
                  .join(" ") || "Not provided"}
              </dd>
            </div>

            <div>
              <dt>Email</dt>
              <dd>{user?.email || "Not provided"}</dd>
            </div>

            <div>
              <dt>Account ID</dt>
              <dd>{user?.id}</dd>
            </div>
          </dl>
        )}
      </section>

      {/* Change password. */}
      <section className="profile-card">
        <div className="profile-card-title profile-card-title-actions">
          <div className="profile-card-heading">
            <KeyRound size={22} />
            <h2>Account Security</h2>
          </div>

          {!isChangingPassword && (
            <button
              type="button"
              className="edit-profile-button"
              onClick={() => {
                setPasswordForm({
                  current_password: "",
                  new_password: "",
                  confirm_password: "",
                });
                setPasswordMessage("");
                setPasswordError("");
                setIsChangingPassword(true);
              }}
            >
              <KeyRound size={15} /> Change password
            </button>
          )}
        </div>

        {passwordMessage && (
          <p className="profile-success" role="status">
            {passwordMessage}
          </p>
        )}

        {passwordError && (
          <p className="profile-error" role="alert">
            {passwordError}
          </p>
        )}

        {isChangingPassword && (
          <form
            className="profile-edit-form password-edit-form"
            onSubmit={handleSavePassword}
          >
            {[
              {
                name: "current_password",
                label: "Current password",
                key: "current",
              },
              {
                name: "new_password",
                label: "New password",
                key: "new",
              },
              {
                name: "confirm_password",
                label: "Confirm new password",
                key: "confirm",
              },
            ].map((field) => (
              <label key={field.name}>
                {field.label}

                <span className="password-input-wrap">
                  <input
                    type={
                      showPasswords[field.key] ? "text" : "password"
                    }
                    name={field.name}
                    value={passwordForm[field.name]}
                    onChange={handlePasswordChange}
                    required
                    autoComplete={
                      field.key === "current"
                        ? "current-password"
                        : "new-password"
                    }
                  />

                  <button
                    type="button"
                    className="password-visibility-button"
                    aria-label={
                      showPasswords[field.key]
                        ? `Hide ${field.label.toLowerCase()}`
                        : `Show ${field.label.toLowerCase()}`
                    }
                    onClick={() =>
                      setShowPasswords((previous) => ({
                        ...previous,
                        [field.key]: !previous[field.key],
                      }))
                    }
                  >
                    {showPasswords[field.key] ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </span>
              </label>
            ))}

            <p className="password-help-text">
              Choose a strong password that meets the password requirements.
            </p>

            <div className="profile-edit-actions">
              <button
                type="submit"
                className="profile-save-button"
                disabled={savingPassword}
              >
                <Save size={16} />
                {savingPassword ? "Updating..." : "Update password"}
              </button>

              <button
                type="button"
                className="profile-cancel-edit-button"
                disabled={savingPassword}
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordError("");
                  setPasswordForm({
                    current_password: "",
                    new_password: "",
                    confirm_password: "",
                  });
                  setShowPasswords({
                    current: false,
                    new: false,
                    confirm: false,
                  });
                }}
              >
                <X size={16} /> Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Existing order history. */}
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

                  <span className={`profile-status status-${orderStatus}`}>
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
                          <strong>
                            {order.courier_name || "Not assigned yet"}
                          </strong>
                        </p>

                        <p>
                          <span>Tracking number</span>
                          <strong>
                            {order.tracking_number || "Not available yet"}
                          </strong>
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
                        <span>
                          Size: {item.product_size || "Not specified"}
                        </span>
                        <span>
                          Condition: {item.product_condition || "Not specified"}
                        </span>
                        <span>Quantity: {item.quantity}</span>
                      </div>

                      <div className="profile-product-price">
                        <strong>
                          ₹{Number(item.price_at_purchase).toFixed(2)}
                        </strong>
                        <span>
                          Subtotal: ₹{Number(item.subtotal).toFixed(2)}
                        </span>
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

      {/* Existing ordered-product details modal. */}
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
              <p className="profile-eyebrow">
                OCTOBER · THRIFT AND CREATE
              </p>

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
                  <dd>
                    {selectedProduct.product_category || "Not specified"}
                  </dd>
                </div>

                <div>
                  <dt>Size</dt>
                  <dd>
                    {selectedProduct.product_size || "Not specified"}
                  </dd>
                </div>

                <div>
                  <dt>Condition</dt>
                  <dd>
                    {selectedProduct.product_condition || "Not specified"}
                  </dd>
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
