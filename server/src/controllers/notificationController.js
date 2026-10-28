import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .populate("actor", "name")
        .populate("workspace", "name")
        .populate("document", "title")
        .sort({ createdAt: -1 })
        .limit(30),
      Notification.countDocuments({
        recipient: userId,
        read: false
      })
    ]);

    res.status(200).json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications"
    });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.userId,
      read: false
    });

    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error("Get unread count error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count"
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.notificationId,
        recipient: req.user.userId
      },
      {
        $set: {
          read: true,
          readAt: new Date()
        }
      },
      {
        returnDocument: "after",
        runValidators: true
      }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update notification"
    });
  }
};


export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        recipient: req.user.userId,
        read: false
      },
      {
        $set: {
          read: true,
          readAt: new Date()
        }
      }
    );

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.userId,
      read: false
    });

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
      unreadCount
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update notifications"
    });
  }
};

