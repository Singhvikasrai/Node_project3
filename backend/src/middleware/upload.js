import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { uploadsDirectory } from "../config/paths.js";

const ensureDirectory = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
   const uploadDir = file.mimetype === "application/pdf"
      ? ensureDirectory(path.join(uploadsDirectory, "pdfs"))
      : ensureDirectory(path.join(uploadsDirectory, "images"));

    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const originalName = path.basename(file.originalname).replace(/\s+/g, "-");
    const safeName = `${Date.now()}-${crypto.randomUUID()}-${originalName}`;
    cb(null, safeName);
  },
});

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error("Only PDF, JPG, PNG, and WebP files are allowed.");
      error.statusCode = 400;
      return cb(error);
    }

    return cb(null, true);
  },
});

export default upload;
