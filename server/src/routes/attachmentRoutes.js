
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import {
  uploadAttachment,
  getAttachments
} from "../controllers/attachmentController.js";

const router = express.Router();

router.get(
  "/document/:documentId",
  authMiddleware,
  getAttachments
);

router.post(
  "/document/:documentId",
  authMiddleware,
  upload.single("file"),
  uploadAttachment
);

export default router;
