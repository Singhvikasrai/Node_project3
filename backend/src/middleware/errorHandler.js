/** Standard fallback response for errors that reach Express middleware. */
export const notFoundHandler = (req, res) =>
  res.status(404).json({ success: false, message: "Route not found" });

/** Prevents uncaught errors from leaking implementation details to clients. */
export const errorHandler = (error, req, res, next) => {
  console.error("Unhandled request error:", error);

  if (res.headersSent) return next(error);

  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? "Internal server error" : error.message,
  });
};
