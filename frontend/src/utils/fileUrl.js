import { API_BASE_URL } from "../config/api";

/** Builds a stable public URL for files stored by the backend. */
export const getFileUrl = (filePath) => {
  if (typeof filePath !== "string" || !filePath.trim()) return null;
  if (/^https?:\/\//i.test(filePath)) return filePath;

  const normalizedPath = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const uploadsPosition = normalizedPath.toLowerCase().indexOf("uploads/");
  const publicPath = uploadsPosition >= 0
    ? normalizedPath.slice(uploadsPosition)
    : normalizedPath;

  const encodedPath = publicPath.split("/").map(encodeURIComponent).join("/");
  return `${API_BASE_URL}/${encodedPath}`;
};
