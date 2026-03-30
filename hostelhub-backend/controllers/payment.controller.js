const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");

const adminGetAllPayments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      hostelId,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (hostelId) {
      where.booking = {
        hostelId,
      };
    }

    if (search) {
      where.OR = [
        {
          paymentReference: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          momoTransactionId: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          payerPhone: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          booking: {
            bookingReference: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          booking: {
            student: {
              OR: [
                {
                  firstName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  lastName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        },
        {
          booking: {
            hostel: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

    const allowedSortFields = ["createdAt", "amount", "status", "paidAt"];
    const orderField = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";
    const orderDirection = sortOrder === "asc" ? "asc" : "desc";

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          booking: {
            select: {
              id: true,
              bookingReference: true,
              status: true,
              totalAmount: true,
              paymentPlan: true,
              semesterPeriod: true,
              academicYear: true,
              booker: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
              hostel: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
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
                  paymentDetail: {
                    select: {
                      accountName: true,
                      momoNumber: true,
                      momoProvider: true,
                    },
                  },
                },
              },
              roomType: {
                select: {
                  id: true,
                  occupancyType: true,
                  pricePerPerson: true,
                },
              },
            },
          },
          disbursement: {
            select: {
              id: true,
              disbursementReference: true,
              amount: true,
              platformFee: true,
              status: true,
              disbursedAt: true,
              recipientPhone: true,
              recipientName: true,
            },
          },
        },
        orderBy: { [orderField]: orderDirection },
        skip,
        take: limitNum,
      }),
      prisma.payment.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: payments,
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

const adminGetPaymentStats = async (req, res, next) => {
  try {
    const [
      statusStats,
      totalRevenue,
      platformFeesResult,
      pendingDisbursements,
      completedDisbursements,
      recentPayments,
      monthlyStats,
    ] = await Promise.all([
      prisma.payment.groupBy({
        by: ["status"],
        _count: { id: true },
        _sum: { amount: true },
      }),

      prisma.payment.aggregate({
        where: { status: "SUCCESSFUL" },
        _sum: { amount: true },
        _count: { id: true },
      }),

      prisma.disbursement.aggregate({
        where: {
          status: { in: ["COMPLETED", "PENDING", "PROCESSING"] },
        },
        _sum: { platformFee: true },
      }),

      prisma.disbursement.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true },
        _count: { id: true },
      }),

      prisma.disbursement.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
        _count: { id: true },
      }),

      prisma.payment.findMany({
        where: { status: "SUCCESSFUL" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          booking: {
            select: {
              bookingReference: true,
              booker: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              hostel: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),

      prisma.$queryRaw`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
          COUNT(*)::int as count,
          COALESCE(SUM(amount), 0) as total
        FROM payments
        WHERE status = 'SUCCESSFUL'
          AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
      `,
    ]);

    const statusMap = statusStats.reduce((acc, item) => {
      acc[item.status] = {
        count: item._count.id,
        amount: item._sum.amount || 0,
      };
      return acc;
    }, {});

    const totalPayments = statusStats.reduce(
      (sum, item) => sum + item._count.id,
      0,
    );

    res.status(200).json({
      success: true,
      data: {
        totalPayments,
        statusBreakdown: {
          successful: statusMap.SUCCESSFUL || { count: 0, amount: 0 },
          pending: statusMap.PENDING || { count: 0, amount: 0 },
          failed: statusMap.FAILED || { count: 0, amount: 0 },
          refunded: statusMap.REFUNDED || { count: 0, amount: 0 },
        },
        revenue: {
          totalReceived: totalRevenue._sum.amount || 0,
          totalSuccessfulPayments: totalRevenue._count.id || 0,
          platformFeesEarned: platformFeesResult._sum.platformFee || 0,
        },
        disbursements: {
          pendingAmount: pendingDisbursements._sum.amount || 0,
          pendingCount: pendingDisbursements._count.id || 0,
          completedAmount: completedDisbursements._sum.amount || 0,
          completedCount: completedDisbursements._count.id || 0,
        },
        recentPayments,
        monthlyStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

const adminGetPaymentDetail = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          select: {
            id: true,
            bookingReference: true,
            status: true,
            totalAmount: true,
            paymentPlan: true,
            semesterPeriod: true,
            academicYear: true,
            notes: true,
            createdAt: true,
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                studentProfile: {
                  select: {
                    studentId: true,
                    programme: true,
                    level: true,
                  },
                },
              },
            },
            hostel: {
              select: {
                id: true,
                name: true,
                slug: true,
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
                paymentDetail: {
                  select: {
                    accountName: true,
                    momoNumber: true,
                    momoProvider: true,
                  },
                },
              },
            },
            roomType: {
              select: {
                id: true,
                occupancyType: true,
                pricePerPerson: true,
              },
            },
          },
        },
        disbursement: true,
      },
    });

    if (!payment) {
      return next(new ApiError(404, "Payment not found."));
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};


const getMyPayments = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      booking: {
        bookerId: studentId,
      },
    };

    if (status) {
      where.status = status;
    }

    const allowedSortFields = ["createdAt", "amount", "status", "paidAt"];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const orderDirection = sortOrder === "asc" ? "asc" : "desc";

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          booking: {
            select: {
              id: true,
              bookingReference: true,
              status: true,
              baseAmount: true,
              platformFee: true,
              totalAmount: true,
              paymentPlan: true,
              semesterPeriod: true,
              academicYear: true,
              createdAt: true,
              hostel: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  address: true,
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                    select: {
                      url: true,
                    },
                  },
                },
              },
              roomType: {
                select: {
                  id: true,
                  occupancyType: true,
                  pricePerPerson: true,
                },
              },
              room: {
                select: {
                  id: true,
                  roomNumber: true,
                },
              },
            },
          },
        },
        orderBy: { [orderField]: orderDirection },
        skip,
        take: limitNum,
      }),
      prisma.payment.count({ where }),
    ]);

    const allPayments = await prisma.payment.findMany({
      where: {
        booking: {
          bookerId: studentId,
        },
      },
      select: {
        status: true,
        amount: true,
      },
    });

    const stats = {
      total: allPayments.length,
      successful: allPayments.filter((p) => p.status === "SUCCESSFUL").length,
      pending: allPayments.filter((p) => p.status === "PENDING").length,
      failed: allPayments.filter((p) => p.status === "FAILED").length,
      totalSpent: allPayments
        .filter((p) => p.status === "SUCCESSFUL")
        .reduce((sum, p) => sum + Number(p.amount), 0),
    };

    res.status(200).json({
      success: true,
      data: payments,
      stats,
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

const getMyPaymentDetail = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { paymentId } = req.params;

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        booking: {
          bookerId: studentId,
        },
      },
      include: {
        booking: {
          select: {
            id: true,
            bookingReference: true,
            status: true,
            baseAmount: true,
            platformFee: true,
            platformFeePercent: true,
            totalAmount: true,
            paymentPlan: true,
            semesterPeriod: true,
            academicYear: true,
            checkInDate: true,
            checkOutDate: true,
            notes: true,
            createdAt: true,
            confirmedAt: true,
            hostel: {
              select: {
                id: true,
                name: true,
                slug: true,
                address: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                  select: {
                    url: true,
                  },
                },
              },
            },
            roomType: {
              select: {
                id: true,
                occupancyType: true,
                pricePerPerson: true,
                amenities: true,
              },
            },
            room: {
              select: {
                id: true,
                roomNumber: true,
                floor: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return next(new ApiError(404, "Payment not found."));
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminGetAllPayments,
  adminGetPaymentStats,
  adminGetPaymentDetail,
  getMyPayments,
  getMyPaymentDetail,
};



