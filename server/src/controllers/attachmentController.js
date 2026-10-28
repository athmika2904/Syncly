import ImageKit from "@imagekit/nodejs";
import Document from "../models/Document.js";
import WorkspaceMember from "../models/WorkspaceMember.js";
import Attachment from "../models/Attachment.js";

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY
});

const getAccessibleDocument = async (documentId, userId) => {
  const document = await Document.findById(documentId);

  if (!document) {
    return { error: "Document not found", status: 404 };
  }

  const membership = await WorkspaceMember.findOne({
    workspace: document.workspace,
    user: userId
  });

  if (!membership) {
    return { error: "You do not have access to this document", status: 403 };
  }

  return { document };
};

export const uploadAttachment = async (req, res) => {
  try {
    const { documentId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Choose a file to upload"
      });
    }

    if (!process.env.IMAGEKIT_PRIVATE_KEY) {
      return res.status(500).json({
        success: false,
        message: "File storage is not configured"
      });
    }

    const result = await getAccessibleDocument(
      documentId,
      req.user.userId
    );

    if (result.error) {
      return res.status(result.status).json({
        success: false,
        message: result.error
      });
    }

    const safeName = req.file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-150);

    const uploadedFile = await imagekit.files.upload({
      file: req.file.buffer.toString("base64"),
      fileName: `${Date.now()}-${safeName}`,
      folder: "/syncly/attachments"
    });

    const attachment = await Attachment.create({
      document: result.document._id,
      workspace: result.document.workspace,
      uploadedBy: req.user.userId,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      url: uploadedFile.url,
      fileId: uploadedFile.fileId
    });

    await attachment.populate("uploadedBy", "name email");

    const io = req.app.get("io");

    if (io) {
      io.to(`document:${documentId}`).emit(
        "attachment:created",
        attachment
      );
    }

    return res.status(201).json({
      success: true,
      attachment
    });
  } catch (error) {
    console.error("Upload attachment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to upload attachment"
    });
  }
};

export const getAttachments = async (req, res) => {
  try {
    const { documentId } = req.params;

    const result = await getAccessibleDocument(
      documentId,
      req.user.userId
    );

    if (result.error) {
      return res.status(result.status).json({
        success: false,
        message: result.error
      });
    }

    const attachments = await Attachment.find({
      document: documentId
    })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      attachments
    });
  } catch (error) {
    console.error("Fetch attachments error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch attachments"
    });
  }
};