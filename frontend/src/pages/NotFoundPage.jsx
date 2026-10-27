
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <main className="profile-page">
      <h1>404 — Page not found</h1>
      <p>Sorry, we couldn't find the page you're looking for.</p>
      <Link to="/" className="button button-dark">
        Back to OCTOBER
      </Link>
    </main>
  );
};

export default NotFoundPage;
