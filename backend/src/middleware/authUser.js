import jwt from "jsonwebtoken";

const unauthorized = (res, message) =>
  res.status(401).json({ success: false, message });

const authUser = (req, res, next) => {
  const authorization = req.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return unauthorized(res, "Not Authorized. Login Again");
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return unauthorized(res, "Token Missing");

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    console.warn("JWT verification failed:", error.message);
    return unauthorized(res, "Token expired or invalid. Login Again");
  }
};

/** Requires authentication middleware to run first. */
export const requireAdmin = (req, res, next) => {
  if (req.user?.role === "admin") return next();

  return res.status(403).json({
    success: false,
    message: "Admin access is required",
  });
};


export default authUser;
