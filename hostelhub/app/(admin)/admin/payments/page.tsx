"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  CreditCard,
  Search,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  X,
  Phone,
  ArrowDownRight,
  ArrowUpDown,
  Banknote,
  FileText,
  RefreshCw,
  AlertCircle,
  Send,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { PaymentStatusIcon } from "@/components/PaymentStatusIcon";
import { cn } from "@/lib/utils";
import { paymentService } from "@/services/payment.service";
import { disbursementService } from "@/services/disbursement.service";
import toast from "react-hot-toast";
import type {
  AdminPayment,
  AdminPaymentQueryParams,
  AdminPaymentsListResponse,
  AdminPaymentStatsResponse,
} from "@/types/payment";

const PLATFORM_FEE_PERCENT = parseFloat(
  process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENT || "2",
);

function formatCurrency(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `GHS ${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPaymentStatusVariant(status: string) {
  switch (status) {
    case "SUCCESSFUL":
      return "success" as const;
    case "PENDING":
      return "warning" as const;
    case "FAILED":
      return "error" as const;
    case "REFUNDED":
      return "secondary" as const;
    default:
      return "secondary" as const;
  }
}

function getDisbursementStatusVariant(status: string) {
  switch (status) {
    case "COMPLETED":
      return "success" as const;
    case "PROCESSING":
      return "warning" as const;
    case "PENDING":
      return "secondary" as const;
    case "FAILED":
      return "error" as const;
    default:
      return "secondary" as const;
  }
}

function calculatePlatformFee(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return (num * PLATFORM_FEE_PERCENT) / 100;
}

function calculateNetAmount(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num - calculatePlatformFee(num);
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosErr = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return (
      axiosErr.response?.data?.message ||
      axiosErr.message ||
      "An error occurred"
    );
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

function PaymentDetailModal({
  payment,
  onClose,
  onDisbursementProcessed,
}: {
  payment: AdminPayment;
  onClose: () => void;
  onDisbursementProcessed: () => void;
}) {
  const [processing, setProcessing] = useState(false);

  const amount = parseFloat(payment.amount);
  const platformFee = payment.disbursement
    ? parseFloat(payment.disbursement.platformFee)
    : calculatePlatformFee(amount);
  const netAmount = payment.disbursement
    ? parseFloat(payment.disbursement.amount)
    : calculateNetAmount(amount);

  const canDisburse =
    payment.status === "SUCCESSFUL" &&
    payment.disbursement &&
    payment.disbursement.status === "PENDING";

  const handleProcessDisbursement = async () => {
    if (!payment.disbursement) return;
    setProcessing(true);
    try {
      await disbursementService.processDisbursement(payment.disbursement.id);
      toast.success(
        "Disbursement initiated! MoMo transfer is being processed.",
      );
      onDisbursementProcessed();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

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
          <h2 className="text-lg font-bold text-slate-800">Payment Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-800">
              {formatCurrency(amount)}
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge
                variant={getPaymentStatusVariant(payment.status)}
                size="md"
              >
                <PaymentStatusIcon
                  status={payment.status}
                  className="w-3.5 h-3.5 mr-1.5"
                />
                {payment.status}
              </Badge>
              {payment.disbursement && (
                <Badge
                  variant={getDisbursementStatusVariant(
                    payment.disbursement.status,
                  )}
                  size="md"
                >
                  <Banknote className="w-3.5 h-3.5 mr-1.5" />
                  {payment.disbursement.status === "COMPLETED"
                    ? "Disbursed"
                    : payment.disbursement.status === "PROCESSING"
                      ? "Processing"
                      : payment.disbursement.status === "FAILED"
                        ? "Failed"
                        : "Not Disbursed"}
                </Badge>
              )}
              {!payment.disbursement && payment.status === "SUCCESSFUL" && (
                <Badge variant="secondary" size="md">
                  <Banknote className="w-3.5 h-3.5 mr-1.5" />
                  Not Disbursed
                </Badge>
              )}
            </div>
          </div>

          {canDisburse && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-amber-800">
                    Ready to Disburse
                  </h4>
                  <p className="text-sm text-amber-600 mt-0.5">
                    {formatCurrency(netAmount)} to{" "}
                    {payment.disbursement!.recipientName} (
                    {payment.disbursement!.recipientPhone})
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 shrink-0"
                  onClick={handleProcessDisbursement}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-1" />
                  )}
                  {processing ? "Sending..." : "Send Now"}
                </Button>
              </div>
            </div>
          )}

          {payment.status === "SUCCESSFUL" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-semibold text-green-800">
                Financial Breakdown
              </h4>
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Amount Received</span>
                <span className="font-bold text-green-800">
                  {formatCurrency(amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700">
                  Platform Fee ({PLATFORM_FEE_PERCENT}%)
                </span>
                <span className="font-medium text-green-700">
                  -{formatCurrency(platformFee)}
                </span>
              </div>
              <div className="border-t border-green-300 pt-2 flex justify-between text-sm">
                <span className="text-green-700">Net to Manager</span>
                <span className="font-bold text-green-800">
                  {formatCurrency(netAmount)}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {[
              { label: "Payment Reference", value: payment.paymentReference },
              {
                label: "MoMo Transaction ID",
                value: payment.momoTransactionId || "N/A",
              },
              {
                label: "Payment Method",
                value:
                  payment.method === "MTN_MOMO" ? "MTN MoMo" : payment.method,
              },
              { label: "Payer Phone", value: payment.payerPhone || "N/A" },
              {
                label: "Date & Time",
                value: formatDateTime(payment.createdAt),
              },
              {
                label: "Paid At",
                value: payment.paidAt ? formatDateTime(payment.paidAt) : "N/A",
              },
              {
                label: "Booking Reference",
                value: payment.booking.bookingReference,
              },
              { label: "Booking Status", value: payment.booking.status },
              {
                label: "Payment Plan",
                value: `${payment.booking.paymentPlan}${payment.booking.semesterPeriod ? ` (${payment.booking.semesterPeriod})` : ""}`,
              },
              {
                label: "Academic Year",
                value: payment.booking.academicYear || "N/A",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-2 border-b border-slate-100"
              >
                <span className="text-sm text-slate-500">{item.label}</span>
                <span className="text-sm font-medium text-slate-800 text-right max-w-[60%]">
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {payment.status === "FAILED" && payment.failureReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-red-800 mb-1">
                Failure Reason
              </h4>
              <p className="text-sm text-red-700">{payment.failureReason}</p>
            </div>
          )}

          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">
              Student/Guest (Payer)
            </h4>
            <div className="flex items-center gap-3">
              <Avatar
                name={`${payment.booking.booker.firstName} ${payment.booking.booker.lastName}`}
                size="md"
              />
              <div>
                <p className="font-medium text-slate-800">
                  {payment.booking.booker.firstName}{" "}
                  {payment.booking.booker.lastName}
                </p>
                <p className="text-xs text-slate-500">
                  {payment.booking.booker.email}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {payment.booking.booker.phone}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">
              Manager (Recipient)
            </h4>
            <div className="flex items-center gap-3">
              <Avatar
                name={`${payment.booking.hostel.manager.firstName} ${payment.booking.hostel.manager.lastName}`}
                size="md"
              />
              <div>
                <p className="font-medium text-slate-800">
                  {payment.booking.hostel.manager.firstName}{" "}
                  {payment.booking.hostel.manager.lastName}
                </p>
                <p className="text-xs text-slate-500">
                  {payment.booking.hostel.name}
                </p>
                {payment.booking.hostel.paymentDetail && (
                  <p className="text-xs text-slate-500">
                    {payment.booking.hostel.paymentDetail.momoProvider}:{" "}
                    {payment.booking.hostel.paymentDetail.momoNumber}
                  </p>
                )}
              </div>
            </div>
          </div>

          {payment.disbursement &&
            payment.disbursement.status === "COMPLETED" && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-1">
                  Disbursed
                </h4>
                <p className="text-sm text-blue-700">
                  {formatCurrency(payment.disbursement.amount)} sent to{" "}
                  {payment.disbursement.recipientName} (
                  {payment.disbursement.recipientPhone})
                  {payment.disbursement.disbursedAt &&
                    ` on ${formatDate(payment.disbursement.disbursedAt)}`}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Ref: {payment.disbursement.disbursementReference}
                </p>
              </div>
            )}
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose}>
            Close
          </Button>
          {canDisburse ? (
            <Button
              fullWidth
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleProcessDisbursement}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {processing ? "Sending..." : "Disburse Now"}
            </Button>
          ) : payment.disbursement &&
            payment.disbursement.status !== "COMPLETED" ? (
            <Button variant="outline" fullWidth asChild>
              <Link href="/admin/disbursements">
                <Banknote className="w-4 h-4 mr-2" />
                View Disbursements
              </Link>
            </Button>
          ) : (
            <Button variant="outline" fullWidth>
              <FileText className="w-4 h-4 mr-2" />
              Receipt
            </Button>
          )}
        </div>
      </motion.div>
    </>
  );
}

function PaymentsTableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="animate-pulse">
        <div className="bg-slate-50 border-b border-slate-200 px-3 py-3">
          <div className="flex gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-200 rounded flex-1" />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-3 py-4 border-b border-slate-100">
            <div className="flex gap-4">
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className="h-4 bg-slate-100 rounded flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const STAT_CONFIGS = [
  {
    key: "totalReceived",
    label: "Total Received",
    icon: ArrowDownRight,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  {
    key: "platformFees",
    label: "Platform Fees",
    icon: CreditCard,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  {
    key: "pendingDisbursement",
    label: "Pending Disbursement",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    key: "totalDisbursed",
    label: "Total Disbursed",
    icon: CheckCircle2,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
] as const;

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "amount" | "paidAt">(
    "createdAt",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(
    null,
  );
  const pageSize = 10;
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [pagination, setPagination] = useState<
    AdminPaymentsListResponse["pagination"] | null
  >(null);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  const [stats, setStats] = useState<AdminPaymentStatsResponse["data"] | null>(
    null,
  );
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true);
    setPaymentsError(null);
    try {
      const params: AdminPaymentQueryParams = {
        page: currentPage,
        limit: pageSize,
        ...(statusFilter !== "all" && {
          status: statusFilter as AdminPaymentQueryParams["status"],
        }),
        ...(debouncedSearch && { search: debouncedSearch }),
        sortBy,
        sortOrder,
      };
      const result = await paymentService.adminGetAllPayments(params);
      setPayments(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setPaymentsError(getErrorMessage(err));
    } finally {
      setPaymentsLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, debouncedSearch, sortBy, sortOrder]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const result = await paymentService.adminGetPaymentStats();
      setStats(result.data);
    } catch (err) {
      console.error("Failed to fetch stats:", getErrorMessage(err));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleRefresh = () => {
    fetchPayments();
    fetchStats();
  };

  const statValues = useMemo(() => {
    if (!stats) return null;
    return {
      totalReceived: formatCurrency(stats.revenue.totalReceived),
      platformFees: formatCurrency(stats.revenue.platformFeesEarned),
      pendingDisbursement: formatCurrency(stats.disbursements.pendingAmount),
      totalDisbursed: formatCurrency(stats.disbursements.completedAmount),
    };
  }, [stats]);

  const handleSort = useCallback(
    (field: "createdAt" | "amount" | "paidAt") => {
      if (sortBy === field) {
        setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
      } else {
        setSortBy(field);
        setSortOrder("desc");
      }
      setCurrentPage(1);
    },
    [sortBy],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Incoming Payments
          </h1>
          <p className="text-slate-500 mt-1">
            All MoMo payments received from students
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          {stats && stats.disbursements.pendingCount > 0 && (
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
              asChild
            >
              <Link href="/admin/disbursements">
                <Banknote className="w-4 h-4 mr-2" />
                Process {stats.disbursements.pendingCount} Disbursements
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                    <div className="h-5 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          : STAT_CONFIGS.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("bg-white rounded-xl border p-4", stat.border)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", stat.bg)}>
                      <Icon className={cn("w-5 h-5", stat.color)} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">
                        {stat.label}
                      </p>
                      <p className="text-lg font-bold text-slate-800">
                        {statValues?.[stat.key] ?? "GHS 0.00"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, reference, phone, hostel..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="SUCCESSFUL">Successful</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [f, o] = e.target.value.split("-");
                setSortBy(f as typeof sortBy);
                setSortOrder(o as "asc" | "desc");
                setCurrentPage(1);
              }}
              className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="amount-desc">Amount: High</option>
              <option value="amount-asc">Amount: Low</option>
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {paymentsError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Failed to load payments
          </h3>
          <p className="text-red-600 mb-4">{paymentsError}</p>
          <Button
            variant="outline"
            onClick={fetchPayments}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}

      {paymentsLoading && <PaymentsTableSkeleton />}

      {!paymentsLoading && !paymentsError && payments.length > 0 && (
        <>
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Manager / Hostel
                  </th>
                  <th
                    className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                    onClick={() => handleSort("amount")}
                  >
                    <span className="flex items-center gap-1">
                      Amount
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Fee
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Disbursed
                  </th>
                  <th
                    className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                    onClick={() => handleSort("createdAt")}
                  >
                    <span className="flex items-center gap-1">
                      Date
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const amt = parseFloat(payment.amount);
                  const fee = payment.disbursement
                    ? parseFloat(payment.disbursement.platformFee)
                    : calculatePlatformFee(amt);
                  return (
                    <tr
                      key={payment.id}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-3 py-3">
                        <p className="text-sm font-medium text-slate-800">
                          {payment.paymentReference}
                        </p>
                        <p className="text-xs text-slate-400">
                          {payment.booking.bookingReference}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={`${payment.booking.booker.firstName} ${payment.booking.booker.lastName}`}
                            size="sm"
                          />
                          <div>
                            <p className="text-sm text-slate-700">
                              {payment.booking.booker.firstName}{" "}
                              {payment.booking.booker.lastName}
                            </p>
                            <p className="text-xs text-slate-400">
                              {payment.payerPhone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-sm text-slate-700">
                          {payment.booking.hostel.manager.firstName}{" "}
                          {payment.booking.hostel.manager.lastName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {payment.booking.hostel.name}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-sm font-semibold text-green-600">
                          {formatCurrency(amt)}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-sm text-purple-600">
                          {formatCurrency(fee)}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <Badge
                          variant={getPaymentStatusVariant(payment.status)}
                          size="sm"
                        >
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <Badge
                          variant={
                            payment.disbursement?.status === "COMPLETED"
                              ? "success"
                              : payment.disbursement?.status === "PROCESSING"
                                ? "warning"
                                : "secondary"
                          }
                          size="sm"
                        >
                          {payment.disbursement?.status === "COMPLETED"
                            ? "Yes"
                            : payment.disbursement?.status === "PROCESSING"
                              ? "Processing"
                              : "No"}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-xs text-slate-500">
                          {formatDateTime(payment.createdAt)}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {payment.status === "SUCCESSFUL" &&
                            payment.disbursement?.status === "PENDING" && (
                              <Link
                                href="/admin/disbursements"
                                className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Go to disbursements"
                              >
                                <Send className="w-4 h-4" />
                              </Link>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="lg:hidden space-y-4">
            {payments.map((payment) => {
              const amt = parseFloat(payment.amount);
              const fee = payment.disbursement
                ? parseFloat(payment.disbursement.platformFee)
                : calculatePlatformFee(amt);
              return (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer"
                  onClick={() => setSelectedPayment(payment)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={`${payment.booking.booker.firstName} ${payment.booking.booker.lastName}`}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium text-slate-800 text-sm">
                          {payment.booking.booker.firstName}{" "}
                          {payment.booking.booker.lastName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {payment.paymentReference}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">
                        {formatCurrency(amt)}
                      </p>
                      <p className="text-xs text-purple-500">
                        Fee: {formatCurrency(fee)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                      → {payment.booking.hostel.manager.firstName}{" "}
                      {payment.booking.hostel.manager.lastName} (
                      {payment.booking.hostel.name})
                    </p>
                    <div className="flex gap-1">
                      <Badge
                        variant={getPaymentStatusVariant(payment.status)}
                        size="sm"
                      >
                        {payment.status}
                      </Badge>
                      <Badge
                        variant={
                          payment.disbursement?.status === "COMPLETED"
                            ? "success"
                            : "secondary"
                        }
                        size="sm"
                      >
                        {payment.disbursement?.status === "COMPLETED"
                          ? "Sent"
                          : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-slate-200">
              <p className="text-sm text-slate-500">
                {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(pagination.pages, p + 1))
                  }
                  disabled={currentPage === pagination.pages}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {!paymentsLoading && !paymentsError && payments.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            No payments found
          </h3>
          <p className="text-slate-500">
            {debouncedSearch || statusFilter !== "all"
              ? "Adjust your filters to find payments."
              : "No payments have been made yet."}
          </p>
        </div>
      )}

      <AnimatePresence>
        {selectedPayment && (
          <PaymentDetailModal
            payment={selectedPayment}
            onClose={() => setSelectedPayment(null)}
            onDisbursementProcessed={handleRefresh}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
