const express = require("express");
const router = express.Router();

const {
  adminGetAllHostels,
  adminGetHostelDetail,
  adminVerifyHostel,
  adminSuspendHostel,
  adminGetHostelStats,
} = require("../controllers/hostel.controller");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const validate = require("../middleware/validate");

const {
  hostelIdValidator,
  hostelQueryValidator,
  adminVerifyHostelValidator,
} = require("../validators/hostel.validator");

router.use(protect, authorize("ADMIN"));

router.get("/stats", adminGetHostelStats);

router.get("/", hostelQueryValidator, validate, adminGetAllHostels);

router.get("/:hostelId", hostelIdValidator, validate, adminGetHostelDetail);

router.put(
  "/:hostelId/verify",
  adminVerifyHostelValidator,
  validate,
  adminVerifyHostel,
);

router.put(
  "/:hostelId/suspend",
  hostelIdValidator,
  validate,
  adminSuspendHostel,
);

module.exports = router;
