import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Workspace = () => {
  const { workspaceId } = useParams();
  const { token } = useAuth();

  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [role, setRole] = useState("");

  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [error, setError] = useState("");

  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

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
      setRole(response.data.role);
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Failed to load workspace"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await api.get(
        `/workspaces/${workspaceId}/members`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMembers(response.data.members);
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Failed to load members"
      );
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    fetchWorkspace();
    fetchMembers();
  }, [workspaceId, token]);

  const handleInvite = async (e) => {
    e.preventDefault();

    setInviteError("");
    setInviteSuccess("");
    setInviteLoading(true);

    try {
      const response = await api.post(
        `/workspaces/${workspaceId}/members`,
        {
          email
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setInviteSuccess(response.data.message);
      setEmail("");

      await fetchMembers();

      setTimeout(() => {
        setShowInvite(false);
        setInviteSuccess("");
      }, 1200);
    } catch (error) {
      setInviteError(
        error.response?.data?.message ||
        "Failed to add member"
      );
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-78px)] items-center justify-center bg-[#f4f1e9]">
        <p className="text-sm text-stone-500">
          Loading workspace...
        </p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="flex min-h-[calc(100vh-78px)] items-center justify-center bg-[#f4f1e9]">
        <div className="text-center">
          <p className="text-sm text-[#a44b42]">
            {error || "Workspace not found"}
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
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

            <div>
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

            <span className="w-fit rounded-full border border-[#68705a]/30 bg-[#68705a]/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#68705a]">
              {role}
            </span>

          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">

          <div className="rounded-lg border border-stone-200 bg-[#faf9f5] p-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Members
            </p>

            <p className="mt-5 font-serif text-4xl">
              {members.length}
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

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.3fr_1fr]">

          <div className="rounded-lg border border-stone-200 bg-[#faf9f5]">

            <div className="flex items-center justify-between border-b border-stone-200 px-7 py-6">

              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[#68705a]">
                  PEOPLE
                </p>

                <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em]">
                  Members
                </h2>
              </div>

              {role === "owner" && (
                <button
                  onClick={() => {
                    setShowInvite(true);
                    setInviteError("");
                    setInviteSuccess("");
                  }}
                  className="rounded bg-[#252522] px-5 py-2.5 text-sm font-semibold text-[#faf9f5] transition hover:-translate-y-0.5 hover:bg-[#4f5744] hover:shadow-md"
                >
                  + Invite
                </button>
              )}

            </div>

            {membersLoading ? (
              <div className="px-7 py-10 text-sm text-stone-500">
                Loading members...
              </div>
            ) : members.length === 0 ? (
              <div className="px-7 py-10 text-sm text-stone-500">
                No members yet.
              </div>
            ) : (
              <div>
                {members.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between border-b border-stone-200 px-7 py-5 last:border-b-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#68705a]/10 font-serif text-lg text-[#68705a]">
                        {member.user.name
                          ?.charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <p className="text-sm font-semibold">
                          {member.user.name}
                        </p>

                        <p className="mt-1 text-xs text-stone-400">
                          {member.user.email}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            )}

          </div>

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

        </div>

      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#252522]/30 px-6 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-lg border border-stone-200 bg-[#faf9f5] p-8 shadow-[0_25px_80px_rgba(37,37,34,0.18)]">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[#68705a]">
                  ADD MEMBER
                </p>

                <h2 className="mt-2 font-serif text-4xl tracking-[-0.04em]">
                  Invite someone
                </h2>
              </div>

              <button
                onClick={() => setShowInvite(false)}
                className="text-2xl text-stone-400 transition hover:text-[#252522]"
              >
                ×
              </button>

            </div>

            <p className="mt-4 text-sm leading-6 text-stone-500">
              Enter the email address of an existing Syncly user.
            </p>

            <form
              onSubmit={handleInvite}
              className="mt-7"
            >

              <label className="text-xs font-semibold">
                Email address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
                required
                className="mt-2 w-full rounded border border-stone-300 bg-[#f4f1e9]/50 px-4 py-3.5 text-sm outline-none transition focus:border-[#68705a] focus:bg-[#faf9f5] focus:ring-4 focus:ring-[#68705a]/10"
              />

              {inviteError && (
                <p className="mt-4 text-sm text-[#a44b42]">
                  {inviteError}
                </p>
              )}

              {inviteSuccess && (
                <p className="mt-4 text-sm text-[#68705a]">
                  {inviteSuccess}
                </p>
              )}

              <div className="mt-7 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="rounded border border-stone-300 px-5 py-3 text-sm font-semibold transition hover:border-[#68705a] hover:bg-[#f4f1e9]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="rounded bg-[#252522] px-6 py-3 text-sm font-semibold text-[#faf9f5] transition hover:bg-[#4f5744] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {inviteLoading
                    ? "Adding..."
                    : "Add member"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}
    </div>
  );
};

export default Workspace;