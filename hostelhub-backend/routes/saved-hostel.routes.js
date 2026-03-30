const {
  checkMultipleSavedStatus,
  checkSavedStatus,
  clearAllSaved,
  getSavedCount,
  getSavedHostels,
  saveHostel,
  toggleSaveHostel,
  unsaveHostel,
} = require("../controllers/saved-hostel.controller");

const express = require("express");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");

const router = express.Router();

router.use(protect);
router.use(authorize("STUDENT", "GUEST"));

router.get("/", getSavedHostels);
router.get("/count", getSavedCount);
router.post("/check-status", checkMultipleSavedStatus);
router.delete("/clear-all", clearAllSaved);
router.get("/:hostelId/status", checkSavedStatus);
router.post("/:hostelId", saveHostel);
router.delete("/:hostelId", unsaveHostel);
router.patch("/:hostelId/toggle", toggleSaveHostel);

module.exports = router;
