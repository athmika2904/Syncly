import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/Authcontext";
import Comments from "../components/Comments";
import api from "../services/api";

const Document = () => {
  const { documentId } = useParams();
  const { token,user } = useAuth();

  const socketRef = useRef(null);

  const [document, setDocument] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const loadDocument = async () => {
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

        const socket = io("http://localhost:5000", {
          auth: {
            token
          }
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          setConnected(true);

          socket.emit(
            "document:join",
            documentId,
            (response) => {
              if (!response.success) {
                setError(response.message);
                return;
              }

              setContent(response.content);
            }
          );
        });

        socket.on("document:updated", ({ content }) => {
          setContent(content);
        });

        socket.on("connect_error", (error) => {
          setConnected(false);
          setError(error.message);
        });

        socket.on("disconnect", () => {
          setConnected(false);
        });
      } catch (error) {
        setError(
          error.response?.data?.message ||
          "Failed to load document"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDocument();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit(
          "document:leave",
          documentId
        );

        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [documentId, token]);

  const handleChange = (e) => {
    const newContent = e.target.value;

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
      <div className="flex min-h-[calc(100vh-78px)] items-center justify-center">
        <p className="text-sm text-stone-500">
          Loading document...
        </p>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="flex min-h-[calc(100vh-78px)] items-center justify-center">
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
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
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

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-xs text-stone-500">
                <span
                  className={`h-2 w-2 rounded-full ${
                    connected
                      ? "bg-[#68705a]"
                      : "bg-stone-400"
                  }`}
                />

                {connected
                  ? "Live"
                  : "Connecting..."}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-8">
  <div className="min-w-0 flex-1">
    <textarea
      value={content}
      onChange={handleChange}
      placeholder="Start writing..."
      className="min-h-[60vh] w-full resize-none border-0 bg-transparent text-base leading-8 text-[#252522] outline-none placeholder:text-stone-400"
    />
  </div>

  <Comments
    documentId={documentId}
    user={user}
  />
</div>
      </div>
    </div>
  );
};

export default Document;