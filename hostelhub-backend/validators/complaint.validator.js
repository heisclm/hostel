const { body, param, query } = require("express-validator");

const createComplaintValidator = [
  body("hostelId")
    .notEmpty()
    .withMessage("Hostel ID is required")
    .isUUID()
    .withMessage("Invalid hostel ID"),
  body("subject")
    .notEmpty()
    .withMessage("Subject is required")
    .isLength({ min: 2 })
    .withMessage("Subject must be at least 2 characters"),
  body("message")
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 2 })
    .withMessage("Message must be at least 2 characters"),
  body("category")
    .optional()
    .isString()
    .withMessage("Category must be a string"),
  body("visibility")
    .optional()
    .isIn(["ADMIN_ONLY", "ADMIN_AND_MANAGER"])
    .withMessage("Visibility must be either ADMIN_ONLY or ADMIN_AND_MANAGER"),
];

const complaintIdValidator = [
  param("complaintId")
    .notEmpty()
    .withMessage("Complaint ID is required")
    .isUUID()
    .withMessage("Invalid complaint ID"),
];

const updateStatusValidator = [
  param("complaintId")
    .notEmpty()
    .withMessage("Complaint ID is required")
    .isUUID()
    .withMessage("Invalid complaint ID"),
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"])
    .withMessage("Invalid status"),
  body("resolution")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Resolution must be less than 500 characters"),
];

const addResponseValidator = [
  param("complaintId")
    .notEmpty()
    .withMessage("Complaint ID is required")
    .isUUID()
    .withMessage("Invalid complaint ID"),
  body("message")
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 2, max: 1000 })
    .withMessage("Message must be between 2 and 1000 characters"),
];

const complaintQueryValidator = [
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
    .isIn(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"])
    .withMessage("Invalid status"),
];

module.exports = {
  createComplaintValidator,
  complaintIdValidator,
  updateStatusValidator,
  addResponseValidator,
  complaintQueryValidator,
};
