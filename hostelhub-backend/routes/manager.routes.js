const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");

const {
  getDashboardStats,
  getManagerProfile,
} = require("../controllers/manager.controller");

router.get("/dashboard", protect, authorize("MANAGER"), getDashboardStats);
router.get("/profile", protect, authorize("MANAGER"), getManagerProfile);

module.exports = router;
