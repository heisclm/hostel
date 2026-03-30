"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Phone,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  CreditCard,
  Shield,
  ChevronRight,
  Bed,
  Sparkles,
  FileText,
  X,
  ExternalLink,
  RefreshCw,
  Home,
  Layers,
  Star,
  Edit3,
  Trash2,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { bookingService } from "@/services/booking.service";
import { reviewService } from "@/services/review.service";
import type { Booking, BookingStatus, PaymentStatus } from "@/types/booking";

const statusConfig: Record<
  BookingStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ElementType;
  }
> = {
  PENDING: {
    label: "Pending",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: Clock,
  },
  PAID: {
    label: "Paid",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: CreditCard,
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: XCircle,
  },
  EXPIRED: {
    label: "Expired",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-200",
    icon: Clock,
  },
  CHECKED_IN: {
    label: "Checked In",
    color: "text-teal-700",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    icon: CheckCircle2,
  },
  CHECKED_OUT: {
    label: "Checked Out",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-200",
    icon: CheckCircle2,
  },
};

const paymentStatusConfig: Record<
  PaymentStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ElementType;
  }
> = {
  PENDING: {
    label: "Pending",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: Clock,
  },
  SUCCESSFUL: {
    label: "Paid",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    icon: CheckCircle2,
  },
  FAILED: {
    label: "Failed",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: XCircle,
  },
  REFUNDED: {
    label: "Refunded",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-200",
    icon: CreditCard,
  },
};

function getHostelImage(booking: Booking): string {
  const primaryImage = booking.hostel?.images?.find((img) => img.isPrimary);
  if (primaryImage) return primaryImage.url;
  if (booking.hostel?.images?.[0]) return booking.hostel.images[0].url;
  return "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80";
}

function formatOccupancy(type: string): string {
  const map: Record<string, string> = {
    IN_1: "Single Room",
    IN_2: "Double Room",
    IN_3: "Triple Room",
    IN_4: "Quad Room",
  };
  return map[type] || type;
}

function formatAmount(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return isNaN(num) ? "0" : num.toLocaleString();
}

function formatDate(date: string | null): string {
  if (!date) return "TBD";
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(date: string | null): string {
  if (!date) return "TBD";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPaymentPlanLabel(booking: Booking): string {
  if (booking.paymentPlan === "FULL_YEAR") return "Full Year";
  if (booking.semesterPeriod === "FIRST_SEMESTER") return "1st Semester";
  return "2nd Semester";
}

function getDuration(booking: Booking): string {
  if (booking.checkInDate && booking.checkOutDate) {
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    const months = Math.round(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24 * 30),
    );
    return `${months} month${months !== 1 ? "s" : ""}`;
  }
  return booking.paymentPlan === "FULL_YEAR" ? "12 months" : "6 months";
}

function canShowReview(booking: Booking): boolean {
  if (!["CHECKED_IN", "CHECKED_OUT"].includes(booking.status)) {
    return false;
  }

  if (booking.checkInDate) {
    const checkInDate = new Date(booking.checkInDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkInDate.setHours(0, 0, 0, 0);
    return checkInDate <= today;
  }

  return true;
}

function StarRating({
  rating,
  onChange,
  readonly = false,
  size = "md",
}: {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          className={cn(
            "transition-transform",
            !readonly && "hover:scale-110 cursor-pointer",
            readonly && "cursor-default",
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              "transition-colors",
              (hoverRating || rating) >= star
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-slate-300",
            )}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewSection({
  booking,
  onReviewChange,
}: {
  booking: Booking;
  onReviewChange: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(booking.review?.rating || 0);
  const [comment, setComment] = useState(booking.review?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const hasExistingReview = !!booking.review;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      if (hasExistingReview && booking.review) {
        await reviewService.updateReview(booking.review.id, {
          rating,
          comment: comment.trim() || undefined,
        });
        toast.success("Review updated successfully!");
      } else {
        await reviewService.createReview({
          hostelId: booking.hostelId,
          bookingId: booking.id,
          rating,
          comment: comment.trim() || undefined,
        });
        toast.success("Review submitted successfully!");
      }
      setIsEditing(false);
      onReviewChange();
    } catch (error) {
      console.error("Review error:", error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to submit review");
      } else {
        toast.error("Failed to submit review");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!booking.review) return;

    setIsDeleting(true);
    try {
      await reviewService.deleteReview(booking.review.id);
      toast.success("Review deleted successfully!");
      setShowDeleteConfirm(false);
      setRating(0);
      setComment("");
      onReviewChange();
    } catch (error) {
      console.error("Delete review error:", error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to delete review");
      } else {
        toast.error("Failed to delete review");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const startEditing = () => {
    setRating(booking.review?.rating || 0);
    setComment(booking.review?.comment || "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setRating(booking.review?.rating || 0);
    setComment(booking.review?.comment || "");
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.32 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      <div className="bg-linear-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {hasExistingReview ? "Your Review" : "Rate Your Stay"}
              </h2>
              <p className="text-sm text-slate-500">
                {hasExistingReview
                  ? "You can edit or delete your review"
                  : "Share your experience with others"}
              </p>
            </div>
          </div>
          {hasExistingReview && !isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={startEditing}
                className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Edit review"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete review"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {hasExistingReview && !isEditing && booking.review && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StarRating rating={booking.review.rating} readonly size="md" />
                <span className="text-lg font-bold text-slate-800">
                  {booking.review.rating}.0
                </span>
              </div>
              <p className="text-sm text-slate-400">
                Reviewed on {formatShortDate(booking.review.createdAt)}
              </p>
            </div>
            {booking.review.comment && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-slate-700 text-sm leading-relaxed">
                  &ldquo;{booking.review.comment}&rdquo;
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg w-fit">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Thank you for your feedback!
            </div>
          </div>
        )}
        {(!hasExistingReview || isEditing) && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                How would you rate your stay?
              </label>
              <div className="flex items-center gap-4">
                <StarRating rating={rating} onChange={setRating} size="lg" />
                {rating > 0 && (
                  <span className="text-lg font-bold text-amber-600">
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent"}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Share your experience (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell others about your stay - the facilities, service, cleanliness, etc."
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
              />
              <p className="text-xs text-slate-400 mt-1 text-right">
                {comment.length}/500 characters
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              {isEditing && (
                <button
                  onClick={cancelEditing}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0}
                className={cn(
                  "flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2",
                  !isEditing && "w-full",
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {hasExistingReview ? "Updating..." : "Submitting..."}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {hasExistingReview ? "Update Review" : "Submit Review"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-slate-100"
            >
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-800 mb-2">
                  Delete your review?
                </p>
                <p className="text-sm text-red-700 mb-4">
                  This action cannot be undone. Your review will be permanently
                  removed.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 bg-white text-slate-700 rounded-lg font-medium text-sm border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-linear-to-br from-slate-900 via-primary-900 to-slate-900 py-12">
        <div className="container-custom">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 bg-white/10 rounded-lg" />
            <div className="flex gap-3">
              <div className="h-7 w-24 bg-white/10 rounded-full" />
              <div className="h-7 w-36 bg-white/10 rounded-full" />
            </div>
            <div className="h-8 w-64 bg-white/20 rounded-lg" />
            <div className="h-5 w-48 bg-white/10 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 h-80 animate-pulse" />
            <div className="bg-white rounded-2xl border border-slate-100 h-40 animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 h-64 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          Something went wrong
        </h2>
        <p className="text-slate-500 max-w-sm mb-6 mx-auto">{message}</p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/bookings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </Link>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          Booking Not Found
        </h2>
        <p className="text-slate-500 max-w-sm mb-6 mx-auto">
          The booking you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </p>
        <Link
          href="/bookings"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </Link>
      </div>
    </div>
  );
}

function RoomAssignmentCard({
  booking,
  roomLabel,
}: {
  booking: Booking;
  roomLabel: string;
}) {
  if (!booking.room) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden"
    >
      <div className="bg-linear-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-emerald-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Home className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Room Assignment
            </h2>
            <p className="text-sm text-slate-500">
              Your allocated accommodation
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-emerald-200">
              <span className="text-xs text-emerald-100 font-medium">ROOM</span>
              <span className="text-2xl font-bold text-white">
                {booking.room.roomNumber}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-lg font-bold text-slate-800">
                Room {booking.room.roomNumber}
              </p>
              {booking.room.floor !== undefined &&
                booking.room.floor !== null && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Layers className="w-3.5 h-3.5" />
                    Floor {booking.room.floor}
                  </div>
                )}
              {booking.bedNumber && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg">
                  <Bed className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-700">
                    Bed {booking.bedNumber}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-3 sm:border-l sm:border-slate-100 sm:pl-6">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Room Type</p>
              <p className="font-semibold text-slate-800 text-sm">
                {roomLabel}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Capacity</p>
              <p className="font-semibold text-slate-800 text-sm">
                {booking.room.capacity}{" "}
                {booking.room.capacity === 1 ? "person" : "persons"}
              </p>
            </div>
            {booking.confirmedAt && (
              <div className="bg-emerald-50 rounded-xl p-3 col-span-2">
                <p className="text-xs text-emerald-600 mb-1">Assigned On</p>
                <p className="font-semibold text-emerald-800 text-sm">
                  {formatDate(booking.confirmedAt)}
                </p>
              </div>
            )}
          </div>
        </div>

        {booking.room.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Room Notes</p>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
              {booking.room.notes}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function PendingRoomAssignmentNotice() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
          <Clock className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 mb-1">
            Room Assignment Pending
          </h3>
          <p className="text-sm text-slate-600 mb-3">
            Your payment has been confirmed! The hostel manager will assign you
            a room shortly. You&apos;ll receive a notification once your room is
            ready.
          </p>
          <div className="inline-flex items-center gap-2 text-xs text-blue-600 bg-blue-100 px-3 py-1.5 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Waiting for room assignment
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function BookingDetailPage() {
  const params = useParams();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const bookingId = params.id as string;

  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;

    setIsLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const response = await bookingService.getBookingDetail(bookingId);

      if (response.success && response.data) {
        setBooking(response.data);
      } else {
        setNotFound(true);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch booking:", err);

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message = err.response?.data?.message as string | undefined;

        if (status === 404) {
          setNotFound(true);
        } else if (status === 401) {
          setError("Please log in to view this booking.");
        } else if (status === 403) {
          setError("You don't have permission to view this booking.");
        } else {
          setError(
            message ||
              err.message ||
              "Failed to load booking details. Please try again.",
          );
        }
      } else if (err instanceof Error) {
        setError(
          err.message || "Failed to load booking details. Please try again.",
        );
      } else {
        setError("Failed to load booking details. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleCopyBookingId = () => {
    const textToCopy = booking?.bookingReference || booking?.id || "";
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(true);
    toast.success("Booking reference copied!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

    setIsCancelling(true);
    try {
      const response = await bookingService.cancelBooking(
        booking.id,
        cancelReason || undefined,
      );

      if (response.success) {
        toast.success("Booking cancelled successfully");
        setIsCancelModalOpen(false);
        setBooking(response.data);
      } else {
        toast.error(response.message || "Failed to cancel booking");
      }
    } catch (err: unknown) {
      console.error("Failed to cancel booking:", err);

      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message as string | undefined;
        toast.error(message || "Failed to cancel booking. Please try again.");
      } else {
        toast.error("Failed to cancel booking. Please try again.");
      }
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchBooking} />;
  }

  if (notFound || !booking) {
    return <NotFoundState />;
  }

  const status = statusConfig[booking.status] || statusConfig.PENDING;
  const StatusIcon = status.icon;
  const pStatus = booking.payment?.status || "PENDING";
  const paymentStat =
    paymentStatusConfig[pStatus] || paymentStatusConfig.PENDING;
  const PaymentIcon = paymentStat.icon;

  const hostelImage = getHostelImage(booking);
  const hostelName = booking.hostel?.name || "Unknown Hostel";
  const hostelAddress = booking.hostel?.address || "Unknown Address";
  const hostelSlug = booking.hostel?.id || booking.hostelId;
  const roomLabel = formatOccupancy(booking.roomType?.occupancyType || "");
  const pricePerPerson = booking.roomType?.pricePerPerson
    ? formatAmount(booking.roomType.pricePerPerson)
    : null;

  const canCancel = ["PENDING", "PAID", "CONFIRMED"].includes(booking.status);
  const canPay =
    booking.status === "PENDING" && booking.payment?.status !== "SUCCESSFUL";

  const paymentPlanLabel = getPaymentPlanLabel(booking);
  const duration = getDuration(booking);

  const momoNumber = booking.hostel?.paymentDetail?.momoNumber;
  const momoProvider = booking.hostel?.paymentDetail?.momoProvider;
  const accountName = booking.hostel?.paymentDetail?.accountName;

  const hasRoomAssigned = booking.room !== null && booking.room !== undefined;
  const isPendingRoomAssignment = booking.status === "PAID" && !hasRoomAssigned;

  const showReviewSection = canShowReview(booking);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative bg-linear-to-br from-slate-900 via-primary-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[3rem_3rem]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500/20 rounded-full blur-[80px]" />

        <div className="relative container-custom py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link
              href="/bookings"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Bookings
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6"
          >
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
                    status.bgColor,
                    status.color,
                    status.borderColor,
                  )}
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  {status.label}
                </span>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full">
                  <span className="text-xs text-slate-400">Ref:</span>
                  <code className="text-xs font-mono text-white">
                    {booking.bookingReference}
                  </code>
                  <button
                    onClick={handleCopyBookingId}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    {copiedId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                </div>
                {hasRoomAssigned && booking.room && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-full">
                    <Home className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-300">
                      Room {booking.room.roomNumber}
                      {booking.bedNumber && ` • Bed ${booking.bedNumber}`}
                    </span>
                  </div>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {hostelName}
              </h1>
              <p className="text-slate-400 flex items-center gap-1.5 mb-2">
                <MapPin className="w-4 h-4 text-primary-400" />
                {hostelAddress}
              </p>
              <p className="text-slate-500 text-sm">
                Booked on {formatShortDate(booking.createdAt)}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8"
          >
            <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <Bed className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {roomLabel}
                  </p>
                  <p className="text-xs text-slate-400">Room Type</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{duration}</p>
                  <p className="text-xs text-slate-400">Duration</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {paymentPlanLabel}
                  </p>
                  <p className="text-xs text-slate-400">
                    {booking.academicYear || "N/A"}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    GHS {formatAmount(booking.totalAmount)}
                  </p>
                  <p className="text-xs text-slate-400">Total Amount</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 40"
            fill="none"
            className="w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0 40L1440 40L1440 20C1200 0 960 0 720 10C480 20 240 30 0 20Z"
              fill="#f8fafc"
            />
          </svg>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {hasRoomAssigned && (
              <RoomAssignmentCard booking={booking} roomLabel={roomLabel} />
            )}

            {isPendingRoomAssignment && <PendingRoomAssignmentNotice />}

            {showReviewSection && (
              <ReviewSection booking={booking} onReviewChange={fetchBooking} />
            )}

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="relative w-full sm:w-48 h-48 sm:h-auto overflow-hidden">
                  <Image
                    src={hostelImage}
                    alt={hostelName}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent sm:bg-linear-to-r" />
                </div>
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 mb-1">
                        Hostel Information
                      </h2>
                      <p className="text-sm text-slate-500">
                        Your accommodation details
                      </p>
                    </div>
                    <Link
                      href={`/hostels/${hostelSlug}`}
                      className="inline-flex items-center gap-1 text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                    >
                      View Hostel
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Hostel Name</p>
                        <p className="font-medium text-slate-800">
                          {hostelName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-secondary-100 rounded-lg flex items-center justify-center">
                        <Bed className="w-4 h-4 text-secondary-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Room Type</p>
                        <p className="font-medium text-slate-800">
                          {roomLabel}
                          {pricePerPerson && (
                            <span className="text-sm text-slate-500 ml-1">
                              (GHS {pricePerPerson}/person)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Address</p>
                        <p className="font-medium text-slate-800">
                          {hostelAddress}
                        </p>
                      </div>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="mt-5 pt-5 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-2">
                        Booking Notes
                      </p>
                      <p className="text-sm text-slate-700">{booking.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Booking Period
                  </h2>
                  <p className="text-sm text-slate-500">
                    {paymentPlanLabel}
                    {booking.academicYear && ` • ${booking.academicYear}`}
                  </p>
                </div>
              </div>

              {booking.checkInDate &&
              (booking.expectedCheckOutDate || booking.checkOutDate) ? (
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex flex-col items-center justify-center mb-2 mx-auto">
                      <span className="text-xl font-bold text-emerald-700">
                        {new Date(booking.checkInDate).getDate()}
                      </span>
                      <span className="text-[10px] text-emerald-600 uppercase font-semibold">
                        {new Date(booking.checkInDate).toLocaleDateString(
                          "en-US",
                          { month: "short" },
                        )}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      Check-in
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(booking.checkInDate)}
                    </p>
                  </div>

                  <div className="flex-1 mx-6 relative">
                    <div className="border-t-2 border-dashed border-slate-200" />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex flex-col items-center justify-center mb-2 mx-auto">
                      <span className="text-xl font-bold text-red-700">
                        {new Date(
                          booking.expectedCheckOutDate || booking.checkOutDate!,
                        ).getDate()}
                      </span>
                      <span className="text-[10px] text-red-600 uppercase font-semibold">
                        {new Date(
                          booking.expectedCheckOutDate || booking.checkOutDate!,
                        ).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      Expected Check-out
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(
                        booking.expectedCheckOutDate || booking.checkOutDate,
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-slate-600">
                    Check-in and check-out dates will be assigned after
                    confirmation.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Plan: {paymentPlanLabel} ({duration})
                  </p>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Payment Information
                    </h2>
                    <p className="text-sm text-slate-500">
                      Transaction details
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
                    paymentStat.bgColor,
                    paymentStat.color,
                    paymentStat.borderColor,
                  )}
                >
                  <PaymentIcon className="w-3.5 h-3.5" />
                  {paymentStat.label}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Payment Plan</span>
                  <span className="font-semibold text-slate-800">
                    {paymentPlanLabel}
                  </span>
                </div>

                {booking.payment && (
                  <>
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                      <span className="text-sm text-slate-500">
                        Payment Method
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-yellow-400 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold text-yellow-900">
                            M
                          </span>
                        </div>
                        <span className="font-semibold text-slate-800">
                          {booking.payment.method || "Mobile Money"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                      <span className="text-sm text-slate-500">
                        Payment Reference
                      </span>
                      <code className="bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-mono text-slate-700">
                        {booking.payment.paymentReference}
                      </code>
                    </div>

                    {booking.payment.amount && (
                      <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <span className="text-sm text-slate-500">
                          Amount Paid
                        </span>
                        <span className="font-semibold text-slate-800">
                          GHS {formatAmount(booking.payment.amount)}
                        </span>
                      </div>
                    )}

                    {booking.payment.paidAt && (
                      <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <span className="text-sm text-slate-500">Paid On</span>
                        <span className="font-semibold text-slate-800">
                          {formatShortDate(booking.payment.paidAt)}
                        </span>
                      </div>
                    )}

                    {booking.payment.failureReason && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-xs text-red-600 font-semibold mb-1">
                          Failure Reason
                        </p>
                        <p className="text-sm text-red-700">
                          {booking.payment.failureReason}
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-center justify-between pt-3">
                  <span className="text-lg font-bold text-slate-800">
                    Total Amount
                  </span>
                  <span className="text-2xl font-bold text-primary-600">
                    GHS {formatAmount(booking.totalAmount)}
                  </span>
                </div>
              </div>

              {canPay && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <Link
                    href={`/bookings/${booking.id}/pay`}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    Pay Now — GHS {formatAmount(booking.totalAmount)}
                  </Link>
                </div>
              )}
            </motion.div>

            {booking.status === "CANCELLED" && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl border border-red-200 shadow-sm p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Cancellation Details
                    </h2>
                    <p className="text-sm text-slate-500">
                      This booking has been cancelled
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {booking.cancelledAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        Cancelled On
                      </span>
                      <span className="font-medium text-slate-800">
                        {formatDate(booking.cancelledAt)}
                      </span>
                    </div>
                  )}
                  {booking.cancelReason && (
                    <div>
                      <span className="text-sm text-slate-500">Reason</span>
                      <p className="mt-1 text-sm text-slate-700 bg-red-50 rounded-lg p-3">
                        {booking.cancelReason}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {booking.student && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Student Information
                    </h2>
                    <p className="text-sm text-slate-500">
                      Your registered details
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-linear-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center">
                    <span className="text-xl font-bold text-white">
                      {booking.student.firstName[0]}
                      {booking.student.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {booking.student.firstName} {booking.student.lastName}
                    </p>
                    <p className="text-sm text-slate-500">
                      {booking.student.email}
                    </p>
                    {booking.student.studentProfile?.studentId && (
                      <p className="text-xs text-slate-400">
                        ID: {booking.student.studentProfile.studentId}
                        {booking.student.studentProfile.programme &&
                          ` • ${booking.student.studentProfile.programme}`}
                        {booking.student.studentProfile.level &&
                          ` • Level ${booking.student.studentProfile.level}`}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
            >
              <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href={`/hostels/${hostelSlug}`}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Building2 className="w-4 h-4 text-slate-600" />
                    </div>
                    <span className="font-medium text-sm">View Hostel</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                {canPay && (
                  <Link
                    href={`/bookings/${booking.id}/pay`}
                    className="flex items-center justify-between p-3 bg-primary-50 rounded-xl text-primary-700 hover:bg-primary-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <CreditCard className="w-4 h-4 text-primary-600" />
                      </div>
                      <span className="font-medium text-sm">Make Payment</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-primary-400 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}

                {showReviewSection && !booking.review && (
                  <button
                    onClick={() => {
                      document
                        .querySelector("[data-review-section]")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="w-full flex items-center justify-between p-3 bg-amber-50 rounded-xl text-amber-700 hover:bg-amber-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Star className="w-4 h-4 text-amber-600" />
                      </div>
                      <span className="font-medium text-sm">
                        Leave a Review
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}

                <Link
                  href={`/complaints/new?hostel=${booking.hostelId}`}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <MessageSquare className="w-4 h-4 text-slate-600" />
                    </div>
                    <span className="font-medium text-sm">
                      Submit Complaint
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                {canCancel && (
                  <button
                    onClick={() => setIsCancelModalOpen(true)}
                    className="w-full flex items-center justify-between p-3 bg-red-50 rounded-xl text-red-700 hover:bg-red-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <XCircle className="w-4 h-4 text-red-600" />
                      </div>
                      <span className="font-medium text-sm">
                        Cancel Booking
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </motion.div>

            {(momoNumber || accountName) && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
              >
                <h3 className="font-bold text-slate-900 mb-4">
                  Hostel Contact
                </h3>
                {accountName && (
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 bg-linear-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center">
                      <span className="text-xl font-bold text-white">
                        {accountName
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {accountName}
                      </p>
                      <p className="text-sm text-slate-500">
                        {momoProvider || "Mobile Money"}
                      </p>
                    </div>
                  </div>
                )}
                {momoNumber && (
                  <a
                    href={`tel:${momoNumber}`}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-primary-600" />
                    <span className="text-sm">{momoNumber}</span>
                  </a>
                )}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-linear-to-br from-primary-600 to-primary-700 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-[30px]" />

              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-white mb-2">Need Help?</h3>
                <p className="text-primary-100 text-sm mb-4">
                  If you have any issues with your booking, our support team is
                  here to help.
                </p>
                <Link
                  href="/support"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-primary-700 rounded-xl font-semibold text-sm hover:bg-primary-50 transition-colors"
                >
                  Contact Support
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isCancelModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setIsCancelModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Cancel Booking
                      </h3>
                      <p className="text-sm text-slate-500">
                        This action cannot be undone
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCancelModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-sm font-semibold text-red-800 mb-1">
                    Are you sure?
                  </p>
                  <p className="text-sm text-red-700">
                    You are about to cancel your booking at{" "}
                    <strong>{hostelName}</strong> (Ref:{" "}
                    {booking.bookingReference}). Please contact support if you
                    need assistance with refunds.
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Reason for cancellation (optional)
                  </label>
                  <textarea
                    placeholder="Please let us know why you're cancelling..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsCancelModalOpen(false)}
                    disabled={isCancelling}
                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    Keep Booking
                  </button>
                  <button
                    onClick={handleCancelBooking}
                    disabled={isCancelling}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isCancelling ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Cancel Booking
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
