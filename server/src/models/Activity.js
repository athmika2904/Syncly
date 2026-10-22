import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: ["document_created", "document_updated"],
      required: true
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null
    },
    description: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

activitySchema.index({ workspace: 1, createdAt: -1 });

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;