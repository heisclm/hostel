const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");

const {
  getMyPayments,
  getMyPaymentDetail,
} = require("../controllers/payment.controller");

router.get(
  "/my-payments",
  protect,
  authorize("STUDENT", "GUEST"),
  getMyPayments,
);
router.get(
  "/my-payments/:paymentId",
  protect,
  authorize("STUDENT", "GUEST"),
  getMyPaymentDetail,
);

module.exports = router;
