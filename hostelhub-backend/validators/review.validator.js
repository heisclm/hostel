const { body, param, query } = require("express-validator");

const createReviewValidator = [
  body("bookingId")
    .notEmpty()
    .withMessage("Booking ID is required")
    .isUUID()
    .withMessage("Invalid booking ID"),
  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment")
    .optional()
    .isString()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Comment must be between 10 and 1000 characters"),
];

const updateReviewValidator = [
  param("reviewId").isUUID().withMessage("Invalid review ID"),
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment")
    .optional()
    .isString()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Comment must be between 10 and 1000 characters"),
];

const reviewIdValidator = [
  param("reviewId").isUUID().withMessage("Invalid review ID"),
];

const hostelReviewsQueryValidator = [
  param("hostelId").isUUID().withMessage("Invalid hostel ID"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
  query("sortBy")
    .optional()
    .isIn(["newest", "oldest", "highest", "lowest"])
    .withMessage("Sort must be newest, oldest, highest, or lowest"),
];

module.exports = {
  createReviewValidator,
  updateReviewValidator,
  reviewIdValidator,
  hostelReviewsQueryValidator,
};
