const ApiError = require("../utils/apiError");

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Not authorized. Please log in."));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Role '${req.user.role}' is not authorized to access this resource.`,
        ),
      );
    }

    next();
  };
};

const canBook = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Not authorized. Please log in."));
  }

  const allowedRoles = ["STUDENT", "GUEST"];
  if (!allowedRoles.includes(req.user.role)) {
    return next(
      new ApiError(
        403,
        "Only students and guests can make bookings. Please register for an appropriate account.",
      ),
    );
  }

  next();
};

const requireGuestType = (...guestTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Not authorized. Please log in."));
    }

    if (req.user.role !== "GUEST") {
      return next(
        new ApiError(403, "This action is only available for guest accounts."),
      );
    }

    if (!req.user.guestProfile) {
      return next(new ApiError(403, "Guest profile not found."));
    }

    if (!guestTypes.includes(req.user.guestProfile.guestType)) {
      return next(
        new ApiError(
          403,
          `This action is only available for: ${guestTypes.join(", ")}`,
        ),
      );
    }

    next();
  };
};

module.exports = { authorize, canBook, requireGuestType };
