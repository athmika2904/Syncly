import express from "express";

import {
  createComment,
  getComments,
  updateComment,
  deleteComment
} from "../controllers/commentController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/document/:documentId",
  authMiddleware,
  createComment
);

router.get(
  "/document/:documentId",
  authMiddleware,
  getComments
);

router.put(
  "/:commentId",
  authMiddleware,
  updateComment
);

router.delete(
  "/:commentId",
  authMiddleware,
  deleteComment
);

export default router;