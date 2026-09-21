import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[calc(100vh-78px)] bg-[#f4f1e9] text-[#252522]">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 lg:px-16">
        <div className="flex flex-col gap-8 border-b border-stone-300 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#68705a]">
              YOUR WORKSPACE
            </p>

            <h1 className="mt-3 font-serif text-5xl font-medium tracking-[-0.04em] sm:text-6xl">
              Welcome, {user?.name}.
            </h1>

            <p className="mt-4 max-w-lg text-sm leading-6 text-stone-500">
              Your collaborative space for ideas, documents and
              everything your team is building together.
            </p>
          </div>

          <button
            onClick={logout}
            className="w-fit rounded border border-stone-300 px-5 py-2.5 text-sm font-semibold text-[#252522] transition hover:border-[#68705a] hover:bg-[#faf9f5]"
          >
            Log out
          </button>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-lg border border-stone-200 bg-[#faf9f5] p-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Workspaces
            </p>

            <p className="mt-5 font-serif text-4xl">
              0
            </p>

            <p className="mt-2 text-sm text-stone-500">
              Spaces you're part of
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-[#faf9f5] p-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Documents
            </p>

            <p className="mt-5 font-serif text-4xl">
              0
            </p>

            <p className="mt-2 text-sm text-stone-500">
              Documents you've created
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-[#faf9f5] p-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Activity
            </p>

            <p className="mt-5 font-serif text-4xl">
              —
            </p>

            <p className="mt-2 text-sm text-stone-500">
              Recent workspace activity
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-lg border border-dashed border-stone-300 bg-[#faf9f5]/50 px-8 py-16 text-center">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#68705a]">
            START SOMETHING NEW
          </p>

          <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em]">
            Create your first workspace
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-500">
            Bring your team together and create a shared space
            for your next project.
          </p>

          <button className="mt-7 rounded bg-[#252522] px-6 py-3 text-sm font-semibold text-[#faf9f5] transition hover:-translate-y-0.5 hover:bg-[#4f5744] hover:shadow-lg">
            Create workspace
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;