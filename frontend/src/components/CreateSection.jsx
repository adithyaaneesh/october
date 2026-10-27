
import { Heart, Leaf, ArrowRight, Scissors } from "lucide-react";

const CreateSection = () => {
  return (
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
        <div>
          <Scissors />
          <span>
            <strong>CUSTOM FIT</strong>
            <small>Made for your style</small>
          </span>
        </div>

        <div>
          <Heart />
          <span>
            <strong>YOUR DESIGN</strong>
            <small>Traditional or modern</small>
          </span>
        </div>

        <div>
          <Leaf />
          <span>
            <strong>MADE WITH CARE</strong>
            <small>Thoughtful details</small>
          </span>
        </div>
      </div>
    </section>
  );
};

export default CreateSection;
