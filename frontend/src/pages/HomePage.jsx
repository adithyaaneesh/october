import HeroSection from "../components/HeroSection";
import ProductSection from "../components/ProductSection";
import CreateSection from "../components/CreateSection";
import StitchingForm from "../components/StitchingForm";

const HomePage = ({
  onAddToCart,
  loggedInUser,
  accessToken,
  onOpenAuth,
}) => {
  return (
    <main>
      <HeroSection />
      <ProductSection
        onAddToCart={onAddToCart}
        loggedInUser={loggedInUser}
        accessToken={accessToken}
        onOpenAuth={onOpenAuth}
      />
      <CreateSection />
      <StitchingForm />
    </main>
  );
};

export default HomePage;
