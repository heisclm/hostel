const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const { generateToken } = require("../utils/helpers");

class AuthService {
  static generateJWT(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    });
  }

  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  static async comparePasswords(inputPassword, hashedPassword) {
    return bcrypt.compare(inputPassword, hashedPassword);
  }

  static sanitizeUser(user) {
    const { password, resetPasswordToken, resetPasswordExpires, ...safeUser } =
      user;
    return safeUser;
  }

  static async registerStudent(data) {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      studentId,
      programme,
      level,
      academicYear,
    } = data;

    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingEmail) {
      throw new ApiError(400, "Email already registered");
    }

    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });
    if (existingPhone) {
      throw new ApiError(400, "Phone number already registered");
    }

    const existingStudentId = await prisma.studentProfile.findUnique({
      where: { studentId },
    });
    if (existingStudentId) {
      throw new ApiError(400, "Student ID already registered");
    }

    const hashedPassword = await this.hashPassword(password);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        password: hashedPassword,
        role: "STUDENT",
        status: "ACTIVE",
        studentProfile: {
          create: {
            studentId,
            programme: programme || null,
            level: level ? parseInt(level) : null,
            academicYear: academicYear || null,
          },
        },
      },
      include: {
        studentProfile: true,
      },
    });

    const token = this.generateJWT(user.id);
    const safeUser = this.sanitizeUser(user);

    return { user: safeUser, token };
  }

  static async registerManager(data, idImageUrl) {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      idType,
      idNumber,
      businessName,
    } = data;

    if (!idImageUrl) {
      throw new ApiError(400, "ID document is required");
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingEmail) {
      throw new ApiError(400, "Email already registered");
    }

    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });
    if (existingPhone) {
      throw new ApiError(400, "Phone number already registered");
    }

    const hashedPassword = await this.hashPassword(password);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        password: hashedPassword,
        role: "MANAGER",
        status: "ACTIVE",
        managerProfile: {
          create: {
            idType,
            idNumber,
            businessName: businessName || null,
            idImage: idImageUrl,
            verified: false,
            verificationStatus: "PENDING",
          },
        },
      },
      include: {
        managerProfile: true,
      },
    });

    const token = this.generateJWT(user.id);
    const safeUser = this.sanitizeUser(user);

    return { user: safeUser, token };
  }

  static async registerGuest(data) {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      guestType,
      beneficiaryName,
      beneficiaryPhone,
      beneficiaryEmail,
      relationshipType,
      staffId,
      department,
      admissionNumber,
      expectedMatricDate,
      programmeAdmitted,
      purpose,
      organization,
    } = data;

    const validGuestTypes = [
      "PARENT_GUARDIAN",
      "UNIVERSITY_STAFF",
      "PROSPECTIVE_STUDENT",
      "VISITOR",
    ];
    if (!validGuestTypes.includes(guestType)) {
      throw new ApiError(
        400,
        "Invalid guest type. Must be one of: PARENT_GUARDIAN, UNIVERSITY_STAFF, PROSPECTIVE_STUDENT, VISITOR",
      );
    }

    this.validateGuestTypeFields(guestType, data);

    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingEmail) {
      throw new ApiError(400, "Email already registered");
    }

    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });
    if (existingPhone) {
      throw new ApiError(400, "Phone number already registered");
    }

    if (staffId) {
      const existingStaffId = await prisma.guestProfile.findFirst({
        where: { staffId },
      });
      if (existingStaffId) {
        throw new ApiError(400, "Staff ID already registered");
      }
    }

    if (admissionNumber) {
      const existingAdmissionNumber = await prisma.guestProfile.findFirst({
        where: { admissionNumber },
      });
      if (existingAdmissionNumber) {
        throw new ApiError(400, "Admission number already registered");
      }
    }

    const hashedPassword = await this.hashPassword(password);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        password: hashedPassword,
        role: "GUEST",
        status: "ACTIVE",
        guestProfile: {
          create: {
            guestType,

            beneficiaryName: beneficiaryName || null,
            beneficiaryPhone: beneficiaryPhone || null,
            beneficiaryEmail: beneficiaryEmail || null,
            relationshipType: relationshipType || null,

            staffId: staffId || null,
            department: department || null,

            admissionNumber: admissionNumber || null,
            expectedMatricDate: expectedMatricDate
              ? new Date(expectedMatricDate)
              : null,
            programmeAdmitted: programmeAdmitted || null,

            purpose: purpose || null,
            organization: organization || null,
          },
        },
      },
      include: {
        guestProfile: true,
      },
    });

    const token = this.generateJWT(user.id);
    const safeUser = this.sanitizeUser(user);

    return { user: safeUser, token };
  }

  static validateGuestTypeFields(guestType, data) {
    switch (guestType) {
      case "PARENT_GUARDIAN":
        if (!data.beneficiaryName) {
          throw new ApiError(
            400,
            "Beneficiary name is required for parent/guardian registration",
          );
        }
        if (!data.beneficiaryPhone) {
          throw new ApiError(
            400,
            "Beneficiary phone is required for parent/guardian registration",
          );
        }
        if (!data.relationshipType) {
          throw new ApiError(
            400,
            "Relationship type is required for parent/guardian registration",
          );
        }
        break;

      case "UNIVERSITY_STAFF":
        if (!data.staffId) {
          throw new ApiError(
            400,
            "Staff ID is required for university staff registration",
          );
        }
        if (!data.department) {
          throw new ApiError(
            400,
            "Department is required for university staff registration",
          );
        }
        break;

      case "PROSPECTIVE_STUDENT":
        if (!data.admissionNumber) {
          throw new ApiError(
            400,
            "Admission number is required for prospective student registration",
          );
        }
        if (!data.programmeAdmitted) {
          throw new ApiError(
            400,
            "Programme admitted is required for prospective student registration",
          );
        }
        break;

      case "VISITOR":
        if (!data.purpose) {
          throw new ApiError(
            400,
            "Purpose of visit is required for visitor registration",
          );
        }
        break;

      default:
        throw new ApiError(400, "Invalid guest type");
    }
  }

  static async login(email, password, loginAs = null) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        studentProfile: true,
        managerProfile: true,
        guestProfile: true,
      },
    });

    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    if (loginAs) {
      const validLoginRoles = ["STUDENT", "MANAGER", "ADMIN", "GUEST"];
      if (!validLoginRoles.includes(loginAs)) {
        throw new ApiError(400, "Invalid login role specified");
      }

      if (user.role !== loginAs && user.role !== "ADMIN") {
        throw new ApiError(
          403,
          `This account is not registered as a ${loginAs.toLowerCase()}. Please use the correct login portal.`,
        );
      }
    }

    if (user.status === "SUSPENDED") {
      throw new ApiError(
        403,
        "Your account has been suspended. Please contact support for assistance.",
      );
    }

    if (user.status === "INACTIVE") {
      throw new ApiError(
        403,
        "Your account is inactive. Please contact support to reactivate.",
      );
    }

    const isMatch = await this.comparePasswords(password, user.password);
    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    if (user.role === "MANAGER" && user.managerProfile) {
      const { verificationStatus, rejectionReason } = user.managerProfile;

      if (verificationStatus === "PENDING") {
        throw new ApiError(
          403,
          "Your manager account is pending verification. You will receive an email notification once your account is approved.",
        );
      }

      if (verificationStatus === "REJECTED") {
        const reasonText = rejectionReason
          ? `Reason: ${rejectionReason}`
          : "Please contact support for more information.";
        throw new ApiError(
          403,
          `Your manager verification was rejected. ${reasonText}`,
        );
      }
    }

    const token = this.generateJWT(user.id);
    const safeUser = this.sanitizeUser(user);

    return { user: safeUser, token };
  }

  static async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        managerProfile: true,
        guestProfile: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return this.sanitizeUser(user);
  }

  static async updateProfile(userId, data) {
    const {
      firstName,
      lastName,
      phone,

      programme,
      level,
      academicYear,
      emergencyContact,

      businessName,

      beneficiaryName,
      beneficiaryPhone,
      beneficiaryEmail,
      relationshipType,
      staffId,
      department,
      admissionNumber,
      expectedMatricDate,
      programmeAdmitted,
      purpose,
      organization,
    } = data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        managerProfile: true,
        guestProfile: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (phone && phone !== user.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone },
      });
      if (existingPhone) {
        throw new ApiError(
          400,
          "Phone number already in use by another account",
        );
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
      },
    });

    if (user.role === "STUDENT" && user.studentProfile) {
      await prisma.studentProfile.update({
        where: { userId },
        data: {
          ...(programme !== undefined && { programme }),
          ...(level !== undefined && { level: level ? parseInt(level) : null }),
          ...(academicYear !== undefined && { academicYear }),
          ...(emergencyContact !== undefined && { emergencyContact }),
        },
      });
    }

    if (user.role === "MANAGER" && user.managerProfile) {
      await prisma.managerProfile.update({
        where: { userId },
        data: {
          ...(businessName !== undefined && { businessName }),
        },
      });
    }

    if (user.role === "GUEST" && user.guestProfile) {
      await prisma.guestProfile.update({
        where: { userId },
        data: {
          ...(beneficiaryName !== undefined && { beneficiaryName }),
          ...(beneficiaryPhone !== undefined && { beneficiaryPhone }),
          ...(beneficiaryEmail !== undefined && { beneficiaryEmail }),
          ...(relationshipType !== undefined && { relationshipType }),

          ...(staffId !== undefined && { staffId }),
          ...(department !== undefined && { department }),

          ...(admissionNumber !== undefined && { admissionNumber }),
          ...(expectedMatricDate !== undefined && {
            expectedMatricDate: expectedMatricDate
              ? new Date(expectedMatricDate)
              : null,
          }),
          ...(programmeAdmitted !== undefined && { programmeAdmitted }),

          ...(purpose !== undefined && { purpose }),
          ...(organization !== undefined && { organization }),
        },
      });
    }

    const freshUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        managerProfile: true,
        guestProfile: true,
      },
    });

    return this.sanitizeUser(freshUser);
  }

  static async convertGuestToStudent(userId, studentData) {
    const { studentId, programme, level, academicYear } = studentData;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        guestProfile: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.role !== "GUEST") {
      throw new ApiError(
        400,
        "Only guest accounts can be converted to student accounts",
      );
    }

    if (user.guestProfile?.guestType !== "PROSPECTIVE_STUDENT") {
      throw new ApiError(
        400,
        "Only prospective student guests can be converted to student accounts",
      );
    }

    const existingStudentId = await prisma.studentProfile.findUnique({
      where: { studentId },
    });
    if (existingStudentId) {
      throw new ApiError(400, "Student ID already registered");
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      await tx.guestProfile.delete({
        where: { userId },
      });

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          role: "STUDENT",
          studentProfile: {
            create: {
              studentId,
              programme: programme || null,
              level: level ? parseInt(level) : null,
              academicYear: academicYear || null,
            },
          },
        },
        include: {
          studentProfile: true,
        },
      });

      return updated;
    });

    return this.sanitizeUser(updatedUser);
  }

  static async forgotPassword(email) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new ApiError(404, "No account found with this email");
    }

    const resetToken = generateToken();
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    return { resetToken, user };
  }

  static async resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired reset token");
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return true;
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const isMatch = await this.comparePasswords(currentPassword, user.password);
    if (!isMatch) {
      throw new ApiError(400, "Current password is incorrect");
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return true;
  }
}

module.exports = AuthService;
