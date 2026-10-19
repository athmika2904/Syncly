
import express from "express";

import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from "../controllers/notificationController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getNotifications);

router.get(
  "/unread-count",
  authMiddleware,
  getUnreadCount
);

router.patch(
  "/read-all",
  authMiddleware,
  markAllNotificationsAsRead
);

router.patch(
  "/:notificationId/read",
  authMiddleware,
  markNotificationAsRead
);

export default router;
