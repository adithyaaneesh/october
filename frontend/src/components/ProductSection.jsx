
import { useEffect, useState } from "react";
import { ArrowRight, Heart } from "lucide-react";

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

const ProductSection = ({ onAddToCart }) => {
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from Django.
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

  const toggleFavorite = (id) => {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
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

        <div className="product-grid">
          {displayProducts.map((product, index) => (
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
                  onClick={() => toggleFavorite(product.id)}
                  aria-label={
                    favorites.includes(product.id)
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                >
                  <Heart
                    size={20}
                    fill={
                      favorites.includes(product.id)
                        ? "currentColor"
                        : "none"
                    }
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
