const { prisma } = require("../config/db.js");
const { ApiError } = require("../utils/apiError.js");

class SavedHostelService {
  static async saveHostel(userId, hostelId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!["STUDENT", "GUEST"].includes(user.role)) {
      throw new ApiError(403, "Only students and guests can save hostels");
    }

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
      select: { id: true, status: true },
    });

    if (!hostel) {
      throw new ApiError(404, "Hostel not found");
    }

    if (hostel.status !== "APPROVED") {
      throw new ApiError(400, "Cannot save an unapproved hostel");
    }

    const existing = await prisma.savedHostel.findUnique({
      where: {
        userId_hostelId: {
          userId,
          hostelId,
        },
      },
    });

    if (existing) {
      throw new ApiError(400, "Hostel is already saved");
    }

    const savedHostel = await prisma.savedHostel.create({
      data: {
        userId,
        hostelId,
      },
      include: {
        hostel: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return savedHostel;
  }

  static async unsaveHostel(userId, hostelId) {
    const savedHostel = await prisma.savedHostel.findUnique({
      where: {
        userId_hostelId: {
          userId,
          hostelId,
        },
      },
    });

    if (!savedHostel) {
      throw new ApiError(404, "Hostel not found in saved list");
    }

    await prisma.savedHostel.delete({
      where: {
        userId_hostelId: {
          userId,
          hostelId,
        },
      },
    });

    return { message: "Hostel removed from saved list" };
  }

  static async getSavedHostels(userId, options = {}) {
    const { page = 1, limit = 10, sortBy = "recent", search = "" } = options;

    const skip = (page - 1) * limit;

    const where = {
      userId,
      hostel: {
        status: "APPROVED",
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
    };

    let orderBy = { createdAt: "desc" };

    if (sortBy === "name") {
      orderBy = { hostel: { name: "asc" } };
    } else if (sortBy === "distance") {
      orderBy = { hostel: { distanceToCampus: "asc" } };
    }

    const [savedHostels, total] = await Promise.all([
      prisma.savedHostel.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          hostel: {
            include: {
              images: {
                orderBy: { isPrimary: "desc" },
                take: 3,
              },
              facilities: true,
              roomTypes: {
                select: {
                  id: true,
                  occupancyType: true,
                  pricePerPerson: true,
                  availableRooms: true,
                  availableSpots: true,
                },
              },
              reviews: {
                select: {
                  rating: true,
                },
              },
            },
          },
        },
      }),
      prisma.savedHostel.count({ where }),
    ]);

    const hostels = savedHostels.map((saved) => {
      const hostel = saved.hostel;
      const ratings = hostel.reviews.map((r) => r.rating);
      const averageRating =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : null;

      const priceRange = {
        min: Math.min(...hostel.roomTypes.map((r) => Number(r.pricePerPerson))),
        max: Math.max(...hostel.roomTypes.map((r) => Number(r.pricePerPerson))),
      };

      return {
        savedAt: saved.createdAt,
        hostel: {
          id: hostel.id,
          name: hostel.name,
          slug: hostel.slug,
          address: hostel.address,
          distanceToCampus: hostel.distanceToCampus,
          images: hostel.images,
          facilities: hostel.facilities,
          roomTypes: hostel.roomTypes,
          priceRange,
          totalAvailable: hostel.roomTypes.reduce(
            (sum, r) => sum + r.availableRooms,
            0,
          ),
          rating: averageRating,
          reviewCount: ratings.length,
        },
      };
    });

    return {
      hostels,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + savedHostels.length < total,
      },
    };
  }

  static async isHostelSaved(userId, hostelId) {
    const saved = await prisma.savedHostel.findUnique({
      where: {
        userId_hostelId: {
          userId,
          hostelId,
        },
      },
    });

    return { isSaved: !!saved };
  }

  static async checkSavedStatus(userId, hostelIds) {
    const saved = await prisma.savedHostel.findMany({
      where: {
        userId,
        hostelId: { in: hostelIds },
      },
      select: {
        hostelId: true,
      },
    });

    const savedIds = new Set(saved.map((s) => s.hostelId));

    return hostelIds.reduce((acc, id) => {
      acc[id] = savedIds.has(id);
      return acc;
    }, {});
  }

  static async toggleSave(userId, hostelId) {
    const { isSaved } = await this.isHostelSaved(userId, hostelId);

    if (isSaved) {
      await this.unsaveHostel(userId, hostelId);
      return { isSaved: false, message: "Hostel removed from saved list" };
    } else {
      await this.saveHostel(userId, hostelId);
      return { isSaved: true, message: "Hostel saved successfully" };
    }
  }

  static async getSavedCount(userId) {
    const count = await prisma.savedHostel.count({
      where: { userId },
    });

    return { count };
  }

  static async clearAllSaved(userId) {
    const result = await prisma.savedHostel.deleteMany({
      where: { userId },
    });

    return {
      message: "All saved hostels cleared",
      count: result.count,
    };
  }
}

module.exports = SavedHostelService;
