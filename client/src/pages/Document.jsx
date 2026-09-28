import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import api from "../services/api";

const Document = () => {
  const { documentId } = useParams();
  const { token } = useAuth();

  const [document, setDocument] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchDocument = async () => {
    try {
      const response = await api.get(
        `/documents/${documentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setDocument(response.data.document);
      setContent(response.data.document.content || "");
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Failed to load document"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    fetchDocument();
  }, [documentId, token]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      await api.put(
        `/documents/${documentId}`,
        {
          content
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage("Saved");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Failed to save"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-78px)] items-center justify-center bg-[#f4f1e9]">
        <p className="text-sm text-stone-500">
          Loading document...
        </p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex min-h-[calc(100vh-78px)] items-center justify-center bg-[#f4f1e9]">
        <div className="text-center">
          <p className="text-sm text-[#a44b42]">
            {error || "Document not found"}
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

      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-10">

        <Link
          to={`/workspace/${document.workspace}`}
          className="text-sm text-stone-500 transition hover:text-[#252522]"
        >
          ← Back to workspace
        </Link>

        <div className="mt-8 border-b border-stone-300 pb-7">

          <div className="flex items-center justify-between gap-4">

            <h1 className="font-serif text-4xl tracking-[-0.04em] sm:text-5xl">
              {document.title}
            </h1>

            <div className="flex items-center gap-4">

              {message && (
                <span className="text-xs text-stone-400">
                  {message}
                </span>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded bg-[#252522] px-5 py-2.5 text-sm font-semibold text-[#faf9f5] transition hover:bg-[#4f5744] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>

            </div>

          </div>

        </div>

        <div className="mt-8">

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing..."
            className="min-h-[60vh] w-full resize-none border-0 bg-transparent text-base leading-8 text-[#252522] outline-none placeholder:text-stone-400"
          />

        </div>

      </div>

    </div>
  );
};

export default Document;