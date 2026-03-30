const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const { getPagination, buildPaginationResponse } = require("../utils/helpers");

class AdminService {
  static async getManagers(queryParams) {
    const { page = 1, limit = 10, status, search } = queryParams;
    const { skip, take, currentPage, itemsPerPage } = getPagination(
      page,
      limit,
    );

    const where = {
      role: "MANAGER",
    };

    if (status) {
      where.managerProfile = {
        verificationStatus: status,
      };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        {
          managerProfile: {
            businessName: { contains: search, mode: "insensitive" },
          },
        },
        {
          managerProfile: {
            idNumber: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    const [managers, totalItems] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          managerProfile: {
            select: {
              id: true,
              businessName: true,
              idType: true,
              idNumber: true,
              idImage: true,
              verified: true,
              verifiedAt: true,
              verifiedBy: true,
              rejectionReason: true,
              verificationStatus: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const pagination = buildPaginationResponse(
      totalItems,
      currentPage,
      itemsPerPage,
    );

    return { managers, pagination };
  }

  static async getManagerById(managerId) {
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        managerProfile: {
          select: {
            id: true,
            businessName: true,
            idType: true,
            idNumber: true,
            idImage: true,
            verified: true,
            verifiedAt: true,
            verifiedBy: true,
            rejectionReason: true,
            verificationStatus: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            hostels: true,
          },
        },
      },
    });

    if (!manager) {
      throw new ApiError(404, "Manager not found");
    }

    if (manager.role !== "MANAGER") {
      throw new ApiError(400, "This user is not a hostel manager");
    }

    return manager;
  }

  static async verifyManager(managerId, action, adminId, rejectionReason) {
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      include: {
        managerProfile: true,
      },
    });

    if (!manager) {
      throw new ApiError(404, "Manager not found");
    }

    if (manager.role !== "MANAGER") {
      throw new ApiError(400, "This user is not a hostel manager");
    }

    if (!manager.managerProfile) {
      throw new ApiError(400, "Manager profile not found");
    }

    if (
      action === "VERIFY" &&
      manager.managerProfile.verificationStatus === "VERIFIED"
    ) {
      throw new ApiError(400, "This manager is already verified");
    }

    if (action === "VERIFY") {
      await prisma.managerProfile.update({
        where: { userId: managerId },
        data: {
          verified: true,
          verificationStatus: "VERIFIED",
          verifiedAt: new Date(),
          verifiedBy: adminId,
          rejectionReason: null,
        },
      });

      const updatedManager = await prisma.user.findUnique({
        where: { id: managerId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          managerProfile: {
            select: {
              id: true,
              businessName: true,
              idType: true,
              idNumber: true,
              idImage: true,
              verified: true,
              verifiedAt: true,
              verifiedBy: true,
              verificationStatus: true,
            },
          },
        },
      });

      return updatedManager;
    } else if (action === "REJECT") {
      if (!rejectionReason) {
        throw new ApiError(
          400,
          "Rejection reason is required when rejecting a manager",
        );
      }

      await prisma.managerProfile.update({
        where: { userId: managerId },
        data: {
          verified: false,
          verificationStatus: "REJECTED",
          rejectionReason: rejectionReason,
          verifiedBy: adminId,
        },
      });

      const updatedManager = await prisma.user.findUnique({
        where: { id: managerId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          managerProfile: {
            select: {
              id: true,
              businessName: true,
              idType: true,
              idNumber: true,
              idImage: true,
              verified: true,
              rejectionReason: true,
              verificationStatus: true,
            },
          },
        },
      });

      return updatedManager;
    }
  }

  static async getUsers(queryParams) {
    const { page = 1, limit = 10, role, status, search } = queryParams;
    const { skip, take, currentPage, itemsPerPage } = getPagination(
      page,
      limit,
    );

    const where = {};

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, totalItems] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          studentProfile: {
            select: {
              studentId: true,
              programme: true,
              level: true,
            },
          },
          managerProfile: {
            select: {
              businessName: true,
              verified: true,
              verificationStatus: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const pagination = buildPaginationResponse(
      totalItems,
      currentPage,
      itemsPerPage,
    );

    return { users, pagination };
  }

  static async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        studentProfile: true,
        managerProfile: {
          select: {
            id: true,
            businessName: true,
            idType: true,
            idNumber: true,
            idImage: true,
            verified: true,
            verifiedAt: true,
            verifiedBy: true,
            rejectionReason: true,
            verificationStatus: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            complaints: true,
            hostels: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  }

  static async updateUserStatus(userId, newStatus, adminId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (userId === adminId) {
      throw new ApiError(400, "You cannot change your own account status");
    }

    if (user.role === "ADMIN") {
      throw new ApiError(400, "Cannot modify another admin's account status");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
      },
    });

    return updatedUser;
  }

  static async getVerificationStats() {
    const [pending, verified, rejected, totalManagers] = await Promise.all([
      prisma.managerProfile.count({
        where: { verificationStatus: "PENDING" },
      }),
      prisma.managerProfile.count({
        where: { verificationStatus: "VERIFIED" },
      }),
      prisma.managerProfile.count({
        where: { verificationStatus: "REJECTED" },
      }),
      prisma.user.count({
        where: { role: "MANAGER" },
      }),
    ]);

    return {
      totalManagers,
      pending,
      verified,
      rejected,
    };
  }
}

module.exports = AdminService;
