import express from "express";
import {
  createWorkspace,
  getWorkspaces
} from "../controllers/workspaceController.js";
import authMiddleware from "../middleware/authMiddleWare.js";

const router = express.Router();

router.post("/", authMiddleware, createWorkspace);
router.get("/", authMiddleware, getWorkspaces);

export default router;