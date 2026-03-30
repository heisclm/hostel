const { body } = require("express-validator");

const registerStudentValidator = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^(\+233|0)\d{9}$/)
    .withMessage(
      "Please provide a valid Ghana phone number (e.g., 0241234567 or +233241234567)",
    ),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),

  body("studentId").trim().notEmpty().withMessage("Student ID is required"),

  body("programme").optional().trim(),

  body("level")
    .optional()
    .isInt({ min: 100, max: 800 })
    .withMessage("Level must be between 100 and 800"),

  body("academicYear")
    .optional()
    .trim()
    .matches(/^\d{4}\/\d{4}$/)
    .withMessage("Academic year must be in format YYYY/YYYY (e.g., 2024/2025)"),
];

const registerManagerValidator = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^(\+233|0)\d{9}$/)
    .withMessage("Please provide a valid Ghana phone number"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),

  body("idType")
    .trim()
    .notEmpty()
    .withMessage("ID type is required")
    .isIn(["ghana_card", "passport"])
    .withMessage("ID type must be either ghana_card or passport"),

  body("idNumber")
    .trim()
    .notEmpty()
    .withMessage("ID number is required")
    .custom((value, { req }) => {
      const idType = req.body.idType;

      if (idType === "ghana_card") {
        if (!/^GHA-\d{9}-\d$/.test(value)) {
          throw new Error(
            "Ghana Card number must be in format GHA-XXXXXXXXX-X (e.g., GHA-123456789-0)",
          );
        }
      } else if (idType === "passport") {
        if (!/^[A-Z0-9]{6,12}$/i.test(value)) {
          throw new Error(
            "Passport number must be 6-12 alphanumeric characters",
          );
        }
      }

      return true;
    }),

  body("businessName").optional().trim(),
];


const registerGuestValidator = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^(\+233|0)[0-9]{9}$/)
    .withMessage("Please provide a valid Ghanaian phone number"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  body("guestType")
    .notEmpty()
    .withMessage("Guest type is required")
    .isIn(["PARENT_GUARDIAN", "UNIVERSITY_STAFF", "PROSPECTIVE_STUDENT", "VISITOR"])
    .withMessage("Invalid guest type"),

  body("beneficiaryName")
    .if(body("guestType").equals("PARENT_GUARDIAN"))
    .notEmpty()
    .withMessage("Beneficiary name is required for parent/guardian"),

  body("beneficiaryPhone")
    .if(body("guestType").equals("PARENT_GUARDIAN"))
    .notEmpty()
    .withMessage("Beneficiary phone is required for parent/guardian")
    .matches(/^(\+233|0)[0-9]{9}$/)
    .withMessage("Please provide a valid Ghanaian phone number"),

  body("relationshipType")
    .if(body("guestType").equals("PARENT_GUARDIAN"))
    .notEmpty()
    .withMessage("Relationship type is required for parent/guardian"),

  body("staffId")
    .if(body("guestType").equals("UNIVERSITY_STAFF"))
    .notEmpty()
    .withMessage("Staff ID is required for university staff"),

  body("department")
    .if(body("guestType").equals("UNIVERSITY_STAFF"))
    .notEmpty()
    .withMessage("Department is required for university staff"),

  body("admissionNumber")
    .if(body("guestType").equals("PROSPECTIVE_STUDENT"))
    .notEmpty()
    .withMessage("Admission number is required for prospective students"),

  body("programmeAdmitted")
    .if(body("guestType").equals("PROSPECTIVE_STUDENT"))
    .notEmpty()
    .withMessage("Programme admitted is required for prospective students"),

  body("purpose")
    .if(body("guestType").equals("VISITOR"))
    .notEmpty()
    .withMessage("Purpose is required for visitors"),

  body("beneficiaryEmail")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email"),

  body("expectedMatricDate")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid date"),

  body("organization")
    .optional()
    .trim(),
];

const convertToStudentValidator = [
  body("studentId")
    .trim()
    .notEmpty()
    .withMessage("Student ID is required"),

  body("programme")
    .optional()
    .trim(),

  body("level")
    .optional()
    .isInt({ min: 100, max: 800 })
    .withMessage("Level must be between 100 and 800"),

  body("academicYear")
    .optional()
    .trim(),
];


const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
  body("loginAs")
    .optional()
    .isIn(["STUDENT", "MANAGER", "GUEST"])
    .withMessage("Invalid login type"),
];

const forgotPasswordValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
];

const resetPasswordValidator = [
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm your password")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

const changePasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),
];

const updateProfileValidator = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),

  body("phone")
    .optional()
    .trim()
    .matches(/^(\+233|0)\d{9}$/)
    .withMessage(
      "Please provide a valid Ghana phone number (e.g., 0241234567 or +233241234567)",
    ),

  body("programme")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Programme must be at most 100 characters"),

  body("level")
    .optional()
    .isInt({ min: 100, max: 800 })
    .withMessage("Level must be between 100 and 800"),

  body("academicYear")
    .optional()
    .trim()
    .matches(/^\d{4}\/\d{4}$/)
    .withMessage("Academic year must be in format YYYY/YYYY (e.g., 2024/2025)"),

  body("emergencyContact")
    .optional()
    .trim()
    .matches(/^(\+233|0)\d{9}$/)
    .withMessage(
      "Please provide a valid Ghana phone number for emergency contact",
    ),
];

module.exports = {
  registerStudentValidator,
  registerManagerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  updateProfileValidator,
  registerGuestValidator,
  convertToStudentValidator,
};
