const Signup = () => {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-heading">
          <span className="auth-eyebrow">GET STARTED</span>
          <h1>Create account</h1>
          <p>Start collaborating with your team.</p>
        </div>

        <form>
          <div className="input-group">
            <label>Full name</label>
            <input
              type="text"
              placeholder="Your name"
            />
          </div>

          <div className="input-group">
            <label>Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Create a password"
            />
          </div>

          <button type="submit">
            Create account
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;