import "dotenv/config";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import connectDB from "./src/config/db.js";
import Comment from "./src/models/Comment.js";
import Document from "./src/models/Document.js";
import WorkspaceMember from "./src/models/WorkspaceMember.js";
import app from "./src/app.js";
import { corsOptions, getAllowedOrigins } from "./src/config/cors.js";
import { recordDocumentEdit } from "./src/utils/documentActivity.js";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: corsOptions.origin,
    methods: ["GET", "POST"]
  }
});

app.set("io", io);

const respond = (callback, data) => {
  if (typeof callback === "function") {
    callback(data);
  }
};

const versionFilter = (version) =>
  version === 0
    ? {
        $or: [
          { version: 0 },
          { version: { $exists: false } },
          { version: null }
        ]
      }
    : { version };

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required."));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return next(new Error("Invalid authentication token."));
    }

    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error("Invalid or expired authentication token."));
  }
});

const getWorkspaceMembership = async (document, userId) => {
  return WorkspaceMember.findOne({
    workspace: document.workspace,
    user: userId
  });
};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.userId}`);

  socket.join(`user:${socket.userId}`);

 
  socket.on("document:join", async (documentId, callback) => {
    try {
      if (typeof documentId !== "string" || !documentId.trim()) {
        return respond(callback, {
          success: false,
          message: "Invalid document ID."
        });
      }

      const document = await Document.findById(documentId);

      if (!document) {
        return respond(callback, {
          success: false,
          message: "Document not found."
        });
      }

      const membership = await getWorkspaceMembership(
        document,
        socket.userId
      );

      if (!membership) {
        return respond(callback, {
          success: false,
          message: "You do not have access to this document."
        });
      }

      socket.join(`document:${documentId}`);

      return respond(callback, {
        success: true,
        content: document.content || "",
        version: document.version ?? 0
      });
    } catch (error) {
      console.error("document:join error:", error);

      return respond(callback, {
        success: false,
        message: "Unable to join document."
      });
    }
  });

  socket.on("document:change", async (payload, callback) => {
    try {
      const { documentId, content, version } = payload || {};

      if (
        typeof documentId !== "string" ||
        !documentId.trim() ||
        typeof content !== "string" ||
        !Number.isInteger(version) ||
        version < 0
      ) {
        return respond(callback, {
          success: false,
          message: "Invalid document change."
        });
      }

      if (content.length > 1_000_000) {
        return respond(callback, {
          success: false,
          message: "Document is too large."
        });
      }

      if (!socket.rooms.has(`document:${documentId}`)) {
        return respond(callback, {
          success: false,
          message: "Join the document before editing."
        });
      }

      const document = await Document.findById(documentId).select(
        "workspace title"
      );

      if (!document) {
        return respond(callback, {
          success: false,
          message: "Document not found."
        });
      }

      const membership = await getWorkspaceMembership(
        document,
        socket.userId
      );

      if (!membership) {
        return respond(callback, {
          success: false,
          message: "You do not have permission to edit this document."
        });
      }

      const updatedDocument = await Document.findOneAndUpdate(
        {
          _id: documentId,
          ...versionFilter(version)
        },
        {
          $set: {
            content,
            updatedBy: socket.userId
          },
          $inc: {
            version: 1
          }
        },
        {
          returnDocument: "after",
          runValidators: true
        }
      );

      if (!updatedDocument) {
        
        const latestDocument = await Document.findById(documentId);

        if (!latestDocument) {
          return respond(callback, {
            success: false,
            message: "Document not found."
          });
        }

        return respond(callback, {
          success: false,
          conflict: true,
          message: "Another edit was saved first.",
          content: latestDocument.content || "",
          version: latestDocument.version ?? 0
        });
      }

      
      respond(callback, {
        success: true,
        version: updatedDocument.version
      });


      socket.to(`document:${documentId}`).emit("document:updated", {
        content: updatedDocument.content,
        version: updatedDocument.version,
        updatedBy: socket.userId
      });

      
      recordDocumentEdit({
        io,
        document,
        userId: socket.userId
      });
    } catch (error) {
      console.error("document:change error:", error);

      return respond(callback, {
        success: false,
        message: "Failed to save document."
      });
    }
  });

  // Create a comment
  socket.on("comment:created", async (payload, callback) => {
    try {
      const { documentId, content } = payload || {};

      if (
        typeof documentId !== "string" ||
        !documentId.trim() ||
        typeof content !== "string" ||
        !content.trim()
      ) {
        return respond(callback, {
          success: false,
          message: "Document ID and comment content are required."
        });
      }

      if (content.trim().length > 5000) {
        return respond(callback, {
          success: false,
          message: "Comment is too long."
        });
      }

      const document = await Document.findById(documentId);

      if (!document) {
        return respond(callback, {
          success: false,
          message: "Document not found."
        });
      }

      const membership = await getWorkspaceMembership(
        document,
        socket.userId
      );

      if (!membership) {
        return respond(callback, {
          success: false,
          message: "You do not have access to this document."
        });
      }

      if (!socket.rooms.has(`document:${documentId}`)) {
        return respond(callback, {
          success: false,
          message: "Join the document before commenting."
        });
      }

      const comment = await Comment.create({
        document: documentId,
        user: socket.userId,
        content: content.trim()
      });

      const populatedComment = await Comment.findById(
        comment._id
      ).populate("user", "name email");

      io.to(`document:${documentId}`).emit(
        "comment:created",
        populatedComment
      );

      return respond(callback, {
        success: true,
        comment: populatedComment
      });
    } catch (error) {
      console.error("comment:created error:", error);

      return respond(callback, {
        success: false,
        message: "Failed to create comment."
      });
    }
  });

  // Update a comment
  socket.on("comment:updated", async (payload, callback) => {
    try {
      const { commentId, content } = payload || {};

      if (
        typeof commentId !== "string" ||
        !commentId.trim() ||
        typeof content !== "string" ||
        !content.trim()
      ) {
        return respond(callback, {
          success: false,
          message: "Comment ID and content are required."
        });
      }

      if (content.trim().length > 5000) {
        return respond(callback, {
          success: false,
          message: "Comment is too long."
        });
      }

      const comment = await Comment.findById(commentId);

      if (!comment) {
        return respond(callback, {
          success: false,
          message: "Comment not found."
        });
      }

      if (String(comment.user) !== String(socket.userId)) {
        return respond(callback, {
          success: false,
          message: "You can only edit your own comments."
        });
      }

      const document = await Document.findById(comment.document);

      if (!document) {
        return respond(callback, {
          success: false,
          message: "Document not found."
        });
      }

      const membership = await getWorkspaceMembership(
        document,
        socket.userId
      );

      if (!membership) {
        return respond(callback, {
          success: false,
          message: "You do not have access to this document."
        });
      }

      if (!socket.rooms.has(`document:${document._id}`)) {
        return respond(callback, {
          success: false,
          message: "Join the document before editing comments."
        });
      }

      comment.content = content.trim();
      await comment.save();

      const populatedComment = await Comment.findById(
        comment._id
      ).populate("user", "name email");

      io.to(`document:${document._id}`).emit(
        "comment:updated",
        populatedComment
      );

      return respond(callback, {
        success: true,
        comment: populatedComment
      });
    } catch (error) {
      console.error("comment:updated error:", error);

      return respond(callback, {
        success: false,
        message: "Failed to update comment."
      });
    }
  });

  socket.on("comment:deleted", async (payload, callback) => {
    try {
      const { commentId } = payload || {};

      if (typeof commentId !== "string" || !commentId.trim()) {
        return respond(callback, {
          success: false,
          message: "Comment ID is required."
        });
      }

      const comment = await Comment.findById(commentId);

      if (!comment) {
        return respond(callback, {
          success: false,
          message: "Comment not found."
        });
      }

      if (String(comment.user) !== String(socket.userId)) {
        return respond(callback, {
          success: false,
          message: "You can only delete your own comments."
        });
      }

      const document = await Document.findById(comment.document);

      if (!document) {
        return respond(callback, {
          success: false,
          message: "Document not found."
        });
      }

      const membership = await getWorkspaceMembership(
        document,
        socket.userId
      );

      if (!membership) {
        return respond(callback, {
          success: false,
          message: "You do not have access to this document."
        });
      }

      if (!socket.rooms.has(`document:${document._id}`)) {
        return respond(callback, {
          success: false,
          message: "Join the document before deleting comments."
        });
      }

      await Comment.findByIdAndDelete(commentId);

      io.to(`document:${document._id}`).emit("comment:deleted", {
        commentId
      });

      return respond(callback, {
        success: true,
        commentId
      });
    } catch (error) {
      console.error("comment:deleted error:", error);

      return respond(callback, {
        success: false,
        message: "Failed to delete comment."
      });
    }
  });

  socket.on("document:leave", (documentId) => {
    if (typeof documentId === "string") {
      socket.leave(`document:${documentId}`);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`User disconnected: ${socket.userId}`, reason);
  });
});


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not set in the environment.");
    }

    await connectDB();

    const origins = getAllowedOrigins();

    console.log(
      origins.length > 0
        ? `Allowed CORS origins: ${origins.join(", ")}`
        : "WARNING: CLIENT_URL is not set, so all browser origins are blocked."
    );

   
    const migrated = await Document.updateMany(
      { version: { $exists: false } },
      { $set: { version: 0 } }
    );

    if (migrated.modifiedCount > 0) {
      console.log(
        `Migrated ${migrated.modifiedCount} document(s) to include a version field.`
      );
    }

    server.listen(PORT, () => {
      console.log(`Syncly API and Socket.IO running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();