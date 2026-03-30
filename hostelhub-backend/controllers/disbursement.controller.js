const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const {
  transferToManager,
  checkDisbursementStatus,
} = require("../config/momo");

const getAllDisbursements = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status) where.status = status;

    if (search) {
      where.OR = [
        {
          disbursementReference: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          recipientName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          recipientPhone: { contains: search },
        },
      ];
    }

    const [disbursements, total] = await Promise.all([
      prisma.disbursement.findMany({
        where,
        include: {
          payment: {
            select: {
              id: true,
              paymentReference: true,
              amount: true,
              status: true,
              booking: {
                select: {
                  id: true,
                  bookingReference: true,
                  booker: {
                    select: {
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
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.disbursement.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: disbursements,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getDisbursementStats = async (req, res, next) => {
  try {
    const [statusStats, totals] = await Promise.all([
      prisma.disbursement.groupBy({
        by: ["status"],
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.disbursement.aggregate({
        _sum: {
          amount: true,
          platformFee: true,
        },
        _count: { id: true },
      }),
    ]);

    const statusMap = statusStats.reduce((acc, item) => {
      acc[item.status] = {
        count: item._count.id,
        totalAmount: item._sum.amount || 0,
      };
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        totalDisbursements: totals._count.id,
        totalAmount: totals._sum.amount || 0,
        totalPlatformFees: totals._sum.platformFee || 0,
        statusBreakdown: {
          pending: statusMap.PENDING || { count: 0, totalAmount: 0 },
          processing: statusMap.PROCESSING || {
            count: 0,
            totalAmount: 0,
          },
          completed: statusMap.COMPLETED || {
            count: 0,
            totalAmount: 0,
          },
          failed: statusMap.FAILED || { count: 0, totalAmount: 0 },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const processDisbursement = async (req, res, next) => {
  try {
    const { disbursementId } = req.params;
    const adminId = req.user.id;

    const disbursement = await prisma.disbursement.findUnique({
      where: { id: disbursementId },
      include: {
        payment: {
          include: {
            booking: {
              include: {
                hostel: {
                  select: {
                    id: true,
                    name: true,
                    managerId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!disbursement) {
      return next(new ApiError(404, "Disbursement not found."));
    }

    if (disbursement.status !== "PENDING") {
      return next(
        new ApiError(
          400,
          `Cannot process disbursement. Status is "${disbursement.status}".`,
        ),
      );
    }

    await prisma.disbursement.update({
      where: { id: disbursementId },
      data: {
        status: "PROCESSING",
        disbursedBy: adminId,
      },
    });

    try {
      const momoResponse = await transferToManager({
        amount: parseFloat(disbursement.amount),
        phone: disbursement.recipientPhone,
        externalId: disbursement.disbursementReference,
        payeeNote: `Disbursement for ${disbursement.payment.booking.hostel.name} - ${disbursement.payment.booking.bookingReference}`,
        payerMessage: `HostelHub payment for booking ${disbursement.payment.booking.bookingReference}`,
      });

      await prisma.disbursement.update({
        where: { id: disbursementId },
        data: {
          notes: `MoMo Reference: ${momoResponse.referenceId}`,
        },
      });

      res.status(200).json({
        success: true,
        message: "Disbursement initiated. Use the reference to check status.",
        data: {
          disbursementId,
          momoReferenceId: momoResponse.referenceId,
          amount: disbursement.amount,
          recipientPhone: disbursement.recipientPhone,
          recipientName: disbursement.recipientName,
          status: "PROCESSING",
        },
      });
    } catch (momoError) {
      await prisma.disbursement.update({
        where: { id: disbursementId },
        data: {
          status: "FAILED",
          failureReason: momoError.message,
        },
      });

      return next(
        new ApiError(500, `Disbursement failed: ${momoError.message}`),
      );
    }
  } catch (error) {
    next(error);
  }
};

const verifyDisbursement = async (req, res, next) => {
  try {
    const { disbursementId } = req.params;

    const disbursement = await prisma.disbursement.findUnique({
      where: { id: disbursementId },
      include: {
        payment: {
          include: {
            booking: {
              include: {
                hostel: {
                  select: { name: true, managerId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!disbursement) {
      return next(new ApiError(404, "Disbursement not found."));
    }

    if (disbursement.status === "COMPLETED") {
      return res.status(200).json({
        success: true,
        message: "Disbursement already completed.",
        data: disbursement,
      });
    }

    if (disbursement.status !== "PROCESSING") {
      return next(
        new ApiError(
          400,
          `Cannot verify. Disbursement status is "${disbursement.status}".`,
        ),
      );
    }

    const momoRefMatch = disbursement.notes?.match(/MoMo Reference: (.+)/);
    if (!momoRefMatch) {
      return next(
        new ApiError(400, "No MoMo reference found. Cannot verify status."),
      );
    }

    const momoReferenceId = momoRefMatch[1];
    const momoStatus = await checkDisbursementStatus(momoReferenceId);

    if (momoStatus.status === "SUCCESSFUL") {
      const updatedDisbursement = await prisma.$transaction(async (tx) => {
        const updated = await tx.disbursement.update({
          where: { id: disbursementId },
          data: {
            status: "COMPLETED",
            disbursedAt: new Date(),
            notes: `${disbursement.notes}\nCompleted at: ${new Date().toISOString()}`,
          },
        });

        await tx.notification.create({
          data: {
            userId: disbursement.payment.booking.hostel.managerId,
            title: "Disbursement Received!",
            message: `Payment of GHS ${disbursement.amount} has been sent to your MoMo number ${disbursement.recipientPhone} for booking ${disbursement.payment.booking.bookingReference}.`,
            type: "DISBURSEMENT",
            metadata: {
              disbursementId: disbursement.id,
              amount: disbursement.amount,
            },
          },
        });

        return updated;
      });

      return res.status(200).json({
        success: true,
        message: "Disbursement completed successfully.",
        data: updatedDisbursement,
      });
    } else if (momoStatus.status === "FAILED") {
      const updatedDisbursement = await prisma.disbursement.update({
        where: { id: disbursementId },
        data: {
          status: "FAILED",
          failureReason: momoStatus.reason?.message || "Transfer failed",
        },
      });

      return res.status(200).json({
        success: true,
        message: "Disbursement failed.",
        data: updatedDisbursement,
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "Disbursement still processing.",
        data: {
          status: "PROCESSING",
          momoStatus: momoStatus.status,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

const markDisbursementComplete = async (req, res, next) => {
  try {
    const { disbursementId } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id;

    const disbursement = await prisma.disbursement.findUnique({
      where: { id: disbursementId },
      include: {
        payment: {
          include: {
            booking: {
              include: {
                hostel: {
                  select: { name: true, managerId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!disbursement) {
      return next(new ApiError(404, "Disbursement not found."));
    }

    if (disbursement.status === "COMPLETED") {
      return next(new ApiError(400, "Disbursement is already completed."));
    }

    const updatedDisbursement = await prisma.$transaction(async (tx) => {
      const updated = await tx.disbursement.update({
        where: { id: disbursementId },
        data: {
          status: "COMPLETED",
          disbursedBy: adminId,
          disbursedAt: new Date(),
          notes: notes
            ? `Manual completion: ${notes}`
            : "Manually marked as completed by admin",
        },
      });

      await tx.notification.create({
        data: {
          userId: disbursement.payment.booking.hostel.managerId,
          senderId: adminId,
          title: "Disbursement Completed",
          message: `Payment of GHS ${disbursement.amount} for booking ${disbursement.payment.booking.bookingReference} has been disbursed.`,
          type: "DISBURSEMENT",
          metadata: {
            disbursementId: disbursement.id,
          },
        },
      });

      return updated;
    });

    res.status(200).json({
      success: true,
      message: "Disbursement marked as completed.",
      data: updatedDisbursement,
    });
  } catch (error) {
    next(error);
  }
};

const getManagerDisbursements = async (req, res, next) => {
  try {
    const managerId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { managerId };
    if (status) where.status = status;

    const [disbursements, total] = await Promise.all([
      prisma.disbursement.findMany({
        where,
        include: {
          payment: {
            select: {
              paymentReference: true,
              amount: true,
              paidAt: true,
              booking: {
                select: {
                  bookingReference: true,
                  hostel: {
                    select: {
                      name: true,
                    },
                  },
                  student: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.disbursement.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: disbursements,
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

module.exports = {
  getAllDisbursements,
  getDisbursementStats,
  processDisbursement,
  verifyDisbursement,
  markDisbursementComplete,
  getManagerDisbursements,
};
