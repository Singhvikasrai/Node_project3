import path from "path";
import { fileURLToPath } from "url";

const currentFilePath = fileURLToPath(import.meta.url);
const backendRoot = path.resolve(path.dirname(currentFilePath), "../..");

export const uploadsDirectory = path.join(backendRoot, "uploads");

/** Converts an uploaded file path into the public path stored in the database. */
export const toPublicUploadPath = (filePath) =>
  path.relative(backendRoot, filePath).replace(/\\/g, "/");
