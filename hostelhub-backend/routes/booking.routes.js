const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");
const { authorize, canBook } = require("../middleware/authorize");
const validate = require("../middleware/validate");

const {
  createBooking,
  initiatePayment,
  verifyPayment,
  getMyBookings,
  getBookingDetail,
  cancelBooking,
  getHostelBookings,
  assignRoomToStudent,
  reassignRoom,
  checkInStudent,
  checkOutStudent,
  getManagerTenants,
  confirmBooking,
} = require("../controllers/booking.controller");

const {
  createBookingValidator,
  initiatePaymentValidator,
  bookingIdValidator,
  bookingQueryValidator,
  cancelBookingValidator,
  checkInOutValidator,
  getManagerTenantsValidator,
} = require("../validators/booking.validator");

router.post(
  "/",
  protect,
  canBook,
  createBookingValidator,
  validate,
  createBooking,
);

router.get(
  "/my-bookings",
  protect,
  authorize("STUDENT", "GUEST"),
  bookingQueryValidator,
  validate,
  getMyBookings,
);

router.get(
  "/:bookingId",
  protect,
  bookingIdValidator,
  validate,
  getBookingDetail,
);

router.post(
  "/:bookingId/pay",
  protect,
  authorize("STUDENT", "GUEST"),
  initiatePaymentValidator,
  validate,
  initiatePayment,
);

router.get(
  "/:bookingId/verify-payment",
  protect,
  bookingIdValidator,
  validate,
  verifyPayment,
);

router.put(
  "/:bookingId/cancel",
  protect,
  authorize("STUDENT", "GUEST", "MANAGER", "ADMIN"),
  cancelBookingValidator,
  validate,
  cancelBooking,
);

router.get(
  "/manager/tenants",
  protect,
  authorize("MANAGER"),
  getManagerTenantsValidator,
  validate,
  getManagerTenants,
);

router.get(
  "/hostel/:hostelId",
  protect,
  authorize("MANAGER", "ADMIN"),
  bookingQueryValidator,
  validate,
  getHostelBookings,
);

router.post(
  "/hostel/:hostelId/:bookingId/assign-room",
  protect,
  authorize("MANAGER"),
  assignRoomToStudent,
);

router.patch(
  "/hostel/:hostelId/:bookingId/reassign-room",
  protect,
  authorize("MANAGER"),
  reassignRoom,
);

router.patch(
  "/hostel/:hostelId/:bookingId/confirm",
  protect,
  authorize("MANAGER"),
  confirmBooking,
);

router.put(
  "/hostel/:hostelId/:bookingId/check-in",
  protect,
  authorize("MANAGER"),
  checkInOutValidator,
  validate,
  checkInStudent,
);

router.put(
  "/hostel/:hostelId/:bookingId/check-out",
  protect,
  authorize("MANAGER"),
  checkInOutValidator,
  validate,
  checkOutStudent,
);

module.exports = router;
