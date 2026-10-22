
import Document from "../models/Document.js";
import Workspace from "../models/Workspace.js";
import WorkspaceMember from "../models/WorkspaceMember.js";
import Activity from "../models/Activity.js";
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

    try {
  await Activity.create({
    workspace: workspaceId,
    user: req.user.userId,
    type: "document_created",
    document: document._id,
    description: `created the document "${document.title}"`
  });
} catch (activityError) {
  console.error("Failed to record document creation:", activityError);
}

    res.status(201).json({
      success: true,
      message: "Document created successfully",
      document
    });
  } catch (error) {
    res.status(500).json({
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

    document.content = content;
    document.updatedBy = req.user.userId;

    await document.save();
    try {
  await Activity.create({
    workspace: document.workspace,
    user: req.user.userId,
    type: "document_updated",
    document: document._id,
    description: `updated the document "${document.title}"`
  });
} catch (activityError) {
  console.error("Failed to record document update:", activityError);
}
    res.status(200).json({
      success: true,
      message: "Document saved successfully",
      document
    });
  } catch (error) {
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
