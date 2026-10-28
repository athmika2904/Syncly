

import Activity from "../models/Activity.js";
import Notification from "../models/Notification.js";
import WorkspaceMember from "../models/WorkspaceMember.js";

export const EDIT_ACTIVITY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes


export const recordDocumentEdit = async ({ io, document, userId }) => {
  try {
    const since = new Date(Date.now() - EDIT_ACTIVITY_WINDOW_MS);

    const alreadyLogged = await Activity.exists({
      workspace: document.workspace,
      document: document._id,
      user: userId,
      type: "document_updated",
      createdAt: { $gte: since }
    });

    if (alreadyLogged) return;

    await Activity.create({
      workspace: document.workspace,
      user: userId,
      type: "document_updated",
      document: document._id,
      description: `updated the document "${document.title}"`
    });

    const members = await WorkspaceMember.find({
      workspace: document.workspace,
      user: { $ne: userId }
    }).select("user");

    if (members.length === 0) return;

    const created = await Notification.insertMany(
      members.map((member) => ({
        recipient: member.user,
        actor: userId,
        type: "document_update",
        message: `edited "${document.title}"`,
        workspace: document.workspace,
        document: document._id
      }))
    );

    if (!io) return;

    const populated = await Notification.find({
      _id: { $in: created.map((notification) => notification._id) }
    })
      .populate("actor", "name")
      .populate("workspace", "name")
      .populate("document", "title");

    populated.forEach((notification) => {
      io.to(`user:${notification.recipient}`).emit(
        "notification:new",
        notification
      );
    });
  } catch (error) {
    console.error("Failed to record document edit activity:", error);
  }
};