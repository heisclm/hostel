const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const validate = require("../middleware/validate");

const {
  getEligibleHostelsForComplaint,
  createComplaint,
  getMyComplaints,
  getComplaintDetail,
  getHostelComplaints,
  getAllComplaints,
  addResponse,
  updateComplaintStatus,
  getComplaintStats,
} = require("../controllers/complaint.controller");

const {
  createComplaintValidator,
  complaintIdValidator,
  updateStatusValidator,
  addResponseValidator,
  complaintQueryValidator,
} = require("../validators/complaint.validator");

router.get(
  "/eligible-hostels",
  protect,
  authorize("STUDENT", "GUEST"),
  getEligibleHostelsForComplaint,
);

router.post(
  "/",
  protect,
  authorize("STUDENT", "GUEST"),
  createComplaintValidator,
  validate,
  createComplaint,
);

router.get(
  "/my-complaints",
  protect,
  authorize("STUDENT", "GUEST"),
  complaintQueryValidator,
  validate,
  getMyComplaints,
);

router.get(
  "/:complaintId",
  protect,
  complaintIdValidator,
  validate,
  getComplaintDetail,
);

router.post(
  "/:complaintId/responses",
  protect,
  addResponseValidator,
  validate,
  addResponse,
);

router.get(
  "/hostel/:hostelId",
  protect,
  authorize("MANAGER"),
  complaintQueryValidator,
  validate,
  getHostelComplaints,
);

router.get(
  "/hostel/:hostelId/stats",
  protect,
  authorize("MANAGER"),
  getComplaintStats,
);

router.patch(
  "/:complaintId/status",
  protect,
  authorize("MANAGER", "ADMIN"),
  updateStatusValidator,
  validate,
  updateComplaintStatus,
);

router.get(
  "/",
  protect,
  authorize("ADMIN"),
  complaintQueryValidator,
  validate,
  getAllComplaints,
);

router.get("/admin/stats", protect, authorize("ADMIN"), getComplaintStats);

module.exports = router;
