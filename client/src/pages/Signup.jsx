import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await signup(name, email, password);
      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-78px)] bg-[#f4f1e9] px-6 py-12">
      <div className="flex min-h-[calc(100vh-174px)] items-center justify-center">
        <div className="w-full max-w-md rounded-lg border border-stone-200 bg-[#faf9f5] px-8 py-10 shadow-[0_20px_60px_rgba(37,37,34,0.07)] sm:px-11">
          <div className="text-center">
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#68705a]">
              GET STARTED
            </span>

            <h1 className="mt-3 font-serif text-5xl font-medium tracking-[-0.04em] text-[#252522]">
              Create account
            </h1>

            <p className="mt-4 text-sm leading-6 text-stone-500">
              Create your workspace and start collaborating.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-9 flex flex-col gap-5"
          >
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#252522]">
                Full name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="rounded border border-stone-300 bg-[#f4f1e9]/50 px-4 py-3.5 text-sm text-[#252522] outline-none transition focus:border-[#68705a] focus:bg-[#faf9f5] focus:ring-4 focus:ring-[#68705a]/10"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#252522]">
                Email address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="rounded border border-stone-300 bg-[#f4f1e9]/50 px-4 py-3.5 text-sm text-[#252522] outline-none transition focus:border-[#68705a] focus:bg-[#faf9f5] focus:ring-4 focus:ring-[#68705a]/10"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#252522]">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                minLength={6}
                required
                className="rounded border border-stone-300 bg-[#f4f1e9]/50 px-4 py-3.5 text-sm text-[#252522] outline-none transition focus:border-[#68705a] focus:bg-[#faf9f5] focus:ring-4 focus:ring-[#68705a]/10"
              />
            </div>

            {error && (
              <p className="text-sm text-[#a44b42]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded bg-[#252522] px-5 py-3.5 text-sm font-semibold text-[#faf9f5] transition hover:-translate-y-0.5 hover:bg-[#4f5744] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-[#252522] underline underline-offset-4 transition hover:text-[#68705a]"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;