
import HeroSection from "../components/HeroSection";
import ProductSection from "../components/ProductSection";
import CreateSection from "../components/CreateSection";
import StitchingForm from "../components/StitchingForm";

const HomePage = ({ onAddToCart }) => {
  return (
    <main>
      <HeroSection />
      <ProductSection onAddToCart={onAddToCart} />
      <CreateSection />
      <StitchingForm />
    </main>
  );
};

export default HomePage;
