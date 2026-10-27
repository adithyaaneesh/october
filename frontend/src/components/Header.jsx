
import { Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";

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

  return (
    <header className="site-header">
      <a className="brand" href="#home" aria-label="October home">
        <span className="brand-name">OCTOBER</span>
        <span className="brand-divider" />
        <span className="brand-subtitle">THRIFT AND CREATE</span>
      </a>

      <button
        className="mobile-menu"
        onClick={() => setMenuOpen((open) => !open)}
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
