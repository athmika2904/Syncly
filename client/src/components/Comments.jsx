import { useEffect, useState } from "react";
import { useAuth } from "../context/Authcontext";
import api from "../services/api";

const Comments = ({ documentId, user }) => {
  const { token } = useAuth();

  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  const fetchComments = async () => {
    try {
      const response = await api.get(
        `/comments/document/${documentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setComments(response.data.comments);
    } catch (error) {
      console.error("Failed to fetch comments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    fetchComments();
  }, [documentId, token]);

  const handleAddComment = async () => {
    if (!content.trim()) return;

    try {
      setSubmitting(true);

      const response = await api.post(
        `/comments/document/${documentId}`,
        {
          content: content.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setComments((prev) => [...prev, response.data.comment]);
      setContent("");
    } catch (error) {
      console.error("Failed to add comment", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      const response = await api.put(
        `/comments/${commentId}`,
        {
          content: editContent.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setComments((prev) =>
        prev.map((comment) =>
          comment._id === commentId
            ? response.data.comment
            : comment
        )
      );

      setEditingId(null);
      setEditContent("");
    } catch (error) {
      console.error("Failed to update comment", error);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setComments((prev) =>
        prev.filter((comment) => comment._id !== commentId)
      );
    } catch (error) {
      console.error("Failed to delete comment", error);
    }
  };

  const startEditing = (comment) => {
    setEditingId(comment._id);
    setEditContent(comment.content);
  };

  if (loading) {
    return (
      <aside className="w-80 border-l border-[#ddd9cf] bg-[#faf9f5] p-5">
        <p className="text-sm text-[#68705a]">
          Loading comments...
        </p>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-80 flex-col border-l border-[#ddd9cf] bg-[#faf9f5]">
      <div className="border-b border-[#ddd9cf] px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-[#252522]">
            Comments
          </h2>

          <span className="rounded-full bg-[#e8e6dc] px-2.5 py-1 text-xs text-[#68705a]">
            {comments.length}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {comments.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <p className="text-sm text-[#252522]">
                No comments yet
              </p>

              <p className="mt-1 text-xs text-[#77776f]">
                Start a conversation about this document.
              </p>
            </div>
          </div>
        ) : (
          comments.map((comment) => {
            const isOwner =
               String(comment.user?._id) === String(user?._id) ||
                String(comment.user?._id) === String(user?.id) ||
                String(comment.user?._id) === String(user?.userId);

            return (
              <div
                key={comment._id}
                className="rounded-xl border border-[#e2dfd5] bg-white p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-[#252522]">
                    {comment.user?.name}
                  </p>

                  <p className="text-[11px] text-[#99998f]">
                    {new Date(
                      comment.createdAt
                    ).toLocaleDateString()}
                  </p>
                </div>

                {editingId === comment._id ? (
                  <div>
                    <textarea
                      value={editContent}
                      onChange={(e) =>
                        setEditContent(e.target.value)
                      }
                      className="min-h-20 w-full resize-none rounded-lg border border-[#d8d5ca] bg-[#faf9f5] p-3 text-sm text-[#252522] outline-none focus:border-[#68705a]"
                    />

                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() =>
                          handleEdit(comment._id)
                        }
                        className="rounded-lg bg-[#68705a] px-3 py-1.5 text-xs text-white"
                      >
                        Save
                      </button>

                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditContent("");
                        }}
                        className="rounded-lg px-3 py-1.5 text-xs text-[#77776f]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm leading-6 text-[#45453f]">
                      {comment.content}
                    </p>

                    {isOwner && (
                      <div className="mt-3 flex gap-3">
                        <button
                          onClick={() =>
                            startEditing(comment)
                          }
                          className="text-xs text-[#68705a] hover:underline"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(comment._id)
                          }
                          className="text-xs text-[#9a5c5c] hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-[#ddd9cf] p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-20 w-full resize-none rounded-xl border border-[#d8d5ca] bg-white p-3 text-sm text-[#252522] outline-none placeholder:text-[#aaa99f] focus:border-[#68705a]"
        />

        <button
          onClick={handleAddComment}
          disabled={submitting || !content.trim()}
          className="mt-2 w-full rounded-xl bg-[#68705a] py-2.5 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Posting..." : "Comment"}
        </button>
      </div>
    </aside>
  );
};

export default Comments;