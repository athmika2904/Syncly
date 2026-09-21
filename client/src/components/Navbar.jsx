import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { isAuthenticated } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-300/80 bg-[#f4f1e9]/90 backdrop-blur-md">
      <div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-16">
        <Link
          to="/"
          className="font-serif text-[1.7rem] font-semibold tracking-[-0.055em] text-[#252522] transition hover:opacity-70"
        >
          Syncly
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="px-2 py-2 text-sm font-medium text-stone-500 transition hover:text-[#252522]"
              >
                Log in
              </Link>

              <Link
                to="/signup"
                className="rounded bg-[#252522] px-5 py-2.5 text-sm font-semibold text-[#faf9f5] transition hover:-translate-y-0.5 hover:bg-[#4f5744] hover:shadow-md"
              >
                Get started
              </Link>
            </>
          ) : (
            <Link
              to="/dashboard"
              className="rounded border border-stone-300 px-5 py-2.5 text-sm font-semibold text-[#252522] transition hover:border-[#68705a] hover:bg-[#faf9f5]"
            >
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;