import express from "express";
import cors from "cors";
import documentRoutes from "./routes/documentRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js"
import workspaceRoutes from "./routes/workspaceRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/comments", commentRoutes);
export default app;