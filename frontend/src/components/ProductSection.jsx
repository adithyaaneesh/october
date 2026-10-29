
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Heart,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
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

const categories = [
  { value: "tops", label: "Tops" },
  { value: "shirts", label: "Shirts" },
  { value: "trousers", label: "Trousers" },
  { value: "dresses", label: "Dresses" },
  { value: "jackets", label: "Jackets" },
  { value: "skirts", label: "Skirts" },
  { value: "accessories", label: "Accessories" },
  { value: "other", label: "Other" },
];

const sizes = ["XS", "S", "M", "L", "XL", "XXL", "FREE"];

const emptyFilters = {
  search: "",
  category: "",
  size: "",
  min_price: "",
  max_price: "",
  sort: "newest",
};

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

  // Values currently entered in the search and filter controls.
  const [filters, setFilters] = useState(emptyFilters);

  // Filters are sent to Django when the customer applies them.
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [filterError, setFilterError] = useState("");

  const hasActiveFilters = Object.values(appliedFilters).some(
    (value) => value.trim() !== ""
  );

  // Fetch products from Django using the applied filters.
  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      setLoading(true);
      setFilterError("");

      try {
        const params = new URLSearchParams();

        Object.entries(appliedFilters).forEach(([key, value]) => {
          if (value.trim() !== "") {
            params.set(key, value.trim());
          }
        });

        const queryString = params.toString();
        const url = queryString
          ? `${API_URL}/api/products/?${queryString}`
          : `${API_URL}/api/products/`;

        const response = await fetch(url, {
          signal: controller.signal,
        });

        const data = await response.json().catch(() => []);

        if (!response.ok) {
          const message =
            data && typeof data === "object" && !Array.isArray(data)
              ? Object.values(data).flat().join(" ")
              : "Could not fetch products.";

          throw new Error(message || "Could not fetch products.");
        }

        const items = Array.isArray(data)
          ? data
          : data.results || [];

        setProducts(items);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Product API error:", error);
          setProducts([]);
          setFilterError(
            error.message || "Unable to load products. Please try again."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => controller.abort();
  }, [appliedFilters]);

  // Load the logged-in customer's saved products.
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
              setWishlistError(
                "Your session has expired. Please log in again."
              );
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
          setWishlistError(
            error.message || "Could not load your wishlist."
          );
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
      setWishlistError(
        "Preview products cannot be saved. Add real products in Django Admin."
      );
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
                setWishlistError(
                  "Your session has expired. Please log in again."
                );
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
                setWishlistError(
                  "Your session has expired. Please log in again."
                );
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
      setWishlistError(
        error.message || "Could not update your wishlist."
      );
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));

    setFilterError("");
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();
    setFilterError("");

    const minPrice =
      filters.min_price.trim() === ""
        ? null
        : Number(filters.min_price);

    const maxPrice =
      filters.max_price.trim() === ""
        ? null
        : Number(filters.max_price);

    if (
      minPrice !== null &&
      (!Number.isFinite(minPrice) || minPrice < 0)
    ) {
      setFilterError("Enter a valid minimum price.");
      return;
    }

    if (
      maxPrice !== null &&
      (!Number.isFinite(maxPrice) || maxPrice < 0)
    ) {
      setFilterError("Enter a valid maximum price.");
      return;
    }

    if (
      minPrice !== null &&
      maxPrice !== null &&
      minPrice > maxPrice
    ) {
      setFilterError(
        "Minimum price cannot be greater than maximum price."
      );
      return;
    }

    setAppliedFilters({ ...filters });
  };

  const handleClearFilters = () => {
    setFilters({ ...emptyFilters });
    setAppliedFilters({ ...emptyFilters });
    setFilterError("");
  };

  // Preview products are shown only when no filters are active
  // and the real inventory is empty.
  const displayProducts =
    products.length > 0
      ? products
      : !hasActiveFilters && !filterError
        ? sampleProducts
        : [];

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
        {/* Search and filter controls */}
        <form
          className="product-filters"
          onSubmit={handleApplyFilters}
        >
          <div className="product-search">
            <Search size={20} aria-hidden="true" />

            <input
              type="search"
              name="search"
              placeholder="Search by product name..."
              value={filters.search}
              onChange={handleFilterChange}
              aria-label="Search products by name"
            />
          </div>

          <div className="filter-heading">
            <SlidersHorizontal size={18} />
            <span>Find your perfect piece</span>
          </div>

          <div className="filter-controls">
            <label className="filter-field">
              <span>Category</span>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option
                    key={category.value}
                    value={category.value}
                  >
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="filter-field">
              <span>Size</span>
              <select
                name="size"
                value={filters.size}
                onChange={handleFilterChange}
              >
                <option value="">All sizes</option>
                {sizes.map((size) => (
                  <option key={size} value={size}>
                    {size === "FREE" ? "Free Size" : size}
                  </option>
                ))}
              </select>
            </label>

            <label className="filter-field">
              <span>Minimum price (₹)</span>
              <input
                type="number"
                name="min_price"
                min="0"
                step="0.01"
                placeholder="e.g. 300"
                value={filters.min_price}
                onChange={handleFilterChange}
              />
            </label>

            <label className="filter-field">
              <span>Maximum price (₹)</span>
              <input
                type="number"
                name="max_price"
                min="0"
                step="0.01"
                placeholder="e.g. 1000"
                value={filters.max_price}
                onChange={handleFilterChange}
              />
            </label>
            <label className="filter-field">
              <span>Sort By</span>
              <select
                name="sort"
                value={filters.sort}
                onChange={handleFilterChange}
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A-Z</option>
              </select>
            </label>
          </div>

          {filterError && (
            <p className="filter-error" role="alert">
              {filterError}
            </p>
          )}

          <div className="filter-actions">
            <button
              type="submit"
              className="apply-filters-button"
            >
              <Search size={16} />
              Apply Filters
            </button>

            <button
              type="button"
              className="clear-filters-button"
              onClick={handleClearFilters}
              disabled={
                !hasActiveFilters &&
                Object.values(filters).every((value) => value === "")
              }
            >
              <X size={16} />
              Clear Filters
            </button>
          </div>
        </form>

        {loading && (
          <p className="loading-message">
            Finding lovely pieces...
          </p>
        )}

        {filterError && (
          <p className="filter-error" role="alert">
            {filterError}
          </p>
        )}

        {!loading &&
          !filterError &&
          products.length === 0 &&
          !hasActiveFilters && (
            <p className="demo-notice">
              Preview products are shown below. Add products in Django
              Admin to display your real inventory.
            </p>
          )}

        {!loading &&
          !filterError &&
          products.length === 0 &&
          hasActiveFilters && (
            <div className="no-products-message">
              <Search size={28} />
              <h3>No pieces found</h3>
              <p>
                Try another name, category, size, or price range.
              </p>
              <button
                type="button"
                className="clear-filters-button"
                onClick={handleClearFilters}
              >
                <X size={16} />
                Clear Filters
              </button>
            </div>
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
                      : product.is_available &&
                          product.stock_quantity > 0
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
