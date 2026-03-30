const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const validate = require("../middleware/validate");

const {
  adminGetAllBookings,
  adminGetBookingStats,
} = require("../controllers/booking.controller");

const {
  getAllDisbursements,
  getDisbursementStats,
  processDisbursement,
  verifyDisbursement,
  markDisbursementComplete,
} = require("../controllers/disbursement.controller");

const { bookingQueryValidator } = require("../validators/booking.validator");

const {
  disbursementIdValidator,
  disbursementQueryValidator,
} = require("../validators/payment.validator");

router.use(protect, authorize("ADMIN"));

router.get("/stats", adminGetBookingStats);

router.get("/", bookingQueryValidator, validate, adminGetAllBookings);

router.get("/disbursements/stats", getDisbursementStats);

router.get(
  "/disbursements",
  disbursementQueryValidator,
  validate,
  getAllDisbursements,
);

router.post(
  "/disbursements/:disbursementId/process",
  disbursementIdValidator,
  validate,
  processDisbursement,
);

router.get(
  "/disbursements/:disbursementId/verify",
  disbursementIdValidator,
  validate,
  verifyDisbursement,
);

router.put(
  "/disbursements/:disbursementId/complete",
  disbursementIdValidator,
  validate,
  markDisbursementComplete,
);

module.exports = router;
