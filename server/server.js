import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import dotenv from "dotenv";

import app from "./src/app.js";
import connectDB from "./src/config/db.js";

dotenv.config();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

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