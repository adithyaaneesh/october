
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import "./App.css";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ShoppingCart from "./components/ShoppingCart";
import AuthPage from "./components/AuthPage";

import HomePage from "./pages/HomePage";
import ProfileRoute from "./pages/ProfileRoute";
import NotFoundPage from "./pages/NotFoundPage";

const API_URL = "http://127.0.0.1:8000";

const App = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState([]);

  // Restore login session after refresh.
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const savedAccessToken = localStorage.getItem("october_access_token");
      const savedRefreshToken = localStorage.getItem("october_refresh_token");

      if (!savedAccessToken) {
        setAccessToken(null);
        setLoggedInUser(null);
        return;
      }

      try {
        let token = savedAccessToken;

        let response = await fetch(`${API_URL}/api/accounts/profile/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401 && savedRefreshToken) {
          const refreshResponse = await fetch(
            `${API_URL}/api/accounts/token/refresh/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ refresh: savedRefreshToken }),
            }
          );

          if (!refreshResponse.ok) {
            throw new Error("Your session has expired. Please log in again.");
          }

          const refreshData = await refreshResponse.json();
          token = refreshData.access;

          localStorage.setItem("october_access_token", token);

          response = await fetch(`${API_URL}/api/accounts/profile/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        }

        if (!response.ok) {
          throw new Error("Your session has expired. Please log in again.");
        }

        const user = await response.json();

        if (!cancelled) {
          setAccessToken(token);
          setLoggedInUser(user);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Session restoration failed:", error);

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
      const response = await fetch(`${API_URL}/api/accounts/profile/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Could not load your profile.");
      }

      const user = await response.json();

      localStorage.setItem("october_access_token", token);

      if (refreshToken) {
        localStorage.setItem("october_refresh_token", refreshToken);
      }

      setAccessToken(token);
      setLoggedInUser(user);
      setIsAuthOpen(false);
    } catch (error) {
      console.error("Login error:", error);
      alert(error.message || "Unable to log in. Please try again.");
    }
  };

  // Clear the session on logout.
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
    if (!product.is_available || product.stock_quantity < 1) {
      return;
    }

    setCart((previousCart) => {
      const existing = previousCart.find(
        (item) => item.id === product.id
      );

      if (existing) {
        if (existing.cartQuantity >= product.stock_quantity) {
          return previousCart;
        }

        return previousCart.map((item) =>
          item.id === product.id
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      }

      return [...previousCart, { ...product, cartQuantity: 1 }];
    });

    setIsCartOpen(true);
  };

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
            element={<HomePage onAddToCart={addToCart} />}
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
                    window.dispatchEvent(new PopStateEvent("popstate"));
                  }}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route path="*" element={<NotFoundPage />} />
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
