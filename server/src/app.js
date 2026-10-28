import express from "express";
import cors from "cors";
import documentRoutes from "./routes/documentRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js"
import workspaceRoutes from "./routes/workspaceRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js"
import attachmentRoutes from "./routes/attachmentRoutes.js"
import activityRoutes from "./routes/activityRoutes.js";
import { corsOptions } from "./config/cors.js";

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/comments", commentRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/attachments", attachmentRoutes);
app.use("/api/activities", activityRoutes);

// Unknown API route
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "File must be 10 MB or smaller"
    });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON body"
    });
  }

  if (err.message && err.message.startsWith("Only JPG")) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    message: "Server error"
  });
});

export default app;