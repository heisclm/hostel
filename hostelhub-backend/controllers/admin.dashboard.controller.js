const { prisma } = require("../config/db");
const asyncHandler = require("../middleware/asyncHandler");

const getAdminDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const totalPlatformRevenue = await prisma.booking.aggregate({
    where: {
      payment: {
        status: "SUCCESSFUL",
      },
    },
    _sum: {
      platformFee: true,
    },
  });

  const thisMonthPlatformRevenue = await prisma.booking.aggregate({
    where: {
      payment: {
        status: "SUCCESSFUL",
        paidAt: { gte: startOfMonth },
      },
    },
    _sum: {
      platformFee: true,
    },
  });

  const lastMonthPlatformRevenue = await prisma.booking.aggregate({
    where: {
      payment: {
        status: "SUCCESSFUL",
        paidAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    },
    _sum: {
      platformFee: true,
    },
  });

  const totalPaymentsReceived = await prisma.payment.aggregate({
    where: {
      status: "SUCCESSFUL",
    },
    _sum: {
      amount: true,
    },
  });

  const thisMonthPayments = await prisma.payment.aggregate({
    where: {
      status: "SUCCESSFUL",
      paidAt: { gte: startOfMonth },
    },
    _sum: {
      amount: true,
    },
  });

  const totalDisbursed = await prisma.disbursement.aggregate({
    where: {
      status: "COMPLETED",
    },
    _sum: {
      amount: true,
    },
  });

  const thisMonthDisbursed = await prisma.disbursement.aggregate({
    where: {
      status: "COMPLETED",
      disbursedAt: { gte: startOfMonth },
    },
    _sum: {
      amount: true,
    },
  });

  const pendingDisbursementsAmount = await prisma.disbursement.aggregate({
    where: {
      status: { in: ["PENDING", "PROCESSING"] },
    },
    _sum: {
      amount: true,
    },
    _count: true,
  });

  const pendingDisbursementManagers = await prisma.disbursement.groupBy({
    by: ["managerId"],
    where: {
      status: { in: ["PENDING", "PROCESSING"] },
    },
  });

  const totalHostels = await prisma.hostel.count({
    where: {
      status: "APPROVED",
    },
  });

  const thisMonthHostels = await prisma.hostel.count({
    where: {
      status: "APPROVED",
      createdAt: { gte: startOfMonth },
    },
  });

  const totalUsers = await prisma.user.count();

  const thisMonthUsers = await prisma.user.count({
    where: {
      createdAt: { gte: startOfMonth },
    },
  });

  const activeBookings = await prisma.booking.count({
    where: {
      status: { in: ["CONFIRMED", "CHECKED_IN"] },
    },
  });

  const lastMonthActiveBookings = await prisma.booking.count({
    where: {
      status: { in: ["CONFIRMED", "CHECKED_IN"] },
      createdAt: {
        gte: startOfLastMonth,
        lte: endOfLastMonth,
      },
    },
  });

  const pendingManagerVerifications = await prisma.managerProfile.count({
    where: {
      verificationStatus: "PENDING",
    },
  });

  const pendingHostelVerifications = await prisma.hostel.count({
    where: {
      status: "PENDING",
    },
  });

  const recentPayments = await prisma.payment.findMany({
    where: {
      status: "SUCCESSFUL",
    },
    include: {
      booking: {
        include: {
          booker: {
            select: {
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          hostel: {
            select: {
              name: true,
              manager: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
      disbursement: {
        select: {
          status: true,
        },
      },
    },
    orderBy: { paidAt: "desc" },
    take: 10,
  });

  const pendingDisbursements = await prisma.disbursement.findMany({
    where: {
      status: { in: ["PENDING", "PROCESSING"] },
    },
    include: {
      payment: {
        include: {
          booking: {
            include: {
              hostel: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const disbursementsByManager = await prisma.disbursement.groupBy({
    by: ["managerId", "recipientName", "recipientPhone"],
    where: {
      status: { in: ["PENDING", "PROCESSING"] },
    },
    _sum: {
      amount: true,
    },
    _count: true,
    _min: {
      createdAt: true,
    },
  });

  const managerIds = disbursementsByManager.map((d) => d.managerId);
  const managerHostels = await prisma.hostel.findMany({
    where: {
      managerId: { in: managerIds },
      status: "APPROVED",
    },
    select: {
      managerId: true,
      name: true,
      paymentDetail: {
        select: {
          momoProvider: true,
        },
      },
    },
  });

  const formattedPendingDisbursements = disbursementsByManager.map((d) => {
    const hostel = managerHostels.find((h) => h.managerId === d.managerId);
    return {
      id: `DIS-${d.managerId.slice(0, 8)}`,
      managerId: d.managerId,
      managerName: d.recipientName,
      hostelName: hostel?.name || "Unknown Hostel",
      amount: Number(d._sum.amount),
      paymentCount: d._count,
      oldestPayment: d._min.createdAt,
      momoNumber: d.recipientPhone,
      network: hostel?.paymentDetail?.momoProvider || "MTN",
    };
  });

  const pendingManagers = await prisma.user.findMany({
    where: {
      role: "MANAGER",
      managerProfile: {
        verificationStatus: "PENDING",
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      managerProfile: {
        select: {
          businessName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const pendingHostels = await prisma.hostel.findMany({
    where: {
      status: "PENDING",
    },
    select: {
      id: true,
      name: true,
      address: true,
      createdAt: true,
      manager: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const formattedVerifications = [
    ...pendingHostels.map((h) => ({
      id: h.id,
      type: "hostel",
      name: h.name,
      submittedBy: `${h.manager.firstName} ${h.manager.lastName}`,
      date: h.createdAt,
      location: h.address,
    })),
    ...pendingManagers.map((m) => ({
      id: m.id,
      type: "manager",
      name: `${m.firstName} ${m.lastName}`,
      submittedBy: "Self",
      date: m.createdAt,
      location: m.managerProfile?.businessName || "N/A",
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const escalatedComplaints = await prisma.complaint.findMany({
    where: {
      status: { in: ["OPEN", "IN_PROGRESS"] },
      createdAt: {
        lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      hostel: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 5,
  });

  const formattedEscalatedComplaints = escalatedComplaints.map((c) => {
    const daysOpen = Math.floor(
      (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    );
    return {
      id: c.id,
      title: c.subject,
      hostelName: c.hostel?.name || "General",
      userName: `${c.user.firstName} ${c.user.lastName}`,
      userRole: c.user.role,
      priority: daysOpen > 5 ? "urgent" : "high",
      daysOpen,
    };
  });

  const currentPlatformRev = Number(
    thisMonthPlatformRevenue._sum.platformFee || 0,
  );
  const lastPlatformRev = Number(
    lastMonthPlatformRevenue._sum.platformFee || 0,
  );
  const revenueChange =
    lastPlatformRev > 0
      ? ((currentPlatformRev - lastPlatformRev) / lastPlatformRev) * 100
      : currentPlatformRev > 0
        ? 100
        : 0;

  const activeBookingsChange =
    lastMonthActiveBookings > 0
      ? ((activeBookings - lastMonthActiveBookings) / lastMonthActiveBookings) *
        100
      : activeBookings > 0
        ? 100
        : 0;

  res.status(200).json({
    success: true,
    data: {
      platformStats: [
        {
          label: "Total Revenue",
          value: Number(totalPlatformRevenue._sum.platformFee || 0),
          change: `+${revenueChange.toFixed(1)}%`,
          trending: revenueChange >= 0 ? "up" : "down",
          icon: "CreditCard",
          color: "text-green-600",
          bg: "bg-green-50",
          border: "border-green-200",
        },
        {
          label: "Pending Disbursements",
          value: Number(pendingDisbursementsAmount._sum.amount || 0),
          change: `${pendingDisbursementManagers.length} managers`,
          trending: "neutral",
          icon: "Banknote",
          color: "text-amber-600",
          bg: "bg-amber-50",
          border: "border-amber-200",
        },
        {
          label: "Total Hostels",
          value: totalHostels,
          change: `+${thisMonthHostels} this month`,
          trending: "up",
          icon: "Building2",
          color: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-200",
        },
        {
          label: "Registered Users",
          value: totalUsers,
          change: `+${thisMonthUsers} this month`,
          trending: "up",
          icon: "Users",
          color: "text-purple-600",
          bg: "bg-purple-50",
          border: "border-purple-200",
        },
        {
          label: "Active Bookings",
          value: activeBookings,
          change: `+${activeBookingsChange.toFixed(1)}%`,
          trending: activeBookingsChange >= 0 ? "up" : "down",
          icon: "Calendar",
          color: "text-indigo-600",
          bg: "bg-indigo-50",
          border: "border-indigo-200",
        },
        {
          label: "Pending Verifications",
          value: pendingManagerVerifications + pendingHostelVerifications,
          change: "Needs attention",
          trending: "neutral",
          icon: "UserCheck",
          color: "text-rose-600",
          bg: "bg-rose-50",
          border: "border-rose-200",
        },
      ],
      financialSummary: {
        totalReceived: Number(totalPaymentsReceived._sum.amount || 0),
        totalDisbursed: Number(totalDisbursed._sum.amount || 0),
        platformBalance: Number(pendingDisbursementsAmount._sum.amount || 0),
        platformCommission: Number(totalPlatformRevenue._sum.platformFee || 0),
        commissionRate: 2.0,
        thisMonthReceived: Number(thisMonthPayments._sum.amount || 0),
        thisMonthDisbursed: Number(thisMonthDisbursed._sum.amount || 0),
      },
      recentPayments: recentPayments.map((p) => ({
        id: p.paymentReference,
        bookerName: `${p.booking.booker.firstName} ${p.booking.booker.lastName}`,
        bookerRole: p.booking.booker.role,
        amount: Number(p.amount),
        method: p.method === "MTN_MOMO" ? "MTN MoMo" : p.method,
        hostelName: p.booking.hostel.name,
        managerName: `${p.booking.hostel.manager.firstName} ${p.booking.hostel.manager.lastName}`,
        status: "received",
        disbursed: p.disbursement?.status === "COMPLETED",
        date: p.paidAt,
      })),
      pendingDisbursements: formattedPendingDisbursements,
      pendingVerifications: formattedVerifications.slice(0, 5),
      escalatedComplaints: formattedEscalatedComplaints,
      counts: {
        pendingManagerVerifications,
        pendingHostelVerifications,
        pendingDisbursements: pendingDisbursementsAmount._count || 0,
        escalatedComplaints: escalatedComplaints.length,
      },
    },
  });
});

module.exports = {
  getAdminDashboardStats,
};
