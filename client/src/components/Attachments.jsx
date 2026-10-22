
import { useEffect, useRef, useState } from "react";
import { Paperclip, Upload, FileText, Image, ExternalLink } from "lucide-react";
import { io } from "socket.io-client";
import api from "../services/api";
import { useAuth } from "../context/Authcontext";

const Attachments = ({ documentId }) => {
  const { token } = useAuth();
  const inputRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !documentId) return;

    let active = true;

    const fetchAttachments = async () => {
      try {
        const response = await api.get(
          `/attachments/document/${documentId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (active) {
          setAttachments(response.data.attachments || []);
        }
      } catch {
        if (active) setError("Unable to load attachments.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAttachments();

    const socket = io("http://localhost:5000", {
      auth: { token }
    });

    socket.emit("document:join", { documentId });

    socket.on("attachment:created", (attachment) => {
      if (active) {
        setAttachments((current) => {
          if (current.some((item) => item._id === attachment._id)) {
            return current;
          }

          return [attachment, ...current];
        });
      }
    });

    return () => {
      active = false;
      socket.emit("document:leave", { documentId });
      socket.disconnect();
    };
  }, [documentId, token]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post(
        `/attachments/document/${documentId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const attachment = response.data.attachment;

      setAttachments((current) => {
        if (current.some((item) => item._id === attachment._id)) {
          return current;
        }

        return [attachment, ...current];
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-[#faf9f5] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#252522]">
            <Paperclip size={18} className="text-[#68705a]" />
            <h2 className="font-serif text-xl">Shared files</h2>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Screenshots, mockups, diagrams and documents
          </p>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#252522] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#414638] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Upload size={16} />
          {uploading ? "Uploading..." : "Upload file"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-stone-500">
          Loading files...
        </p>
      ) : attachments.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-stone-300 px-5 py-10 text-center">
          <Upload size={24} className="mx-auto text-stone-400" />
          <p className="mt-3 text-sm font-medium text-[#252522]">
            No shared files yet
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Upload a screenshot or design to start a discussion.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {attachments.map((attachment) => {
            const isImage = attachment.fileType.startsWith("image/");

            return (
              <article
                key={attachment._id}
                className="overflow-hidden rounded-xl border border-stone-200 bg-white"
              >
                {isImage ? (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block bg-stone-100"
                  >
                    <img
                      src={attachment.url}
                      alt={attachment.fileName}
                      loading="lazy"
                      className="h-44 w-full object-cover transition hover:opacity-90"
                    />
                  </a>
                ) : (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-44 flex-col items-center justify-center gap-3 bg-[#f0eee5] text-[#68705a] hover:bg-[#e8e5d9]"
                  >
                    <FileText size={34} />
                    <span className="text-sm font-medium">Preview PDF</span>
                  </a>
                )}

                <div className="p-3">
                  <p className="truncate text-sm font-medium text-[#252522]">
                    {attachment.fileName}
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    {attachment.uploadedBy?.name || "Workspace member"} ·{" "}
                    {(attachment.fileSize / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#68705a] hover:underline"
                  >
                    <ExternalLink size={13} />
                    Open file
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default Attachments;
