const { param, query } = require("express-validator");

const paymentIdValidator = [
  param("paymentId").isUUID().withMessage("Invalid payment ID"),
];

const paymentQueryValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
  query("status")
    .optional()
    .isIn(["PENDING", "SUCCESSFUL", "FAILED", "REFUNDED"])
    .withMessage("Invalid payment status"),
];

const disbursementIdValidator = [
  param("disbursementId").isUUID().withMessage("Invalid disbursement ID"),
];

const disbursementQueryValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
  query("status")
    .optional()
    .isIn(["PENDING", "PROCESSING", "COMPLETED", "FAILED"])
    .withMessage("Invalid disbursement status"),
];

module.exports = {
  paymentIdValidator,
  paymentQueryValidator,
  disbursementIdValidator,
  disbursementQueryValidator,
};
