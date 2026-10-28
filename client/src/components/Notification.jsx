import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/Authcontext";
import api from "../services/api";
import { SOCKET_URL } from "../config";

const Notifications = () => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!token) return;

    try {
      setLoading(true);

      const response = await api.get("/notifications", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    fetchNotifications();

    const socket = io(SOCKET_URL, {
      auth: { token }
    });

    socket.on("notification:new", (notification) => {
      setNotifications((previous) => {
        if (previous.some((item) => item._id === notification._id)) {
          return previous;
        }

        return [notification, ...previous].slice(0, 30);
      });

      setUnreadCount((previous) => previous + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const markAsRead = async (notificationId) => {
    const notification = notifications.find(
      (item) => item._id === notificationId
    );

    if (!notification || notification.read) return;

    try {
      await api.patch(
        `/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setNotifications((previous) =>
        previous.map((item) =>
          item._id === notificationId
            ? { ...item, read: true }
            : item
        )
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  
const markAllAsRead = async () => {
  if (unreadCount === 0) return;

  try {
    const response = await api.patch(
      "/notifications/read-all",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    setNotifications((previous) =>
      previous.map((item) => ({
        ...item,
        read: true
      }))
    );

    setUnreadCount(response.data.unreadCount ?? 0);
  } catch (error) {
    console.error(
      "Failed to mark all notifications as read:",
      error.response?.data || error
    );
  }
};


  const getNotificationText = (notification) => {
    const actor = notification.actor?.name || "Someone";

    if (notification.type === "comment") {
      return `${actor} ${notification.message}`;
    }

    if (notification.type === "workspace_invitation") {
      return `${actor} ${notification.message}`;
    }

    if (notification.type === "document_update") {
      return `${actor} ${notification.message}`;
    }

    return notification.message;
  };

  const getDocumentLink = (notification) => {
    if (notification.document?._id) {
      return `/document/${notification.document._id}`;
    }

    return null;
  };

  const formatTime = (date) => {
    const timestamp = new Date(date);
    const now = new Date();
    const seconds = Math.floor((now - timestamp) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

    return timestamp.toLocaleDateString();
  };

  if (!token) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((previous) => !previous);
          if (!open) fetchNotifications();
        }}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#252522] transition hover:bg-[#f4f1e9]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 21h4"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#68705a] px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#e8e5dc] bg-[#faf9f5] shadow-xl">
          <div className="flex items-center justify-between border-b border-[#e8e5dc] px-5 py-4">
            <div>
              <h3 className="font-serif text-lg text-[#252522]">
                Notifications
              </h3>
              <p className="mt-0.5 text-xs text-[#77786f]">
                {unreadCount === 0
                  ? "You're all caught up"
                  : `${unreadCount} unread`}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-medium text-[#68705a] transition hover:text-[#252522]"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-[#77786f]">
                Loading notifications...
              </p>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#f0eee5] text-[#68705a]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[#252522]">
                  No notifications yet
                </p>
                <p className="mt-1 text-xs text-[#77786f]">
                  Updates from your workspace will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const documentLink = getDocumentLink(notification);

                const content = (
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eeece2] font-serif text-sm text-[#68705a]">
                      {(notification.actor?.name || "S")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-5 text-[#252522]">
                        {getNotificationText(notification)}
                      </p>

                      {notification.document?.title && (
                        <p className="mt-1 truncate text-xs text-[#68705a]">
                          {notification.document.title}
                        </p>
                      )}

                      <p className="mt-1.5 text-[11px] text-[#8b8b81]">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>

                    {!notification.read && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#68705a]" />
                    )}
                  </div>
                );

                return (
                  <div
                    key={notification._id}
                    className={`border-b border-[#eeece5] last:border-b-0 ${
                      notification.read ? "" : "bg-[#f3f2e9]"
                    }`}
                  >
                    {documentLink ? (
                      <Link
                        to={documentLink}
                        onClick={() => {
                          markAsRead(notification._id);
                          setOpen(false);
                        }}
                        className="block px-5 py-4 transition hover:bg-[#eeece5]"
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markAsRead(notification._id)}
                        className="block w-full px-5 py-4 text-left transition hover:bg-[#eeece5]"
                      >
                        {content}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;