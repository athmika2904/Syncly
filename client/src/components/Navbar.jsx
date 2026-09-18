import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav>
      <Link to="/" className="logo">
        SYNCLY
      </Link>

      <div>
        <Link to="/login">Login</Link>
        <Link to="/signup">Get Started</Link>
      </div>
    </nav>
  );
};

export default Navbar;