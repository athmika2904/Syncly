const Login = () => {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-heading">
          <span className="auth-eyebrow">WELCOME BACK</span>
          <h1>Log in</h1>
          <p>Sign in to continue to your Syncly.</p>
        </div>

        <form>
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
              placeholder="Enter your password"
            />
          </div>

          <button type="submit">
            Log in
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;