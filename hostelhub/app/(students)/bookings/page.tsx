"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Search,
  Filter,
  Plus,
  ArrowRight,
  CreditCard,
  X,
  Check,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Bed,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { bookingService } from "@/services/booking.service";
import type { Booking, BookingStatus } from "@/types/booking";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

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

const filterOptions = [
  { value: "all", label: "All Bookings" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "CHECKED_IN", label: "Checked In" },
  { value: "CHECKED_OUT", label: "Checked Out" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "EXPIRED", label: "Expired" },
];

const isActiveBooking = (b: Booking) =>
  ["PENDING", "PAID", "CONFIRMED", "CHECKED_IN"].includes(b.status);

const isPastBooking = (b: Booking) =>
  ["CHECKED_OUT", "CANCELLED", "EXPIRED"].includes(b.status);

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

function BookingCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-48 h-40 sm:h-auto bg-slate-200" />
        <div className="flex-1 p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-5 w-40 bg-slate-200 rounded-lg" />
              <div className="h-4 w-32 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-6 w-24 bg-slate-200 rounded-full" />
          </div>
          <div className="h-4 w-48 bg-slate-100 rounded-lg" />
          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <div className="h-4 w-24 bg-slate-100 rounded-lg" />
            <div className="h-4 w-32 bg-slate-100 rounded-lg" />
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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-red-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">
        Something went wrong
      </h3>
      <p className="text-slate-500 max-w-sm mb-6">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}

function EmptyState({
  filter,
  onClear,
}: {
  filter: string;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-6">
        <Calendar className="w-10 h-10 text-slate-300" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">
        No bookings found
      </h3>
      <p className="text-slate-500 max-w-sm mb-6">
        {filter === "all"
          ? "You haven't made any bookings yet. Start by browsing our verified hostels."
          : `No ${statusConfig[filter as BookingStatus]?.label?.toLowerCase() || filter} bookings found.`}
      </p>
      {filter === "all" ? (
        <Link
          href="/hostels"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
        >
          <Building2 className="w-4 h-4" />
          Browse Hostels
        </Link>
      ) : (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
        >
          <X className="w-4 h-4" />
          Clear Filter
        </button>
      )}
    </div>
  );
}

function BookingCard({
  booking,
  index,
  isPast = false,
}: {
  booking: Booking;
  index: number;
  isPast?: boolean;
}) {
  const status = statusConfig[booking.status] || statusConfig.PENDING;
  const StatusIcon = status.icon;

  const formatDate = (date: string | null) => {
    if (!date) return "TBD";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const hostelImage = getHostelImage(booking);
  const hostelName = booking.hostel?.name || "Unknown Hostel";
  const hostelAddress = booking.hostel?.address || "Unknown Address";
  const roomLabel = formatOccupancy(booking.roomType?.occupancyType || "");
  const paymentStatus = booking.payment?.status || "PENDING";
  const isPaymentDone = paymentStatus === "SUCCESSFUL";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/bookings/${booking.id}`}>
        <motion.div
          whileHover={{ y: -2 }}
          className={cn(
            "group bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden",
            isPast && "opacity-75 hover:opacity-100",
          )}
        >
          <div className="flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-48 h-40 sm:h-auto overflow-hidden">
              <Image
                src={hostelImage}
                alt={hostelName}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent sm:bg-linear-to-r" />

              <div className="absolute bottom-3 left-3 sm:hidden">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border",
                    status.bgColor,
                    status.color,
                    status.borderColor,
                  )}
                >
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </span>
              </div>
            </div>

            <div className="flex-1 p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                      {hostelName}
                    </h3>
                    <span
                      className={cn(
                        "hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border",
                        status.bgColor,
                        status.color,
                        status.borderColor,
                      )}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary-500" />
                    {hostelAddress}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-2xl font-bold text-slate-900">
                    GHS {formatAmount(booking.totalAmount)}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    {booking.bookingReference}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Bed className="w-4 h-4 text-slate-500" />
                  </div>
                  <span>{roomLabel}</span>
                </div>

                {(booking.checkInDate || booking.checkOutDate) && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-slate-500" />
                    </div>
                    <span>
                      {formatDate(booking.checkInDate)} –{" "}
                      {formatDate(booking.checkOutDate)}
                    </span>
                  </div>
                )}

                {!booking.checkInDate && booking.paymentPlan && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-slate-500" />
                    </div>
                    <span>
                      {booking.paymentPlan === "FULL_YEAR"
                        ? "Full Year"
                        : booking.semesterPeriod === "FIRST_SEMESTER"
                          ? "1st Semester"
                          : "2nd Semester"}
                      {booking.academicYear && ` • ${booking.academicYear}`}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center",
                      isPaymentDone ? "bg-emerald-100" : "bg-amber-100",
                    )}
                  >
                    <CreditCard
                      className={cn(
                        "w-4 h-4",
                        isPaymentDone ? "text-emerald-600" : "text-amber-600",
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "capitalize font-medium",
                      isPaymentDone ? "text-emerald-600" : "text-amber-600",
                    )}
                  >
                    {paymentStatus === "SUCCESSFUL"
                      ? "Paid"
                      : paymentStatus.toLowerCase()}
                  </span>
                </div>

                <div className="sm:ml-auto flex items-center gap-1 text-primary-600 text-sm font-semibold group-hover:gap-2 transition-all">
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default function BookingsPage() {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });

  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/bookings");
    }
  }, [user, authLoading, router]);

  const fetchBookings = useCallback(async () => {

     if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params: { page: number; limit: number; status?: string } = {
        page,
        limit: 20,
      };

      if (filter !== "all") {
        params.status = filter;
      }

      const response = await bookingService.getMyBookings(params);

      if (response.success) {
        setBookings(response.data);
        if (response.pagination) {
          setPagination({
            pages: response.pagination.pages,
            total: response.pagination.total,
          });
        }
      } else {
        setError("Failed to fetch bookings");
      }
    } catch (err: unknown) {
      console.error("Failed to fetch bookings:", err);

      if (err instanceof Error && "response" in err) {
        const axiosError = err as {
          response?: {
            status?: number;
            data?: { message?: string };
          };
          message?: string;
        };

        if (axiosError.response?.status === 401) {
          setError("Please log in to view your bookings.");
          router.push('/login?redirect=/bookings');
        } else if (axiosError.response?.status === 403) {
          setError("You don't have permission to view these bookings.");
        } else {
          setError(
            axiosError.response?.data?.message ||
              axiosError.message ||
              "Failed to load bookings. Please try again.",
          );
        }
      } else if (err instanceof Error) {
        setError(err.message || "Failed to load bookings. Please try again.");
      } else {
        setError("Failed to load bookings. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [filter, page, user, router]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    if (!showFilterDropdown) return;
    const handler = () => setShowFilterDropdown(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showFilterDropdown]);

  const filteredBookings = bookings.filter((booking) => {
    if (searchQuery === "") return true;
    const hostelName = booking.hostel?.name || "";
    const ref = booking.bookingReference || "";
    const query = searchQuery.toLowerCase();
    return (
      hostelName.toLowerCase().includes(query) ||
      ref.toLowerCase().includes(query) ||
      booking.id.toLowerCase().includes(query)
    );
  });

  const activeBookings = filteredBookings.filter(isActiveBooking);
  const pastBookings = filteredBookings.filter(isPastBooking);

  const stats = {
    total: pagination.total || bookings.length,
    active: bookings.filter(isActiveBooking).length,
    completed: bookings.filter((b) => b.status === "CHECKED_OUT").length,
    totalSpent: bookings
      .filter((b) => b.payment?.status === "SUCCESSFUL")
      .reduce((sum, b) => {
        const amt =
          typeof b.totalAmount === "string"
            ? parseFloat(b.totalAmount)
            : b.totalAmount;
        return sum + (isNaN(amt) ? 0 : amt);
      }, 0),
  };

  const currentFilterLabel =
    filterOptions.find((o) => o.value === filter)?.label || "All";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative bg-linear-to-br from-slate-900 via-primary-900 to-slate-900">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[3rem_3rem]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative container-custom py-10 sm:py-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs text-slate-300 mb-4">
                  <Calendar className="w-3.5 h-3.5 text-primary-400" />
                  {isLoading
                    ? "..."
                    : `${stats.total} total booking${stats.total !== 1 ? "s" : ""}`}
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  My{" "}
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-400 to-secondary-400">
                    Bookings
                  </span>
                </h1>
                <p className="text-slate-400">
                  Manage your hostel reservations and payments
                </p>
              </div>
              <Link
                href="/hostels"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-100 transition-colors shadow-lg shrink-0"
              >
                <Plus className="w-4 h-4" />
                Book New Hostel
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {isLoading ? "—" : stats.total}
                    </p>
                    <p className="text-xs text-slate-400">Total</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {isLoading ? "—" : stats.active}
                    </p>
                    <p className="text-xs text-slate-400">Active</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {isLoading ? "—" : stats.completed}
                    </p>
                    <p className="text-xs text-slate-400">Completed</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {isLoading
                        ? "—"
                        : `GHS ${stats.totalSpent.toLocaleString()}`}
                    </p>
                    <p className="text-xs text-slate-400">Total Spent</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 p-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by hostel name or booking reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/90 backdrop-blur-sm rounded-xl border-0 focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800 placeholder:text-slate-400 transition-all text-sm"
              />
            </div>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFilterDropdown(!showFilterDropdown);
                }}
                className="flex items-center gap-2 px-4 py-3 bg-white/90 backdrop-blur-sm rounded-xl text-sm font-medium text-slate-700 hover:bg-white transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">{currentFilterLabel}</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    showFilterDropdown && "rotate-180",
                  )}
                />
              </button>

              <AnimatePresence>
                {showFilterDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="py-1">
                      {filterOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setFilter(option.value);
                            setShowFilterDropdown(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between",
                            filter === option.value
                              ? "bg-primary-50 text-primary-600 font-semibold"
                              : "text-slate-700 hover:bg-slate-50",
                          )}
                        >
                          {option.label}
                          {filter === option.value && (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
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
        {filter !== "all" && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-slate-500">Filtered by:</span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
                statusConfig[filter as BookingStatus]?.bgColor,
                statusConfig[filter as BookingStatus]?.color,
                statusConfig[filter as BookingStatus]?.borderColor,
              )}
            >
              {statusConfig[filter as BookingStatus]?.label}
              <button
                onClick={() => setFilter("all")}
                className="ml-1 hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <BookingCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchBookings} />
        ) : filteredBookings.length === 0 ? (
          <EmptyState filter={filter} onClear={() => setFilter("all")} />
        ) : (
          <div className="space-y-8">
            {activeBookings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Active Bookings
                    </h2>
                    <p className="text-sm text-slate-500">
                      {activeBookings.length} booking
                      {activeBookings.length !== 1 && "s"} in progress
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {activeBookings.map((booking, index) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      index={index}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {pastBookings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Past Bookings
                    </h2>
                    <p className="text-sm text-slate-500">
                      {pastBookings.length} past booking
                      {pastBookings.length !== 1 && "s"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {pastBookings.map((booking, index) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      index={index}
                      isPast
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-slate-500">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(pagination.pages, p + 1))
                  }
                  disabled={page === pagination.pages}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {!isLoading && !error && filteredBookings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 p-6 sm:p-8 bg-linear-to-r from-primary-600 to-primary-700 rounded-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Need Another Room?
                </h3>
                <p className="text-primary-100">
                  Browse our verified hostels and find your next accommodation
                </p>
              </div>
              <Link
                href="/hostels"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 rounded-xl font-semibold hover:bg-primary-50 transition-colors shadow-lg shrink-0"
              >
                Browse Hostels
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
