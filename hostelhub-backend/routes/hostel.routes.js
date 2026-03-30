const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

const {
  createHostel,
  updateHostel,
  deleteHostel,
  getMyHostels,
  getMyHostelDetail,
  addRoomType,
  updateRoomType,
  deleteRoomType,
  addRooms,
  updateRoom,
  deleteRoom,
  getRooms,
  getAvailableRoomsForAssignment,
  addFacilities,
  removeFacility,
  upsertPaymentDetail,
  addImages,
  removeImage,
  setPrimaryImage,
  getApprovedHostels,
  getHostelBySlug,
  getHostelById,
} = require("../controllers/hostel.controller");

const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const validate = require("../middleware/validate");

const {
  createHostelValidator,
  updateHostelValidator,
  createRoomTypeValidator,
  updateRoomTypeValidator,
  hostelIdValidator,
  updatePaymentDetailValidator,
  hostelQueryValidator,
} = require("../validators/hostel.validator");

router.get("/", hostelQueryValidator, validate, getApprovedHostels);

router.get("/my-hostels", protect, authorize("MANAGER"), getMyHostels);

router.get("/slug/:slug", getHostelBySlug);

router.post(
  "/",
  protect,
  authorize("MANAGER"),
  createHostelValidator,
  validate,
  createHostel,
);

router.get("/:hostelId", hostelIdValidator, validate, getHostelById);

router.get(
  "/:hostelId/manage",
  protect,
  authorize("MANAGER"),
  hostelIdValidator,
  validate,
  getMyHostelDetail,
);

router.put(
  "/:hostelId",
  protect,
  authorize("MANAGER"),
  updateHostelValidator,
  validate,
  updateHostel,
);

router.delete(
  "/:hostelId",
  protect,
  authorize("MANAGER"),
  hostelIdValidator,
  validate,
  deleteHostel,
);

router.post(
  "/:hostelId/room-types",
  protect,
  authorize("MANAGER"),
  createRoomTypeValidator,
  validate,
  addRoomType,
);

router.put(
  "/:hostelId/room-types/:roomTypeId",
  protect,
  authorize("MANAGER"),
  updateRoomTypeValidator,
  validate,
  updateRoomType,
);

router.delete(
  "/:hostelId/room-types/:roomTypeId",
  protect,
  authorize("MANAGER"),
  hostelIdValidator,
  validate,
  deleteRoomType,
);

router.get(
  "/:hostelId/room-types/:roomTypeId/rooms",
  protect,
  authorize("MANAGER", "ADMIN"),
  getRooms,
);

router.get(
  "/:hostelId/room-types/:roomTypeId/available-rooms",
  protect,
  authorize("MANAGER"),
  getAvailableRoomsForAssignment,
);

router.post(
  "/:hostelId/room-types/:roomTypeId/rooms",
  protect,
  authorize("MANAGER"),
  addRooms,
);

router.patch(
  "/:hostelId/rooms/:roomId",
  protect,
  authorize("MANAGER"),
  updateRoom,
);

router.delete(
  "/:hostelId/rooms/:roomId",
  protect,
  authorize("MANAGER"),
  deleteRoom,
);

router.post(
  "/:hostelId/facilities",
  protect,
  authorize("MANAGER"),
  hostelIdValidator,
  validate,
  addFacilities,
);

router.delete(
  "/:hostelId/facilities/:facilityId",
  protect,
  authorize("MANAGER"),
  removeFacility,
);

router.put(
  "/:hostelId/payment-details",
  protect,
  authorize("MANAGER"),
  updatePaymentDetailValidator,
  validate,
  upsertPaymentDetail,
);

router.post(
  "/:hostelId/images",
  protect,
  authorize("MANAGER"),
  upload.array("images", 10),
  addImages,
);

router.delete(
  "/:hostelId/images/:imageId",
  protect,
  authorize("MANAGER"),
  removeImage,
);

router.patch(
  "/:hostelId/images/:imageId/primary",
  protect,
  authorize("MANAGER"),
  setPrimaryImage,
);

module.exports = router;
