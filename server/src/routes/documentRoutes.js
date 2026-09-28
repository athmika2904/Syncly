import express from "express";

import {
  createDocument,
  getDocuments,getDocument,updateDocument
} from "../controllers/documentController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/workspace/:workspaceId",
  authMiddleware,
  createDocument
);

router.get(
  "/workspace/:workspaceId",
  authMiddleware,
  getDocuments
);
router.get(
  "/:documentId",
  authMiddleware,
  getDocument
);

router.put(
  "/:documentId",
  authMiddleware,
  updateDocument
);
export default router;