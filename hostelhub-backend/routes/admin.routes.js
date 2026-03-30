const express = require("express");
const router = express.Router();

const {
  getManagers,
  getManagerDetail,
  verifyManager,
  getVerificationStats,
  getUsers,
  getUserDetail,
  updateUserStatus,
  getAdminNavCounts,
} = require("../controllers/admin.controller");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const validate = require("../middleware/validate");

const {
  verifyManagerValidator,
  getManagersQueryValidator,
  userIdValidator,
  updateUserStatusValidator,
} = require("../validators/admin.validator");
const {
  adminGetBookingStats,
  adminGetAllBookings,
} = require("../controllers/booking.controller");
const { bookingQueryValidator } = require("../validators/booking.validator");
const {
  adminGetPaymentStats,
  adminGetAllPayments,
  adminGetPaymentDetail,
} = require("../controllers/payment.controller");
const {
  paymentQueryValidator,
  paymentIdValidator,
  disbursementQueryValidator,
  disbursementIdValidator,
} = require("../validators/payment.validator");
const {
  getDisbursementStats,
  getAllDisbursements,
  verifyDisbursement,
  processDisbursement,
  markDisbursementComplete,
} = require("../controllers/disbursement.controller");
const {
  getAdminDashboardStats,
} = require("../controllers/admin.dashboard.controller");

router.use(protect, authorize("ADMIN"));

router.get("/dashboard", getAdminDashboardStats);

router.get("/managers/stats/verification", getVerificationStats);

router.get("/managers", getManagersQueryValidator, validate, getManagers);

router.get("/bookings/stats", adminGetBookingStats);
router.get("/bookings", bookingQueryValidator, validate, adminGetAllBookings);

router.get("/payments/stats", adminGetPaymentStats);
router.get("/payments", paymentQueryValidator, validate, adminGetAllPayments);

router.get("/nav-counts", protect, authorize("ADMIN"), getAdminNavCounts);

router.get("/disbursements/stats", getDisbursementStats);
router.get(
  "/disbursements",
  disbursementQueryValidator,
  validate,
  getAllDisbursements,
);

router.get("/managers/:managerId", getManagerDetail);

router.get(
  "/payments/:paymentId",
  paymentIdValidator,
  validate,
  adminGetPaymentDetail,
);

router.get(
  "/disbursements/:disbursementId/verify",
  disbursementIdValidator,
  validate,
  verifyDisbursement,
);

router.post(
  "/disbursements/:disbursementId/process",
  disbursementIdValidator,
  validate,
  processDisbursement,
);

router.put(
  "/managers/:managerId/verify",
  verifyManagerValidator,
  validate,
  verifyManager,
);

router.put(
  "/disbursements/:disbursementId/complete",
  disbursementIdValidator,
  validate,
  markDisbursementComplete,
);

router.get("/users", getUsers);

router.get("/users/:id", userIdValidator, validate, getUserDetail);

router.put(
  "/users/:id/status",
  updateUserStatusValidator,
  validate,
  updateUserStatus,
);

module.exports = router;
