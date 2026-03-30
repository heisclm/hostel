const AuthService = require("../services/auth.service");
const ApiResponse = require("../utils/apiResponse");
const { sendEmail } = require("../config/mailjet");
const { uploadToCloudinary } = require("../config/cloudinary");

const sendTokenResponse = (res, token) => {
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        (parseInt(process.env.JWT_COOKIE_EXPIRE) || 7) * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  };

  res.cookie("token", token, cookieOptions);
};

const clearTokenResponse = (res) => {
  res.cookie("token", "", {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/",
  });
};

const registerStudent = async (req, res, next) => {
  try {
    const { user, token } = await AuthService.registerStudent(req.body);

    sendTokenResponse(res, token);

    return ApiResponse.created(res, "Student registered successfully", {
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const registerManager = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "ID document is required. Please upload your ID.",
      });
    }

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      "cug-hostels/id-documents",
    );

    const { user, token } = await AuthService.registerManager(
      req.body,
      uploadResult.url,
    );

    sendTokenResponse(res, token);

    return ApiResponse.created(
      res,
      "Manager account created successfully. Your account is pending verification by admin.",
      { user, token },
    );
  } catch (error) {
    next(error);
  }
};

const registerGuest = async (req, res, next) => {
  try {
    const { user, token } = await AuthService.registerGuest(req.body);

    sendTokenResponse(res, token);

    let message = "Guest account created successfully.";
    switch (user.guestProfile?.guestType) {
      case "PARENT_GUARDIAN":
        message =
          "Parent/Guardian account created successfully. You can now book hostels for your child.";
        break;
      case "UNIVERSITY_STAFF":
        message =
          "Staff account created successfully. You can now browse and book hostels.";
        break;
      case "PROSPECTIVE_STUDENT":
        message =
          "Prospective student account created successfully. You can book a hostel now and convert to a full student account once you receive your student ID.";
        break;
      case "VISITOR":
        message =
          "Visitor account created successfully. You can now browse and book hostels.";
        break;
    }

    return ApiResponse.created(res, message, {
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, loginAs } = req.body;
    const { user, token } = await AuthService.login(email, password, loginAs);

    sendTokenResponse(res, token);

    return ApiResponse.success(res, "Login successful", { user, token });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    clearTokenResponse(res);
    return ApiResponse.success(res, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await AuthService.getProfile(req.user.id);
    return ApiResponse.success(res, "Profile retrieved successfully", {
      user,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await AuthService.updateProfile(req.user.id, req.body);
    return ApiResponse.success(res, "Profile updated successfully", {
      user,
    });
  } catch (error) {
    next(error);
  }
};

const convertToStudent = async (req, res, next) => {
  try {
    const user = await AuthService.convertGuestToStudent(req.user.id, req.body);

    return ApiResponse.success(
      res,
      "Your account has been successfully converted to a student account. Welcome!",
      { user },
    );
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { resetToken, user } = await AuthService.forgotPassword(
      req.body.email,
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      toName: `${user.firstName} ${user.lastName}`,
      subject: "Password Reset Request - HostelHub",
      textContent: `You requested a password reset. Use this link within 30 minutes: ${resetUrl}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Password Reset Request</h2>
          <p>Dear ${user.firstName},</p>
          <p>You requested a password reset for your HostelHub account.</p>
          <p>Click the button below to reset your password. This link expires in <strong>30 minutes</strong>.</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">HostelHub - Catholic University of Ghana Hostel Finder</p>
        </div>
      `,
    });

    return ApiResponse.success(
      res,
      "Password reset link sent to your email. Check your inbox.",
    );
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await AuthService.resetPassword(req.params.token, req.body.password);
    return ApiResponse.success(
      res,
      "Password reset successful. Please login with your new password.",
    );
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await AuthService.changePassword(req.user.id, currentPassword, newPassword);
    return ApiResponse.success(res, "Password changed successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerStudent,
  registerManager,
  registerGuest,
  login,
  logout,
  getMe,
  updateProfile,
  convertToStudent,
  forgotPassword,
  resetPassword,
  changePassword,
};
