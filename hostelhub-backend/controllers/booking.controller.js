const { prisma } = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const ApiError = require("../utils/apiError");
const { requestToPay, checkPaymentStatus } = require("../config/momo");
const {
  notifyBookingCreated,
  notifyPaymentSuccess,
  notifyRoomAssigned,
  notifyBookingConfirmed,
  notifyCheckIn,
  notifyCheckOut,
  notifyBookingCancelled,
  notifyRoomReassigned,
} = require("../utils/notifications");

const generateBookingReference = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${timestamp}-${random}`;
};

const generatePaymentReference = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PAY-${timestamp}-${random}`;
};

const calculateRoomStatus = (currentOccupants, capacity) => {
  if (currentOccupants >= capacity) {
    return "FULLY_OCCUPIED";
  } else if (currentOccupants > 0) {
    return "PARTIALLY_OCCUPIED";
  } else {
    return "AVAILABLE";
  }
};

const updateRoomTypeStats = async (tx, roomTypeId) => {
  const rooms = await tx.room.findMany({
    where: { roomTypeId },
    select: {
      capacity: true,
      currentOccupants: true,
      status: true,
    },
  });

  const totalRooms = rooms.length;
  const totalSpots = rooms.reduce((sum, room) => sum + room.capacity, 0);
  const occupiedSpots = rooms.reduce(
    (sum, room) => sum + room.currentOccupants,
    0,
  );
  const availableSpots = totalSpots - occupiedSpots;

  const availableRooms = rooms.filter(
    (room) =>
      room.status === "AVAILABLE" || room.status === "PARTIALLY_OCCUPIED",
  ).length;

  await tx.roomType.update({
    where: { id: roomTypeId },
    data: {
      totalRooms,
      availableRooms,
      totalSpots,
      availableSpots,
    },
  });
};

function getCurrentAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (month >= 9) {
    return `${year}/${year + 1}`;
  }
  return `${year - 1}/${year}`;
}

const createBooking = async (req, res, next) => {
  try {
    const bookerId = req.user.id;
    const {
      hostelId,
      roomTypeId,
      paymentPlan,
      semesterPeriod,
      academicYear,
      notes,
      isBookingForSelf = true,
      occupantName,
      occupantPhone,
      occupantEmail,
    } = req.body;

    if (!["STUDENT", "GUEST"].includes(req.user.role)) {
      return next(
        new ApiError(403, "Only students and guests can create bookings."),
      );
    }

    if (!isBookingForSelf) {
      if (!occupantName) {
        return next(
          new ApiError(
            400,
            "Occupant name is required when booking for someone else.",
          ),
        );
      }
      if (!occupantPhone) {
        return next(
          new ApiError(
            400,
            "Occupant phone is required when booking for someone else.",
          ),
        );
      }
    }

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
      include: {
        roomTypes: {
          include: {
            rooms: {
              where: {
                status: { in: ["AVAILABLE", "PARTIALLY_OCCUPIED"] },
              },
            },
          },
        },
        paymentDetail: true,
      },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.status !== "APPROVED") {
      return next(
        new ApiError(
          400,
          "This hostel is not currently available for booking.",
        ),
      );
    }

    const roomType = hostel.roomTypes.find((rt) => rt.id === roomTypeId);
    if (!roomType) {
      return next(new ApiError(404, "Room type not found for this hostel."));
    }

    if (roomType.availableSpots <= 0) {
      return next(new ApiError(400, "No available spots for this room type."));
    }

    if (paymentPlan === "SEMESTER" && !hostel.allowSemesterPayment) {
      return next(
        new ApiError(
          400,
          "This hostel does not allow semester payments. Please choose full year payment.",
        ),
      );
    }

    if (paymentPlan === "SEMESTER" && !semesterPeriod) {
      return next(
        new ApiError(
          400,
          "Semester period is required for semester payment plan.",
        ),
      );
    }

    let baseAmount;
    if (hostel.pricingPeriod === "PER_SEMESTER") {
      baseAmount =
        paymentPlan === "FULL_YEAR"
          ? parseFloat(roomType.pricePerPerson) * 2
          : parseFloat(roomType.pricePerPerson);
    } else {
      baseAmount =
        paymentPlan === "SEMESTER"
          ? parseFloat(roomType.pricePerPerson) / 2
          : parseFloat(roomType.pricePerPerson);
    }

    const platformFeePercent = parseFloat(
      process.env.PLATFORM_FEE_PERCENT || "2",
    );
    const platformFee = parseFloat(
      ((baseAmount * platformFeePercent) / 100).toFixed(2),
    );
    const totalAmount = parseFloat((baseAmount + platformFee).toFixed(2));

    const existingBooking = await prisma.booking.findFirst({
      where: {
        bookerId,
        hostelId,
        status: { in: ["PENDING", "PAID", "CONFIRMED", "CHECKED_IN"] },
        ...(academicYear && { academicYear }),
      },
    });

    if (existingBooking) {
      return next(
        new ApiError(
          400,
          "You already have an active booking at this hostel. Please cancel the existing booking first.",
        ),
      );
    }

    const currentAcademicYear = academicYear || getCurrentAcademicYear();

    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          bookingReference: generateBookingReference(),
          bookerId,
          hostelId,
          roomTypeId,
          paymentPlan,
          semesterPeriod: paymentPlan === "SEMESTER" ? semesterPeriod : null,
          academicYear: currentAcademicYear,
          baseAmount,
          platformFee,
          platformFeePercent,
          totalAmount,
          notes,
          status: "PENDING",
          isBookingForSelf,
          occupantName: isBookingForSelf ? null : occupantName,
          occupantPhone: isBookingForSelf ? null : occupantPhone,
          occupantEmail: isBookingForSelf ? null : occupantEmail,
        },
        include: {
          hostel: {
            select: {
              id: true,
              name: true,
              address: true,
              managerId: true,
            },
          },
          roomType: {
            select: {
              id: true,
              occupancyType: true,
              pricePerPerson: true,
              availableSpots: true,
              totalSpots: true,
            },
          },
        },
      });

      return newBooking;
    });

    await notifyBookingCreated(
      booking,
      { id: bookerId },
      booking.hostel,
      booking.roomType,
    );

    res.status(201).json({
      success: true,
      message: "Booking created successfully. Please proceed to make payment.",
      data: {
        ...booking,
        priceBreakdown: {
          roomPrice: baseAmount,
          platformFee,
          platformFeePercent,
          totalPayable: totalAmount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const initiatePayment = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { phone } = req.body;
    const userId = req.user.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        hostel: {
          select: {
            id: true,
            name: true,
            managerId: true,
          },
        },
        payment: true,
        roomType: true,
      },
    });

    if (!booking) {
      return next(new ApiError(404, "Booking not found."));
    }

    if (booking.bookerId !== userId) {
      return next(
        new ApiError(403, "You are not authorized to pay for this booking."),
      );
    }

    if (booking.status !== "PENDING") {
      return next(
        new ApiError(
          400,
          `Cannot initiate payment. Booking status is "${booking.status}".`,
        ),
      );
    }

    if (booking.payment && booking.payment.status === "PENDING") {
      return next(
        new ApiError(
          400,
          "A payment is already pending for this booking. Please wait for it to complete or check the status.",
        ),
      );
    }

    if (booking.payment && booking.payment.status === "FAILED") {
      await prisma.payment.delete({
        where: { id: booking.payment.id },
      });
    }

    const paymentReference = generatePaymentReference();
    const amount = parseFloat(booking.totalAmount);

    const momoResponse = await requestToPay({
      amount,
      phone,
      externalId: paymentReference,
      payerMessage: `Payment for ${booking.hostel.name} - ${booking.bookingReference}`,
      payeeNote: `Booking ${booking.bookingReference} - ${booking.roomType.occupancyType}`,
    });

    const payment = await prisma.payment.create({
      data: {
        paymentReference,
        bookingId: booking.id,
        amount,
        method: "MTN_MOMO",
        status: "PENDING",
        momoRequestId: momoResponse.referenceId,
        payerPhone: phone,
        payerMessage: `Payment for ${booking.hostel.name}`,
      },
    });

    res.status(200).json({
      success: true,
      message:
        "Payment initiated. Please approve the payment prompt on your phone.",
      data: {
        paymentId: payment.id,
        paymentReference: payment.paymentReference,
        momoReferenceId: momoResponse.referenceId,
        amount,
        priceBreakdown: {
          roomPrice: parseFloat(booking.baseAmount),
          platformFee: parseFloat(booking.platformFee),
          total: amount,
        },
        status: "PENDING",
        bookingReference: booking.bookingReference,
      },
    });
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        hostel: {
          select: {
            id: true,
            name: true,
            managerId: true,
            paymentDetail: true,
          },
        },
        roomType: true,
        booker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!booking) {
      return next(new ApiError(404, "Booking not found."));
    }

    if (booking.bookerId !== userId && req.user.role !== "ADMIN") {
      return next(
        new ApiError(403, "You are not authorized to check this payment."),
      );
    }

    if (!booking.payment) {
      return next(new ApiError(404, "No payment found for this booking."));
    }

    if (booking.payment.status === "SUCCESSFUL") {
      return res.status(200).json({
        success: true,
        message: "Payment already confirmed.",
        data: {
          paymentStatus: "SUCCESSFUL",
          bookingStatus: booking.status,
          paymentReference: booking.payment.paymentReference,
        },
      });
    }

    if (booking.payment.status === "FAILED") {
      return res.status(200).json({
        success: true,
        message: "Payment failed. You can retry.",
        data: {
          paymentStatus: "FAILED",
          bookingStatus: booking.status,
          failureReason: booking.payment.failureReason,
        },
      });
    }

    const momoStatus = await checkPaymentStatus(booking.payment.momoRequestId);

    if (momoStatus.status === "SUCCESSFUL") {
      const result = await prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: { id: booking.payment.id },
          data: {
            status: "SUCCESSFUL",
            momoTransactionId: momoStatus.financialTransactionId || null,
            paidAt: new Date(),
            providerResponse: momoStatus,
          },
        });

        const updatedBooking = await tx.booking.update({
          where: { id: booking.id },
          data: { status: "PAID" },
        });

        if (booking.hostel.paymentDetail) {
          await tx.disbursement.create({
            data: {
              disbursementReference: `DSB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
              paymentId: booking.payment.id,
              hostelId: booking.hostel.id,
              managerId: booking.hostel.managerId,
              amount: parseFloat(booking.baseAmount),
              platformFee: parseFloat(booking.platformFee),
              recipientPhone: booking.hostel.paymentDetail.momoNumber,
              recipientName: booking.hostel.paymentDetail.accountName,
              status: "PENDING",
            },
          });
        }

        return { updatedPayment, updatedBooking };
      });

      await notifyPaymentSuccess(booking, result.updatedPayment);

      return res.status(200).json({
        success: true,
        message:
          "Payment confirmed successfully! The hostel manager will assign you a room shortly.",
        data: {
          paymentStatus: "SUCCESSFUL",
          bookingStatus: "PAID",
          paymentReference: booking.payment.paymentReference,
          bookingReference: booking.bookingReference,
          amount: booking.totalAmount,
          transactionId: momoStatus.financialTransactionId || null,
        },
      });
    } else if (momoStatus.status === "FAILED") {
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: "FAILED",
          failedAt: new Date(),
          failureReason: momoStatus.reason?.message || "Payment failed",
          providerResponse: momoStatus,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Payment failed. You can try again.",
        data: {
          paymentStatus: "FAILED",
          bookingStatus: booking.status,
          failureReason: momoStatus.reason?.message || "Payment failed",
        },
      });
    } else {
      return res.status(200).json({
        success: true,
        message:
          "Payment is still being processed. Please check again in a moment.",
        data: {
          paymentStatus: "PENDING",
          bookingStatus: booking.status,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

const confirmBooking = async (req, res, next) => {
  try {
    const { hostelId, bookingId } = req.params;
    const { roomNumber } = req.body;
    const managerId = req.user.id;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.managerId !== managerId) {
      return next(
        new ApiError(403, "You are not authorized to manage this hostel."),
      );
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, hostelId },
      include: {
        booker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        roomType: true,
      },
    });

    if (!booking) {
      return next(new ApiError(404, "Booking not found."));
    }

    if (booking.status !== "PAID") {
      return next(
        new ApiError(
          400,
          `Cannot confirm booking. Current status is "${booking.status}". Only paid bookings can be confirmed.`,
        ),
      );
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
      include: {
        roomType: true,
        booker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    await notifyBookingConfirmed(booking, hostel, managerId, roomNumber);

    res.status(200).json({
      success: true,
      message: "Booking confirmed successfully.",
      data: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookerId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { bookerId };
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          hostel: {
            select: {
              id: true,
              name: true,
              slug: true,
              address: true,
              images: {
                where: { isPrimary: true },
                take: 1,
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
          payment: {
            select: {
              id: true,
              paymentReference: true,
              status: true,
              amount: true,
              method: true,
              paidAt: true,
            },
          },
          review: {
            select: {
              id: true,
              rating: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.booking.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: bookings,
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

const getBookingDetail = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        hostel: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            managerId: true,
            images: true,
            paymentDetail: {
              select: {
                accountName: true,
                momoNumber: true,
                momoProvider: true,
              },
            },
          },
        },
        roomType: true,
        room: {
          select: {
            id: true,
            roomNumber: true,
            floor: true,
            capacity: true,
            currentOccupants: true,
            status: true,
            notes: true,
          },
        },
        payment: true,
        booker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            studentProfile: true,
            guestProfile: true,
          },
        },
        review: true,
      },
    });

    if (!booking) {
      return next(new ApiError(404, "Booking not found."));
    }

    const isBooker = booking.bookerId === userId;
    const isManager = booking.hostel.managerId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isBooker && !isManager && !isAdmin) {
      return next(
        new ApiError(403, "You are not authorized to view this booking."),
      );
    }

    if (isManager && booking.payment) {
      delete booking.payment.providerResponse;
      delete booking.payment.momoRequestId;
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        hostel: {
          select: {
            id: true,
            name: true,
            managerId: true,
          },
        },
        payment: true,
        room: true,
        roomType: true,
      },
    });

    if (!booking) {
      return next(new ApiError(404, "Booking not found."));
    }

    const isBooker = booking.bookerId === userId;
    const isManager = booking.hostel.managerId === userId;
    const isAdmin = req.user.role === "ADMIN";

    if (!isBooker && !isManager && !isAdmin) {
      return next(
        new ApiError(403, "You are not authorized to cancel this booking."),
      );
    }

    const cancellableStatuses = ["PENDING", "PAID", "CONFIRMED"];
    if (!cancellableStatuses.includes(booking.status)) {
      return next(
        new ApiError(
          400,
          `Cannot cancel booking with status "${booking.status}". Only pending, paid, or confirmed bookings can be cancelled.`,
        ),
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason:
            reason ||
            `Cancelled by ${isBooker ? "booker" : isManager ? "manager" : "admin"}`,
        },
      });

      if (
        booking.roomId &&
        ["CONFIRMED", "CHECKED_IN"].includes(booking.status)
      ) {
        const newOccupants = Math.max(0, booking.room.currentOccupants - 1);
        await tx.room.update({
          where: { id: booking.roomId },
          data: {
            currentOccupants: newOccupants,
            status: calculateRoomStatus(newOccupants, booking.room.capacity),
          },
        });

        await updateRoomTypeStats(tx, booking.roomTypeId);
      }

      if (
        booking.payment &&
        booking.payment.status === "SUCCESSFUL" &&
        ["PAID", "CONFIRMED"].includes(booking.status)
      ) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { status: "REFUNDED" },
        });

        await tx.disbursement.updateMany({
          where: {
            paymentId: booking.payment.id,
            status: "PENDING",
          },
          data: {
            status: "FAILED",
            failureReason: "Booking cancelled",
          },
        });
      }

      return updatedBooking;
    });

    const cancelledBy = isBooker ? "booker" : isManager ? "manager" : "admin";
    await notifyBookingCancelled(
      booking,
      booking.hostel,
      cancelledBy,
      reason,
      userId,
    );

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const assignRoomToStudent = async (req, res, next) => {
  try {
    const { hostelId, bookingId } = req.params;
    const { roomId, bedNumber } = req.body;
    const managerId = req.user.id;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.managerId !== managerId) {
      return next(
        new ApiError(403, "You are not authorized to manage this hostel."),
      );
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, hostelId },
      include: {
        booker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        roomType: true,
      },
    });

    if (!booking) {
      return next(new ApiError(404, "Booking not found."));
    }

    if (booking.status !== "PAID") {
      return next(
        new ApiError(
          400,
          `Cannot assign room. Booking status is "${booking.status}". Only paid bookings can be assigned rooms.`,
        ),
      );
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        bookings: {
          where: {
            status: { in: ["CONFIRMED", "CHECKED_IN"] },
          },
          select: { bedNumber: true },
        },
      },
    });

    if (!room) {
      return next(new ApiError(404, "Room not found."));
    }

    if (room.roomTypeId !== booking.roomTypeId) {
      return next(
        new ApiError(400, "Room does not match the booked room type."),
      );
    }

    if (room.status === "FULLY_OCCUPIED") {
      return next(new ApiError(400, "This room is already full."));
    }

    if (room.status === "UNDER_MAINTENANCE" || room.status === "UNAVAILABLE") {
      return next(
        new ApiError(
          400,
          `This room is ${room.status.toLowerCase().replace("_", " ")}.`,
        ),
      );
    }

    if (room.currentOccupants >= room.capacity) {
      return next(new ApiError(400, "This room is already at full capacity."));
    }

    let assignedBedNumber = bedNumber;
    if (bedNumber) {
      if (bedNumber < 1 || bedNumber > room.capacity) {
        return next(
          new ApiError(
            400,
            `Bed number must be between 1 and ${room.capacity}.`,
          ),
        );
      }
      const occupiedBeds = room.bookings
        .map((b) => b.bedNumber)
        .filter(Boolean);
      if (occupiedBeds.includes(bedNumber)) {
        return next(new ApiError(400, `Bed ${bedNumber} is already occupied.`));
      }
    } else {
      const occupiedBeds = room.bookings
        .map((b) => b.bedNumber)
        .filter(Boolean);
      for (let i = 1; i <= room.capacity; i++) {
        if (!occupiedBeds.includes(i)) {
          assignedBedNumber = i;
          break;
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          roomId,
          bedNumber: assignedBedNumber,
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
        include: {
          room: true,
          roomType: true,
          booker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      const newOccupants = room.currentOccupants + 1;
      const newStatus = calculateRoomStatus(newOccupants, room.capacity);

      await tx.room.update({
        where: { id: roomId },
        data: {
          currentOccupants: newOccupants,
          status: newStatus,
        },
      });

      await updateRoomTypeStats(tx, booking.roomTypeId);

      return updatedBooking;
    });

    await notifyRoomAssigned(
      booking,
      room,
      hostel,
      managerId,
      assignedBedNumber,
    );

    res.status(200).json({
      success: true,
      message: `Room ${room.roomNumber}${assignedBedNumber ? `, Bed ${assignedBedNumber}` : ""} assigned successfully.`,
      data: result,
    });
  } catch (error) {
    console.error("Assign room error:", error);
    next(error);
  }
};

const reassignRoom = async (req, res, next) => {
  try {
    const { hostelId, bookingId } = req.params;
    const { newRoomId, newBedNumber, reason } = req.body;
    const managerId = req.user.id;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.managerId !== managerId) {
      return next(
        new ApiError(403, "You are not authorized to manage this hostel."),
      );
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, hostelId },
      include: {
        room: true,
        booker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        roomType: true,
      },
    });

    if (!booking) {
      return next(new ApiError(404, "Booking not found."));
    }

    if (!["CONFIRMED", "CHECKED_IN"].includes(booking.status)) {
      return next(
        new ApiError(
          400,
          "Can only reassign room for confirmed or checked-in bookings.",
        ),
      );
    }

    if (!booking.roomId) {
      return next(
        new ApiError(400, "No room assigned. Use assign room instead."),
      );
    }

    const newRoom = await prisma.room.findUnique({
      where: { id: newRoomId },
      include: {
        bookings: {
          where: {
            status: { in: ["CONFIRMED", "CHECKED_IN"] },
          },
          select: { bedNumber: true },
        },
      },
    });

    if (!newRoom) {
      return next(new ApiError(404, "New room not found."));
    }

    if (newRoom.roomTypeId !== booking.roomTypeId) {
      return next(new ApiError(400, "New room must be of the same room type."));
    }

    if (newRoom.currentOccupants >= newRoom.capacity) {
      return next(new ApiError(400, "New room is at full capacity."));
    }

    let assignedBedNumber = newBedNumber;
    if (!assignedBedNumber) {
      const occupiedBeds = newRoom.bookings
        .map((b) => b.bedNumber)
        .filter(Boolean);
      for (let i = 1; i <= newRoom.capacity; i++) {
        if (!occupiedBeds.includes(i)) {
          assignedBedNumber = i;
          break;
        }
      }
    }

    const oldRoom = booking.room;

    const result = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          roomId: newRoomId,
          bedNumber: assignedBedNumber,
        },
        include: {
          room: true,
          booker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      const oldOccupants = Math.max(0, oldRoom.currentOccupants - 1);
      await tx.room.update({
        where: { id: oldRoom.id },
        data: {
          currentOccupants: oldOccupants,
          status: calculateRoomStatus(oldOccupants, oldRoom.capacity),
        },
      });

      const newOccupants = newRoom.currentOccupants + 1;
      await tx.room.update({
        where: { id: newRoomId },
        data: {
          currentOccupants: newOccupants,
          status: calculateRoomStatus(newOccupants, newRoom.capacity),
        },
      });

      await updateRoomTypeStats(tx, booking.roomTypeId);

      return updatedBooking;
    });

    await notifyRoomReassigned(
      booking,
      oldRoom,
      newRoom,
      hostel,
      managerId,
      assignedBedNumber,
      reason,
    );

    res.status(200).json({
      success: true,
      message: `Reassigned from Room ${oldRoom.roomNumber} to Room ${newRoom.roomNumber}.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const checkInStudent = async (req, res, next) => {
  try {
    const { hostelId, bookingId } = req.params;
    const managerId = req.user.id;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.managerId !== managerId) {
      return next(
        new ApiError(403, "You are not authorized to manage this hostel."),
      );
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, hostelId },
      include: {
        room: true,
        booker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!booking) {
      return next(new ApiError(404, "Booking not found."));
    }

    if (booking.status !== "CONFIRMED") {
      return next(
        new ApiError(
          400,
          `Cannot check in. Booking status is "${booking.status}". Only confirmed bookings can be checked in.`,
        ),
      );
    }

    if (!booking.roomId) {
      return next(
        new ApiError(400, "Please assign a room before checking in."),
      );
    }

    const now = new Date();
    let expectedCheckOutDate = new Date(now);

    if (booking.paymentPlan === "FULL_YEAR") {
      expectedCheckOutDate.setMonth(expectedCheckOutDate.getMonth() + 12);
    } else {
      expectedCheckOutDate.setMonth(expectedCheckOutDate.getMonth() + 6);
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CHECKED_IN",
        checkInDate: now,
        expectedCheckOutDate,
      },
      include: {
        room: true,
        roomType: true,
        booker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    await notifyCheckIn(booking, hostel, booking.room, managerId);

    res.status(200).json({
      success: true,
      message: "Checked in successfully.",
      data: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

const checkOutStudent = async (req, res, next) => {
  try {
    const { hostelId, bookingId } = req.params;
    const managerId = req.user.id;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.managerId !== managerId) {
      return next(
        new ApiError(403, "You are not authorized to manage this hostel."),
      );
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, hostelId },
      include: {
        room: true,
        roomType: true,
        booker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!booking) {
      return next(new ApiError(404, "Booking not found."));
    }

    if (booking.status !== "CHECKED_IN") {
      return next(
        new ApiError(
          400,
          `Cannot check out. Booking status is "${booking.status}". Only checked-in bookings can be checked out.`,
        ),
      );
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CHECKED_OUT",
          checkOutDate: new Date(),
        },
        include: {
          room: true,
          roomType: true,
          booker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (booking.room) {
        const newOccupants = Math.max(0, booking.room.currentOccupants - 1);
        await tx.room.update({
          where: { id: booking.room.id },
          data: {
            currentOccupants: newOccupants,
            status: calculateRoomStatus(newOccupants, booking.room.capacity),
          },
        });

        await updateRoomTypeStats(tx, booking.roomTypeId);
      }

      if (hostel.status === "UNAVAILABLE") {
        await tx.hostel.update({
          where: { id: hostelId },
          data: { status: "APPROVED" },
        });
      }

      return updated;
    });

    await notifyCheckOut(booking, hostel, managerId);

    res.status(200).json({
      success: true,
      message: "Checked out successfully. Room spot is now available.",
      data: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

const getHostelBookings = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const managerId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.managerId !== managerId && req.user.role !== "ADMIN") {
      return next(
        new ApiError(403, "You are not authorized to view these bookings."),
      );
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { hostelId };
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          booker: {
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
                  beneficiaryPhone: true,
                  staffId: true,
                  department: true,
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
          payment: {
            select: {
              id: true,
              paymentReference: true,
              status: true,
              amount: true,
              paidAt: true,
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
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.booking.count({ where }),
    ]);

    const formattedBookings = bookings.map((booking) => ({
      ...booking,
      occupantInfo: booking.isBookingForSelf
        ? {
            name: `${booking.booker.firstName} ${booking.booker.lastName}`,
            phone: booking.booker.phone,
            email: booking.booker.email,
          }
        : {
            name: booking.occupantName,
            phone: booking.occupantPhone,
            email: booking.occupantEmail,
          },
    }));

    res.status(200).json({
      success: true,
      data: formattedBookings,
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

const adminGetAllBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search, hostelId } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status) where.status = status;
    if (hostelId) where.hostelId = hostelId;

    if (search) {
      where.OR = [
        {
          bookingReference: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          booker: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
        {
          hostel: {
            name: { contains: search, mode: "insensitive" },
          },
        },
        {
          occupantName: { contains: search, mode: "insensitive" },
        },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          booker: {
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
              managerId: true,
              manager: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
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
          payment: {
            select: {
              id: true,
              paymentReference: true,
              status: true,
              amount: true,
              paidAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.booking.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: bookings,
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

const adminGetBookingStats = async (req, res, next) => {
  try {
    const [statusStats, revenueResult, recentBookings] = await Promise.all([
      prisma.booking.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.payment.aggregate({
        where: { status: "SUCCESSFUL" },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.booking.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          booker: {
            select: {
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          hostel: {
            select: { name: true },
          },
        },
      }),
    ]);

    const statusMap = statusStats.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {});

    const totalBookings = Object.values(statusMap).reduce(
      (sum, count) => sum + count,
      0,
    );

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        statusBreakdown: {
          pending: statusMap.PENDING || 0,
          paid: statusMap.PAID || 0,
          confirmed: statusMap.CONFIRMED || 0,
          cancelled: statusMap.CANCELLED || 0,
          expired: statusMap.EXPIRED || 0,
          checkedIn: statusMap.CHECKED_IN || 0,
          checkedOut: statusMap.CHECKED_OUT || 0,
        },
        revenue: {
          totalCollected: revenueResult._sum.amount || 0,
          totalPayments: revenueResult._count.id || 0,
        },
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getManagerTenants = async (req, res, next) => {
  try {
    const managerId = req.user.id;
    const {
      page = 1,
      limit = 20,
      status,
      search,
      hostelId,
      sortBy = "checkInDate",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const managerHostels = await prisma.hostel.findMany({
      where: { managerId },
      select: { id: true, name: true },
    });

    if (managerHostels.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No hostels found for this manager.",
        data: {
          tenants: [],
          pagination: {
            total: 0,
            page: pageNum,
            limit: limitNum,
            totalPages: 0,
          },
          stats: {
            active: 0,
            checkedOut: 0,
            pending: 0,
            overdue: 0,
            totalCollected: 0,
            totalOutstanding: 0,
          },
          hostels: [],
        },
      });
    }

    const hostelIds = managerHostels.map((h) => h.id);

    const where = {
      hostelId:
        hostelId && hostelIds.includes(hostelId) ? hostelId : { in: hostelIds },
      status: status
        ? status
        : { in: ["CHECKED_IN", "CHECKED_OUT", "CONFIRMED"] },
    };

    if (search) {
      where.OR = [
        { booker: { firstName: { contains: search, mode: "insensitive" } } },
        { booker: { lastName: { contains: search, mode: "insensitive" } } },
        { booker: { email: { contains: search, mode: "insensitive" } } },
        { occupantName: { contains: search, mode: "insensitive" } },
        { room: { roomNumber: { contains: search, mode: "insensitive" } } },
      ];
    }

    const orderByMap = {
      checkInDate: { checkInDate: sortOrder },
      name: { booker: { firstName: sortOrder } },
      roomNumber: { room: { roomNumber: sortOrder } },
      createdAt: { createdAt: sortOrder },
    };

    const orderBy = orderByMap[sortBy] || { createdAt: "desc" };

    const formatOccupancyType = (type) => {
      const typeMap = {
        IN_1: "Single Room",
        IN_2: "2 in a Room",
        IN_3: "3 in a Room",
        IN_4: "4 in a Room",
      };
      return typeMap[type] || type;
    };

    const [bookings, total, statsData] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          booker: {
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
                  academicYear: true,
                  emergencyContact: true,
                },
              },
              guestProfile: {
                select: {
                  guestType: true,
                  beneficiaryName: true,
                  beneficiaryPhone: true,
                  beneficiaryEmail: true,
                  relationshipType: true,
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
            },
          },
          roomType: {
            select: {
              id: true,
              occupancyType: true,
              pricePerPerson: true,
              description: true,
            },
          },
          room: {
            select: {
              id: true,
              roomNumber: true,
              floor: true,
              capacity: true,
              currentOccupants: true,
              status: true,
            },
          },
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              paidAt: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
      prisma.booking.groupBy({
        by: ["status"],
        where: {
          hostelId: { in: hostelIds },
          status: { in: ["CHECKED_IN", "CHECKED_OUT", "CONFIRMED"] },
        },
        _count: { id: true },
      }),
    ]);

    const allBookingsForStats = await prisma.booking.findMany({
      where: {
        hostelId: { in: hostelIds },
        status: { in: ["CHECKED_IN", "CHECKED_OUT", "CONFIRMED"] },
      },
      select: {
        baseAmount: true,
        totalAmount: true,
        platformFee: true,
        status: true,
        payment: {
          select: {
            amount: true,
            status: true,
          },
        },
      },
    });

    const totalCollected = allBookingsForStats.reduce((sum, b) => {
      if (b.payment && b.payment.status === "SUCCESSFUL") {
        const managerAmount =
          Number(b.payment.amount) - Number(b.platformFee || 0);
        return sum + managerAmount;
      }
      return sum;
    }, 0);

    const totalOutstanding = allBookingsForStats.reduce((sum, b) => {
      const isPaid = b.payment && b.payment.status === "SUCCESSFUL";
      if (!isPaid) {
        return sum + Number(b.baseAmount || 0);
      }
      return sum;
    }, 0);

    const tenantsWithOverdue = allBookingsForStats.filter((b) => {
      const isPaid = b.payment && b.payment.status === "SUCCESSFUL";
      return b.status === "CHECKED_IN" && !isPaid;
    }).length;

    const tenants = bookings.map((booking) => {
      const payment = booking.payment;
      const isSuccessful = payment && payment.status === "SUCCESSFUL";

      const baseAmount = Number(booking.baseAmount || 0);
      const platformFee = Number(booking.platformFee || 0);
      const totalPaid = isSuccessful ? Number(payment.amount) - platformFee : 0;
      const balance = baseAmount - totalPaid;

      let tenantStatus = "active";
      if (booking.status === "CHECKED_OUT") {
        tenantStatus = "checked_out";
      } else if (booking.status === "CONFIRMED") {
        tenantStatus = "pending";
      } else if (booking.status === "CHECKED_IN" && balance > 0) {
        tenantStatus = "overdue";
      }

      const studentProfile = booking.booker.studentProfile;
      const guestProfile = booking.booker.guestProfile;
      const isStudent = booking.booker.role === "STUDENT";
      const isGuest = booking.booker.role === "GUEST";

      const parseEmergencyContact = (contact) => {
        if (!contact) {
          return { name: null, phone: null, relationship: null };
        }
        
        if (typeof contact === 'object') {
          return {
            name: contact.name || null,
            phone: contact.phone || null,
            relationship: contact.relationship || null,
          };
        }
        
        try {
          const parsed = JSON.parse(contact);
          return {
            name: parsed.name || null,
            phone: parsed.phone || null,
            relationship: parsed.relationship || null,
          };
        } catch (e) {
          return { name: contact, phone: null, relationship: null };
        }
      };

      let emergencyContact = { name: null, phone: null, relationship: null };
      
      if (isStudent && studentProfile) {
        emergencyContact = parseEmergencyContact(studentProfile.emergencyContact);
      } else if (isGuest && guestProfile) {
        emergencyContact = {
          name: guestProfile.beneficiaryName || null,
          phone: guestProfile.beneficiaryPhone || null,
          relationship: guestProfile.relationshipType || null,
        };
      }

      return {
        id: booking.id,
        bookingId: booking.id,
        booker: {
          id: booking.booker.id,
          name: `${booking.booker.firstName} ${booking.booker.lastName}`,
          firstName: booking.booker.firstName,
          lastName: booking.booker.lastName,
          email: booking.booker.email,
          phone: booking.booker.phone || null,
          avatar: null, 

          bookerId: isStudent && studentProfile ? studentProfile.studentId : null,
          university: isStudent ? "Catholic University of Ghana" : null,
          programme: isStudent && studentProfile ? studentProfile.programme : null,
          level: isStudent && studentProfile 
            ? (studentProfile.level ? `Level ${studentProfile.level}` : null) 
            : null,
          
          emergencyContact,
        },
        hostel: {
          id: booking.hostel.id,
          name: booking.hostel.name,
        },
        roomType: booking.roomType
          ? {
              id: booking.roomType.id,
              name: formatOccupancyType(booking.roomType.occupancyType),
              type: booking.roomType.occupancyType,
            }
          : null,
        roomNumber: booking.room?.roomNumber || null,
        checkIn: booking.checkInDate,
        checkOut: booking.expectedCheckOutDate || booking.checkOutDate,
        actualCheckOut: booking.checkOutDate || null,
        status: tenantStatus,
        paymentPlan: booking.paymentPlan,
        totalDue: baseAmount,
        totalPaid,
        balance: Math.max(balance, 0),
        lastPaymentDate: isSuccessful ? payment.paidAt : null,
        createdAt: booking.createdAt,
      };
    });

    const statusCounts = {};
    statsData.forEach((s) => {
      statusCounts[s.status] = s._count.id;
    });

    res.status(200).json({
      success: true,
      message: "Tenants retrieved successfully.",
      data: {
        tenants,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
        stats: {
          active: statusCounts["CHECKED_IN"] || 0,
          checkedOut: statusCounts["CHECKED_OUT"] || 0,
          pending: statusCounts["CONFIRMED"] || 0,
          overdue: tenantsWithOverdue,
          totalCollected: Math.max(totalCollected, 0),
          totalOutstanding: Math.max(totalOutstanding, 0),
        },
        hostels: managerHostels,
      },
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createBooking,
  initiatePayment,
  verifyPayment,
  assignRoomToStudent,
  reassignRoom,
  getMyBookings,
  getBookingDetail,
  cancelBooking,
  checkInStudent,
  checkOutStudent,
  getHostelBookings,
  adminGetAllBookings,
  adminGetBookingStats,
  getManagerTenants,
  confirmBooking,
};
