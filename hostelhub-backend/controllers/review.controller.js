const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");

const createReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { bookingId, rating, comment } = req.body;

    if (!["STUDENT", "GUEST"].includes(req.user.role)) {
      return next(
        new ApiError(403, "Only students and guests can write reviews."),
      );
    }

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
        review: true,
      },
    });

    if (!booking) {
      return next(new ApiError(404, "Booking not found."));
    }

    if (booking.bookerId !== userId) {
      return next(
        new ApiError(403, "You can only review hostels you have booked."),
      );
    }

    const reviewableStatuses = ["CHECKED_IN", "CHECKED_OUT"];
    if (!reviewableStatuses.includes(booking.status)) {
      return next(
        new ApiError(
          400,
          "You can only review a hostel after you have checked in or checked out.",
        ),
      );
    }

    if (booking.review) {
      return next(
        new ApiError(
          400,
          "You have already reviewed this booking. You can update your existing review instead.",
        ),
      );
    }

    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          userId,
          hostelId: booking.hostelId,
          bookingId,
          rating: parseInt(rating),
          comment: comment || null,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: booking.hostel.managerId,
          senderId: userId,
          title: "New Review",
          message: `A ${rating}-star review has been left for ${booking.hostel.name}.`,
          type: "SYSTEM",
          metadata: {
            reviewId: newReview.id,
            hostelId: booking.hostelId,
            rating,
          },
        },
      });

      return newReview;
    });

    res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return next(new ApiError(404, "Review not found."));
    }

    if (review.userId !== userId) {
      return next(
        new ApiError(403, "You are not authorized to update this review."),
      );
    }

    const updateData = {};
    if (rating !== undefined) updateData.rating = parseInt(rating);
    if (comment !== undefined) updateData.comment = comment;

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Review updated successfully.",
      data: updatedReview,
    });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return next(new ApiError(404, "Review not found."));
    }

    if (review.userId !== userId && req.user.role !== "ADMIN") {
      return next(
        new ApiError(403, "You are not authorized to delete this review."),
      );
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const getHostelReviews = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const { page = 1, limit = 10, sortBy = "newest" } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const hostel = await prisma.hostel.findUnique({
      where: { id: hostelId },
      select: { id: true, status: true },
    });

    if (!hostel) {
      return next(new ApiError(404, "Hostel not found."));
    }

    let orderBy;
    switch (sortBy) {
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "highest":
        orderBy = { rating: "desc" };
        break;
      case "lowest":
        orderBy = { rating: "asc" };
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
    }

    const [reviews, total, aggregation, ratingDistribution] = await Promise.all([
      prisma.review.findMany({
        where: { hostelId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
              studentProfile: {
                select: {
                  programme: true,
                  level: true,
                },
              },
              guestProfile: {
                select: {
                  guestType: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: parseInt(limit),
      }),
      prisma.review.count({ where: { hostelId } }),
      prisma.review.aggregate({
        where: { hostelId },
        _avg: { rating: true },
        _count: { id: true },
      }),
      prisma.review.groupBy({
        by: ["rating"],
        where: { hostelId },
        _count: { id: true },
      }),
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach((item) => {
      distribution[item.rating] = item._count.id;
    });

    res.status(200).json({
      success: true,
      data: reviews,  
      stats: {
        averageRating: aggregation._avg.rating
          ? Math.round(aggregation._avg.rating * 10) / 10
          : 0,
        totalReviews: aggregation._count.id,
        distribution, 
      },
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

const getMyReviews = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { userId },
        include: {
          hostel: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          booking: {
            select: {
              bookingReference: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.review.count({ where: { userId } }),
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
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

const getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, minRating, sortBy = "newest" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (minRating) {
      where.rating = { gte: parseInt(minRating) };
    }

    let orderBy = {};
    switch (sortBy) {
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "highest":
        orderBy = { rating: "desc" };
        break;
      case "lowest":
        orderBy = { rating: "asc" };
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
              studentProfile: {
                select: {
                  programme: true,
                  level: true,
                },
              },
              guestProfile: {
                select: {
                  guestType: true,
                },
              },
            },
          },
          hostel: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy,
        skip,
        take: parseInt(limit),
      }),
      prisma.review.count({ where }),
    ]);

    const allRatings = await prisma.review.findMany({
      where,
      select: { rating: true },
    });

    const totalReviews = allRatings.length;
    const averageRating =
      totalReviews > 0
        ? allRatings.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    res.status(200).json({
      success: true,
      data: reviews,
      stats: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
      },
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

const getFeaturedReviews = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;

    const reviews = await prisma.review.findMany({
      where: {
        rating: { gte: 4 },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            studentProfile: {
              select: {
                programme: true,
                level: true,
              },
            },
            guestProfile: {
              select: {
                guestType: true,
              },
            },
          },
        },
        hostel: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getHostelReviews,
  getMyReviews,
  getAllReviews,
  getFeaturedReviews,
};
