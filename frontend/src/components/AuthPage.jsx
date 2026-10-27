
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import "./AuthPage.css";

const API_URL = "http://127.0.0.1:8000";

const AuthPage = ({ onClose, onLogin }) => {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password2: "",
  });

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        const registerResponse = await fetch(
          `${API_URL}/api/accounts/register/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          }
        );

        const registerData = await registerResponse.json();

        if (!registerResponse.ok) {
          throw new Error(
            Object.entries(registerData)
              .map(([key, value]) =>
                `${key}: ${Array.isArray(value) ? value.join(" ") : value}`
              )
              .join("\n")
          );
        }

        // Registration succeeded. Switch to login so the user
        // can authenticate with their new account.
        setMode("login");
        setForm((previous) => ({
          ...previous,
          password2: "",
        }));
        setError("Account created! Please log in.");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/accounts/login/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: form.username,
            password: form.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Invalid username or password."
        );
      }

      // Keep the access token in memory rather than localStorage.
      onLogin(data.access, data.refresh);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <section className="auth-panel">
        <button
          type="button"
          className="auth-back"
          onClick={onClose}
        >
          <ArrowLeft size={17} /> Back to store
        </button>

        <div className="auth-brand">
          <span>OCTOBER</span>
          <small>THRIFT AND CREATE</small>
        </div>

        <p className="auth-eyebrow">
          {mode === "login" ? "WELCOME BACK" : "JOIN OUR COMMUNITY"}
        </p>

        <h1>
          {mode === "login" ? "Good to see you." : "Create your account."}
        </h1>

        <p className="auth-description">
          {mode === "login"
            ? "Sign in to your OCTOBER account."
            : "Join OCTOBER and discover pieces with a story."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <label>
                First name
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  required
                  autoComplete="given-name"
                />
              </label>

              <label>
                Last name
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  required
                  autoComplete="family-name"
                />
              </label>

              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </label>
            </>
          )}

          <label>
            Username
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </label>

          <label>
            Password
            <span className="auth-password-wrap">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                required
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {mode === "register" && (
            <label>
              Confirm password
              <input
                name="password2"
                type="password"
                value={form.password2}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </label>
          )}

          {error && (
            <p
              className={
                error.startsWith("Account created!")
                  ? "auth-message"
                  : "auth-error"
              }
              role="status"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "SIGN IN"
                : "CREATE ACCOUNT"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login"
            ? "New to OCTOBER?"
            : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Register" : "Sign in"}
          </button>
        </p>
      </section>
    </div>
  );
};

export default AuthPage;
