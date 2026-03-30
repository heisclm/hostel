const { body, param, query } = require("express-validator");

const createHostelValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Hostel name is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Hostel name must be between 3 and 100 characters"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 20 })
    .withMessage("Description must be at least 20 characters"),
  body("address").trim().notEmpty().withMessage("Address is required"),
  body("distanceToCampus")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Distance to campus must be a positive number"),
  body("totalRooms")
    .isInt({ min: 1 })
    .withMessage("Total rooms must be at least 1"),
  body("pricingPeriod")
    .isIn(["PER_YEAR", "PER_SEMESTER"])
    .withMessage("Pricing period must be PER_YEAR or PER_SEMESTER"),
  body("allowSemesterPayment")
    .optional()
    .isBoolean()
    .withMessage("allowSemesterPayment must be a boolean"),
  body("facilities")
    .optional()
    .isArray()
    .withMessage("Facilities must be an array"),
  body("facilities.*.name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Facility name cannot be empty"),
  body("paymentDetail")
    .optional()
    .isObject()
    .withMessage("Payment detail must be an object"),
  body("paymentDetail.accountName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Account name is required"),
  body("paymentDetail.momoNumber")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Momo number is required"),
  body("paymentDetail.momoProvider")
    .optional()
    .isIn(["MTN", "VODAFONE", "AIRTELTIGO"])
    .withMessage("Invalid momo provider"),
];

const updateHostelValidator = [
  param("hostelId").isUUID().withMessage("Invalid hostel ID"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Hostel name must be between 3 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 20 })
    .withMessage("Description must be at least 20 characters"),
  body("address")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Address cannot be empty"),
  body("distanceToCampus")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Distance to campus must be a positive number"),
  body("totalRooms")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Total rooms must be at least 1"),
  body("pricingPeriod")
    .optional()
    .isIn(["PER_YEAR", "PER_SEMESTER"])
    .withMessage("Invalid pricing period"),
  body("allowSemesterPayment")
    .optional()
    .isBoolean()
    .withMessage("allowSemesterPayment must be a boolean"),
];

const createRoomTypeValidator = [
  param("hostelId").isUUID().withMessage("Invalid hostel ID"),
  body("occupancyType")
    .isIn(["IN_1", "IN_2", "IN_3", "IN_4"])
    .withMessage("Occupancy type must be SINGLE, DOUBLE, TRIPLE, or QUAD"),
  body("pricePerPerson")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Price per person must be a valid decimal")
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error("Price per person must be greater than 0");
      }
      return true;
    }),
  body("totalRooms")
    .isInt({ min: 1 })
    .withMessage("Total rooms must be at least 1"),
  body("availableRooms")
    .isInt({ min: 0 })
    .withMessage("Available rooms cannot be negative"),
  body("amenities")
    .optional()
    .isArray()
    .withMessage("Amenities must be an array"),
  body("amenities.*")
    .optional()
    .isString()
    .withMessage("Each amenity must be a string"),
  body("description").optional().trim(),
];

const updateRoomTypeValidator = [
  param("hostelId").isUUID().withMessage("Invalid hostel ID"),
  param("roomTypeId").isUUID().withMessage("Invalid room type ID"),
  body("pricePerPerson")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Price per person must be a valid decimal")
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error("Price per person must be greater than 0");
      }
      return true;
    }),
  body("totalRooms")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Total rooms must be at least 1"),
  body("availableRooms")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Available rooms cannot be negative"),
  body("amenities")
    .optional()
    .isArray()
    .withMessage("Amenities must be an array"),
  body("description").optional().trim(),
];

const hostelIdValidator = [
  param("hostelId").isUUID().withMessage("Invalid hostel ID"),
];

const updatePaymentDetailValidator = [
  param("hostelId").isUUID().withMessage("Invalid hostel ID"),
  body("accountName").trim().notEmpty().withMessage("Account name is required"),
  body("momoNumber").trim().notEmpty().withMessage("Momo number is required"),
  body("momoProvider")
    .optional()
    .isIn(["MTN", "VODAFONE", "AIRTELTIGO"])
    .withMessage("Invalid momo provider"),
  body("alternatePhone").optional().trim(),
  body("notes").optional().trim(),
];

const updateAvailableRoomsValidator = [
  param("hostelId").isUUID().withMessage("Invalid hostel ID"),
  param("roomTypeId").isUUID().withMessage("Invalid room type ID"),
  body("availableRooms")
    .isInt({ min: 0 })
    .withMessage("Available rooms must be 0 or greater"),
];

const hostelQueryValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
  query("status")
    .optional()
    .isIn(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"])
    .withMessage("Invalid status"),
  query("search").optional().trim(),
  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Min price must be a positive number"),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Max price must be a positive number"),
  query("occupancyType")
    .optional()
    .isIn(["IN_1", "IN_2", "IN_3", "IN_4"])
    .withMessage("Invalid occupancy type"),
];

const adminVerifyHostelValidator = [
  param("hostelId").isUUID().withMessage("Invalid hostel ID"),
  body("status")
    .isIn(["APPROVED", "REJECTED"])
    .withMessage("Status must be APPROVED or REJECTED"),
  body("rejectionReason")
    .if(body("status").equals("REJECTED"))
    .notEmpty()
    .withMessage("Rejection reason is required when rejecting a hostel"),
];

module.exports = {
  createHostelValidator,
  updateHostelValidator,
  createRoomTypeValidator,
  updateRoomTypeValidator,
  hostelIdValidator,
  updatePaymentDetailValidator,
  updateAvailableRoomsValidator,
  hostelQueryValidator,
  adminVerifyHostelValidator,
};
