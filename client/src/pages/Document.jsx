
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/Authcontext";
import Comments from "../components/Comments";
import Attachments from "../components/Attachments";
import api from "../services/api";

const Document = () => {
  const { documentId } = useParams();
  const { token, user } = useAuth();

  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let activeSocket = null;

    const loadDocument = async () => {
      setLoading(true);
      setError("");
      setDocument(null);

      try {
        const response = await api.get(
          `/documents/${documentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (cancelled) return;

        const loadedDocument = response.data.document;
        setDocument(loadedDocument);
        setContent(loadedDocument.content || "");

        activeSocket = io("http://localhost:5000", {
          auth: { token },
          reconnection: true
        });

        socketRef.current = activeSocket;
        setSocket(activeSocket);

        activeSocket.on("connect", () => {
          if (cancelled) return;

          setConnected(true);
          setError("");

          activeSocket.emit(
            "document:join",
            documentId,
            (joinResponse) => {
              if (cancelled) return;

              if (!joinResponse?.success) {
                setError(
                  joinResponse?.message ||
                    "Unable to join document collaboration."
                );
                return;
              }

              setContent(joinResponse.content || "");
            }
          );
        });

        activeSocket.on("document:updated", ({ content: updatedContent }) => {
          if (!cancelled) {
            setContent(updatedContent || "");
          }
        });

        activeSocket.on("connect_error", (socketError) => {
          if (!cancelled) {
            setConnected(false);
            setError(socketError.message || "Unable to connect to the server.");
          }
        });

        activeSocket.on("disconnect", () => {
          if (!cancelled) {
            setConnected(false);
          }
        });
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "Failed to load document. Check that the server is running."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      cancelled = true;

      if (activeSocket) {
        activeSocket.emit("document:leave", documentId);
        activeSocket.disconnect();
      }

      if (socketRef.current === activeSocket) {
        socketRef.current = null;
      }
    };
  }, [documentId, token]);

  const handleChange = (event) => {
    const newContent = event.target.value;

    setContent(newContent);

    if (socketRef.current?.connected) {
      socketRef.current.emit("document:change", {
        documentId,
        content: newContent
      });
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

  if (!document) {
    return (
      <div className="flex min-h-[calc(100vh-78px)] items-center justify-center bg-[#f4f1e9] px-6">
        <div className="text-center">
          <p className="text-sm text-[#a44b42]">
            {error || "Document could not be loaded."}
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
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
        <Link
          to={`/workspace/${
            typeof document.workspace === "object"
              ? document.workspace._id
              : document.workspace
          }`}
          className="text-sm text-stone-500 transition hover:text-[#252522]"
        >
          ← Back to workspace
        </Link>

        <div className="mt-8 border-b border-stone-300 pb-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h1 className="break-words font-serif text-4xl tracking-[-0.04em] sm:text-5xl">
              {document.title}
            </h1>

            <div className="flex shrink-0 items-center gap-2 text-xs text-stone-500">
              <span
                className={`h-2 w-2 rounded-full ${
                  connected ? "bg-[#68705a]" : "bg-stone-400"
                }`}
              />
              {connected ? "Live" : "Connecting..."}
            </div>
          </div>

          {error && (
            <p className="mt-3 text-sm text-[#a44b42]">
              {error}
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          <main className="min-w-0 flex-1">
            <textarea
              value={content}
              onChange={handleChange}
              placeholder="Start writing..."
              aria-label="Document content"
              className="min-h-[60vh] w-full resize-y border-0 bg-transparent text-base leading-8 text-[#252522] outline-none placeholder:text-stone-400"
            />

            <div className="mt-8">
              <Attachments documentId={documentId} />
            </div>
          </main>

          <aside className="w-full shrink-0 lg:w-80">
            <Comments
              documentId={documentId}
              user={user}
              socket={socket}
            />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Document;
