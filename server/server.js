import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import dotenv from "dotenv";

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import Comment from "./src/models/Comment.js";
dotenv.config();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});
app.set("io", io);
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

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
      const Document = (await import("./src/models/Document.js")).default;
      const WorkspaceMember = (await import("./src/models/WorkspaceMember.js")).default;

      const document = await Document.findById(documentId);

      if (!document) {
        return callback({
          success: false,
          message: "Document not found"
        });
      }

      const membership = await WorkspaceMember.findOne({
        workspace: document.workspace,
        user: socket.userId
      });

      if (!membership) {
        return callback({
          success: false,
          message: "You do not have access to this document"
        });
      }

      socket.join(`document:${documentId}`);

      callback({
        success: true,
        content: document.content || ""
      });
    } catch (error) {
      callback({
        success: false,
        message: "Failed to join document"
      });
    }
  });

  socket.on("document:change", async ({ documentId, content }) => {
    try {
      const Document = (await import("./src/models/Document.js")).default;
      const WorkspaceMember = (await import("./src/models/WorkspaceMember.js")).default;

      const document = await Document.findById(documentId);

      if (!document) return;

      const membership = await WorkspaceMember.findOne({
        workspace: document.workspace,
        user: socket.userId
      });

      if (!membership) return;

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
    socket.on("comment:created", async ({ documentId, content }, callback) => {
    try {
      const Document = (await import("./src/models/Document.js")).default;
      const WorkspaceMember = (await import("./src/models/WorkspaceMember.js")).default;

      const document = await Document.findById(documentId);

      if (!document) {
        return callback?.({
          success: false,
          message: "Document not found"
        });
      }

      const membership = await WorkspaceMember.findOne({
        workspace: document.workspace,
        user: socket.userId
      });

      if (!membership) {
        return callback?.({
          success: false,
          message: "You do not have access to this document"
        });
      }

      const comment = await Comment.create({
        content,
        document: documentId,
        user: socket.userId
      });

      const populatedComment = await Comment.findById(comment._id)
        .populate("user", "name email");

      io.to(`document:${documentId}`).emit(
        "comment:created",
        populatedComment
      );

      callback?.({
        success: true,
        comment: populatedComment
      });
    } catch (error) {
      console.error("Comment creation error:", error);

      callback?.({
        success: false,
        message: "Failed to create comment"
      });
    }
  });

  socket.on("comment:updated", async ({ commentId, content }, callback) => {
    try {
      const comment = await Comment.findById(commentId);

      if (!comment) {
        return callback?.({
          success: false,
          message: "Comment not found"
        });
      }

      if (String(comment.user) !== String(socket.userId)) {
        return callback?.({
          success: false,
          message: "You can only edit your own comments"
        });
      }

      comment.content = content;
      await comment.save();

      const populatedComment = await Comment.findById(comment._id)
        .populate("user", "name email");

      io.to(`document:${comment.document}`).emit(
        "comment:updated",
        populatedComment
      );

      callback?.({
        success: true,
        comment: populatedComment
      });
    } catch (error) {
      console.error("Comment update error:", error);

      callback?.({
        success: false,
        message: "Failed to update comment"
      });
    }
  });

  socket.on("comment:deleted", async (commentId, callback) => {
    try {
      const comment = await Comment.findById(commentId);

      if (!comment) {
        return callback?.({
          success: false,
          message: "Comment not found"
        });
      }

      if (String(comment.user) !== String(socket.userId)) {
        return callback?.({
          success: false,
          message: "You can only delete your own comments"
        });
      }

      const documentId = comment.document;

      await comment.deleteOne();

      io.to(`document:${documentId}`).emit(
        "comment:deleted",
        commentId
      );

      callback?.({
        success: true
      });
    } catch (error) {
      console.error("Comment deletion error:", error);

      callback?.({
        success: false,
        message: "Failed to delete comment"
      });
    }
  });
  socket.on("document:leave", (documentId) => {
    socket.leave(`document:${documentId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.userId);
  });
});


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(
      `Syncly API and Socket.IO running on port ${PORT}`
    );
  });
};

startServer();