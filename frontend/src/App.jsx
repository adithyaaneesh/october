import { useEffect, useState } from "react";
import {
  ArrowRight,
  Heart,
  Menu,
  ShoppingBag,
  Scissors,
  Leaf,
  MessageCircle,
  X,
} from "lucide-react";
import "./App.css";
import StitchingForm from "./components/StitchingForm";

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

const App = () => {
  const [products, setProducts] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const whatsappLink =
    "https://wa.me/?text=" +
    encodeURIComponent(
      "Hi OCTOBER! I would like to know more about your custom stitching service."
    );

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#home" aria-label="October home">
          <span className="brand-name">OCTOBER</span>
          <span className="brand-divider" />
          <span className="brand-subtitle">THRIFT AND CREATE</span>
        </a>

        <button
          className="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav className={menuOpen ? "navigation open" : "navigation"}>
          <a href="#thrift" onClick={() => setMenuOpen(false)}>
            THRIFT
          </a>
          <a href="#create" onClick={() => setMenuOpen(false)}>
            CREATE
          </a>
          <a href="#story" onClick={() => setMenuOpen(false)}>
            OUR STORY
          </a>
        </nav>

        <a href="#thrift" className="header-bag" aria-label="Shop thrift">
          <ShoppingBag size={21} strokeWidth={1.5} />
        </a>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <p className="eyebrow">A DIFFERENT KIND OF WARDROBE</p>
            <h1>
              Pre-loved finds.
              <br />
              Made-for-you pieces.
            </h1>
            <p className="hero-description">
              Thoughtful thrift finds and custom creations,
              for a more personal and sustainable wardrobe.
            </p>

            <div className="hero-actions">
              <a href="#thrift" className="button button-dark">
                EXPLORE THRIFT <ArrowRight size={16} />
              </a>
              <a href="#create" className="button button-outline">
                CREATE YOUR OWN
              </a>
            </div>

            <div className="hero-values">
              <span><Leaf /> SUSTAINABLE CHOICES</span>
              <span><Heart /> ONE-OF-A-KIND PIECES</span>
              <span><Scissors /> MADE FOR YOU</span>
            </div>
          </div>

          <div className="hero-image" role="img" aria-label="Curated vintage clothing">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=85"
              alt="Clothing collection in a boutique"
            />
            <div className="hero-image-label">
              <span>GOOD CLOTHES,</span>
              <span>BRIGHTER DAYS.</span>
            </div>
          </div>
        </section>

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
                      <div className={`product-placeholder placeholder-${index % 3}`}>
                        <span>OCTOBER</span>
                        <span>PRE-LOVED</span>
                      </div>
                    )}

                    <button
                      className="favorite-button"
                      onClick={() => toggleFavorite(product.id)}
                      aria-label="Toggle favorite"
                    >
                      <Heart
                        size={20}
                        fill={favorites.includes(product.id) ? "currentColor" : "none"}
                      />
                    </button>
                  </div>

                  <div className="product-info">
                    <div className="product-title-row">
                      <h3>{product.name}</h3>
                      <span>{money(product.price)}</span>
                    </div>
                    <p>
                      {product.category_display || product.category} &nbsp; | &nbsp;
                      SIZE {product.size}
                    </p>
                    <p className="condition">
                      {product.condition_display ||
                        product.condition?.replaceAll("_", " ")}
                    </p>
                    <a
                      className="product-enquire"
                      href={
                        "https://wa.me/?text=" +
                        encodeURIComponent(
                          `Hi OCTOBER! Is "${product.name}" (${money(product.price)}) available?`
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

        <section className="create-section" id="create">
          <div className="create-image">
            <img
              src="https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1200&q=85"
              alt="Creative workspace for designing and making clothes"
              loading="lazy"
            />
          </div>

          <div className="create-copy">
            <p className="eyebrow">YOUR VISION, OUR CRAFT</p>
            <h2>Your idea. Our hands.</h2>
            <p>
              Have something special in mind? Tell us your style, share your
              measurements and design ideas, and let's create something
              that feels like you.
            </p>
            <a href="#stitching" className="button button-dark">
              START YOUR CREATION <ArrowRight size={16} />
            </a>
          </div>

          <div className="create-features">
            <div><Scissors /><span><strong>CUSTOM FIT</strong><small>Made for your style</small></span></div>
            <div><Heart /><span><strong>YOUR DESIGN</strong><small>Traditional or modern</small></span></div>
            <div><Leaf /><span><strong>MADE WITH CARE</strong><small>Thoughtful details</small></span></div>
          </div>
        </section>

        <StitchingForm />
      </main>

      <footer className="site-footer" id="story">
        <a href="#home" className="footer-brand">OCTOBER</a>
        <p>THRIFT AND CREATE</p>
        <span>Clothes with a past. Creations with a future.</span>
        <a
          href="https://instagram.com/"
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram"
        >
          Instagram
        </a>

        <small>© {new Date().getFullYear()} OCTOBER. Made with care.</small>
      </footer>
    </div>
  );
};

export default App;
