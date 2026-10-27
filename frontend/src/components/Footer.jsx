
const Footer = () => {
  return (
    <footer className="site-footer" id="story">
      <a href="#home" className="footer-brand">
        OCTOBER
      </a>

      <p>THRIFT AND CREATE</p>

      <span>Clothes with a past. Creations with a future.</span>

      <a
        href="https://instagram.com/october.tnc/"
        target="_blank"
        rel="noreferrer"
        aria-label="Instagram"
      >
        Instagram
      </a>

      <small>
        © {new Date().getFullYear()} OCTOBER. Made with care.
      </small>
    </footer>
  );
};

export default Footer;
