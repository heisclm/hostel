const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const { notifyComplaintCreated, notifyComplaintResponse, notifyComplaintStatusUpdate } = require("../utils/notifications");

const getEligibleHostelsForComplaint = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const eligibleBookings = await prisma.booking.findMany({
      where: {
        bookerId: userId,
        status: "CHECKED_IN",
      },
      include: {
        hostel: {
          select: {
            id: true,
            name: true,
            address: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        room: {
          select: {
            roomNumber: true,
          },
        },
      },
      orderBy: {
        checkInDate: "desc",
      },
    });

    const hostelsMap = new Map();
    eligibleBookings.forEach((booking) => {
      if (booking.hostel && !hostelsMap.has(booking.hostel.id)) {
        hostelsMap.set(booking.hostel.id, {
          id: booking.hostel.id,
          name: booking.hostel.name,
          address: booking.hostel.address,
          image: booking.hostel.images[0]?.url || null,
          roomNumber: booking.room?.roomNumber || null,
          bookingId: booking.id,
          checkInDate: booking.checkInDate,
        });
      }
    });

    const eligibleHostels = Array.from(hostelsMap.values());

    res.status(200).json({
      success: true,
      data: eligibleHostels,
      message:
        eligibleHostels.length > 0
          ? "Eligible hostels retrieved"
          : "No active stay found. You can only submit complaints for hostels where you are currently staying.",
    });
  } catch (error) {
    next(error);
  }
};

const createComplaint = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { hostelId, subject, message, category, visibility } = req.body;

    const allowedVisibility = ["ADMIN_ONLY", "ADMIN_AND_MANAGER"];
    const complaintVisibility =
      visibility && allowedVisibility.includes(visibility)
        ? visibility
        : "ADMIN_AND_MANAGER";

    const activeBooking = await prisma.booking.findFirst({
      where: {
        bookerId: userId,
        hostelId,
        status: "CHECKED_IN",
      },
      include: {
        hostel: {
          select: {
            id: true,
            name: true,
            managerId: true,
          },
        },
      },
    });

    if (!activeBooking) {
      return next(
        new ApiError(
          403,
          "You can only submit complaints for hostels where you are currently staying.",
        ),
      );
    }

    const complaint = await prisma.complaint.create({
      data: {
        userId,
        hostelId,
        subject,
        message,
        category: category || null,
        status: "OPEN",
        visibility: complaintVisibility,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        hostel: {
          select: {
            id: true,
            name: true,
            managerId: true,
          },
        },
      },
    });

    await notifyComplaintCreated(complaint, req.user, activeBooking.hostel);

    const visibilityMessage =
      complaintVisibility === "ADMIN_ONLY"
        ? "Complaint submitted successfully. Only the platform admin has been notified via email."
        : "Complaint submitted successfully. The hostel manager and admin have been notified via email.";

    res.status(201).json({
      success: true,
      message: visibilityMessage,
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

const getMyComplaints = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          hostel: {
            select: {
              id: true,
              name: true,
              address: true,
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          responses: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              responder: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
          },
          _count: {
            select: { responses: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.complaint.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getComplaintDetail = async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true, 
            studentProfile: {
              select: {
                studentId: true,
                programme: true,
                level: true,
              },
            },
            guestProfile: {
              select: {
                guestType: true,
                beneficiaryName: true,
                staffId: true,
                department: true,
              },
            },
          },
        },
        hostel: {
          select: {
            id: true,
            name: true,
            address: true,
            managerId: true,
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        responses: {
          orderBy: { createdAt: "asc" },
          include: {
            responder: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: { responses: true },
        },
      },
    });

    if (!complaint) {
      return next(new ApiError(404, "Complaint not found"));
    }

    const isOwner = complaint.userId === userId;
    const isManager = complaint.hostel?.managerId === userId;
    const isAdmin = userRole === "ADMIN";

    if ((userRole === "STUDENT" || userRole === "GUEST") && !isOwner) {
      return next(
        new ApiError(403, "You don't have permission to view this complaint"),
      );
    }

    if (userRole === "MANAGER" && !isManager) {
      return next(
        new ApiError(403, "You don't have permission to view this complaint"),
      );
    }

    if (userRole === "MANAGER" && complaint.visibility === "ADMIN_ONLY") {
      return next(new ApiError(403, "This complaint is not visible to you"));
    }

    res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

const getHostelComplaints = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const { page = 1, limit = 20, status, category, search } = req.query;

    const hostel = await prisma.hostel.findFirst({
      where: {
        id: hostelId,
        managerId: req.user.id,
      },
    });

    if (!hostel) {
      return next(new ApiError(403, "You don't have access to this hostel"));
    }

    const where = {
      hostelId,
      visibility: "ADMIN_AND_MANAGER",
    };

    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              role: true,
              studentProfile: {
                select: {
                  studentId: true,
                  programme: true,
                  level: true,
                },
              },
              guestProfile: {
                select: {
                  guestType: true,
                  beneficiaryName: true,
                  staffId: true,
                  department: true,
                },
              },
            },
          },
          responses: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              responder: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
          },
          _count: { select: { responses: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.complaint.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAllComplaints = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      hostelId,
      category,
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (hostelId) where.hostelId = hostelId;
    if (category) where.category = category;

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
        {
          user: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          hostel: {
            select: {
              id: true,
              name: true,
              address: true,
              managerId: true,
              manager: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          responses: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              responder: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
          },
          _count: {
            select: { responses: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.complaint.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const addResponse = async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const { message } = req.body;
    const responderId = req.user.id;
    const userRole = req.user.role;

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        hostel: {
          select: {
            id: true,
            name: true,
            managerId: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!complaint) {
      return next(new ApiError(404, "Complaint not found."));
    }

    const isManager = complaint.hostel?.managerId === responderId;
    const isAdmin = userRole === "ADMIN";
    const isOwner = complaint.userId === responderId;

    if (!isManager && !isAdmin && !isOwner) {
      return next(
        new ApiError(
          403,
          "You are not authorized to respond to this complaint.",
        ),
      );
    }

    if (isManager && complaint.visibility === "ADMIN_ONLY") {
      return next(new ApiError(403, "This complaint is not visible to you."));
    }

    const response = await prisma.$transaction(async (tx) => {
      const newResponse = await tx.complaintResponse.create({
        data: {
          complaintId,
          responderId,
          message,
        },
        include: {
          responder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      if (complaint.status === "OPEN") {
        await tx.complaint.update({
          where: { id: complaintId },
          data: { status: "IN_PROGRESS" },
        });
      }
      const notifyUserId = isOwner
        ? complaint.hostel?.managerId
        : complaint.userId;

      if (notifyUserId) {
        await tx.notification.create({
          data: {
            userId: notifyUserId,
            senderId: responderId,
            title: "New Response to Complaint",
            message: `A response has been added to your complaint: "${complaint.subject}"`,
            type: "COMPLAINT",
            metadata: {
              complaintId,
              responseId: newResponse.id,
            },
          },
        });
      }

      return newResponse;
    });

    res.status(201).json({
      success: true,
      message: "Response added successfully.",
      data: response,
    });
  } catch (error) {
    next(error);
  }
};
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const { status, resolution } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        hostel: {
          select: {
            id: true,
            name: true,
            managerId: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!complaint) {
      return next(new ApiError(404, "Complaint not found."));
    }

    const isManager = complaint.hostel?.managerId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isManager && !isAdmin) {
      return next(
        new ApiError(
          403,
          "Only managers and admins can update complaint status.",
        ),
      );
    }

    if (isManager && complaint.visibility === "ADMIN_ONLY") {
      return next(new ApiError(403, "This complaint is not visible to you."));
    }

    const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    if (!validStatuses.includes(status)) {
      return next(
        new ApiError(
          400,
          `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        ),
      );
    }

    const updateData = { status };

    if ((status === "RESOLVED" || status === "CLOSED") && resolution) {
      await prisma.complaintResponse.create({
        data: {
          complaintId,
          responderId: userId,
          message: `[${status}] ${resolution}`,
        },
      });
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id: complaintId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        hostel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await notifyComplaintStatusUpdate(
      complaint,
      complaint.user,
      complaint.hostel,
      req.user,
      status,
      resolution
    );

    res.status(200).json({
      success: true,
      message: `Complaint marked as ${status.toLowerCase().replace("_", " ")}. Email notification sent.`,
      data: updatedComplaint,
    });
  } catch (error) {
    next(error);
  }
};

const getComplaintStats = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const managerId = req.user.id;

    if (hostelId) {
      const hostel = await prisma.hostel.findFirst({
        where: { id: hostelId, managerId },
      });

      if (!hostel) {
        return next(new ApiError(404, "Hostel not found or access denied."));
      }
    }

    const where = hostelId ? { hostelId } : {};

    const [total, open, inProgress, resolved, closed] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.count({ where: { ...where, status: "OPEN" } }),
      prisma.complaint.count({ where: { ...where, status: "IN_PROGRESS" } }),
      prisma.complaint.count({ where: { ...where, status: "RESOLVED" } }),
      prisma.complaint.count({ where: { ...where, status: "CLOSED" } }),
    ]);

    const recent = await prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total,
          open,
          inProgress,
          resolved,
          closed,
        },
        recent,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEligibleHostelsForComplaint,
  createComplaint,
  getMyComplaints,
  getComplaintDetail,
  getHostelComplaints,
  getAllComplaints,
  addResponse,
  updateComplaintStatus,
  getComplaintStats,
};
