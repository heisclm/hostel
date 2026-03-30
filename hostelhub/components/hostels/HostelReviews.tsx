"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { useHostelReviews } from "@/hooks/useReviews";
import type { ReviewSummary } from "@/types/review";

function StarRating({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-6 h-6" };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeMap[size],
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200",
          )}
        />
      ))}
    </div>
  );
}

function RatingBar({
  star,
  count,
  total,
}: {
  star: number;
  count: number;
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-slate-500">{star}</span>
      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-slate-400 text-xs">{count}</span>
    </div>
  );
}

function ReviewsSummaryCard({ summary }: { summary: ReviewSummary }) {
  return (
    <div className="flex flex-col sm:flex-row gap-6 p-5 bg-slate-50 rounded-xl mb-6">
      <div className="text-center sm:text-left">
        <div className="text-4xl font-bold text-slate-900 mb-1">
          {summary.averageRating.toFixed(1)}
        </div>
        <StarRating rating={Math.round(summary.averageRating)} size="md" />
        <p className="text-sm text-slate-500 mt-1">
          {summary.totalReviews}{" "}
          {summary.totalReviews === 1 ? "review" : "reviews"}
        </p>
      </div>
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => (
          <RatingBar
            key={star}
            star={star}
            count={summary.ratingDistribution[star] || 0}
            total={summary.totalReviews}
          />
        ))}
      </div>
    </div>
  );
}

interface HostelReviewsProps {
  hostelId: string;
}

export default function HostelReviews({ hostelId }: HostelReviewsProps) {
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "highest" | "lowest"
  >("newest");
  const [page, setPage] = useState(1);

  const { reviews, summary, pagination, isLoading, error } = useHostelReviews(
    hostelId,
    {
      page,
      limit: 10,
      sortBy,
    },
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-24 bg-slate-50 rounded-xl animate-pulse" />
        <div className="h-24 bg-slate-50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500">Failed to load reviews</p>
        <p className="text-xs text-red-400 mt-1">{error}</p>
      </div>
    );
  }

  if (!summary || summary.totalReviews === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No reviews yet</p>
        <p className="text-sm text-slate-400 mt-1">
          Be the first to review this hostel after your stay
        </p>
      </div>
    );
  }

  return (
    <div>
      <ReviewsSummaryCard summary={summary} />

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          Showing {reviews.length} of {summary.totalReviews} reviews
        </p>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as typeof sortBy);
              setPage(1);
            }}
            className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest rated</option>
            <option value="lowest">Lowest rated</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border border-slate-100 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <Avatar
                name={`${review.user.firstName} ${review.user.lastName}`}
                size="sm"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-slate-800 text-sm">
                    {review.user.firstName} {review.user.lastName}
                  </h4>
                  <span className="text-xs text-slate-400">
                    {new Date(review.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <StarRating rating={review.rating} />
                {review.comment && (
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}