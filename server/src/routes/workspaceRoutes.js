import express from "express";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace
} from "../controllers/workspaceController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createWorkspace);
router.get("/", authMiddleware, getWorkspaces);
router.get("/:workspaceId", authMiddleware, getWorkspace);
export default router;