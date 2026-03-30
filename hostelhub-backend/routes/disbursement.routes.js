const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const validate = require("../middleware/validate");

const {
  getManagerDisbursements,
} = require("../controllers/disbursement.controller");

const {
  disbursementQueryValidator,
} = require("../validators/payment.validator");

router.use(protect, authorize("MANAGER"));

router.get("/", disbursementQueryValidator, validate, getManagerDisbursements);

module.exports = router;
