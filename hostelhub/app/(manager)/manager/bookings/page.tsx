"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  Phone,
  Mail,
  CreditCard,
  AlertCircle,
  MoreVertical,
  Ban,
  RefreshCw,
  FileText,
  ArrowUpDown,
  Loader2,
  UserCheck,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { bookingService } from "@/services/booking.service";
import api from "@/lib/api";
import type {
  Booking,
  BookingStatus,
  OccupancyType,
  PaymentStatus,
} from "@/types/booking";
import type { AxiosError } from "axios";
import Swal from "sweetalert2";
import { RoomAssignmentModal } from "@/components/manager/RoomAssignmentModal";

interface ManagerHostel {
  id: string;
  name: string;
  status: string;
}

interface HostelApiResponse {
  success: boolean;
  data: Array<{
    id: string;
    name: string;
    status: string;
    [key: string]: unknown;
  }>;
}

interface ApiErrorResponse {
  message?: string;
  errors?: Array<{ message: string }>;
}

interface FilterState {
  search: string;
  status: BookingStatus | "all";
  sortBy: "newest" | "oldest" | "amount_high" | "amount_low";
}

interface NotificationState {
  type: "success" | "error";
  message: string;
}

function toNumber(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  return typeof val === "string" ? parseFloat(val) : val;
}

function getTenantName(booking: Booking): string {
  if (booking.booker) {
    return `${booking.booker.firstName} ${booking.booker.lastName}`;
  }
  return "Unknown Student/Guest";
}

function getTenantEmail(booking: Booking): string {
  return booking.booker?.email || "—";
}

function getTenantPhone(booking: Booking): string {
  return booking.booker?.phone || "—";
}

function getStatusConfig(status: BookingStatus) {
  const configs: Record<
    BookingStatus,
    {
      label: string;
      variant: "warning" | "success" | "primary" | "secondary" | "error";
      icon: React.ElementType;
    }
  > = {
    PENDING: { label: "Pending", variant: "warning", icon: Clock },
    PAID: { label: "Paid", variant: "primary", icon: CreditCard },
    CONFIRMED: { label: "Confirmed", variant: "success", icon: Check },
    CHECKED_IN: { label: "Checked In", variant: "primary", icon: Building2 },
    CHECKED_OUT: {
      label: "Checked Out",
      variant: "secondary",
      icon: Building2,
    },
    CANCELLED: { label: "Cancelled", variant: "error", icon: X },
    EXPIRED: { label: "Expired", variant: "secondary", icon: AlertCircle },
  };
  return configs[status];
}

function getPaymentInfo(booking: Booking): {
  label: string;
  variant: "success" | "warning" | "error" | "secondary";
} {
  if (!booking.payment) {
    if (booking.status === "CANCELLED") {
      return { label: "—", variant: "secondary" };
    }
    return { label: "Awaiting Payment", variant: "warning" };
  }

  const map: Record<
    PaymentStatus,
    {
      label: string;
      variant: "success" | "warning" | "error" | "secondary";
    }
  > = {
    SUCCESSFUL: { label: "Paid", variant: "success" },
    PENDING: { label: "Processing", variant: "warning" },
    FAILED: { label: "Failed", variant: "error" },
    REFUNDED: { label: "Refunded", variant: "secondary" },
  };

  return (
    map[booking.payment.status] || { label: "Unknown", variant: "secondary" }
  );
}

function getDisbursementInfo(booking: Booking): {
  label: string;
  variant: "success" | "warning" | "error" | "secondary" | "primary";
} | null {
  if (!booking.payment || !booking.payment.disbursement) {
    if (booking.payment?.status === "SUCCESSFUL") {
      return { label: "Disbursement Pending", variant: "warning" };
    }
    return null;
  }

  const status = booking.payment.disbursement.status;
  const map: Record<
    string,
    { label: string; variant: "success" | "warning" | "error" | "primary" }
  > = {
    COMPLETED: { label: "Disbursed ✓", variant: "success" },
    PROCESSING: { label: "Disbursing...", variant: "primary" },
    PENDING: { label: "Disbursement Pending", variant: "warning" },
    FAILED: { label: "Disbursement Failed", variant: "error" },
  };

  return map[status] || { label: "Unknown", variant: "secondary" as const };
}

function formatCurrencyShort(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `GHS ${num.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getOccupancyLabel(type: OccupancyType): string {
  const labels: Record<OccupancyType, string> = {
    IN_1: "1 in a Room",
    IN_2: "2 in a Room",
    IN_3: "3 in a Room",
    IN_4: "4 in a Room",
  };
  return labels[type] || type;
}

function getOccupancyShort(type: OccupancyType): string {
  const labels: Record<OccupancyType, string> = {
    IN_1: "1-in-1",
    IN_2: "2-in-1",
    IN_3: "3-in-1",
    IN_4: "4-in-1",
  };
  return labels[type] || type;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: string | number): string {
  const num = toNumber(amount);
  return `GHS ${num.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return formatDate(dateString);
}

function getSemesterLabel(booking: Booking): string {
  const parts: string[] = [];
  if (booking.academicYear) parts.push(booking.academicYear);
  if (booking.semesterPeriod) {
    parts.push(booking.semesterPeriod === "FIRST_SEMESTER" ? "Sem 1" : "Sem 2");
  }
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    return axiosError.response?.data?.message || error.message;
  }
  return "An unexpected error occurred";
}

function NotificationBanner({
  notification,
  onDismiss,
}: {
  notification: NotificationState;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "rounded-xl border p-4 flex items-center justify-between",
        notification.type === "success"
          ? "bg-green-50 border-green-200 text-green-800"
          : "bg-red-50 border-red-200 text-red-800",
      )}
    >
      <div className="flex items-center gap-2">
        {notification.type === "success" ? (
          <Check className="w-4 h-4" />
        ) : (
          <AlertCircle className="w-4 h-4" />
        )}
        <p className="text-sm font-medium">{notification.message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 hover:bg-black/5 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

function HostelSelector({
  hostels,
  selectedId,
  onChange,
  loading,
}: {
  hostels: ManagerHostel[];
  selectedId: string;
  onChange: (id: string) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          <span className="text-sm text-slate-500">Loading hostels...</span>
        </div>
      </div>
    );
  }

  if (hostels.length === 0) return null;
  if (hostels.length === 1) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Select Hostel
      </label>
      <div className="flex flex-wrap gap-2">
        {hostels.map((hostel) => (
          <button
            key={hostel.id}
            onClick={() => onChange(hostel.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              selectedId === hostel.id
                ? "bg-primary-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            <Building2 className="w-4 h-4 inline mr-1.5" />
            {hostel.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function BookingStats({
  bookings,
  loading,
}: {
  bookings: Booking[];
  loading: boolean;
}) {
  const stats = useMemo(() => {
    const pending = bookings.filter((b) => b.status === "PENDING").length;
    const paid = bookings.filter((b) => b.status === "PAID").length;
    const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
    const checkedIn = bookings.filter((b) => b.status === "CHECKED_IN").length;
    const revenue = bookings
      .filter((b) => b.payment?.status === "SUCCESSFUL")
      .reduce((sum, b) => sum + toNumber(b.totalAmount), 0);

    return [
      {
        label: "Awaiting Payment",
        value: pending,
        icon: Clock,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
      },
      {
        label: "Awaiting Assignment",
        value: paid,
        icon: UserCheck,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      },
      {
        label: "Active Tenants",
        value: confirmed + checkedIn,
        icon: Building2,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      },
      {
        label: "Revenue Collected",
        value: formatCurrency(revenue),
        icon: CreditCard,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
        isAmount: true,
      },
    ];
  }, [bookings]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("bg-white rounded-xl border p-4", stat.borderColor)}
        >
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", stat.bgColor)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              {loading ? (
                <div className="h-7 w-12 bg-slate-200 rounded animate-pulse mt-1" />
              ) : (
                <p
                  className={cn(
                    "font-bold text-slate-800",
                    stat.isAmount ? "text-lg" : "text-2xl",
                  )}
                >
                  {stat.value}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function FilterBar({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or booking ref..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) =>
              onChange({
                ...filters,
                status: e.target.value as BookingStatus | "all",
              })
            }
            className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="CHECKED_OUT">Checked Out</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="EXPIRED">Expired</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filters.sortBy}
            onChange={(e) =>
              onChange({
                ...filters,
                sortBy: e.target.value as FilterState["sortBy"],
              })
            }
            className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount_high">Amount: High to Low</option>
            <option value="amount_low">Amount: Low to High</option>
          </select>
          <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  onAction,
  actionLoading,
}: {
  booking: Booking;
  onAction: (action: string, booking: Booking) => void;
  actionLoading: string | null;
}) {
  const [showActions, setShowActions] = useState(false);
  const statusConfig = getStatusConfig(booking.status);
  const paymentInfo = getPaymentInfo(booking);
  const tenantName = getTenantName(booking);
  const isLoading = actionLoading === booking.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
    >
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={tenantName} size="md" />
          <div>
            <h3 className="font-semibold text-slate-800">{tenantName}</h3>
            <p className="text-xs text-slate-500">{booking.bookingReference}</p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-slate-400" />
          </button>
          <AnimatePresence>
            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowActions(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20"
                >
                  <button
                    onClick={() => {
                      onAction("view", booking);
                      setShowActions(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  {booking.status === "PAID" && (
                    <button
                      onClick={() => {
                        onAction("assign", booking);
                        setShowActions(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                    >
                      <UserCheck className="w-4 h-4" />
                      Assign Room
                    </button>
                  )}
                  {booking.status === "CONFIRMED" && (
                    <button
                      onClick={() => {
                        onAction("check_in", booking);
                        setShowActions(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                    >
                      <Building2 className="w-4 h-4" />
                      Check In
                    </button>
                  )}
                  {booking.status === "CHECKED_IN" && (
                    <button
                      onClick={() => {
                        onAction("check_out", booking);
                        setShowActions(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      <Building2 className="w-4 h-4" />
                      Check Out
                    </button>
                  )}
                  {["PENDING", "PAID", "CONFIRMED"].includes(
                    booking.status,
                  ) && (
                    <button
                      onClick={() => {
                        onAction("cancel", booking);
                        setShowActions(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-slate-100"
                    >
                      <Ban className="w-4 h-4" />
                      Cancel Booking
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant={statusConfig.variant} size="sm">
            <statusConfig.icon className="w-3 h-3 mr-1" />
            {statusConfig.label}
          </Badge>
          <Badge variant={paymentInfo.variant} size="sm">
            {paymentInfo.label}
          </Badge>

          {(() => {
            const disbInfo = getDisbursementInfo(booking);
            if (!disbInfo) return null;
            return (
              <Badge variant={disbInfo.variant} size="sm">
                <Banknote className="w-3 h-3 mr-1" />
                {disbInfo.label}
              </Badge>
            );
          })()}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-400 text-xs">Room Type</p>
            <p className="text-slate-700 font-medium">
              {getOccupancyShort(booking.roomType.occupancyType)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Plan</p>
            <p className="text-slate-700 font-medium">
              {booking.paymentPlan === "FULL_YEAR" ? "Full Year" : "Semester"}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Period</p>
            <p className="text-slate-700 font-medium">
              {getSemesterLabel(booking)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Price/Person</p>
            <p className="text-slate-700 font-medium">
              {formatCurrency(booking.roomType.pricePerPerson)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-400">Total Amount</p>
            <p className="text-lg font-bold text-slate-800">
              {formatCurrency(booking.totalAmount)}
            </p>
          </div>
          <p className="text-xs text-slate-400">
            {formatRelativeTime(booking.createdAt)}
          </p>
        </div>
      </div>

      {booking.status === "PAID" && (
        <div className="px-4 py-3 border-t border-slate-100 bg-blue-50">
          <Button
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => onAction("assign", booking)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <UserCheck className="w-4 h-4 mr-1" />
            )}
            Assign Room & Confirm
          </Button>
        </div>
      )}

      {booking.status === "CONFIRMED" && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => onAction("cancel", booking)}
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onAction("check_in", booking)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Building2 className="w-4 h-4 mr-1" />
            )}
            Check In
          </Button>
        </div>
      )}
    </motion.div>
  );
}

function BookingTableRow({
  booking,
  onAction,
  actionLoading,
}: {
  booking: Booking;
  onAction: (action: string, booking: Booking) => void;
  actionLoading: string | null;
}) {
  const [showActions, setShowActions] = useState(false);
  const statusConfig = getStatusConfig(booking.status);
  const paymentInfo = getPaymentInfo(booking);
  const tenantName = getTenantName(booking);
  const isLoading = actionLoading === booking.id;

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={tenantName} size="sm" />
          <div>
            <p className="font-medium text-slate-800 text-sm">{tenantName}</p>
            <p className="text-xs text-slate-400">{booking.bookingReference}</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <p className="text-sm text-slate-700">
          {getOccupancyShort(booking.roomType.occupancyType)}
        </p>
        <p className="text-xs text-slate-400">
          {formatCurrency(booking.roomType.pricePerPerson)}/person
        </p>
      </td>

      <td className="px-4 py-3">
        <p className="text-sm text-slate-700">
          {booking.paymentPlan === "FULL_YEAR" ? "Full Year" : "Semester"}
        </p>
        <p className="text-xs text-slate-400">{getSemesterLabel(booking)}</p>
      </td>

      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-slate-800">
          {formatCurrency(booking.totalAmount)}
        </p>
      </td>

      <td className="px-4 py-3">
        <Badge variant={statusConfig.variant} size="sm">
          <statusConfig.icon className="w-3 h-3 mr-1" />
          {statusConfig.label}
        </Badge>
      </td>

      <td className="px-4 py-3">
        <Badge variant={paymentInfo.variant} size="sm">
          {paymentInfo.label}
        </Badge>
      </td>

      <td className="px-4 py-3">
        {(() => {
          const disbInfo = getDisbursementInfo(booking);
          if (!disbInfo)
            return <span className="text-xs text-slate-400">—</span>;
          return (
            <Badge variant={disbInfo.variant} size="sm">
              {disbInfo.label}
            </Badge>
          );
        })()}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {booking.status === "PAID" && (
            <button
              onClick={() => onAction("assign", booking)}
              disabled={isLoading}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
              title="Assign Room & Confirm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
            </button>
          )}
          {booking.status === "CONFIRMED" && (
            <button
              onClick={() => onAction("check_in", booking)}
              disabled={isLoading}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              title="Check In"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Building2 className="w-4 h-4" />
              )}
            </button>
          )}
          {booking.status === "CHECKED_IN" && (
            <button
              onClick={() => onAction("check_out", booking)}
              disabled={isLoading}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              title="Check Out"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Building2 className="w-4 h-4" />
              )}
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showActions && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowActions(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20"
                  >
                    <button
                      onClick={() => {
                        onAction("view", booking);
                        setShowActions(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    {booking.status === "PAID" && (
                      <button
                        onClick={() => {
                          onAction("assign", booking);
                          setShowActions(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                      >
                        <UserCheck className="w-4 h-4" />
                        Assign Room
                      </button>
                    )}
                    {booking.status === "CONFIRMED" && (
                      <button
                        onClick={() => {
                          onAction("check_in", booking);
                          setShowActions(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                      >
                        <Building2 className="w-4 h-4" />
                        Check In
                      </button>
                    )}
                    {booking.status === "CHECKED_IN" && (
                      <button
                        onClick={() => {
                          onAction("check_out", booking);
                          setShowActions(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        <Building2 className="w-4 h-4" />
                        Check Out
                      </button>
                    )}
                    {["PENDING", "PAID", "CONFIRMED"].includes(
                      booking.status,
                    ) && (
                      <button
                        onClick={() => {
                          onAction("cancel", booking);
                          setShowActions(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-slate-100"
                      >
                        <Ban className="w-4 h-4" />
                        Cancel Booking
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </td>
    </tr>
  );
}

function BookingDetailModal({
  booking,
  onClose,
  onAction,
  actionLoading,
}: {
  booking: Booking;
  onClose: () => void;
  onAction: (action: string, booking: Booking) => void;
  actionLoading: string | null;
}) {
  const statusConfig = getStatusConfig(booking.status);
  const paymentInfo = getPaymentInfo(booking);
  const tenantName = getTenantName(booking);
  const isLoading = actionLoading === booking.id;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-y-auto max-h-[90vh]"
      >
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Booking Details
            </h2>
            <p className="text-sm text-slate-500">{booking.bookingReference}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant={statusConfig.variant} size="md">
              <statusConfig.icon className="w-3.5 h-3.5 mr-1.5" />
              {statusConfig.label}
            </Badge>
            <Badge variant={paymentInfo.variant} size="md">
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              {paymentInfo.label}
            </Badge>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              Tenant Information
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={tenantName} size="lg" />
              <div>
                <p className="font-medium text-slate-800">{tenantName}</p>
                {booking.booker?.studentProfile?.studentId && (
                  <p className="text-sm text-slate-500">
                    ID: {booking.booker.studentProfile.studentId}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                {getTenantEmail(booking)}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                {getTenantPhone(booking)}
              </div>
              {booking.booker?.studentProfile?.programme && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FileText className="w-4 h-4 text-slate-400" />
                  {booking.booker.studentProfile.programme}
                  {booking.booker.studentProfile.level &&
                    ` · Level ${booking.booker.studentProfile.level}`}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              Accommodation
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Room Type</p>
                <p className="text-sm font-medium text-slate-800">
                  {getOccupancyLabel(booking.roomType.occupancyType)}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Price/Person</p>
                <p className="text-sm font-medium text-slate-800">
                  {formatCurrency(booking.roomType.pricePerPerson)}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Payment Plan</p>
                <p className="text-sm font-medium text-slate-800">
                  {booking.paymentPlan === "FULL_YEAR"
                    ? "Full Year"
                    : "Per Semester"}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Academic Period</p>
                <p className="text-sm font-medium text-slate-800">
                  {getSemesterLabel(booking)}
                </p>
              </div>
            </div>
          </div>

          {(booking.checkInDate || booking.checkOutDate) && (
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">
                Stay Period
              </h3>
              <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4">
                <div className="flex-1 text-center">
                  <p className="text-xs text-slate-400 mb-1">Check-in</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {formatDate(booking.checkInDate)}
                  </p>
                </div>
                <div className="w-8 h-px bg-slate-300" />
                <div className="flex-1 text-center">
                  <p className="text-xs text-slate-400 mb-1">Check-out</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {formatDate(booking.checkOutDate)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              Payment
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Total Amount</p>
                <p className="text-sm font-bold text-slate-800">
                  {formatCurrency(booking.totalAmount)}
                </p>
              </div>
              {booking.payment && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">Payment Status</p>
                    <Badge variant={paymentInfo.variant} size="sm">
                      {paymentInfo.label}
                    </Badge>
                  </div>
                  {booking.payment.paidAt && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-600">Paid At</p>
                      <p className="text-sm text-slate-800">
                        {formatDate(booking.payment.paidAt)}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">Reference</p>
                    <p className="text-xs text-slate-500 font-mono">
                      {booking.payment.paymentReference}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {booking.payment?.disbursement && (
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">
                Disbursement
              </h3>
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">Status</p>
                  {(() => {
                    const disbInfo = getDisbursementInfo(booking);
                    if (!disbInfo) return null;
                    return (
                      <Badge variant={disbInfo.variant} size="sm">
                        <Banknote className="w-3 h-3 mr-1" />
                        {disbInfo.label}
                      </Badge>
                    );
                  })()}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">Amount to Receive</p>
                  <p className="text-sm font-bold text-green-700">
                    {formatCurrencyShort(booking.payment.disbursement.amount)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">Platform Fee</p>
                  <p className="text-sm text-slate-500">
                    -
                    {formatCurrencyShort(
                      booking.payment.disbursement.platformFee,
                    )}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">Recipient</p>
                  <p className="text-sm text-slate-800">
                    {booking.payment.disbursement.recipientName}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">MoMo Number</p>
                  <p className="text-sm text-slate-800 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {booking.payment.disbursement.recipientPhone}
                  </p>
                </div>
                {booking.payment.disbursement.disbursedAt && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">Disbursed On</p>
                    <p className="text-sm text-slate-800">
                      {formatDate(booking.payment.disbursement.disbursedAt)}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">Reference</p>
                  <p className="text-xs text-slate-500 font-mono">
                    {booking.payment.disbursement.disbursementReference}
                  </p>
                </div>
              </div>
            </div>
          )}

          {booking.payment?.status === "SUCCESSFUL" &&
            !booking.payment?.disbursement && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Disbursement Pending
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      The admin will process the disbursement to your MoMo
                      account shortly.
                    </p>
                  </div>
                </div>
              </div>
            )}

          {booking.notes && (
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-2">
                Notes
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">{booking.notes}</p>
              </div>
            </div>
          )}

          {booking.cancelReason && (
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-2">
                Cancellation Reason
              </h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{booking.cancelReason}</p>
                {booking.cancelledAt && (
                  <p className="text-xs text-red-600 mt-1">
                    Cancelled on {formatDate(booking.cancelledAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 space-y-1">
            <p>Booked on {formatDate(booking.createdAt)}</p>
            {booking.confirmedAt && (
              <p>Confirmed on {formatDate(booking.confirmedAt)}</p>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 flex gap-3">
          {booking.status === "PAID" && (
            <>
              <Button
                variant="outline"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => onAction("cancel", booking)}
                disabled={isLoading}
              >
                <Ban className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => onAction("assign", booking)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserCheck className="w-4 h-4 mr-2" />
                )}
                Assign Room
              </Button>
            </>
          )}
          {booking.status === "CONFIRMED" && (
            <>
              <Button
                variant="outline"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => onAction("cancel", booking)}
                disabled={isLoading}
              >
                <Ban className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => onAction("check_in", booking)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Building2 className="w-4 h-4 mr-2" />
                )}
                Check In
              </Button>
            </>
          )}
          {booking.status === "CHECKED_IN" && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onAction("check_out", booking)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Building2 className="w-4 h-4 mr-2" />
              )}
              Check Out
            </Button>
          )}
          {["PENDING", "CHECKED_OUT", "CANCELLED", "EXPIRED"].includes(
            booking.status,
          ) && (
            <Button variant="outline" fullWidth onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </motion.div>
    </>
  );
}

function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white rounded-xl border border-slate-200">
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{startItem}</span>{" "}
        to <span className="font-medium text-slate-700">{endItem}</span> of{" "}
        <span className="font-medium text-slate-700">{totalItems}</span>{" "}
        bookings
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "w-9 h-9 rounded-lg text-sm font-medium transition-colors",
              page === currentPage
                ? "bg-primary-600 text-white"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="w-8 h-8 bg-slate-200 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/4" />
            </div>
            <div className="h-6 bg-slate-200 rounded w-20" />
            <div className="h-6 bg-slate-200 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClearFilters,
  hasHostel,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
  hasHostel: boolean;
}) {
  if (!hasHostel) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          No hostels found
        </h3>
        <p className="text-slate-500 mb-6 max-w-md mx-auto">
          You need to create a hostel first before you can manage bookings.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <Calendar className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        {hasFilters ? "No bookings found" : "No bookings yet"}
      </h3>
      <p className="text-slate-500 mb-6 max-w-md mx-auto">
        {hasFilters
          ? "Try adjusting your filters or search terms."
          : "When students book rooms at your hostel, they'll appear here."}
      </p>
      {hasFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}

export default function BookingsPage() {
  const [hostels, setHostels] = useState<ManagerHostel[]>([]);
  const [hostelsLoading, setHostelsLoading] = useState(true);
  const [selectedHostelId, setSelectedHostelId] = useState("");

  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  const [assignmentBooking, setAssignmentBooking] = useState<Booking | null>(
    null,
  );

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    sortBy: "newest",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState | null>(
    null,
  );
  const pageSize = 10;

  useEffect(() => {
    const fetchHostels = async () => {
      try {
        setHostelsLoading(true);
        const response = await api.get<HostelApiResponse>(
          "/hostels/my-hostels",
          {
            params: { limit: 50 },
          },
        );
        if (response.data.success && response.data.data.length > 0) {
          const hostelList: ManagerHostel[] = response.data.data.map((h) => ({
            id: h.id,
            name: h.name,
            status: h.status,
          }));
          setHostels(hostelList);
          setSelectedHostelId(hostelList[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch hostels:", getErrorMessage(err));
      } finally {
        setHostelsLoading(false);
      }
    };

    fetchHostels();
  }, []);

  const fetchBookings = useCallback(async () => {
    if (!selectedHostelId) return;

    try {
      setBookingsLoading(true);
      setBookingsError(null);
      const response = await bookingService.getHostelBookings(
        selectedHostelId,
        { limit: 50 },
      );
      if (response.success) {
        setAllBookings(response.data);
      }
    } catch (err) {
      const message = getErrorMessage(err);
      setBookingsError(message);
      console.error("Error fetching bookings:", message);
    } finally {
      setBookingsLoading(false);
    }
  }, [selectedHostelId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filteredBookings = useMemo(() => {
    let result = [...allBookings];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter((b) => {
        const name = getTenantName(b).toLowerCase();
        const email = (b.booker?.email || "").toLowerCase();
        const ref = b.bookingReference.toLowerCase();
        return (
          name.includes(search) ||
          email.includes(search) ||
          ref.includes(search)
        );
      });
    }

    if (filters.status !== "all") {
      result = result.filter((b) => b.status === filters.status);
    }

    switch (filters.sortBy) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
      case "amount_high":
        result.sort(
          (a, b) => toNumber(b.totalAmount) - toNumber(a.totalAmount),
        );
        break;
      case "amount_low":
        result.sort(
          (a, b) => toNumber(a.totalAmount) - toNumber(b.totalAmount),
        );
        break;
    }

    return result;
  }, [allBookings, filters]);

  const totalPages = Math.ceil(filteredBookings.length / pageSize);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const hasActiveFilters = filters.search !== "" || filters.status !== "all";

  const handleAction = useCallback(
    async (action: string, booking: Booking) => {
      const tenantName = getTenantName(booking);

      switch (action) {
        case "view":
          setSelectedBooking(booking);
          return;

        case "assign":
          setAssignmentBooking(booking);
          return;

        case "check_in": {
          const result = await Swal.fire({
            title: "Check In?",
            text: `Check in ${tenantName}?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#2563eb",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Yes, Check In",
          });

          if (!result.isConfirmed) return;
          setActionLoading(booking.id);
          try {
            const res = await bookingService.checkInStudent(
              selectedHostelId,
              booking.id,
            );
            setNotification({ type: "success", message: res.message });
            await fetchBookings();
            setSelectedBooking(null);
          } catch (err) {
            setNotification({
              type: "error",
              message: getErrorMessage(err),
            });
          } finally {
            setActionLoading(null);
          }
          return;
        }

        case "check_out": {
          const result = await Swal.fire({
            title: "Check Out?",
            text: `Check out ${tenantName}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#2563eb",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Yes, Check Out",
          });

          if (!result.isConfirmed) return;
          setActionLoading(booking.id);
          try {
            const res = await bookingService.checkOutStudent(
              selectedHostelId,
              booking.id,
            );
            setNotification({ type: "success", message: res.message });
            await fetchBookings();
            setSelectedBooking(null);
          } catch (err) {
            setNotification({
              type: "error",
              message: getErrorMessage(err),
            });
          } finally {
            setActionLoading(null);
          }
          return;
        }

        case "cancel": {
          const { value: reason, isConfirmed } = await Swal.fire({
            title: "Cancel Booking",
            text: `Provide a reason for cancelling ${tenantName}'s booking`,
            input: "textarea",
            inputPlaceholder: "Enter cancellation reason...",
            inputAttributes: {
              maxlength: "250",
            },
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Cancel Booking",
            preConfirm: (value) => {
              if (!value) {
                Swal.showValidationMessage("Cancellation reason is required");
              }
              return value;
            },
          });

          if (!isConfirmed) return;
          setActionLoading(booking.id);
          try {
            const res = await bookingService.cancelBooking(
              booking.id,
              reason || undefined,
            );
            setNotification({ type: "success", message: res.message });
            await fetchBookings();
            setSelectedBooking(null);
          } catch (err) {
            setNotification({
              type: "error",
              message: getErrorMessage(err),
            });
          } finally {
            setActionLoading(null);
          }
          return;
        }
      }
    },
    [selectedHostelId, fetchBookings],
  );

  function clearAllFilters() {
    setFilters({ search: "", status: "all", sortBy: "newest" });
    setCurrentPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bookings</h1>
          <p className="text-slate-500 mt-1">
            Manage and track all booking requests for your hostels
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchBookings()}
            disabled={bookingsLoading}
          >
            {bookingsLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {notification && (
          <NotificationBanner
            notification={notification}
            onDismiss={() => setNotification(null)}
          />
        )}
      </AnimatePresence>

      {bookingsError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-800">{bookingsError}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchBookings}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      <HostelSelector
        hostels={hostels}
        selectedId={selectedHostelId}
        onChange={(id) => {
          setSelectedHostelId(id);
          setCurrentPage(1);
        }}
        loading={hostelsLoading}
      />

      {selectedHostelId && (
        <>
          <BookingStats bookings={allBookings} loading={bookingsLoading} />

          <FilterBar
            filters={filters}
            onChange={(f) => {
              setFilters(f);
              setCurrentPage(1);
            }}
          />

          {hasActiveFilters &&
            !bookingsLoading &&
            filteredBookings.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Filter className="w-4 h-4" />
                <span>
                  {filteredBookings.length} booking
                  {filteredBookings.length !== 1 ? "s" : ""} found
                </span>
              </div>
            )}

          {bookingsLoading ? (
            <TableSkeleton />
          ) : paginatedBookings.length > 0 ? (
            <>
              <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Tenant
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Room Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Disbursement
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence mode="popLayout">
                        {paginatedBookings.map((booking) => (
                          <BookingTableRow
                            key={booking.id}
                            booking={booking}
                            onAction={handleAction}
                            actionLoading={actionLoading}
                          />
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:hidden grid gap-4 sm:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {paginatedBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onAction={handleAction}
                      actionLoading={actionLoading}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {totalPages > 1 && (
                <PaginationBar
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredBookings.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          ) : (
            <EmptyState
              hasFilters={hasActiveFilters}
              onClearFilters={clearAllFilters}
              hasHostel={true}
            />
          )}
        </>
      )}

      {!hostelsLoading && hostels.length === 0 && (
        <EmptyState
          hasFilters={false}
          onClearFilters={() => {}}
          hasHostel={false}
        />
      )}

      <AnimatePresence>
        {selectedBooking && (
          <BookingDetailModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onAction={handleAction}
            actionLoading={actionLoading}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {assignmentBooking && (
          <RoomAssignmentModal
            booking={assignmentBooking}
            hostelId={selectedHostelId}
            onClose={() => setAssignmentBooking(null)}
            onSuccess={(message) => {
              setNotification({ type: "success", message });
              fetchBookings();
              setAssignmentBooking(null);
              setSelectedBooking(null);
            }}
            onError={(message) => {
              setNotification({ type: "error", message });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
