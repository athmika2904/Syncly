import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <section>
      <h1>Work together. Build together.</h1>

      <p>
        Syncly is a real-time workspace for teams to
        create, collaborate and stay organized.
      </p>

      <Link to="/signup">
        Get Started
      </Link>
    </section>
  );
};

export default Landing;