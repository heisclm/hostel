const { prisma } = require("../config/db");
const asyncHandler = require("../middleware/asyncHandler");

const getDashboardStats = asyncHandler(async (req, res) => {
  const managerId = req.user.id;

  const hostels = await prisma.hostel.findMany({
    where: { managerId },
    include: {
      images: {
        where: { isPrimary: true },
        take: 1,
      },
      roomTypes: {
        include: {
          rooms: true,
        },
      },
      _count: {
        select: {
          bookings: true,
          complaints: true,
        },
      },
    },
  });

  const hostelIds = hostels.map((h) => h.id);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const currentMonthBookings = await prisma.booking.findMany({
    where: {
      hostelId: { in: hostelIds },
      payment: {
        status: "SUCCESSFUL",
      },
      createdAt: { gte: startOfMonth },
    },
    select: {
      baseAmount: true,
    },
  });

  const currentMonthRevenue = currentMonthBookings.reduce(
    (sum, booking) => sum + Number(booking.baseAmount),
    0,
  );

  const lastMonthBookings = await prisma.booking.findMany({
    where: {
      hostelId: { in: hostelIds },
      payment: {
        status: "SUCCESSFUL",
      },
      createdAt: {
        gte: startOfLastMonth,
        lte: endOfLastMonth,
      },
    },
    select: {
      baseAmount: true,
    },
  });

  const lastMonthRevenue = lastMonthBookings.reduce(
    (sum, booking) => sum + Number(booking.baseAmount),
    0,
  );

  const allSuccessfulBookings = await prisma.booking.findMany({
    where: {
      hostelId: { in: hostelIds },
      payment: {
        status: "SUCCESSFUL",
      },
    },
    select: {
      baseAmount: true,
      platformFee: true,
    },
  });

  const totalRevenue = allSuccessfulBookings.reduce(
    (sum, booking) => sum + Number(booking.baseAmount),
    0,
  );

  const totalPlatformFees = allSuccessfulBookings.reduce(
    (sum, booking) => sum + Number(booking.platformFee),
    0,
  );

  const activeBookings = await prisma.booking.count({
    where: {
      hostelId: { in: hostelIds },
      status: { in: ["CONFIRMED", "CHECKED_IN"] },
    },
  });

  const lastMonthActiveBookings = await prisma.booking.count({
    where: {
      hostelId: { in: hostelIds },
      status: { in: ["CONFIRMED", "CHECKED_IN"] },
      createdAt: {
        gte: startOfLastMonth,
        lte: endOfLastMonth,
      },
    },
  });

  const totalTenants = await prisma.booking.findMany({
    where: {
      hostelId: { in: hostelIds },
      status: { in: ["CONFIRMED", "CHECKED_IN"] },
    },
    select: { bookerId: true },
    distinct: ["bookerId"],
  });

  const lastMonthTenants = await prisma.booking.findMany({
    where: {
      hostelId: { in: hostelIds },
      status: { in: ["CONFIRMED", "CHECKED_IN"] },
      createdAt: {
        gte: startOfLastMonth,
        lte: endOfLastMonth,
      },
    },
    select: { bookerId: true },
    distinct: ["bookerId"],
  });

  let totalRooms = 0;
  let occupiedRooms = 0;

  hostels.forEach((hostel) => {
    hostel.roomTypes.forEach((rt) => {
      rt.rooms.forEach((room) => {
        totalRooms++;
        if (room.currentOccupants > 0) {
          occupiedRooms++;
        }
      });
    });
  });

  const occupancyRate =
    totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const revenueChange =
    lastMonthRevenue > 0
      ? Math.round(
          ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100,
        )
      : currentMonthRevenue > 0
        ? 100
        : 0;

  const recentBookings = await prisma.booking.findMany({
    where: {
      hostelId: { in: hostelIds },
    },
    include: {
      booker: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      hostel: {
        select: {
          name: true,
        },
      },
      roomType: {
        select: {
          occupancyType: true,
        },
      },
      room: {
        select: {
          roomNumber: true,
        },
      },
      payment: {
        select: {
          amount: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const pendingBookings = await prisma.booking.count({
    where: {
      hostelId: { in: hostelIds },
      status: "PENDING",
    },
  });

  const unresolvedComplaints = await prisma.complaint.count({
    where: {
      hostelId: { in: hostelIds },
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
  });

  const pendingPayments = await prisma.payment.count({
    where: {
      booking: {
        hostelId: { in: hostelIds },
      },
      status: "PENDING",
    },
  });

  const pendingBookingsList = await prisma.booking.findMany({
    where: {
      hostelId: { in: hostelIds },
      status: "PENDING",
    },
    include: {
      booker: {
        select: { firstName: true, lastName: true, role: true },
      },
      roomType: {
        select: { occupancyType: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const unresolvedComplaintsList = await prisma.complaint.findMany({
    where: {
      hostelId: { in: hostelIds },
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const pendingPaymentsList = await prisma.payment.findMany({
    where: {
      booking: {
        hostelId: { in: hostelIds },
      },
      status: "PENDING",
    },
    include: {
      booking: {
        include: {
          booker: {
            select: { firstName: true, lastName: true, role: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const formattedHostels = hostels.map((hostel) => {
    let hostelTotalRooms = 0;
    let hostelOccupiedRooms = 0;

    hostel.roomTypes.forEach((rt) => {
      rt.rooms.forEach((room) => {
        hostelTotalRooms++;
        if (room.currentOccupants > 0) {
          hostelOccupiedRooms++;
        }
      });
    });

    return {
      id: hostel.id,
      name: hostel.name,
      address: hostel.address,
      status: hostel.status,
      totalRooms: hostelTotalRooms,
      occupiedRooms: hostelOccupiedRooms,
      occupancyRate:
        hostelTotalRooms > 0
          ? Math.round((hostelOccupiedRooms / hostelTotalRooms) * 100)
          : 0,
      primaryImage: hostel.images[0]?.url || null,
      bookingsCount: hostel._count.bookings,
      complaintsCount: hostel._count.complaints,
    };
  });

  const pendingActions = [
    ...pendingBookingsList.map((b) => ({
      id: b.id,
      type: "booking",
      title: "New booking request",
      description: `${b.booker.firstName} ${b.booker.lastName} (${b.booker.role}) requested to book a ${formatOccupancyType(b.roomType.occupancyType)}`,
      time: getRelativeTime(b.createdAt),
      action: "Review",
      href: "/manager/bookings",
    })),
    ...unresolvedComplaintsList.map((c) => ({
      id: c.id,
      type: "complaint",
      title: "Unresolved complaint",
      description: c.subject || c.message?.substring(0, 50),
      time: getRelativeTime(c.createdAt),
      action: "Respond",
      href: "/manager/complaints",
    })),
    ...pendingPaymentsList.map((p) => ({
      id: p.id,
      type: "payment",
      title: "Payment pending confirmation",
      description: `GHS ${Number(p.amount).toFixed(2)} from ${p.booking.booker.firstName} ${p.booking.booker.lastName}`,
      time: getRelativeTime(p.createdAt),
      action: "Confirm",
      href: "/manager/payments",
    })),
  ].slice(0, 5);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalRevenue: {
          value: totalRevenue,
          change: revenueChange,
          changeType: revenueChange >= 0 ? "positive" : "negative",
        },
        activeBookings: {
          value: activeBookings,
          change: activeBookings - lastMonthActiveBookings,
          changeType:
            activeBookings >= lastMonthActiveBookings ? "positive" : "negative",
        },
        totalTenants: {
          value: totalTenants.length,
          change: totalTenants.length - lastMonthTenants.length,
          changeType:
            totalTenants.length >= lastMonthTenants.length
              ? "positive"
              : "negative",
        },
        occupancyRate: {
          value: occupancyRate,
          change: 0,
          changeType: "positive",
        },
      },
      financials: {
        totalRevenue: totalRevenue,
        totalPlatformFees: totalPlatformFees,
        grossPayments: totalRevenue + totalPlatformFees,
        currentMonthRevenue: currentMonthRevenue,
        lastMonthRevenue: lastMonthRevenue,
      },
      recentBookings: recentBookings.map((b) => ({
        id: b.id,
        bookerName: `${b.booker.firstName} ${b.booker.lastName}`,
        bookerEmail: b.booker.email,
        bookerRole: b.booker.role,
        occupantName: b.isBookingForSelf
          ? `${b.booker.firstName} ${b.booker.lastName}`
          : b.occupantName,
        hostelName: b.hostel.name,
        roomType: formatOccupancyType(b.roomType.occupancyType),
        roomNumber: b.room?.roomNumber || "Not assigned",
        amount: Number(b.baseAmount),
        status: b.status.toLowerCase(),
        date: b.createdAt,
        isBookingForSelf: b.isBookingForSelf,
      })),
      hostels: formattedHostels,
      pendingActions,
      pendingCounts: {
        bookings: pendingBookings,
        complaints: unresolvedComplaints,
        payments: pendingPayments,
      },
    },
  });
});

function getRelativeTime(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}

function formatOccupancyType(type) {
  const mapping = {
    IN_1: "Single Room",
    IN_2: "Double Room",
    IN_3: "Triple Room",
    IN_4: "Quad Room",
  };
  return mapping[type] || type;
}

const getManagerProfile = asyncHandler(async (req, res) => {
  const manager = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      createdAt: true,
      managerProfile: {
        select: {
          businessName: true,
        },
      },
    },
  });

  if (!manager) {
    res.status(404);
    throw new Error("Manager not found");
  }

  res.status(200).json({
    success: true,
    data: {
      id: manager.id,
      firstName: manager.firstName,
      lastName: manager.lastName,
      email: manager.email,
      phone: manager.phone,
      businessName: manager.managerProfile?.businessName || null,
      createdAt: manager.createdAt,
    },
  });
});

module.exports = {
  getDashboardStats,
  getManagerProfile,
};
