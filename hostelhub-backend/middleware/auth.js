const jwt = require("jsonwebtoken");
const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new ApiError(401, "Not authorized. Please log in."));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        studentProfile: true,
        managerProfile: true,
        guestProfile: true,
      },
    });

    if (!user) {
      return next(new ApiError(401, "User not found. Token is invalid."));
    }

    if (user.status === "SUSPENDED") {
      return next(
        new ApiError(
          403,
          "Your account has been suspended. Please contact support for assistance.",
        ),
      );
    }

    if (user.status === "INACTIVE") {
      return next(
        new ApiError(
          403,
          "Your account is inactive. Please contact support to reactivate.",
        ),
      );
    }

    if (user.role === "MANAGER" && user.managerProfile) {
      const { verificationStatus, rejectionReason } = user.managerProfile;

      if (verificationStatus === "PENDING") {
        return next(
          new ApiError(
            403,
            "Your manager account is pending verification. You will be notified once approved.",
          ),
        );
      }

      if (verificationStatus === "REJECTED") {
        const reasonText = rejectionReason
          ? `Reason: ${rejectionReason}`
          : "Please contact support for more information.";
        return next(
          new ApiError(
            403,
            `Your manager verification was rejected. ${reasonText}`,
          ),
        );
      }
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new ApiError(401, "Invalid token. Please log in again."));
    }
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token expired. Please log in again."));
    }
    next(error);
  }
};

module.exports = { protect };
