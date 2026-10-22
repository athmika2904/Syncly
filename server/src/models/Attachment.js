
import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    fileId: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

attachmentSchema.index({ document: 1, createdAt: -1 });

export default mongoose.model("Attachment", attachmentSchema);
