const ApiError = require("../utils/apiError");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (process.env.NODE_ENV === "development") {
    console.error("Error:", err);
  }

  if (err.code === "P2002") {
    const field = err.meta?.target?.join(", ") || "field";
    error = new ApiError(
      400,
      `Duplicate value for ${field}. This ${field} already exists.`,
    );
  }

  if (err.code === "P2025") {
    error = new ApiError(404, "Record not found.");
  }

  if (err.code === "P2003") {
    error = new ApiError(400, "Invalid reference. Related record not found.");
  }

  if (err.name === "JsonWebTokenError") {
    error = new ApiError(401, "Invalid token. Please log in again.");
  }

  if (err.name === "TokenExpiredError") {
    error = new ApiError(401, "Token expired. Please log in again.");
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    error = new ApiError(400, "File too large. Maximum size is 5MB.");
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal Server Error",
    errors: error.errors || [],
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
