
import { useEffect, useState } from "react";
import { ArrowRight, Heart } from "lucide-react";
import { authenticatedFetch } from "../utils/authFetch";

const API_URL = "http://127.0.0.1:8000";

const sampleProducts = [
  {
    id: "sample-1",
    name: "Vintage Denim Jacket",
    price: "650.00",
    category: "Jackets",
    size: "M",
    condition: "Very Good",
    image: "",
  },
  {
    id: "sample-2",
    name: "Classic Linen Shirt",
    price: "450.00",
    category: "Shirts",
    size: "L",
    condition: "Good",
    image: "",
  },
  {
    id: "sample-3",
    name: "Floral Summer Dress",
    price: "780.00",
    category: "Dresses",
    size: "S",
    condition: "Excellent",
    image: "",
  },
];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));

const ProductSection = ({
  onAddToCart,
  loggedInUser,
  accessToken,
  onOpenAuth,
}) => {
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState("");

  // Fetch available products from Django.
  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/products/`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Could not fetch products");
        }

        const data = await response.json();
        const items = Array.isArray(data) ? data : data.results || [];

        setProducts(items);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Product API error:", error);
          setProducts([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => controller.abort();
  }, []);

  // Load the logged-in user's saved products.
  useEffect(() => {
    let cancelled = false;

    const fetchWishlist = async () => {
      setFavorites([]);
      setWishlistError("");

      if (!loggedInUser || !accessToken) {
        return;
      }

      try {
        const response = await authenticatedFetch(
          `${API_URL}/api/products/wishlist/`,
          {},
          {
            onSessionExpired: () => {
              setWishlistError("Your session has expired. Please log in again.");
            },
          }
        );

        if (!response.ok) {
          throw new Error("Could not load your wishlist.");
        }

        const data = await response.json();

        if (!cancelled) {
          setFavorites(data.map((item) => item.product));
        }
      } catch (error) {
        if (!cancelled) {
          setWishlistError(error.message || "Could not load your wishlist.");
        }
      }
    };

    fetchWishlist();

    return () => {
      cancelled = true;
    };
  }, [loggedInUser, accessToken]);

  // Add or remove a product from the database wishlist.
  const toggleFavorite = async (product) => {
    if (!loggedInUser || !accessToken) {
      onOpenAuth();
      return;
    }

    if (!Number.isInteger(product.id)) {
      setWishlistError("Preview products cannot be saved. Add real products in Django Admin.");
      return;
    }

    if (wishlistLoading) {
      return;
    }

    const isFavorite = favorites.includes(product.id);

    setWishlistLoading(true);
    setWishlistError("");

    try {
      const response = isFavorite
        ? await authenticatedFetch(
            `${API_URL}/api/products/wishlist/${product.id}/`,
            { method: "DELETE" },
            {
              onSessionExpired: () => {
                setWishlistError("Your session has expired. Please log in again.");
              },
            }
          )
        : await authenticatedFetch(
            `${API_URL}/api/products/wishlist/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ product_id: product.id }),
            },
            {
              onSessionExpired: () => {
                setWishlistError("Your session has expired. Please log in again.");
              },
            }
          );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Could not update your wishlist."
        );
      }

      setFavorites((current) =>
        isFavorite
          ? current.filter((id) => id !== product.id)
          : current.includes(product.id)
            ? current
            : [...current, product.id]
      );
    } catch (error) {
      setWishlistError(error.message || "Could not update your wishlist.");
    } finally {
      setWishlistLoading(false);
    }
  };

  const displayProducts = products.length ? products : sampleProducts;

  return (
    <section className="thrift-section" id="thrift">
      <div className="section-intro">
        <p className="eyebrow">THE THRIFT EDIT</p>
        <h2>Good clothes, a second life.</h2>
        <p>
          Carefully curated pre-loved pieces that are full of character,
          ready for their next story.
        </p>
        <span className="text-link">
          OUR COLLECTION <ArrowRight size={16} />
        </span>
      </div>

      <div className="product-area">
        {loading && (
          <p className="loading-message">Finding lovely pieces...</p>
        )}

        {!loading && products.length === 0 && (
          <p className="demo-notice">
            Preview products are shown below. Add products in Django Admin
            to display your real inventory.
          </p>
        )}

        {wishlistError && (
          <p className="wishlist-message" role="alert">
            {wishlistError}
          </p>
        )}

        <div className="product-grid">
          {displayProducts.map((product, index) => {
            const isFavorite = favorites.includes(product.id);

            return (
              <article className="product-card" key={product.id}>
                <div className="product-image">
                  {product.image ? (
                    <img
                      src={
                        product.image.startsWith("http")
                          ? product.image
                          : `${API_URL}${product.image}`
                      }
                      alt={product.name}
                    />
                  ) : (
                    <div
                      className={`product-placeholder placeholder-${index % 3}`}
                    >
                      <span>OCTOBER</span>
                      <span>PRE-LOVED</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="favorite-button"
                    onClick={() => toggleFavorite(product)}
                    disabled={wishlistLoading}
                    aria-pressed={isFavorite}
                    aria-label={
                      isFavorite
                        ? `Remove ${product.name} from wishlist`
                        : `Add ${product.name} to wishlist`
                    }
                    title={
                      isFavorite
                        ? "Remove from wishlist"
                        : "Save to wishlist"
                    }
                  >
                    <Heart
                      size={20}
                      fill={isFavorite ? "currentColor" : "none"}
                    />
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
                    onClick={() => onAddToCart(product)}
                    disabled={
                      !Number.isInteger(product.id) ||
                      product.is_available !== true ||
                      product.stock_quantity < 1
                    }
                  >
                    {!Number.isInteger(product.id)
                      ? "Add product in Admin"
                      : product.is_available && product.stock_quantity > 0
                        ? "Add to Bag"
                        : "Sold Out"}
                  </button>

                  <a
                    className="product-enquire"
                    href={
                      "https://wa.me/?text=" +
                      encodeURIComponent(
                        `Hi OCTOBER! Is "${product.name}" (${money(
                          product.price
                        )}) available?`
                      )
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    ENQUIRE ON WHATSAPP <ArrowRight size={14} />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
