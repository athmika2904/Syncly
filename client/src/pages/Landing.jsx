import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-[calc(100vh-78px)] bg-[#f4f1e9] text-[#252522]">
      <section className="mx-auto flex min-h-[calc(100vh-78px)] max-w-7xl items-center px-6 py-20 sm:px-10 lg:px-16">
        <div className="max-w-5xl">
          <p className="mb-6 text-xs font-semibold tracking-[0.22em] text-[#68705a]">
            A SPACE TO CREATE TOGETHER
          </p>

          <h1 className="max-w-4xl font-serif text-6xl font-medium leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-[6.5rem]">
            Work together.
            <br />
            Build together.
          </h1>

          <p className="mt-8 max-w-xl text-base leading-7 text-stone-500 sm:text-lg">
            Syncly brings your team, documents and ideas into one
            collaborative workspace.
          </p>

         

          <div className="mt-20 flex items-center gap-6 border-t border-stone-300 pt-6">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
              Documents
            </span>

            <span className="h-1 w-1 rounded-full bg-stone-400" />

            <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
              Workspaces
            </span>

            <span className="h-1 w-1 rounded-full bg-stone-400" />

            <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
              Collaboration
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;