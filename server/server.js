
import "dotenv/config";

import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import Comment from "./src/models/Comment.js";
import Document from "./src/models/Document.js";
import WorkspaceMember from "./src/models/WorkspaceMember.js";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  }
});

app.set("io", io);

const respond = (callback, data) => {
  if (typeof callback === "function") {
    callback(data);
  }
};

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.userId}`);

  console.log("User connected:", socket.userId);

  socket.on("document:join", async (documentId, callback) => {
    try {
      if (
        typeof documentId !== "string" ||
        !documentId.trim()
      ) {
        return respond(callback, {
          success: false,
          message: "A valid document ID is required"
        });
      }

      const document = await Document.findById(documentId);

      if (!document) {
        return respond(callback, {
          success: false,
          message: "Document not found"
        });
      }

      const membership = await WorkspaceMember.findOne({
        workspace: document.workspace,
        user: socket.userId
      });

      if (!membership) {
        return respond(callback, {
          success: false,
          message: "You do not have access to this document"
        });
      }

      socket.join(`document:${documentId}`);

      return respond(callback, {
        success: true,
        content: document.content || ""
      });
    } catch (error) {
      console.error("Document join error:", error);

      return respond(callback, {
        success: false,
        message: "Failed to join document"
      });
    }
  });

  socket.on("document:change", async (payload) => {
    try {
      const { documentId, content } = payload || {};

      if (
        typeof documentId !== "string" ||
        typeof content !== "string"
      ) {
        return;
      }

      const document = await Document.findById(documentId);

      if (!document) {
        return;
      }

      const membership = await WorkspaceMember.findOne({
        workspace: document.workspace,
        user: socket.userId
      });

      if (!membership) {
        return;
      }

      document.content = content;
      document.updatedBy = socket.userId;

      await document.save();

      socket.to(`document:${documentId}`).emit("document:updated", {
        content
      });
    } catch (error) {
      console.error("Document change error:", error);
    }
  });

  socket.on("comment:created", async (payload, callback) => {
    try {
      const { documentId, content } = payload || {};

      if (
        typeof documentId !== "string" ||
        typeof content !== "string" ||
        !content.trim()
      ) {
        return respond(callback, {
          success: false,
          message: "Document ID and comment content are required"
        });
      }

      const document = await Document.findById(documentId);

      if (!document) {
        return respond(callback, {
          success: false,
          message: "Document not found"
        });
      }

      const membership = await WorkspaceMember.findOne({
        workspace: document.workspace,
        user: socket.userId
      });

      if (!membership) {
        return respond(callback, {
          success: false,
          message: "You do not have access to this document"
        });
      }

      const comment = await Comment.create({
        content: content.trim(),
        document: documentId,
        user: socket.userId
      });

      const populatedComment = await Comment.findById(comment._id)
        .populate("user", "name email");

      io.to(`document:${documentId}`).emit(
        "comment:created",
        populatedComment
      );

      return respond(callback, {
        success: true,
        comment: populatedComment
      });
    } catch (error) {
      console.error("Comment creation error:", error);

      return respond(callback, {
        success: false,
        message: "Failed to create comment"
      });
    }
  });

  socket.on("comment:updated", async (payload, callback) => {
    try {
      const { commentId, content } = payload || {};

      if (
        typeof commentId !== "string" ||
        typeof content !== "string" ||
        !content.trim()
      ) {
        return respond(callback, {
          success: false,
          message: "Comment ID and content are required"
        });
      }

      const comment = await Comment.findById(commentId);

      if (!comment) {
        return respond(callback, {
          success: false,
          message: "Comment not found"
        });
      }

      if (String(comment.user) !== String(socket.userId)) {
        return respond(callback, {
          success: false,
          message: "You can only edit your own comments"
        });
      }

      const document = await Document.findById(comment.document);

      if (!document) {
        return respond(callback, {
          success: false,
          message: "Document not found"
        });
      }

      const membership = await WorkspaceMember.findOne({
        workspace: document.workspace,
        user: socket.userId
      });

      if (!membership) {
        return respond(callback, {
          success: false,
          message: "You do not have access to this document"
        });
      }

      comment.content = content.trim();
      await comment.save();

      const populatedComment = await Comment.findById(comment._id)
        .populate("user", "name email");

      io.to(`document:${comment.document}`).emit(
        "comment:updated",
        populatedComment
      );

      return respond(callback, {
        success: true,
        comment: populatedComment
      });
    } catch (error) {
      console.error("Comment update error:", error);

      return respond(callback, {
        success: false,
        message: "Failed to update comment"
      });
    }
  });

  socket.on("comment:deleted", async (commentId, callback) => {
    try {
      if (typeof commentId !== "string") {
        return respond(callback, {
          success: false,
          message: "A valid comment ID is required"
        });
      }

      const comment = await Comment.findById(commentId);

      if (!comment) {
        return respond(callback, {
          success: false,
          message: "Comment not found"
        });
      }

      if (String(comment.user) !== String(socket.userId)) {
        return respond(callback, {
          success: false,
          message: "You can only delete your own comments"
        });
      }

      const document = await Document.findById(comment.document);

      if (!document) {
        return respond(callback, {
          success: false,
          message: "Document not found"
        });
      }

      const membership = await WorkspaceMember.findOne({
        workspace: document.workspace,
        user: socket.userId
      });

      if (!membership) {
        return respond(callback, {
          success: false,
          message: "You do not have access to this document"
        });
      }

      const documentId = String(comment.document);

      await comment.deleteOne();

      io.to(`document:${documentId}`).emit(
        "comment:deleted",
        commentId
      );

      return respond(callback, {
        success: true
      });
    } catch (error) {
      console.error("Comment deletion error:", error);

      return respond(callback, {
        success: false,
        message: "Failed to delete comment"
      });
    }
  });

  socket.on("document:leave", (documentId) => {
    if (typeof documentId === "string") {
      socket.leave(`document:${documentId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.userId);
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`Syncly API and Socket.IO running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start Syncly server:", error);
    process.exit(1);
  }
};

startServer();
