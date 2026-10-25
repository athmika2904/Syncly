import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import api from "../services/api";
import DocumentSearch from "../components/DocumentSearch";

const Dashboard = () => {
const { user, token, logout } = useAuth();

const [workspaces, setWorkspaces] = useState([]);
const [showModal, setShowModal] = useState(false);

const [name, setName] = useState("");
const [description, setDescription] = useState("");

const [loading, setLoading] = useState(false);
const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
const [error, setError] = useState("");

const [documentTotal, setDocumentTotal] = useState(0);
const [activityTotal, setActivityTotal] = useState(0);
const [recentActivities, setRecentActivities] = useState([]);
const [statsLoading, setStatsLoading] = useState(true);
const [activityError, setActivityError] = useState("");

const fetchDashboardStats = useCallback(async (workspaceList) => {
if (workspaceList.length === 0) {
setDocumentTotal(0);
setActivityTotal(0);
setRecentActivities([]);
setActivityError("");
setStatsLoading(false);
return;
}

setStatsLoading(true);
setActivityError("");

try {
  const results = await Promise.all(
    workspaceList.map(async (workspace) => {
      const [documentsResult, activityResult] = await Promise.all([
        api.get(`/documents/workspace/${workspace._id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        api.get(`/activities/workspace/${workspace._id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ]);

      return {
        documents: documentsResult.data.documents || [],
        activityTotal: activityResult.data.total || 0,
        activities: activityResult.data.activities || []
      };
    })
  );

  setDocumentTotal(
    results.reduce(
      (total, result) => total + result.documents.length,
      0
    )
  );

  setActivityTotal(
    results.reduce(
      (total, result) => total + result.activityTotal,
      0
    )
  );

  const allActivities = results
    .flatMap((result) => result.activities)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

  setRecentActivities(allActivities.slice(0, 5));
} catch (error) {
  console.error("Failed to load dashboard statistics:", error);

  setActivityError(
    error.response?.data?.message ||
      "Failed to load dashboard statistics."
  );
} finally {
  setStatsLoading(false);
}

}, [token]);

const fetchWorkspaces = useCallback(async () => {
try {
setError("");

  const response = await api.get("/workspaces", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const workspaceList = response.data.workspaces || [];

  setWorkspaces(workspaceList);
  await fetchDashboardStats(workspaceList);
} catch (error) {
  setError(
    error.response?.data?.message ||
      "Failed to load workspaces"
  );
  setStatsLoading(false);
} finally {
  setLoadingWorkspaces(false);
}

}, [token, fetchDashboardStats]);

useEffect(() => {
if (token) {
fetchWorkspaces();
}
}, [token, fetchWorkspaces]);

const handleCreateWorkspace = async (e) => {
e.preventDefault();

setError("");
setLoading(true);

try {
  const response = await api.post(
    "/workspaces",
    {
      name,
      description
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const updatedWorkspaces = [
    response.data.workspace,
    ...workspaces
  ];

  setWorkspaces(updatedWorkspaces);

  setName("");
  setDescription("");
  setShowModal(false);

  await fetchDashboardStats(updatedWorkspaces);
} catch (error) {
  setError(
    error.response?.data?.message ||
      "Failed to create workspace"
  );
} finally {
  setLoading(false);
}

};

return (
<div className="min-h-[calc(100vh-78px)] bg-[#f4f1e9] text-[#252522]">
<div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 lg:px-16">
<div className="mb-8">
<DocumentSearch />
</div>

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
          {loadingWorkspaces ? "…" : workspaces.length}
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
          {statsLoading ? "…" : documentTotal}
        </p>

        <p className="mt-2 text-sm text-stone-500">
          Documents across your workspaces
        </p>
      </div>

      <div className="rounded-lg border border-stone-200 bg-[#faf9f5] p-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          Activity
        </p>

        <p className="mt-5 font-serif text-4xl">
          {statsLoading ? "…" : activityError ? "—" : activityTotal}
        </p>

        <p className="mt-2 text-sm text-stone-500">
          Recorded workspace events
        </p>
      </div>
    </div>

    <div className="mt-8 rounded-lg border border-stone-200 bg-[#faf9f5]">
      <div className="border-b border-stone-200 px-7 py-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#68705a]">
          YOUR TEAM
        </p>

        <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em]">
          Recent activity
        </h2>
      </div>

      {statsLoading ? (
        <p className="px-7 py-8 text-sm text-stone-500">
          Loading activity...
        </p>
      ) : activityError ? (
        <div className="px-7 py-8">
          <p className="text-sm text-[#a44b42]">
            {activityError}
          </p>
          <button
            type="button"
            onClick={() => fetchDashboardStats(workspaces)}
            className="mt-3 text-sm font-semibold text-[#68705a] underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      ) : recentActivities.length === 0 ? (
        <div className="px-7 py-8">
          <p className="text-sm text-stone-500">
            No activity recorded yet.
          </p>
          <p className="mt-2 text-sm text-stone-400">
            Create or edit a document to start building your workspace history.
          </p>
        </div>
      ) : (
        <div>
          {recentActivities.map((activity) => (
            <div
              key={activity._id}
              className="flex items-start gap-4 border-b border-stone-200 px-7 py-5 last:border-b-0"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#68705a]/10 text-lg text-[#68705a]">
                {activity.type === "document_created" ? "+" : "↻"}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm leading-6">
                  <span className="font-semibold">
                    {activity.user?.name || "A team member"}
                  </span>{" "}
                  {activity.description}
                </p>

                <p className="mt-1 text-xs text-stone-400">
                  {new Date(activity.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    <div className="mt-12">
      <div className="flex items-end justify-between border-b border-stone-300 pb-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[#68705a]">
            YOUR SPACES
          </p>

          <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em]">
            Workspaces
          </h2>
        </div>

        <button
          onClick={() => {
            setError("");
            setShowModal(true);
          }}
          className="rounded bg-[#252522] px-5 py-2.5 text-sm font-semibold text-[#faf9f5] transition hover:-translate-y-0.5 hover:bg-[#4f5744] hover:shadow-md"
        >
          + New workspace
        </button>
      </div>

      {error && (
        <p className="mt-5 text-sm text-[#a44b42]">
          {error}
        </p>
      )}

      {loadingWorkspaces ? (
        <div className="py-12 text-sm text-stone-500">
          Loading workspaces...
        </div>
      ) : workspaces.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-stone-300 bg-[#faf9f5]/50 px-8 py-16 text-center">
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

          <button
            onClick={() => {
              setError("");
              setShowModal(true);
            }}
            className="mt-7 rounded bg-[#252522] px-6 py-3 text-sm font-semibold text-[#faf9f5] transition hover:-translate-y-0.5 hover:bg-[#4f5744] hover:shadow-lg"
          >
            Create workspace
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <Link
              key={workspace._id}
              to={`/workspace/${workspace._id}`}
              className="group block rounded-lg border border-stone-200 bg-[#faf9f5] p-7 transition hover:-translate-y-1 hover:border-[#68705a] hover:shadow-[0_15px_40px_rgba(37,37,34,0.07)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.15em] text-[#68705a]">
                    WORKSPACE
                  </p>

                  <h3 className="mt-3 font-serif text-2xl tracking-[-0.03em]">
                    {workspace.name}
                  </h3>
                </div>

                <span className="text-stone-300 transition group-hover:text-[#68705a]">
                  →
                </span>
              </div>

              <p className="mt-4 min-h-12 text-sm leading-6 text-stone-500">
                {workspace.description ||
                  "A shared space for your team's work."}
              </p>

              <div className="mt-6 border-t border-stone-200 pt-4 text-xs text-stone-400">
                Created {new Date(workspace.createdAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  </div>

  {showModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#252522]/30 px-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg border border-stone-200 bg-[#faf9f5] p-8 shadow-[0_25px_80px_rgba(37,37,34,0.18)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#68705a]">
              NEW SPACE
            </p>

            <h2 className="mt-2 font-serif text-4xl tracking-[-0.04em]">
              Create workspace
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="text-2xl text-stone-400 transition hover:text-[#252522]"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleCreateWorkspace}
          className="mt-8 flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold">
              Workspace name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Final Year Project"
              required
              className="rounded border border-stone-300 bg-[#f4f1e9]/50 px-4 py-3.5 text-sm outline-none transition focus:border-[#68705a] focus:bg-[#faf9f5] focus:ring-4 focus:ring-[#68705a]/10"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this workspace for?"
              rows="4"
              className="resize-none rounded border border-stone-300 bg-[#f4f1e9]/50 px-4 py-3.5 text-sm outline-none transition focus:border-[#68705a] focus:bg-[#faf9f5] focus:ring-4 focus:ring-[#68705a]/10"
            />
          </div>

          {error && (
            <p className="text-sm text-[#a44b42]">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded border border-stone-300 px-5 py-3 text-sm font-semibold transition hover:border-[#68705a] hover:bg-[#f4f1e9]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded bg-[#252522] px-6 py-3 text-sm font-semibold text-[#faf9f5] transition hover:bg-[#4f5744] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}
</div>

);
};

export default Dashboard;