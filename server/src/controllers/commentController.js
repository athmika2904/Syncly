import Comment from "../models/Comment.js";
import Document from "../models/Document.js";
import WorkspaceMember from "../models/WorkspaceMember.js";

export const createComment = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required"
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

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: populatedComment
    });
  } catch (error) {
    res.status(500).json({
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

    res.status(200).json({
      success: true,
      comments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required"
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

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      comment: updatedComment
    });
  } catch (error) {
    res.status(500).json({
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

    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};