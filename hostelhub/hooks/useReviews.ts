/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback, useEffect } from "react";
import { reviewService } from "@/services/review.service";
import type {
  Review,
  ReviewSummary,
  CreateReviewPayload,
  UpdateReviewPayload,
} from "@/types/review";
import { AxiosError } from "axios";

export function useHostelReviews(
  hostelId: string | null,
  params?: {
    page?: number;
    limit?: number;
    sortBy?: "newest" | "oldest" | "highest" | "lowest";
  },
) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!hostelId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await reviewService.getHostelReviews(hostelId, params);

      setReviews(response.data);

      if (response.stats) {
        setSummary({
          averageRating: response.stats.averageRating,
          totalReviews: response.stats.totalReviews,
          ratingDistribution: response.stats.distribution || {},
        });
      }

      setPagination(response.pagination || null);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        const message =
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to fetch reviews";
        setError(message);
      } else {
        setError("Unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }, [hostelId, params?.page, params?.limit, params?.sortBy]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    summary,
    pagination,
    isLoading,
    error,
    refetch: fetchReviews,
  };
}

export function useCreateReview() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReview = useCallback(async (data: CreateReviewPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await reviewService.createReview(data);
      return response;
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        const message =
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to submit review";
        setError(message);
      } else {
        setError("Unexpected error occurred");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createReview, isLoading, error, setError };
}

export function useUpdateReview() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateReview = useCallback(
    async (reviewId: string, data: UpdateReviewPayload) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await reviewService.updateReview(reviewId, data);
        return response;
      } catch (err: unknown) {
        if (err && typeof err === "object" && "response" in err) {
          const axiosError = err as AxiosError<{ message?: string }>;
          const message =
            axiosError.response?.data?.message ||
            axiosError.message ||
            "Failed to update review";
          setError(message);
        } else {
          setError("Unexpected error occurred");
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { updateReview, isLoading, error, setError };
}

export function useDeleteReview() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteReview = useCallback(async (reviewId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await reviewService.deleteReview(reviewId);
      return response;
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        const message =
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to delete review";
        setError(message);
      } else {
        setError("Unexpected error occurred");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { deleteReview, isLoading, error, setError };
}
