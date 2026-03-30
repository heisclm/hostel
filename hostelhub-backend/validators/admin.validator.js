const { body, param, query } = require("express-validator");

const verifyManagerValidator = [
  param("managerId").isUUID().withMessage("Invalid manager ID"),

  body("action")
    .trim()
    .notEmpty()
    .withMessage("Action is required")
    .isIn(["VERIFY", "REJECT"])
    .withMessage("Action must be either VERIFY or REJECT"),

  body("rejectionReason")
    .if(body("action").equals("REJECT"))
    .trim()
    .notEmpty()
    .withMessage("Rejection reason is required when rejecting a manager")
    .isLength({ min: 10, max: 500 })
    .withMessage("Rejection reason must be between 10 and 500 characters"),
];

const getManagersQueryValidator = [
  query("status")
    .optional()
    .isIn(["PENDING", "VERIFIED", "REJECTED"])
    .withMessage("Status must be PENDING, VERIFIED, or REJECTED"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search term too long"),
];

const userIdValidator = [param("id").isUUID().withMessage("Invalid user ID")];

const updateUserStatusValidator = [
  param("id").isUUID().withMessage("Invalid user ID"),

  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["ACTIVE", "INACTIVE", "SUSPENDED"])
    .withMessage("Status must be ACTIVE, INACTIVE, or SUSPENDED"),

  body("reason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Reason cannot exceed 500 characters"),
];

module.exports = {
  verifyManagerValidator,
  getManagersQueryValidator,
  userIdValidator,
  updateUserStatusValidator,
};
