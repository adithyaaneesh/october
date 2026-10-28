
import { Menu, ShoppingBag, X, Heart } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const Header = ({
  loggedInUser,
  cart,
  onOpenProfile,
  onOpenAuth,
  onOpenCart,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const cartCount = cart.reduce(
    (sum, item) => sum + item.cartQuantity,
    0
  );

  const handleWishlistClick = () => {
    setMenuOpen(false);
  };

  return (
    <header className="site-header">
      <Link
        className="brand"
        to="/"
        aria-label="October home"
        onClick={handleWishlistClick}
      >
        <span className="brand-name">OCTOBER</span>
        <span className="brand-divider" />
        <span className="brand-subtitle">THRIFT AND CREATE</span>
      </Link>

      <button
        className="mobile-menu"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Toggle navigation"
      >
        {menuOpen ? <X /> : <Menu />}
      </button>

      <nav className={menuOpen ? "navigation open" : "navigation"}>
        <Link to="/#thrift" onClick={handleWishlistClick}>
          THRIFT
        </Link>
        <Link to="/#create" onClick={handleWishlistClick}>
          CREATE
        </Link>
        <Link to="/#story" onClick={handleWishlistClick}>
          OUR STORY
        </Link>

        <Link to="/wishlist" onClick={handleWishlistClick}>
          <Heart size={16} />
          WISHLIST
        </Link>
      </nav>

      <button
        type="button"
        onClick={loggedInUser ? onOpenProfile : onOpenAuth}
      >
        {loggedInUser
          ? `Hi, ${loggedInUser.first_name || loggedInUser.username}`
          : "Login / Register"}
      </button>

      <button
        type="button"
        onClick={onOpenCart}
        aria-label={`Open shopping cart, ${cartCount} items`}
      >
        <ShoppingBag size={20} />
        <span>{cartCount}</span>
      </button>
    </header>
  );
};

export default Header;
