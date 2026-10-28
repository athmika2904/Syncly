import Document from "../models/Document.js";
import Workspace from "../models/Workspace.js";
import WorkspaceMember from "../models/WorkspaceMember.js";
import Activity from "../models/Activity.js";
import { recordDocumentEdit } from "../utils/documentActivity.js";

export const createDocument = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Document title is required"
      });
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found"
      });
    }

    const membership = await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: req.user.userId
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this workspace"
      });
    }

    // 1. Create the document first
    const document = await Document.create({
      title: title.trim(),
      content: "",
      workspace: workspaceId,
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    });

    // 2. Record the activity using the created document
    try {
      await Activity.create({
        workspace: workspaceId,
        user: req.user.userId,
        type: "document_created",
        document: document._id,
        description: `created the document "${document.title}"`
      });
    } catch (activityError) {
      console.error(
        "Failed to record document creation:",
        activityError
      );
    }

    // 3. Return the created document
    return res.status(201).json({
      success: true,
      message: "Document created successfully",
      document
    });
  } catch (error) {
    console.error("Create document error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

export const getDocuments = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const membership = await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: req.user.userId
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this workspace"
      });
    }

    const documents = await Document.find({
      workspace: workspaceId
    })
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      documents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

export const getDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

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

    res.status(200).json({
      success: true,
      document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

export const updateDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { content } = req.body;

    if (typeof content !== "string") {
      return res.status(400).json({
        success: false,
        message: "Document content must be a string"
      });
    }

    if (content.length > 1_000_000) {
      return res.status(400).json({
        success: false,
        message: "Document is too large"
      });
    }

    const existing = await Document.findById(documentId).select("workspace");

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    const membership = await WorkspaceMember.findOne({
      workspace: existing.workspace,
      user: req.user.userId
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this document"
      });
    }

    const document = await Document.findByIdAndUpdate(
      documentId,
      {
        $set: {
          content,
          updatedBy: req.user.userId
        },
        $inc: { version: 1 }
      },
      { returnDocument: "after", runValidators: true }
    );

    
    recordDocumentEdit({
      io: req.app.get("io"),
      document,
      userId: req.user.userId
    });

    
    const io = req.app.get("io");

    if (io) {
      io.to(`document:${documentId}`).emit("document:updated", {
        content: document.content,
        version: document.version,
        updatedBy: req.user.userId
      });
    }

    res.status(200).json({
      success: true,
      message: "Document saved successfully",
      document
    });
  } catch (error) {
    console.error("Update document error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

export const searchDocuments = async (req, res) => {
  try {
    const query = req.query.q?.trim();

    if (!query) {
      return res.status(200).json({
        success: true,
        documents: []
      });
    }

    if (query.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Search query cannot exceed 100 characters"
      });
    }

    const memberships = await WorkspaceMember.find({
      user: req.user.userId
    }).select("workspace");

    const workspaceIds = memberships.map(
      (membership) => membership.workspace
    );

    if (workspaceIds.length === 0) {
      return res.status(200).json({
        success: true,
        documents: []
      });
    }

    const escapedQuery = query.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const documents = await Document.find({
      workspace: { $in: workspaceIds },
      title: { $regex: escapedQuery, $options: "i" }
    })
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .populate("workspace", "name")
      .sort({ updatedAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      documents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};