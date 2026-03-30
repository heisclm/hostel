const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const validate = require("../middleware/validate");

const {
  createReview,
  updateReview,
  deleteReview,
  getHostelReviews,
  getMyReviews,
  getAllReviews,
  getFeaturedReviews,
} = require("../controllers/review.controller");

const {
  createReviewValidator,
  updateReviewValidator,
  reviewIdValidator,
  hostelReviewsQueryValidator,
} = require("../validators/review.validator");

router.get("/", getAllReviews);
router.get("/featured", getFeaturedReviews);

router.get(
  "/hostel/:hostelId",
  hostelReviewsQueryValidator,
  validate,
  getHostelReviews,
);

router.get("/my-reviews", protect, authorize("STUDENT", "GUEST"), getMyReviews);

router.post(
  "/",
  protect,
  authorize("STUDENT", "GUEST"),
  createReviewValidator,
  validate,
  createReview,
);

router.put(
  "/:reviewId",
  protect,
  authorize("STUDENT", "GUEST"),
  updateReviewValidator,
  validate,
  updateReview,
);

router.delete(
  "/:reviewId",
  protect,
  authorize("STUDENT", "GUEST", "ADMIN"),
  reviewIdValidator,
  validate,
  deleteReview,
);

module.exports = router;
