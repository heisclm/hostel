const { body, param, query } = require("express-validator");

const createBookingValidator = [
  body("hostelId")
    .notEmpty()
    .withMessage("Hostel ID is required")
    .isUUID()
    .withMessage("Invalid hostel ID"),
  body("roomTypeId")
    .notEmpty()
    .withMessage("Room type ID is required")
    .isUUID()
    .withMessage("Invalid room type ID"),
  body("paymentPlan")
    .notEmpty()
    .withMessage("Payment plan is required")
    .isIn(["FULL_YEAR", "SEMESTER"])
    .withMessage("Payment plan must be FULL_YEAR or SEMESTER"),
  body("semesterPeriod")
    .optional()
    .isIn(["FIRST_SEMESTER", "SECOND_SEMESTER"])
    .withMessage("Semester period must be FIRST_SEMESTER or SECOND_SEMESTER"),
  body("academicYear")
    .optional()
    .matches(/^\d{4}\/\d{4}$/)
    .withMessage("Academic year must be in format YYYY/YYYY (e.g., 2024/2025)"),
  body("notes")
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage("Notes must be 500 characters or less"),
  body("isBookingForSelf")
    .optional()
    .isBoolean()
    .withMessage("isBookingForSelf must be a boolean"),
  body("occupantName")
    .if(body("isBookingForSelf").equals(false))
    .notEmpty()
    .withMessage("Occupant name is required when booking for someone else")
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage("Occupant name must be between 2 and 100 characters"),
  body("occupantPhone")
    .if(body("isBookingForSelf").equals(false))
    .notEmpty()
    .withMessage("Occupant phone is required when booking for someone else")
    .matches(/^(\+?233|0)[235]\d{8}$/)
    .withMessage("Invalid Ghana phone number"),
  body("occupantEmail")
    .optional()
    .isEmail()
    .withMessage("Invalid email address"),
];

const initiatePaymentValidator = [
  param("bookingId").isUUID().withMessage("Invalid booking ID"),
  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .customSanitizer((value) => value.replace(/\s+/g, ""))
    .matches(/^(\+?233|0)[235]\d{8}$/)
    .withMessage("Invalid Ghana phone number"),
];

const bookingIdValidator = [
  param("bookingId").isUUID().withMessage("Invalid booking ID"),
];

const bookingQueryValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage("Limit must be between 1 and 50"),
  query("status")
    .optional()
    .isIn([
      "PENDING",
      "PAID",
      "CONFIRMED",
      "CANCELLED",
      "EXPIRED",
      "CHECKED_IN",
      "CHECKED_OUT",
    ])
    .withMessage("Invalid booking status"),
];

const cancelBookingValidator = [
  param("bookingId").isUUID().withMessage("Invalid booking ID"),
  body("reason")
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage("Cancel reason must be 500 characters or less"),
];

const checkInOutValidator = [
  param("hostelId").isUUID().withMessage("Invalid hostel ID"),
  param("bookingId").isUUID().withMessage("Invalid booking ID"),
];

const getManagerTenantsValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer."),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100."),
  query("status")
    .optional()
    .isIn(["CHECKED_IN", "CHECKED_OUT", "CONFIRMED"])
    .withMessage("Invalid status filter."),
  query("search")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search query too long."),
  query("hostelId").optional().isString().trim(),
  query("sortBy")
    .optional()
    .isIn(["checkInDate", "name", "roomNumber", "createdAt"])
    .withMessage("Invalid sort field."),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be asc or desc."),
];

module.exports = {
  createBookingValidator,
  initiatePaymentValidator,
  bookingIdValidator,
  bookingQueryValidator,
  cancelBookingValidator,
  checkInOutValidator,
  getManagerTenantsValidator,
};
