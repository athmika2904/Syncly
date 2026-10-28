import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/Authcontext";
import Comments from "../components/Comments";
import Attachments from "../components/Attachments";
import api from "../services/api";
import { SOCKET_URL } from "../config";

const SAVE_DELAY_MS = 400;
const CONFLICT_RETRY_MS = 150;
const ERROR_RETRY_MS = 1500;
const MAX_RETRIES = 5;

const Document = () => {
  const { documentId } = useParams();
  const { token, user } = useAuth();

  const socketRef = useRef(null);
  const saveTimerRef = useRef(null);
  const flushSaveRef = useRef(null);
  const contentRef = useRef("");
  const versionRef = useRef(0);
  const pendingRef = useRef(false);
  const saveInProgressRef = useRef(false);
  const retryCountRef = useRef(0);

  const [socket, setSocket] = useState(null);
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [error, setError] = useState("");

  const updateContent = useCallback((value) => {
    contentRef.current = value;
    setContent(value);
  }, []);

  const scheduleSave = useCallback((delay) => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      flushSaveRef.current?.();
    }, delay);
  }, []);

  const flushSave = useCallback(() => {
    const activeSocket = socketRef.current;

    if (!pendingRef.current || saveInProgressRef.current) return;

    if (!activeSocket?.connected) {
      setSaveStatus("Waiting for connection");
      return;
    }

    const contentToSave = contentRef.current;
    const versionToSave = versionRef.current;

    pendingRef.current = false;
    saveInProgressRef.current = true;
    setSaveStatus("Saving...");

    activeSocket.emit(
      "document:change",
      {
        documentId,
        content: contentToSave,
        version: versionToSave
      },
      (response) => {
        saveInProgressRef.current = false;

        if (!response?.success) {
          // Keep the text queued so it is never lost.
          pendingRef.current = true;
          retryCountRef.current += 1;

          // Conflict: someone else saved first (or our version was stale).
          // The server sends back its latest version number. Adopt it and
          // save our text on top of it, instead of getting stuck forever
          // re-sending the same stale version.
          if (response?.conflict) {
            if (Number.isInteger(response.version)) {
              versionRef.current = response.version;
            }

            if (retryCountRef.current > MAX_RETRIES) {
              setSaveStatus("Conflict");
              setError(
                "Could not save because the document keeps changing. Keep typing to try again, or copy your text and reload."
              );
              return;
            }

            setSaveStatus("Saving...");
            scheduleSave(CONFLICT_RETRY_MS);
            return;
          }

          // Any other failure (not joined yet, network hiccup, ...): retry.
          if (retryCountRef.current > MAX_RETRIES) {
            setSaveStatus("Not saved");
            setError(response?.message || "Could not save your changes.");
            return;
          }

          setSaveStatus("Retrying...");
          scheduleSave(ERROR_RETRY_MS);
          return;
        }

        // Success
        retryCountRef.current = 0;
        versionRef.current = response.version;

        if (contentRef.current !== contentToSave) {
          // User typed more while we were saving.
          pendingRef.current = true;
          setSaveStatus("Unsaved changes");
          scheduleSave(SAVE_DELAY_MS);
        } else {
          setSaveStatus("Saved");
          setError("");
        }
      }
    );
  }, [documentId, scheduleSave]);

  useEffect(() => {
    flushSaveRef.current = flushSave;
  }, [flushSave]);

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
        const response = await api.get(`/documents/${documentId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (cancelled) return;

        const loadedDocument = response.data.document;

        setDocument(loadedDocument);
        updateContent(loadedDocument.content || "");
        versionRef.current = loadedDocument.version ?? 0;
        pendingRef.current = false;
        saveInProgressRef.current = false;
        retryCountRef.current = 0;
        setSaveStatus("Saved");

        activeSocket = io(SOCKET_URL, {
          auth: { token },
          reconnection: true
        });

        socketRef.current = activeSocket;
        setSocket(activeSocket);

        activeSocket.on("connect", () => {
          if (cancelled) return;

          setConnected(true);
          setError("");

          activeSocket.emit("document:join", documentId, (joinResponse) => {
            if (cancelled) return;

            if (!joinResponse?.success) {
              setError(
                joinResponse?.message ||
                  "Unable to join document collaboration."
              );
              return;
            }

            // Never replace local unsaved text with a server snapshot.
            // Instead, adopt the server's version number and save our text
            // on top of it.
            if (pendingRef.current || saveInProgressRef.current) {
              versionRef.current = joinResponse.version ?? 0;
              retryCountRef.current = 0;
              flushSave();
              return;
            }

            versionRef.current = joinResponse.version ?? 0;
            updateContent(joinResponse.content || "");
            setSaveStatus("Saved");
          });
        });

        activeSocket.on("document:updated", (update) => {
          if (cancelled) return;

          if (!Number.isInteger(update.version)) return;
          if (update.version <= versionRef.current) return;

          // We have unsaved local text: keep it, just move to the newest
          // version so our next save is accepted.
          if (pendingRef.current || saveInProgressRef.current) {
            versionRef.current = update.version;
            return;
          }

          versionRef.current = update.version;
          updateContent(update.content || "");
          setSaveStatus("Saved");
          setError("");
        });

        activeSocket.on("connect_error", (socketError) => {
          if (cancelled) return;

          setConnected(false);
          setError(socketError.message || "Unable to connect to the server.");
        });

        activeSocket.on("disconnect", () => {
          if (cancelled) return;

          setConnected(false);

          // The acknowledgement for an in-flight save is lost when the
          // connection drops. Without this reset, saveInProgressRef would
          // stay true forever and no further save would ever be sent.
          if (saveInProgressRef.current) {
            saveInProgressRef.current = false;
            pendingRef.current = true;
          }

          if (pendingRef.current) {
            setSaveStatus("Waiting for connection");
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
        if (!cancelled) setLoading(false);
      }
    };

    loadDocument();

    return () => {
      cancelled = true;
      clearTimeout(saveTimerRef.current);

      if (activeSocket) {
        // Try to send any last unsaved text before leaving the page.
        if (pendingRef.current && !saveInProgressRef.current) {
          flushSave();
        }

        activeSocket.emit("document:leave", documentId);
        activeSocket.disconnect();
      }

      if (socketRef.current === activeSocket) {
        socketRef.current = null;
      }
    };
  }, [documentId, token, updateContent, flushSave]);

  const handleChange = (event) => {
    updateContent(event.target.value);
    pendingRef.current = true;
    retryCountRef.current = 0;
    setSaveStatus("Unsaved changes");
    setError("");

    scheduleSave(SAVE_DELAY_MS);
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-78px)] items-center justify-center bg-[#f4f1e9]">
        <p className="text-sm text-stone-500">Loading document...</p>
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

  const workspaceId =
    typeof document.workspace === "object"
      ? document.workspace._id
      : document.workspace;

  return (
    <div className="min-h-[calc(100vh-78px)] bg-[#f4f1e9] text-[#252522]">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
        <Link
          to={`/workspace/${workspaceId}`}
          className="text-sm text-stone-500 transition hover:text-[#252522]"
        >
          ← Back to workspace
        </Link>

        <div className="mt-8 border-b border-stone-300 pb-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h1 className="break-words font-serif text-4xl tracking-[-0.04em] sm:text-5xl">
              {document.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
              <span
                className={`h-2 w-2 rounded-full ${
                  connected ? "bg-[#68705a]" : "bg-stone-400"
                }`}
              />
              {connected ? "Live" : "Disconnected"}
              <span className="border-l border-stone-300 pl-3">
                {saveStatus}
              </span>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-sm text-[#a44b42]">
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
              <Attachments documentId={documentId} socket={socket} />
            </div>
          </main>

          <aside className="w-full shrink-0 lg:w-80">
            <Comments documentId={documentId} user={user} socket={socket} />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Document;


