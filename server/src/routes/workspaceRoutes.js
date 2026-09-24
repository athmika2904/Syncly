import express from "express";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  addMember,
  getMembers
} from "../controllers/workspaceController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createWorkspace);
router.get("/", authMiddleware, getWorkspaces);
router.get("/:workspaceId", authMiddleware, getWorkspace);
router.post(
  "/:workspaceId/members",
  authMiddleware,
  addMember
);

router.get(
  "/:workspaceId/members",
  authMiddleware,
  getMembers
);
export default router;