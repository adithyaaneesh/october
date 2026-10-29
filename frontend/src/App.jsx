
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ShoppingCart from "./components/ShoppingCart";
import AuthPage from "./components/AuthPage";

import HomePage from "./pages/HomePage";
import ProfileRoute from "./pages/ProfileRoute";
import NotFoundPage from "./pages/NotFoundPage";
import WishlistPage from "./pages/WishlistPage";

const API_URL = "http://127.0.0.1:8000";

const App = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState([]);

  // Synchronize access-token updates across the application.
  useEffect(() => {
    const handleTokenUpdate = (event) => {
      setAccessToken(event.detail.accessToken);
    };

    window.addEventListener(
      "october:access-token-updated",
      handleTokenUpdate
    );

    return () => {
      window.removeEventListener(
        "october:access-token-updated",
        handleTokenUpdate
      );
    };
  }, []);

  // Synchronize profile changes across the application.
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      const updatedUser = event.detail;

      if (!updatedUser) return;

      setLoggedInUser((previousUser) => {
        if (!previousUser) return previousUser;

        return {
          ...previousUser,
          ...updatedUser,
        };
      });
    };

    window.addEventListener(
      "october:profile-updated",
      handleProfileUpdate
    );

    return () => {
      window.removeEventListener(
        "october:profile-updated",
        handleProfileUpdate
      );
    };
  }, []);

  // Restore the login session after a browser refresh.
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const savedAccessToken = localStorage.getItem(
        "october_access_token"
      );

      const savedRefreshToken = localStorage.getItem(
        "october_refresh_token"
      );

      if (!savedAccessToken && !savedRefreshToken) {
        setAccessToken(null);
        setLoggedInUser(null);
        return;
      }

      try {
        let token = savedAccessToken;
        let response = null;

        // Check the profile using the saved access token.
        if (token) {
          response = await fetch(
            `${API_URL}/api/accounts/profile/`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        }

        // Refresh the access token if it is missing or expired.
        if (
          (!response || response.status === 401) &&
          savedRefreshToken
        ) {
          const refreshResponse = await fetch(
            `${API_URL}/api/accounts/token/refresh/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                refresh: savedRefreshToken,
              }),
            }
          );

          if (!refreshResponse.ok) {
            throw new Error(
              "Your session could not be renewed."
            );
          }

          const refreshData = await refreshResponse.json();
          token = refreshData.access;

          localStorage.setItem(
            "october_access_token",
            token
          );

          if (refreshData.refresh) {
            localStorage.setItem(
              "october_refresh_token",
              refreshData.refresh
            );
          }

          response = await fetch(
            `${API_URL}/api/accounts/profile/`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        }

        if (!response || !response.ok) {
          throw new Error(
            "Your session could not be restored."
          );
        }

        const user = await response.json();

        if (!cancelled) {
          setAccessToken(token);
          setLoggedInUser(user);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Session restoration failed:",
            error
          );

          localStorage.removeItem("october_access_token");
          localStorage.removeItem("october_refresh_token");

          setAccessToken(null);
          setLoggedInUser(null);
        }
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // Handle successful login.
  const handleLogin = async (token, refreshToken) => {
    try {
      const response = await fetch(
        `${API_URL}/api/accounts/profile/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Could not load your profile.");
      }

      const user = await response.json();

      localStorage.setItem("october_access_token", token);

      if (refreshToken) {
        localStorage.setItem(
          "october_refresh_token",
          refreshToken
        );
      }

      setAccessToken(token);
      setLoggedInUser(user);
      setIsAuthOpen(false);
    } catch (error) {
      console.error("Login error:", error);

      alert(
        error.message ||
          "Unable to log in. Please try again."
      );
    }
  };

  // Clear the local session on logout.
  const handleLogout = () => {
    localStorage.removeItem("october_access_token");
    localStorage.removeItem("october_refresh_token");

    setAccessToken(null);
    setLoggedInUser(null);
    setIsAuthOpen(false);
    setIsCartOpen(false);
    setCart([]);
  };

  // Add an available product to the cart.
  const addToCart = (product) => {
    if (
      !product.is_available ||
      product.stock_quantity < 1
    ) {
      return;
    }

    setCart((previousCart) => {
      const existing = previousCart.find(
        (item) => item.id === product.id
      );

      if (existing) {
        if (
          existing.cartQuantity >= product.stock_quantity
        ) {
          return previousCart;
        }

        return previousCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                cartQuantity: item.cartQuantity + 1,
              }
            : item
        );
      }

      return [
        ...previousCart,
        { ...product, cartQuantity: 1 },
      ];
    });

    setIsCartOpen(true);
  };

  // Open the profile page or request login.
  const handleOpenProfile = () => {
    if (loggedInUser && accessToken) {
      window.history.pushState({}, "", "/profile");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else {
      setIsAuthOpen(true);
    }
  };

  return (
    <BrowserRouter>
      <div className="site-shell">
        <Header
          loggedInUser={loggedInUser}
          cart={cart}
          onOpenProfile={handleOpenProfile}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenCart={() => setIsCartOpen(true)}
        />

        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                onAddToCart={addToCart}
                loggedInUser={loggedInUser}
                accessToken={accessToken}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            }
          />

          <Route
            path="/profile"
            element={
              loggedInUser && accessToken ? (
                <ProfileRoute
                  user={loggedInUser}
                  accessToken={accessToken}
                  onBack={() => {
                    window.history.pushState({}, "", "/");
                    window.dispatchEvent(
                      new PopStateEvent("popstate")
                    );
                  }}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/wishlist"
            element={
              <WishlistPage
                user={loggedInUser}
                accessToken={accessToken}
                onAddToCart={addToCart}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            }
          />

          <Route
            path="*"
            element={<NotFoundPage />}
          />
        </Routes>

        <Footer />

        {isCartOpen && (
          <ShoppingCart
            cart={cart}
            setCart={setCart}
            accessToken={accessToken}
            onLoginRequired={() => {
              setIsCartOpen(false);
              setIsAuthOpen(true);
            }}
            onClose={() => setIsCartOpen(false)}
          />
        )}

        {isAuthOpen && (
          <AuthPage
            onClose={() => setIsAuthOpen(false)}
            onLogin={handleLogin}
          />
        )}
      </div>
    </BrowserRouter>
  );
};

export default App;
