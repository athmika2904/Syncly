import Comment from "../models/Comment.js";
import Document from "../models/Document.js";
import WorkspaceMember from "../models/WorkspaceMember.js";
import Notification from "../models/Notification.js";

export const createComment = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { content } = req.body;

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required"
      });
    }

    if (content.trim().length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Comment is too long"
      });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    const membership = await WorkspaceMember.findOne({
      workspace: document.workspace,
      user: req.user.userId
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this document"
      });
    }

    const comment = await Comment.create({
      content: content.trim(),
      document: documentId,
      user: req.user.userId
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate("user", "name email");

    const io = req.app.get("io");

    if (io) {
      io.to(`document:${documentId}`).emit(
        "comment:created",
        populatedComment
      );
    }

    
    try {
      const members = await WorkspaceMember.find({
        workspace: document.workspace,
        user: { $ne: req.user.userId }
      }).select("user");

      await Promise.all(
        members.map(async (member) => {
          const notification = await Notification.create({
            recipient: member.user,
            actor: req.user.userId,
            type: "comment",
            message: `commented on "${document.title}"`,
            workspace: document.workspace,
            document: document._id
          });

          const populatedNotification = await Notification.findById(
            notification._id
          )
            .populate("actor", "name")
            .populate("workspace", "name")
            .populate("document", "title");

          if (io) {
            io.to(`user:${member.user}`).emit(
              "notification:new",
              populatedNotification
            );
          }
        })
      );
    } catch (notificationError) {
      console.error("Failed to create notifications:", notificationError);
    }

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: populatedComment
    });
  } catch (error) {
    console.error("Create comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

export const getComments = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    const membership = await WorkspaceMember.findOne({
      workspace: document.workspace,
      user: req.user.userId
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this document"
      });
    }

    const comments = await Comment.find({
      document: documentId
    })
      .populate("user", "name email")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      comments
    });
  } catch (error) {
    console.error("Get comments error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required"
      });
    }

    if (content.trim().length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Comment is too long"
      });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    if (comment.user.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own comments"
      });
    }

    comment.content = content.trim();

    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate("user", "name email");

    const io = req.app.get("io");

    if (io) {
      io.to(`document:${comment.document}`).emit(
        "comment:updated",
        updatedComment
      );
    }

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      comment: updatedComment
    });
  } catch (error) {
    console.error("Update comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    if (comment.user.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comments"
      });
    }

    const documentId = comment.document;

    await Comment.findByIdAndDelete(commentId);

    const io = req.app.get("io");

    if (io) {
      io.to(`document:${documentId}`).emit("comment:deleted", {
        commentId
      });
    }

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully"
    });
  } catch (error) {
    console.error("Delete comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};