const AdminService = require("../services/admin.service");
const ApiResponse = require("../utils/apiResponse");
const { prisma } = require("../config/db");

const {
  notifyManagerVerification,
  notifyUserStatusChange,
} = require("../utils/notifications");

const getManagers = async (req, res, next) => {
  try {
    const { managers, pagination } = await AdminService.getManagers(req.query);

    return ApiResponse.paginated(
      res,
      "Managers retrieved successfully",
      managers,
      pagination,
    );
  } catch (error) {
    next(error);
  }
};

const getManagerDetail = async (req, res, next) => {
  try {
    const manager = await AdminService.getManagerById(req.params.managerId);

    return ApiResponse.success(
      res,
      "Manager details retrieved successfully",
      manager,
    );
  } catch (error) {
    next(error);
  }
};

const verifyManager = async (req, res, next) => {
  try {
    const { action, rejectionReason } = req.body;

    const updatedManager = await AdminService.verifyManager(
      req.params.managerId,
      action,
      req.user.id,
      rejectionReason,
    );

    await notifyManagerVerification(updatedManager, action, rejectionReason);

    const message =
      action === "VERIFY"
        ? "Manager verified successfully. They can now list hostels."
        : "Manager verification rejected. They have been notified.";

    return ApiResponse.success(res, message, updatedManager);
  } catch (error) {
    next(error);
  }
};

const getVerificationStats = async (req, res, next) => {
  try {
    const stats = await AdminService.getVerificationStats();

    return ApiResponse.success(res, "Verification statistics retrieved", stats);
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { users, pagination } = await AdminService.getUsers(req.query);

    return ApiResponse.paginated(
      res,
      "Users retrieved successfully",
      users,
      pagination,
    );
  } catch (error) {
    next(error);
  }
};

const getUserDetail = async (req, res, next) => {
  try {
    const user = await AdminService.getUserById(req.params.id);

    return ApiResponse.success(
      res,
      "User details retrieved successfully",
      user,
    );
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const updatedUser = await AdminService.updateUserStatus(
      req.params.id,
      status,
      req.user.id,
    );

    await notifyUserStatusChange(updatedUser, status);

    return ApiResponse.success(
      res,
      `User ${status.toLowerCase()} successfully`,
      updatedUser,
    );
  } catch (error) {
    next(error);
  }
};

const getAdminNavCounts = async (req, res, next) => {
  try {
    const [
      hostelCount,
      pendingPayments,
      pendingDisbursements,
      openComplaints,
      pendingVerifications,
    ] = await Promise.all([
      prisma.hostel.count({
        where: { status: "APPROVED" },
      }),
      prisma.payment.count({
        where: { status: "PENDING" },
      }),
      prisma.disbursement.count({
        where: { status: "PENDING" },
      }),
      prisma.complaint.count({
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      }),
      prisma.hostel.count({
        where: { status: "PENDING" },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        hostels: hostelCount,
        payments: pendingPayments,
        disbursements: pendingDisbursements,
        complaints: openComplaints,
        verifications: pendingVerifications,
      },
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getManagers,
  getManagerDetail,
  verifyManager,
  getVerificationStats,
  getUsers,
  getUserDetail,
  updateUserStatus,
  getAdminNavCounts,
};
