const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../config/cloudinary");
const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const fs = require("fs");
const {
  notifyHostelApproval,
  notifyHostelSuspension,
} = require("../utils/notifications");

const getOccupancyNumber = (occupancyType) => {
  const map = {
    IN_1: 1,
    IN_2: 2,
    IN_3: 3,
    IN_4: 4,
  };
  return map[occupancyType] || 1;
};

const calculateRoomStatus = (currentOccupants, capacity) => {
  if (currentOccupants === 0) return "AVAILABLE";
  if (currentOccupants >= capacity) return "FULLY_OCCUPIED";
  return "PARTIALLY_OCCUPIED";
};

const calculateRoomTypeStats = (rooms) => {
  const stats = {
    totalRooms: rooms.length,
    availableRooms: 0,
    totalSpots: 0,
    availableSpots: 0,
  };

  rooms.forEach((room) => {
    stats.totalSpots += room.capacity;
    stats.availableSpots += room.capacity - room.currentOccupants;

    if (room.currentOccupants < room.capacity) {
      stats.availableRooms++;
    }
  });

  return stats;
};

const generateSlug = async (name) => {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  const existingHostel = await prisma.hostel.findUnique({
    where: { slug },
  });

  if (existingHostel) {
    const suffix = Date.now().toString(36).slice(-4);
    slug = `${slug}-${suffix}`;
  }

  return slug;
};

const updateRoomTypeStats = async (tx, roomTypeId) => {
  const rooms = await tx.room.findMany({
    where: {
      roomTypeId,
      status: { notIn: ["UNDER_MAINTENANCE", "UNAVAILABLE"] },
    },
  });

  const stats = calculateRoomTypeStats(rooms);

  await tx.roomType.update({
    where: { id: roomTypeId },
    data: {
      totalRooms: stats.totalRooms,
      availableRooms: stats.availableRooms,
      totalSpots: stats.totalSpots,
      availableSpots: stats.availableSpots,
    },
  });

  return stats;
};

const checkAndUpdateHostelAvailability = async (hostelId) => {
  const roomTypes = await prisma.roomType.findMany({
    where: { hostelId },
  });

  if (roomTypes.length === 0) return false;

  const totalAvailable = roomTypes.reduce(
    (sum, rt) => sum + rt.availableSpots,
    0,
  );

  if (totalAvailable === 0) {
    await prisma.hostel.update({
      where: { id: hostelId },
      data: { status: "UNAVAILABLE" },
    });
    return true;
  }

  return false;
};

const createHostel = async (req, res, next) => {
  try {
    const managerId = req.user.id;

    if (
      !req.user.managerProfile ||
      req.user.managerProfile.verificationStatus !== "VERIFIED"
    ) {
      return next(
        new ApiError(
          403,
          "Your manager profile must be verified before creating a hostel.",
        ),
      );
    }

    const {
      name,
      description,
      address,
      distanceToCampus,
      totalRooms,
      pricingPeriod,
      allowSemesterPayment,
      facilities,
      roomTypes,
      paymentDetail,
    } = req.body;

    const slug = await generateSlug(name);

    const hostel = await prisma.$transaction(async (tx) => {
      const newHostel = await tx.hostel.create({
        data: {
          name,
          slug,
          description,
          address,
          distanceToCampus: distanceToCampus
            ? parseFloat(distanceToCampus)
            : null,
          totalRooms: parseInt(totalRooms),
          pricingPeriod,
          allowSemesterPayment:
            allowSemesterPayment !== undefined ? allowSemesterPayment : true,
          managerId,
          status: "PENDING",
        },
      });
      if (facilities && facilities.length > 0) {
        await tx.hostelFacility.createMany({
          data: facilities.map((facility) => ({
            hostelId: newHostel.id,
            name: typeof facility === "string" ? facility : facility.name,
          })),
        });
      }

      if (roomTypes && roomTypes.length > 0) {
        for (const rt of roomTypes) {
          const capacity = getOccupancyNumber(rt.occupancyType);
          const roomCount = parseInt(rt.totalRooms);
          const totalSpots = roomCount * capacity;

          const newRoomType = await tx.roomType.create({
            data: {
              hostelId: newHostel.id,
              occupancyType: rt.occupancyType,
              pricePerPerson: parseFloat(rt.pricePerPerson),
              totalRooms: roomCount,
              availableRooms: roomCount,
              totalSpots: totalSpots,
              availableSpots: totalSpots,
              amenities: rt.amenities || [],
              description: rt.description || null,
            },
          });

          if (rt.rooms && rt.rooms.length > 0) {
            await tx.room.createMany({
              data: rt.rooms.map((room) => ({
                roomTypeId: newRoomType.id,
                roomNumber: room.roomNumber,
                floor: room.floor || 1,
                capacity: capacity,
                currentOccupants: 0,
                status: "AVAILABLE",
                notes: room.notes || null,
              })),
            });
          } else {
            const roomsData = [];
            for (let i = 1; i <= roomCount; i++) {
              roomsData.push({
                roomTypeId: newRoomType.id,
                roomNumber: `${rt.occupancyType.replace("IN_", "")}${String(i).padStart(2, "0")}`,
                floor: 1,
                capacity: capacity,
                currentOccupants: 0,
                status: "AVAILABLE",
              });
            }
            await tx.room.createMany({ data: roomsData });
          }
        }
      }

      if (paymentDetail) {
        await tx.hostelPaymentDetail.create({
          data: {
            hostelId: newHostel.id,
            accountName: paymentDetail.accountName,
            momoNumber: paymentDetail.momoNumber,
            momoProvider: paymentDetail.momoProvider || "MTN",
            alternatePhone: paymentDetail.alternatePhone || null,
            notes: paymentDetail.notes || null,
          },
        });
      }

      return tx.hostel.findUnique({
        where: { id: newHostel.id },
        include: {
          facilities: true,
          paymentDetail: true,
          images: true,
          roomTypes: {
            include: {
              rooms: {
                orderBy: { roomNumber: "asc" },
              },
            },
          },
        },
      });
    });

    res.status(201).json({
      success: true,
      message:
        "Hostel created successfully. It will be visible to students once approved by an admin.",
      data: hostel,
    });
  } catch (error) {
    next(error);
  }
};

const updateHostel = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const managerId = req.user.id;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.managerId !== managerId) {
      return next(
        new ApiError(403, "You are not authorized to update this hostel."),
      );
    }

    const {
      name,
      description,
      address,
      distanceToCampus,
      totalRooms,
      pricingPeriod,
      allowSemesterPayment,
    } = req.body;

    const updateData = {};

    if (name) {
      updateData.name = name;

      if (name !== hostel.name) {
        updateData.slug = await generateSlug(name);
      }
    }
    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (distanceToCampus !== undefined)
      updateData.distanceToCampus = parseFloat(distanceToCampus);
    if (totalRooms !== undefined) updateData.totalRooms = parseInt(totalRooms);
    if (pricingPeriod !== undefined) updateData.pricingPeriod = pricingPeriod;
    if (allowSemesterPayment !== undefined)
      updateData.allowSemesterPayment = allowSemesterPayment;

    if (hostel.status === "REJECTED") {
      updateData.status = "PENDING";
      updateData.rejectionReason = null;
    }

    const updatedHostel = await prisma.hostel.update({
      where: { id: hostelId },
      data: updateData,
      include: {
        facilities: true,
        paymentDetail: true,
        images: true,
        roomTypes: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Hostel updated successfully.",
      data: updatedHostel,
    });
  } catch (error) {
    next(error);
  }
};

const deleteHostel = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const managerId = req.user.id;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
      include: {
        bookings: {
          where: {
            status: { in: ["CONFIRMED", "CHECKED_IN"] },
          },
        },
      },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.managerId !== managerId) {
      return next(
        new ApiError(403, "You are not authorized to delete this hostel."),
      );
    }

    if (hostel.bookings.length > 0) {
      return next(
        new ApiError(
          400,
          "Cannot delete hostel with active bookings. Please resolve all bookings first.",
        ),
      );
    }

    await prisma.hostel.delete({
      where: { id: hostelId },
    });

    res.status(200).json({
      success: true,
      message: "Hostel deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const getMyHostels = async (req, res, next) => {
  try {
    const managerId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { managerId };
    if (status) where.status = status;

    const [hostels, total] = await Promise.all([
      prisma.hostel.findMany({
        where,
        include: {
          facilities: true,
          images: true,
          roomTypes: true,
          paymentDetail: true,
          _count: {
            select: {
              bookings: true,
              complaints: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.hostel.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: hostels,
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

const getMyHostelDetail = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const managerId = req.user.id;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
      include: {
        facilities: true,
        images: true,
        roomTypes: {
          include: {
            rooms: {
              orderBy: { roomNumber: "asc" },
              include: {
                bookings: {
                  where: {
                    status: { in: ["CONFIRMED", "CHECKED_IN"] },
                  },
                  include: {
                    student: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        paymentDetail: true,
        _count: {
          select: {
            bookings: true,
            complaints: true,
          },
        },
      },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.managerId !== managerId) {
      return next(
        new ApiError(
          403,
          "You are not authorized to view this hostel's details.",
        ),
      );
    }

    res.status(200).json({
      success: true,
      data: hostel,
    });
  } catch (error) {
    next(error);
  }
};

const addRoomType = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const managerId = req.user.id;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.managerId !== managerId) {
      return next(
        new ApiError(
          403,
          "You are not authorized to add room types to this hostel.",
        ),
      );
    }

    const {
      occupancyType,
      pricePerPerson,
      totalRooms,
      amenities,
      description,
      rooms,
    } = req.body;

    const existingRoomType = await prisma.roomType.findUnique({
      where: {
        hostelId_occupancyType: {
          hostelId,
          occupancyType,
        },
      },
    });

    if (existingRoomType) {
      return next(
        new ApiError(
          400,
          `A ${occupancyType} room type already exists for this hostel. Please update it instead.`,
        ),
      );
    }

    const capacity = getOccupancyNumber(occupancyType);
    const roomCount = rooms ? rooms.length : parseInt(totalRooms);
    const totalSpots = roomCount * capacity;

    if (rooms && rooms.length > 0) {
      const roomNumbers = rooms.map((r) => r.roomNumber);
      const uniqueNumbers = new Set(roomNumbers);
      if (uniqueNumbers.size !== roomNumbers.length) {
        return next(new ApiError(400, "Room numbers must be unique."));
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const newRoomType = await tx.roomType.create({
        data: {
          hostelId,
          occupancyType,
          pricePerPerson: parseFloat(pricePerPerson),
          totalRooms: roomCount,
          availableRooms: roomCount,
          totalSpots: totalSpots,
          availableSpots: totalSpots,
          amenities: amenities || [],
          description: description || null,
        },
      });

      if (rooms && rooms.length > 0) {
        await tx.room.createMany({
          data: rooms.map((room) => ({
            roomTypeId: newRoomType.id,
            roomNumber: room.roomNumber,
            floor: room.floor || 1,
            capacity: capacity,
            currentOccupants: 0,
            status: "AVAILABLE",
            notes: room.notes || null,
          })),
        });
      } else {
        const roomsData = [];
        for (let i = 1; i <= roomCount; i++) {
          roomsData.push({
            roomTypeId: newRoomType.id,
            roomNumber: `${occupancyType.replace("IN_", "")}${String(i).padStart(2, "0")}`,
            floor: 1,
            capacity: capacity,
            currentOccupants: 0,
            status: "AVAILABLE",
          });
        }
        await tx.room.createMany({ data: roomsData });
      }

      return tx.roomType.findUnique({
        where: { id: newRoomType.id },
        include: {
          rooms: {
            orderBy: { roomNumber: "asc" },
          },
        },
      });
    });

    res.status(201).json({
      success: true,
      message: "Room type added successfully with individual rooms.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const addRooms = async (req, res, next) => {
  try {
    const { hostelId, roomTypeId } = req.params;
    const managerId = req.user.id;
    const { rooms } = req.body;

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

    const roomType = await prisma.roomType.findFirst({
      where: { id: roomTypeId, hostelId },
      include: { rooms: true },
    });

    if (!roomType) {
      return next(new ApiError(404, "Room type not found."));
    }

    if (!rooms || rooms.length === 0) {
      return next(new ApiError(400, "Please provide rooms to add."));
    }
    const existingRoomNumbers = roomType.rooms.map((r) => r.roomNumber);
    const newRoomNumbers = rooms.map((r) => r.roomNumber);

    const duplicates = newRoomNumbers.filter((num) =>
      existingRoomNumbers.includes(num),
    );

    if (duplicates.length > 0) {
      return next(
        new ApiError(
          400,
          `Room numbers already exist: ${duplicates.join(", ")}`,
        ),
      );
    }

    const capacity = getOccupancyNumber(roomType.occupancyType);

    const result = await prisma.$transaction(async (tx) => {
      await tx.room.createMany({
        data: rooms.map((room) => ({
          roomTypeId,
          roomNumber: room.roomNumber,
          floor: room.floor || 1,
          capacity: capacity,
          currentOccupants: 0,
          status: "AVAILABLE",
          notes: room.notes || null,
        })),
      });

      await updateRoomTypeStats(tx, roomTypeId);

      return tx.roomType.findUnique({
        where: { id: roomTypeId },
        include: {
          rooms: {
            orderBy: { roomNumber: "asc" },
          },
        },
      });
    });

    res.status(201).json({
      success: true,
      message: `${rooms.length} room(s) added successfully.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const { hostelId, roomId } = req.params;
    const managerId = req.user.id;
    const { roomNumber, floor, status, notes } = req.body;

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

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        roomType: true,
        bookings: {
          where: {
            status: { in: ["CONFIRMED", "CHECKED_IN"] },
          },
        },
      },
    });

    if (!room) {
      return next(new ApiError(404, "Room not found."));
    }

    if (room.roomType.hostelId !== hostelId) {
      return next(new ApiError(400, "Room does not belong to this hostel."));
    }

    if (status === "UNAVAILABLE" && room.bookings.length > 0) {
      return next(
        new ApiError(
          400,
          "Cannot mark room as unavailable while students are assigned. Please reassign them first.",
        ),
      );
    }
    if (roomNumber && roomNumber !== room.roomNumber) {
      const existingRoom = await prisma.room.findFirst({
        where: {
          roomTypeId: room.roomTypeId,
          roomNumber,
          id: { not: roomId },
        },
      });

      if (existingRoom) {
        return next(new ApiError(400, "Room number already exists."));
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedRoom = await tx.room.update({
        where: { id: roomId },
        data: {
          ...(roomNumber && { roomNumber }),
          ...(floor !== undefined && { floor }),
          ...(status && { status }),
          ...(notes !== undefined && { notes }),
        },
      });

      if (status) {
        await updateRoomTypeStats(tx, room.roomTypeId);
      }

      return updatedRoom;
    });

    res.status(200).json({
      success: true,
      message: "Room updated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    const { hostelId, roomId } = req.params;
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

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        roomType: true,
        bookings: {
          where: {
            status: { in: ["PAID", "CONFIRMED", "CHECKED_IN"] },
          },
        },
      },
    });

    if (!room) {
      return next(new ApiError(404, "Room not found."));
    }

    if (room.roomType.hostelId !== hostelId) {
      return next(new ApiError(400, "Room does not belong to this hostel."));
    }

    if (room.bookings.length > 0) {
      return next(
        new ApiError(400, "Cannot delete room with active bookings."),
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.room.delete({
        where: { id: roomId },
      });

      await updateRoomTypeStats(tx, room.roomTypeId);
    });

    res.status(200).json({
      success: true,
      message: "Room deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const getRooms = async (req, res, next) => {
  try {
    const { hostelId, roomTypeId } = req.params;
    const managerId = req.user.id;
    const { status, floor } = req.query;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.managerId !== managerId && req.user.role !== "ADMIN") {
      return next(
        new ApiError(403, "You are not authorized to view these rooms."),
      );
    }

    const roomType = await prisma.roomType.findFirst({
      where: { id: roomTypeId, hostelId },
    });

    if (!roomType) {
      return next(new ApiError(404, "Room type not found."));
    }

    const where = { roomTypeId };
    if (status) where.status = status;
    if (floor) where.floor = parseInt(floor);

    const rooms = await prisma.room.findMany({
      where,
      include: {
        bookings: {
          where: {
            status: { in: ["CONFIRMED", "CHECKED_IN"] },
          },
          include: {
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
          },
        },
      },
      orderBy: { roomNumber: "asc" },
    });

    const formattedRooms = rooms.map((room) => ({
      id: room.id,
      roomNumber: room.roomNumber,
      floor: room.floor,
      capacity: room.capacity,
      currentOccupants: room.currentOccupants,
      availableSpots: room.capacity - room.currentOccupants,
      status: room.status,
      notes: room.notes,
      occupants: room.bookings.map((booking) => ({
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        bedNumber: booking.bedNumber,
        status: booking.status,
        checkInDate: booking.checkInDate,
        expectedCheckOutDate: booking.expectedCheckOutDate,
        student: booking.student,
      })),
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        roomType: {
          id: roomType.id,
          occupancyType: roomType.occupancyType,
          pricePerPerson: roomType.pricePerPerson,
          totalRooms: roomType.totalRooms,
          availableRooms: roomType.availableRooms,
          totalSpots: roomType.totalSpots,
          availableSpots: roomType.availableSpots,
        },
        rooms: formattedRooms,
        summary: {
          total: formattedRooms.length,
          available: formattedRooms.filter((r) => r.status === "AVAILABLE")
            .length,
          partiallyOccupied: formattedRooms.filter(
            (r) => r.status === "PARTIALLY_OCCUPIED",
          ).length,
          fullyOccupied: formattedRooms.filter(
            (r) => r.status === "FULLY_OCCUPIED",
          ).length,
          underMaintenance: formattedRooms.filter(
            (r) => r.status === "UNDER_MAINTENANCE",
          ).length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAvailableRoomsForAssignment = async (req, res, next) => {
  try {
    const { hostelId, roomTypeId } = req.params;
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

    const rooms = await prisma.room.findMany({
      where: {
        roomTypeId,
        status: { in: ["AVAILABLE", "PARTIALLY_OCCUPIED"] },
      },
      include: {
        bookings: {
          where: {
            status: { in: ["CONFIRMED", "CHECKED_IN"] },
          },
          select: {
            bedNumber: true,
          },
        },
      },
      orderBy: { roomNumber: "asc" },
    });

    const availableRooms = rooms.map((room) => {
      const occupiedBeds = room.bookings
        .map((b) => b.bedNumber)
        .filter(Boolean);
      const availableBeds = [];

      for (let i = 1; i <= room.capacity; i++) {
        if (!occupiedBeds.includes(i)) {
          availableBeds.push(i);
        }
      }

      return {
        id: room.id,
        roomNumber: room.roomNumber,
        floor: room.floor,
        capacity: room.capacity,
        currentOccupants: room.currentOccupants,
        availableSpots: room.capacity - room.currentOccupants,
        availableBeds,
        status: room.status,
      };
    });

    res.status(200).json({
      success: true,
      data: availableRooms,
    });
  } catch (error) {
    next(error);
  }
};

const updateRoomType = async (req, res, next) => {
  try {
    const { hostelId, roomTypeId } = req.params;
    const managerId = req.user.id;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.managerId !== managerId) {
      return next(
        new ApiError(403, "You are not authorized to update this room type."),
      );
    }

    const roomType = await prisma.roomType.findFirst({
      where: { id: roomTypeId, hostelId },
    });

    if (!roomType) {
      return next(new ApiError(404, "Room type not found."));
    }

    const { pricePerPerson, amenities, description } = req.body;

    const updateData = {};

    if (pricePerPerson !== undefined) {
      updateData.pricePerPerson = parseFloat(pricePerPerson);
    }
    if (amenities !== undefined) {
      updateData.amenities = amenities;
    }
    if (description !== undefined) {
      updateData.description = description;
    }

    const updatedRoomType = await prisma.roomType.update({
      where: { id: roomTypeId },
      data: updateData,
      include: {
        rooms: {
          orderBy: { roomNumber: "asc" },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Room type updated successfully.",
      data: updatedRoomType,
    });
  } catch (error) {
    next(error);
  }
};

const deleteRoomType = async (req, res, next) => {
  try {
    const { hostelId, roomTypeId } = req.params;
    const managerId = req.user.id;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.managerId !== managerId) {
      return next(
        new ApiError(403, "You are not authorized to delete this room type."),
      );
    }

    const roomType = await prisma.roomType.findFirst({
      where: { id: roomTypeId, hostelId },
      include: {
        bookings: {
          where: {
            status: { in: ["PAID", "CONFIRMED", "CHECKED_IN"] },
          },
        },
      },
    });

    if (!roomType) {
      return next(new ApiError(404, "Room type not found."));
    }

    if (roomType.bookings.length > 0) {
      return next(
        new ApiError(400, "Cannot delete room type with active bookings."),
      );
    }

    await prisma.roomType.delete({
      where: { id: roomTypeId },
    });

    res.status(200).json({
      success: true,
      message: "Room type and all associated rooms deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const updateRoomAvailability = async (req, res, next) => {
  try {
    const { hostelId, roomTypeId } = req.params;
    const managerId = req.user.id;
    const { availableRooms } = req.body;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.managerId !== managerId) {
      return next(
        new ApiError(403, "You are not authorized to update this hostel."),
      );
    }

    const roomType = await prisma.roomType.findFirst({
      where: { id: roomTypeId, hostelId },
    });

    if (!roomType) {
      return next(new ApiError(404, "Room type not found."));
    }

    const newAvailable = parseInt(availableRooms);

    if (newAvailable > roomType.totalRooms) {
      return next(
        new ApiError(
          400,
          `Available rooms cannot exceed total rooms (${roomType.totalRooms}).`,
        ),
      );
    }

    const updatedRoomType = await prisma.roomType.update({
      where: { id: roomTypeId },
      data: { availableRooms: newAvailable },
    });

    if (hostel.status === "UNAVAILABLE" && newAvailable > 0) {
      await prisma.hostel.update({
        where: { id: hostelId },
        data: { status: "APPROVED" },
      });
    }

    const becameUnavailable = await checkAndUpdateHostelAvailability(hostelId);

    res.status(200).json({
      success: true,
      message: becameUnavailable
        ? "Room availability updated. Hostel is now marked as unavailable (all rooms full)."
        : "Room availability updated successfully.",
      data: updatedRoomType,
    });
  } catch (error) {
    next(error);
  }
};

const addFacilities = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const managerId = req.user.id;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.managerId !== managerId) {
      return next(
        new ApiError(403, "You are not authorized to modify this hostel."),
      );
    }

    const { facilities } = req.body;

    if (!facilities || !Array.isArray(facilities) || facilities.length === 0) {
      return next(
        new ApiError(400, "Please provide an array of facility names."),
      );
    }

    const created = await prisma.hostelFacility.createMany({
      data: facilities.map((name) => ({
        hostelId,
        name: typeof name === "string" ? name : name.name,
      })),
    });

    const allFacilities = await prisma.hostelFacility.findMany({
      where: { hostelId },
    });

    res.status(201).json({
      success: true,
      message: `${created.count} facilities added successfully.`,
      data: allFacilities,
    });
  } catch (error) {
    next(error);
  }
};

const removeFacility = async (req, res, next) => {
  try {
    const { hostelId, facilityId } = req.params;
    const managerId = req.user.id;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.managerId !== managerId) {
      return next(
        new ApiError(403, "You are not authorized to modify this hostel."),
      );
    }

    const facility = await prisma.hostelFacility.findFirst({
      where: { id: facilityId, hostelId },
    });

    if (!facility) {
      return next(new ApiError(404, "Facility not found."));
    }

    await prisma.hostelFacility.delete({
      where: { id: facilityId },
    });

    res.status(200).json({
      success: true,
      message: "Facility removed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const upsertPaymentDetail = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const managerId = req.user.id;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.managerId !== managerId) {
      return next(
        new ApiError(403, "You are not authorized to modify this hostel."),
      );
    }

    const { accountName, momoNumber, momoProvider, alternatePhone, notes } =
      req.body;

    const paymentDetail = await prisma.hostelPaymentDetail.upsert({
      where: { hostelId },
      update: {
        accountName,
        momoNumber,
        momoProvider: momoProvider || "MTN",
        alternatePhone: alternatePhone || null,
        notes: notes || null,
      },
      create: {
        hostelId,
        accountName,
        momoNumber,
        momoProvider: momoProvider || "MTN",
        alternatePhone: alternatePhone || null,
        notes: notes || null,
      },
    });

    res.status(200).json({
      success: true,
      message: "Payment details saved successfully.",
      data: paymentDetail,
    });
  } catch (error) {
    next(error);
  }
};

const addImages = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const managerId = req.user.id;

    if (!req.files || req.files.length === 0) {
      return next(
        new ApiError(
          400,
          "No images provided. Please upload at least one image.",
        ),
      );
    }

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
      select: {
        id: true,
        managerId: true,
        images: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.managerId !== managerId) {
      return next(
        new ApiError(
          403,
          "You are not authorized to add images to this hostel.",
        ),
      );
    }

    const isFirstImage = hostel.images.length === 0;

    const uploadResults = await Promise.allSettled(
      req.files.map(async (file, index) => {
        if (!file.buffer) {
          throw new Error("File buffer is missing");
        }

        const result = await uploadToCloudinary(
          file.buffer,
          `cug-hostels/hostels/${hostelId}`,
        );

        return {
          hostelId,
          url: result.url,
          publicId: result.publicId,
          isPrimary: isFirstImage && index === 0,
        };
      }),
    );

    const successfulUploads = [];
    const failedUploads = [];

    uploadResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        successfulUploads.push(result.value);
      } else {
        failedUploads.push({
          file: req.files[index].originalname,
          error: result.reason?.message || "Upload failed",
        });
      }
    });

    if (successfulUploads.length === 0) {
      return next(
        new ApiError(500, "All image uploads failed. Please try again."),
      );
    }

    const createdImages = await prisma.$transaction(
      successfulUploads.map((data) => prisma.hostelImage.create({ data })),
    );

    const response = {
      success: true,
      message: `${createdImages.length} image(s) uploaded successfully.`,
      data: createdImages,
    };

    if (failedUploads.length > 0) {
      response.message += ` ${failedUploads.length} image(s) failed to upload.`;
      response.failedUploads = failedUploads;
    }

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

function cleanupFiles(files) {
  if (!files) return;
  files.forEach((file) => {
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (err) {
      console.error(`Failed to cleanup file ${file.path}:`, err.message);
    }
  });
}

const removeImage = async (req, res, next) => {
  try {
    const { hostelId, imageId } = req.params;
    const managerId = req.user.id;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.managerId !== managerId) {
      return next(
        new ApiError(
          403,
          "You are not authorized to remove images from this hostel.",
        ),
      );
    }

    const image = await prisma.hostelImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return next(new ApiError(404, "Image not found."));
    }

    if (image.hostelId !== hostelId) {
      return next(new ApiError(400, "Image does not belong to this hostel."));
    }

    if (image.publicId) {
      await deleteFromCloudinary(image.publicId);
    }

    await prisma.hostelImage.delete({
      where: { id: imageId },
    });

    if (image.isPrimary) {
      const remainingImages = await prisma.hostelImage.findMany({
        where: { hostelId },
        take: 1,
      });

      if (remainingImages.length > 0) {
        await prisma.hostelImage.update({
          where: { id: remainingImages[0].id },
          data: { isPrimary: true },
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Image removed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const setPrimaryImage = async (req, res, next) => {
  try {
    const { hostelId, imageId } = req.params;
    const managerId = req.user.id;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.managerId !== managerId) {
      return next(
        new ApiError(403, "You are not authorized to modify this hostel."),
      );
    }

    const image = await prisma.hostelImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return next(new ApiError(404, "Image not found."));
    }

    if (image.hostelId !== hostelId) {
      return next(new ApiError(400, "Image does not belong to this hostel."));
    }

    await prisma.hostelImage.updateMany({
      where: { hostelId, isPrimary: true },
      data: { isPrimary: false },
    });

    const updatedImage = await prisma.hostelImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });

    res.status(200).json({
      success: true,
      message: "Primary image set successfully.",
      data: updatedImage,
    });
  } catch (error) {
    next(error);
  }
};

const getApprovedHostels = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      minPrice,
      maxPrice,
      maxDistance,
      facilities,
      occupancyType,
      sortBy = "newest",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      status: "APPROVED",
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (maxDistance) {
      where.distanceToCampus = {
        lte: parseFloat(maxDistance),
      };
    }

    if (facilities) {
      const facilityList = Array.isArray(facilities)
        ? facilities
        : [facilities];

      where.AND = facilityList.map((facilityName) => ({
        facilities: {
          some: {
            name: { equals: facilityName, mode: "insensitive" },
          },
        },
      }));
    }

    if (minPrice || maxPrice || occupancyType) {
      const roomFilter = {
        availableRooms: { gt: 0 },
      };

      if (minPrice) {
        roomFilter.pricePerPerson = {
          ...(roomFilter.pricePerPerson || {}),
          gte: parseFloat(minPrice),
        };
      }

      if (maxPrice) {
        roomFilter.pricePerPerson = {
          ...(roomFilter.pricePerPerson || {}),
          lte: parseFloat(maxPrice),
        };
      }

      if (occupancyType) {
        roomFilter.occupancyType = occupancyType;
      }

      where.roomTypes = {
        some: roomFilter,
      };
    }

    let orderBy = { createdAt: "desc" };

    if (sortBy === "newest") {
      orderBy = { createdAt: "desc" };
    } else if (sortBy === "name") {
      orderBy = { name: "asc" };
    } else if (sortBy === "totalRooms") {
      orderBy = { totalRooms: "desc" };
    }

    const [hostels, total] = await Promise.all([
      prisma.hostel.findMany({
        where,
        include: {
          facilities: true,
          images: true,
          roomTypes: {
            where: {
              availableRooms: { gt: 0 },
            },
          },
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
        orderBy,
        skip,
        take: parseInt(limit),
      }),
      prisma.hostel.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: hostels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getHostelBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const hostel = await prisma.hostel.findUnique({
      where: { slug },
      include: {
        facilities: true,
        images: true,
        roomTypes: true,
        paymentDetail: {
          select: {
            accountName: true,
            momoNumber: true,
            momoProvider: true,
            alternatePhone: true,
            notes: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.status !== "APPROVED") {
      return next(new ApiError(404, "Hostel not found."));
    }

    res.status(200).json({
      success: true,
      data: hostel,
    });
  } catch (error) {
    next(error);
  }
};

const getHostelById = async (req, res, next) => {
  try {
    const { hostelId } = req.params;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
      include: {
        facilities: true,
        images: true,
        roomTypes: true,
        paymentDetail: {
          select: {
            accountName: true,
            momoNumber: true,
            momoProvider: true,
            alternatePhone: true,
            notes: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.status !== "APPROVED") {
      if (
        req.user &&
        (req.user.id === hostel.managerId || req.user.role === "ADMIN")
      ) {
      } else {
        return next(new ApiError(404, "Hostel not found."));
      }
    }

    res.status(200).json({
      success: true,
      data: hostel,
    });
  } catch (error) {
    next(error);
  }
};

const adminGetAllHostels = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    const [hostels, total] = await Promise.all([
      prisma.hostel.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          address: true,
          distanceToCampus: true,
          status: true,
          managerId: true,
          rejectionReason: true,
          totalRooms: true,
          pricingPeriod: true,
          allowSemesterPayment: true,
          createdAt: true,
          updatedAt: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              managerProfile: {
                select: {
                  businessName: true,
                  verified: true,
                  verificationStatus: true,
                },
              },
            },
          },
          images: {
            where: { isPrimary: true },
            select: {
              id: true,
              url: true,
              isPrimary: true,
            },
            take: 1,
          },
          facilities: {
            select: {
              id: true,
              name: true,
            },
          },
          roomTypes: {
            select: {
              id: true,
              occupancyType: true,
              pricePerPerson: true,
              totalRooms: true,
              availableRooms: true,
              amenities: true,
              description: true,
            },
          },
          paymentDetail: {
            select: {
              accountName: true,
              momoNumber: true,
              momoProvider: true,
            },
          },
          _count: {
            select: {
              bookings: true,
              complaints: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.hostel.count({ where }),
    ]);

    const hostelsWithImages = await Promise.all(
      hostels.map(async (hostel) => {
        if (hostel.images.length === 0) {
          const firstImage = await prisma.hostelImage.findFirst({
            where: { hostelId: hostel.id },
            select: {
              id: true,
              url: true,
              isPrimary: true,
            },
            orderBy: { createdAt: "asc" },
          });
          return {
            ...hostel,
            images: firstImage ? [firstImage] : [],
          };
        }
        return hostel;
      }),
    );

    res.status(200).json({
      success: true,
      data: hostelsWithImages,
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

const adminGetHostelDetail = async (req, res, next) => {
  try {
    const { hostelId } = req.params;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
      include: {
        facilities: true,
        images: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
        roomTypes: true,
        paymentDetail: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            managerProfile: {
              select: {
                id: true,
                businessName: true,
                idNumber: true,
                verified: true,
                verificationStatus: true,
                verifiedAt: true,
              },
            },
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

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    const recentBookings = await prisma.booking.findMany({
      where: { hostelId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        bookingReference: true,
        booker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    res.status(200).json({
      success: true,
      data: {
        ...hostel,
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

const adminGetHostelStats = async (req, res, next) => {
  try {
    const stats = await prisma.hostel.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    const statusMap = stats.reduce(
      (acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      },
      {
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
        SUSPENDED: 0,
        UNAVAILABLE: 0,
      },
    );

    const total = Object.values(statusMap).reduce(
      (sum, count) => sum + count,
      0,
    );

    res.status(200).json({
      success: true,
      data: {
        total,
        pending: statusMap.PENDING,
        approved: statusMap.APPROVED,
        rejected: statusMap.REJECTED,
        suspended: statusMap.SUSPENDED,
        unavailable: statusMap.UNAVAILABLE,
      },
    });
  } catch (error) {
    next(error);
  }
};

const adminVerifyHostel = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const { status, rejectionReason } = req.body;
    const adminId = req.user.id;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        roomTypes: true,
      },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    if (hostel.status !== "PENDING" && hostel.status !== "REJECTED") {
      return next(
        new ApiError(
          400,
          `Hostel is already ${hostel.status.toLowerCase()}. Only pending or rejected hostels can be verified.`,
        ),
      );
    }

    if (status === "APPROVED") {
      if (hostel.roomTypes.length === 0) {
        return next(
          new ApiError(
            400,
            "Cannot approve hostel without any room types configured.",
          ),
        );
      }
    }

    const updateData = {
      status,
      rejectionReason: status === "REJECTED" ? rejectionReason : null,
    };

    const updatedHostel = await prisma.hostel.update({
      where: { id: hostelId },
      data: updateData,
      include: {
        facilities: true,
        images: true,
        roomTypes: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    await notifyHostelApproval(
      hostel,
      hostel.manager,
      adminId,
      status,
      rejectionReason,
    );

    res.status(200).json({
      success: true,
      message:
        status === "APPROVED"
          ? "Hostel approved successfully. It is now visible to students."
          : "Hostel rejected successfully. The manager has been notified.",
      data: updatedHostel,
    });
  } catch (error) {
    next(error);
  }
};

const adminSuspendHostel = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    const updatedHostel = await prisma.hostel.update({
      where: { id: hostelId },
      data: {
        status: "SUSPENDED",
        rejectionReason: reason || null,
      },
    });

    await notifyHostelSuspension(hostel, hostel.manager, adminId, reason);

    res.status(200).json({
      success: true,
      message: "Hostel suspended successfully.",
      data: updatedHostel,
    });
  } catch (error) {
    next(error);
  }
};

const assignStudentToRoom = async (req, res, next) => {
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

    if (!booking) {
      return next(new ApiError(404, "Booking not found."));
    }

    if (booking.status !== "PAID") {
      return next(
        new ApiError(
          400,
          `Cannot assign room. Booking status is "${booking.status}". Only paid bookings can be assigned.`,
        ),
      );
    }

    if (booking.roomType.availableRooms <= 0) {
      return next(
        new ApiError(
          400,
          `No available ${booking.roomType.occupancyType} rooms. Please update room availability first.`,
        ),
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CONFIRMED",
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

      const updatedRoomType = await tx.roomType.update({
        where: { id: booking.roomTypeId },
        data: {
          availableRooms: { decrement: 1 },
        },
      });

      return { updatedBooking, updatedRoomType };
    });

    await createNotification({
      userId: booking.booker.id,
      senderId: managerId,
      title: "Room Assigned!",
      message: `You have been assigned a ${booking.roomType.occupancyType.replace("IN_", "")} in a room at ${hostel.name}. Your booking is confirmed.`,
      type: "BOOKING",
      metadata: {
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        hostelName: hostel.name,
        roomType: booking.roomType.occupancyType,
      },
    });

    const becameUnavailable = await checkAndUpdateHostelAvailability(hostelId);

    res.status(200).json({
      success: true,
      message: becameUnavailable
        ? "Student assigned to room. All rooms are now full — hostel marked as unavailable."
        : "Student assigned to room successfully.",
      data: result.updatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createHostel,
  updateHostel,
  deleteHostel,
  getMyHostels,
  getMyHostelDetail,

  addRoomType,
  updateRoomType,
  deleteRoomType,
  updateRoomAvailability,

  addRooms,
  updateRoom,
  deleteRoom,
  getRooms,
  getAvailableRoomsForAssignment,

  addFacilities,
  removeFacility,

  upsertPaymentDetail,

  addImages,
  removeImage,
  setPrimaryImage,

  getApprovedHostels,
  getHostelBySlug,
  getHostelById,

  adminGetAllHostels,
  adminGetHostelDetail,
  adminVerifyHostel,
  adminSuspendHostel,
  adminGetHostelStats,

  assignStudentToRoom,
};
