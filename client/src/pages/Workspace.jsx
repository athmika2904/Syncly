import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import api from "../services/api";

const Workspace = () => {
  const { workspaceId } = useParams();
  const { token } = useAuth();

  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const response = await api.get(
          `/workspaces/${workspaceId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setWorkspace(response.data.workspace);
      } catch (error) {
        setError(
          error.response?.data?.message ||
          "Failed to load workspace"
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchWorkspace();
    }
  }, [workspaceId, token]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-78px)] items-center justify-center bg-[#f4f1e9]">
        <p className="text-sm text-stone-500">
          Loading workspace...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-78px)] items-center justify-center bg-[#f4f1e9]">
        <div className="text-center">
          <p className="text-sm text-[#a44b42]">
            {error}
          </p>

          <Link
            to="/dashboard"
            className="mt-5 inline-block text-sm font-semibold underline underline-offset-4"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-78px)] bg-[#f4f1e9] text-[#252522]">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 lg:px-16">

        <Link
          to="/dashboard"
          className="text-sm text-stone-500 transition hover:text-[#252522]"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-8 border-b border-stone-300 pb-10">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#68705a]">
            WORKSPACE
          </p>

          <h1 className="mt-3 font-serif text-5xl font-medium tracking-[-0.04em] sm:text-6xl">
            {workspace.name}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-500">
            {workspace.description ||
              "A shared space for your team's work."}
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">

          <div className="rounded-lg border border-stone-200 bg-[#faf9f5] p-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Members
            </p>

            <p className="mt-5 font-serif text-4xl">
              1
            </p>

            <p className="mt-2 text-sm text-stone-500">
              People in this workspace
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
              Shared documents
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
              Workspace activity
            </p>
          </div>

        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">

          <div className="rounded-lg border border-stone-200 bg-[#faf9f5] p-8">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#68705a]">
              DOCUMENTS
            </p>

            <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em]">
              Shared documents
            </h2>

            <p className="mt-3 text-sm leading-6 text-stone-500">
              Create and collaborate on documents with your
              workspace members.
            </p>

            <button
              className="mt-7 rounded bg-[#252522] px-5 py-3 text-sm font-semibold text-[#faf9f5] transition hover:bg-[#4f5744]"
            >
              New document
            </button>
          </div>

          <div className="rounded-lg border border-stone-200 bg-[#faf9f5] p-8">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#68705a]">
              MEMBERS
            </p>

            <h2 className="mt-3 font-serif text-3xl tracking-[-0.03em]">
              Your team
            </h2>

            <p className="mt-3 text-sm leading-6 text-stone-500">
              Invite people and collaborate together inside this
              workspace.
            </p>

            <button
              className="mt-7 rounded border border-stone-300 px-5 py-3 text-sm font-semibold transition hover:border-[#68705a] hover:bg-[#f4f1e9]"
            >
              Invite member
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Workspace;