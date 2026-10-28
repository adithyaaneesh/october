
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Heart, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { authenticatedFetch } from "../utils/authFetch";

const API_URL = "http://127.0.0.1:8000";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));

const WishlistPage = ({ user, accessToken, onAddToCart, onOpenAuth }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadWishlist = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await authenticatedFetch(
          `${API_URL}/api/products/wishlist/`,
          {},
          {
            onSessionExpired: () => {
              setError("Your session has expired. Please log in again.");
            },
          }
        );

        if (!response.ok) {
          throw new Error("Could not load your wishlist.");
        }

        const data = await response.json();

        if (!cancelled) {
          setItems(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (user && accessToken) {
      loadWishlist();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [user, accessToken]);

  const removeFromWishlist = async (productId) => {
    setError("");

    try {
      const response = await authenticatedFetch(
        `${API_URL}/api/products/wishlist/${productId}/`,
        { method: "DELETE" },
        {
          onSessionExpired: () => {
            setError("Your session has expired. Please log in again.");
          },
        }
      );

      if (!response.ok) {
        throw new Error("Could not remove this product.");
      }

      setItems((current) =>
        current.filter((item) => item.product !== productId)
      );
    } catch (err) {
      setError(err.message || "Could not remove this product.");
    }
  };

  if (!user || !accessToken) {
    return (
      <main className="wishlist-page">
        <div className="wishlist-empty">
          <Heart size={36} />
          <h1>Your wishlist awaits</h1>
          <p>Log in to view and save your favourite pre-loved pieces.</p>
          <button
            type="button"
            className="add-to-cart-button"
            onClick={onOpenAuth}
          >
            Login / Register
          </button>
          <Link to="/" className="wishlist-back-link">
            <ArrowLeft size={16} /> Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="wishlist-page">
      <div className="wishlist-heading">
        <p className="eyebrow">YOUR PERSONAL EDIT</p>
        <h1>My Wishlist</h1>
        <p>Pieces you've saved for another day.</p>
      </div>

      {error && (
        <p className="wishlist-message" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="loading-message">Loading your saved pieces...</p>
      ) : items.length === 0 ? (
        <div className="wishlist-empty">
          <Heart size={36} />
          <h2>No saved pieces just yet</h2>
          <p>When something catches your eye, tap the heart to save it here.</p>
          <Link to="/" className="wishlist-shop-link">
            Explore the collection <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {items.map((item) => {
            const product = item.product_details;

            if (!product) return null;

            const imageUrl = product.image
              ? product.image.startsWith("http")
                ? product.image
                : `${API_URL}${product.image}`
              : null;

            const inStock =
              product.is_available === true &&
              product.stock_quantity > 0;

            return (
              <article className="product-card" key={item.id}>
                <div className="product-image">
                  {imageUrl ? (
                    <img src={imageUrl} alt={product.name} />
                  ) : (
                    <div className="product-placeholder placeholder-0">
                      <span>OCTOBER</span>
                      <span>PRE-LOVED</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="favorite-button"
                    onClick={() => removeFromWishlist(item.product)}
                    aria-label={`Remove ${product.name} from wishlist`}
                    title="Remove from wishlist"
                  >
                    <Heart size={20} fill="currentColor" />
                  </button>
                </div>

                <div className="product-info">
                  <div className="product-title-row">
                    <h3>{product.name}</h3>
                    <span>{money(product.price)}</span>
                  </div>

                  <p>
                    {product.category_display || product.category}
                    &nbsp; | &nbsp; SIZE {product.size}
                  </p>

                  <p className="condition">
                    {product.condition_display ||
                      product.condition?.replaceAll("_", " ")}
                  </p>

                  <button
                    type="button"
                    className="add-to-cart-button"
                    disabled={!inStock}
                    onClick={() => onAddToCart(product)}
                  >
                    <ShoppingBag size={16} />
                    {inStock ? "Add to Bag" : "Sold Out"}
                  </button>

                  <button
                    type="button"
                    className="wishlist-remove-button"
                    onClick={() => removeFromWishlist(item.product)}
                  >
                    Remove from wishlist
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Link to="/" className="wishlist-back-link">
        <ArrowLeft size={16} /> Continue shopping
      </Link>
    </main>
  );
};

export default WishlistPage;
