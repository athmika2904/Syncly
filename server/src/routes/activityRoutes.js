import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getWorkspaceActivity
} from "../controllers/activityController.js";

const router = express.Router();

router.get(
  "/workspace/:workspaceId",
  authMiddleware,
  getWorkspaceActivity
);

export default router;