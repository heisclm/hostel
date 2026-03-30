const express = require("express");
const router = express.Router();

const {
  registerStudent,
  registerManager,
  login,
  logout,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  registerGuest,
  convertToStudent,
} = require("../controllers/auth.controller");

const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const upload = require("../middleware/upload");

const {
  registerStudentValidator,
  registerManagerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  updateProfileValidator,
  registerGuestValidator,
  convertToStudentValidator,
} = require("../validators/auth.validator");
const { authorize, requireGuestType } = require("../middleware/authorize");

router.post(
  "/register/student",
  registerStudentValidator,
  validate,
  registerStudent,
);

router.post(
  "/register/manager",
  upload.single("idImage"),
  registerManagerValidator,
  validate,
  registerManager,
);


router.post(
  "/register/guest",
  registerGuestValidator,
  validate,
  registerGuest
);



router.post("/login", loginValidator, validate, login);

router.post(
  "/forgot-password",
  forgotPasswordValidator,
  validate,
  forgotPassword,
);

router.put(
  "/reset-password/:token",
  resetPasswordValidator,
  validate,
  resetPassword,
);

router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put(
  "/profile",
  protect,
  updateProfileValidator,
  validate,
  updateProfile,
);
router.put(
  "/change-password",
  protect,
  changePasswordValidator,
  validate,
  changePassword,
);


router.post(
  "/convert-to-student",
  protect,
  authorize("GUEST"),
  requireGuestType("PROSPECTIVE_STUDENT"),
  convertToStudentValidator,
  validate,
  convertToStudent
);



module.exports = router;
