const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const ResponseFormatter = require("../utils/responseFormatter");
// const { AppError } = require('../utils/errorHandler');

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Extract Bearer token from Authorization header
const extractToken = (req) => {
  if (!req.headers.authorization) return null;

  const [type, token] = req.headers.authorization.split(" ");
  return type === "Bearer" ? token : null;
};

// Optional JWT: attach req.user when a valid Bearer token is present; otherwise continue.
// Used for public routes that must still recognize the logged-in user (e.g. own pending listing).
exports.optionalVerifyToken = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return next();
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password").lean();

    if (user) {
      req.user = user;
      if (user._id) {
        req.user.id = user._id.toString();
      }
    }
    return next();
  } catch {
    // Invalid or expired token on an optional-auth route: behave as anonymous.
    return next();
  }
};

// Verify JWT token
exports.verifyToken = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return ResponseFormatter.unauthorized(
        res,
        "Please provide a token in the Authorization header",
      );
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    //lean query to get plain JS object instead of Mongoose document
    const user = await User.findById(decoded.id).select("-password").lean();
    if (!user) {
      return ResponseFormatter.unauthorized(res, "User not found");
    }
    // `.lean()` returns a plain object without Mongoose's `id` virtual; controllers use `req.user.id`.
    req.user = user;
    if (user._id) {
      req.user.id = user._id.toString();
    }
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return ResponseFormatter.unauthorized(res, "Token has expired");
    }
    if (error.name === "JsonWebTokenError") {
      return ResponseFormatter.unauthorized(res, "Invalid token");
    }
    console.error("Token verification error:", error);
    return ResponseFormatter.serverError(
      res,
      "Error verifying token",
      error.message,
    );
  }
};

// Authorize roles
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ResponseFormatter.unauthorized(res, "User not authenticated");
    }

    if (!roles.includes(req.user.role)) {
      return ResponseFormatter.forbidden(
        res,
        `User role '${req.user.role}' is not authorized to access this route`,
      );
    }

    next();
  };
};
