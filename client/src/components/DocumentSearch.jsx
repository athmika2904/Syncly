
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, X } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/Authcontext";

const DocumentSearch = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setDocuments([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/documents/search?q=${encodeURIComponent(trimmedQuery)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          }
        );

        setDocuments(response.data.documents || []);
      } catch (err) {
        if (err.code !== "ERR_CANCELED") {
          setError("Couldn't search documents. Please try again.");
          setDocuments([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, token]);

  const openDocument = (documentId) => {
    setIsOpen(false);
    setQuery("");
    navigate(`/document/${documentId}`);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="flex items-center gap-3 rounded-2xl border border-stone-300/80 bg-[#faf9f5] px-4 py-3 transition focus-within:border-[#68705a] focus-within:ring-2 focus-within:ring-[#68705a]/10">
        <Search size={18} className="shrink-0 text-[#68705a]" />

        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search your documents..."
          className="min-w-0 flex-1 bg-transparent text-sm text-[#252522] outline-none placeholder:text-stone-400"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setDocuments([]);
              setError("");
              setIsOpen(false);
            }}
            aria-label="Clear search"
            className="text-stone-400 transition hover:text-[#252522]"
          >
            <X size={17} />
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-[#faf9f5] shadow-xl shadow-stone-900/10">
          <div className="border-b border-stone-200 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              Search results
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {loading && (
              <p className="px-3 py-6 text-center text-sm text-stone-500">
                Searching documents...
              </p>
            )}

            {!loading && error && (
              <p className="px-3 py-6 text-center text-sm text-red-600">
                {error}
              </p>
            )}

            {!loading && !error && documents.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-stone-500">
                No matching documents found.
              </p>
            )}

            {!loading &&
              !error &&
              documents.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => openDocument(item._id)}
                  className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[#f0eee5]"
                >
                  <div className="mt-0.5 rounded-lg bg-[#68705a]/10 p-2 text-[#68705a]">
                    <FileText size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#252522]">
                      {item.title}
                    </p>
                    <p className="mt-1 truncate text-xs text-stone-500">
                      {item.workspace?.name || "Workspace"}
                    </p>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentSearch;
