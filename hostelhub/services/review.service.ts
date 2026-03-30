import api from "@/lib/api";
import type {
  HostelReviewsResponse,
  CreateReviewPayload,
  UpdateReviewPayload,
  Review,
} from "@/types/review";

export interface AllReviewsResponse {
  success: boolean;
  data: Review[];
  stats?: {
    averageRating: number;
    totalReviews: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface FeaturedReviewsResponse {
  success: boolean;
  data: Review[];
}

export const reviewService = {
  getAllReviews: async (params?: {
    page?: number;
    limit?: number;
    minRating?: number;
    sortBy?: "newest" | "oldest" | "highest" | "lowest";
  }): Promise<AllReviewsResponse> => {
    const response = await api.get("/reviews", { params });
    return response.data;
  },

  getFeaturedReviews: async (
    limit?: number,
  ): Promise<FeaturedReviewsResponse> => {
    const response = await api.get("/reviews/featured", {
      params: { limit },
    });
    return response.data;
  },

  getHostelReviews: async (
    hostelId: string,
    params?: {
      page?: number;
      limit?: number;
      sortBy?: "newest" | "oldest" | "highest" | "lowest";
    },
  ): Promise<HostelReviewsResponse> => {
    const response = await api.get(`/reviews/hostel/${hostelId}`, {
      params,
    });
    return response.data;
  },

  getMyReviews: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get("/reviews/my-reviews", { params });
    return response.data;
  },

  createReview: async (data: CreateReviewPayload) => {
    const response = await api.post("/reviews", data);
    return response.data;
  },

  updateReview: async (reviewId: string, data: UpdateReviewPayload) => {
    const response = await api.put(`/reviews/${reviewId}`, data);
    return response.data;
  },

  deleteReview: async (reviewId: string) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },
};
