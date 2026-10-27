
import { ArrowRight, Heart, Scissors, Leaf } from "lucide-react";

const HeroSection = () => {
  return (
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
          <span>
            <Leaf /> SUSTAINABLE CHOICES
          </span>

          <span>
            <Heart /> ONE-OF-A-KIND PIECES
          </span>

          <span>
            <Scissors /> MADE FOR YOU
          </span>
        </div>
      </div>

      <div
        className="hero-image"
        role="img"
        aria-label="Curated vintage clothing"
      >
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
  );
};

export default HeroSection;
