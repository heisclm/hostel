"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote,
  Search,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Send,
  Loader2,
  Eye,
  FileText,
  Check,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { DisbursementStatusIcon } from "@/components/DisbursementStatusIcon";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { disbursementService } from "@/services/disbursement.service";
import type {
  AdminDisbursement,
  DisbursementQueryParams,
  DisbursementsListResponse,
  DisbursementStatsResponse,
} from "@/types/disbursement";

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

function getStatusVariant(status: string) {
  switch (status) {
    case "COMPLETED":
      return "success" as const;
    case "PROCESSING":
      return "primary" as const;
    case "PENDING":
      return "warning" as const;
    case "FAILED":
      return "error" as const;
    default:
      return "secondary" as const;
  }
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

const STAT_CONFIGS = [
  {
    key: "pending",
    label: "Pending",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    key: "processing",
    label: "Processing",
    icon: Loader2,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    key: "completed",
    label: "Completed",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  {
    key: "platformFees",
    label: "Total Fees Earned",
    icon: Banknote,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
] as const;

function DisbursementDetailModal({
  disbursement,
  onClose,
  onActionComplete,
}: {
  disbursement: AdminDisbursement;
  onClose: () => void;
  onActionComplete: () => void;
}) {
  const [confirmSend, setConfirmSend] = useState(false);
  const [manualNotes, setManualNotes] = useState("");
  const [showManualComplete, setShowManualComplete] = useState(false);
  const [processing, setProcessing] = useState(false);

  const grossAmount = parseFloat(disbursement.payment.amount);
  const platformFee = parseFloat(disbursement.platformFee);
  const netAmount = parseFloat(disbursement.amount);

  const handleProcess = async () => {
    setProcessing(true);
    try {
      await disbursementService.processDisbursement(disbursement.id);
      toast.success("Disbursement initiated! MoMo transfer in progress.");
      setConfirmSend(false);
      onActionComplete();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleVerify = async () => {
    setProcessing(true);
    try {
      const result = await disbursementService.verifyDisbursement(
        disbursement.id,
      );
      toast.success(result.message);
      onActionComplete();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  const handleManualComplete = async () => {
    setProcessing(true);
    try {
      await disbursementService.markDisbursementComplete(
        disbursement.id,
        manualNotes || undefined,
      );
      toast.success("Disbursement marked as completed.");
      setShowManualComplete(false);
      onActionComplete();
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
          <h2 className="text-lg font-bold text-slate-800">
            Disbursement Details
          </h2>
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
              {formatCurrency(netAmount)}
            </p>
            <p className="text-sm text-slate-500 mt-1">to be sent</p>
            <Badge
              variant={getStatusVariant(disbursement.status)}
              size="md"
              className="mt-2"
            >
              <DisbursementStatusIcon
                status={disbursement.status}
                className="w-3.5 h-3.5 mr-1.5"
              />
              {disbursement.status}
            </Badge>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">
              Recipient
            </h4>
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={disbursement.recipientName} size="lg" />
              <div>
                <p className="font-medium text-slate-800">
                  {disbursement.recipientName}
                </p>
                <p className="text-sm text-slate-500">
                  {disbursement.payment.booking.hostel.name}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-400 mb-1">MoMo Number</p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <p className="text-sm font-semibold text-slate-800">
                  {disbursement.recipientPhone}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <h4 className="text-sm font-semibold text-amber-800">Breakdown</h4>
            <div className="flex justify-between text-sm">
              <span className="text-amber-700">Gross Amount</span>
              <span className="font-bold text-amber-800">
                {formatCurrency(grossAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-amber-700">Platform Fee (2%)</span>
              <span className="font-medium text-amber-700">
                -{formatCurrency(platformFee)}
              </span>
            </div>
            <div className="border-t border-amber-300 pt-2 flex justify-between text-sm">
              <span className="text-amber-700 font-semibold">
                Net to Manager
              </span>
              <span className="font-bold text-amber-800">
                {formatCurrency(netAmount)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                label: "Disbursement Ref",
                value: disbursement.disbursementReference,
              },
              {
                label: "Payment Ref",
                value: disbursement.payment.paymentReference,
              },
              {
                label: "Booking Ref",
                value: disbursement.payment.booking.bookingReference,
              },
              {
                label: "Student",
                value: `${disbursement.payment.booking.booker.firstName} ${disbursement.payment.booking.booker.lastName}`,
              },
              {
                label: "Payment Date",
                value: disbursement.payment.paidAt
                  ? formatDate(disbursement.payment.paidAt)
                  : "N/A",
              },
              { label: "Created", value: formatDate(disbursement.createdAt) },
              ...(disbursement.disbursedAt
                ? [
                    {
                      label: "Disbursed At",
                      value: formatDate(disbursement.disbursedAt),
                    },
                  ]
                : []),
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

          {disbursement.status === "FAILED" && disbursement.failureReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-red-800 mb-1">
                Failure Reason
              </h4>
              <p className="text-sm text-red-700">
                {disbursement.failureReason}
              </p>
            </div>
          )}

          {disbursement.notes && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-1">
                Notes
              </h4>
              <p className="text-sm text-blue-700 whitespace-pre-line">
                {disbursement.notes}
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100">
          {disbursement.status === "PENDING" && !confirmSend && (
            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={onClose}>
                Cancel
              </Button>
              <Button
                fullWidth
                className="bg-amber-600 hover:bg-amber-700"
                onClick={() => setConfirmSend(true)}
              >
                <Send className="w-4 h-4 mr-2" />
                Send {formatCurrency(netAmount)}
              </Button>
            </div>
          )}

          {disbursement.status === "PENDING" && confirmSend && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                <p className="text-sm text-amber-800 font-medium">
                  Confirm sending{" "}
                  <span className="font-bold">{formatCurrency(netAmount)}</span>{" "}
                  to{" "}
                  <span className="font-bold">
                    {disbursement.recipientPhone}
                  </span>
                  ?
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setConfirmSend(false)}
                  disabled={processing}
                >
                  Go Back
                </Button>
                <Button
                  fullWidth
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleProcess}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {processing ? "Processing..." : "Confirm & Send"}
                </Button>
              </div>
            </div>
          )}

          {disbursement.status === "PROCESSING" && !showManualComplete && (
            <div className="space-y-3">
              <div className="text-center py-1">
                <div className="flex items-center justify-center gap-2 text-blue-600 mb-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">
                    Transfer in progress...
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleVerify}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Check Status
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowManualComplete(true)}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark Complete
                </Button>
              </div>
            </div>
          )}

          {disbursement.status === "PROCESSING" && showManualComplete && (
            <div className="space-y-3">
              <textarea
                placeholder="Optional: Add notes about the manual completion..."
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={2}
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowManualComplete(false)}
                  disabled={processing}
                >
                  Back
                </Button>
                <Button
                  fullWidth
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleManualComplete}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Confirm Complete
                </Button>
              </div>
            </div>
          )}
          {disbursement.status === "FAILED" && !confirmSend && (
            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={onClose}>
                Close
              </Button>
              <Button
                fullWidth
                className="bg-amber-600 hover:bg-amber-700"
                onClick={() => setConfirmSend(true)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Disbursement
              </Button>
            </div>
          )}

          {disbursement.status === "FAILED" && confirmSend && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                <p className="text-sm text-amber-800 font-medium">
                  Retry sending{" "}
                  <span className="font-bold">{formatCurrency(netAmount)}</span>{" "}
                  to{" "}
                  <span className="font-bold">
                    {disbursement.recipientPhone}
                  </span>
                  ?
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setConfirmSend(false)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleProcess}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {processing ? "Processing..." : "Confirm Retry"}
                </Button>
              </div>
            </div>
          )}

          {disbursement.status === "COMPLETED" && (
            <div className="flex gap-3">
              <Button variant="outline" fullWidth>
                <FileText className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              <Button variant="outline" fullWidth onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

function DisbursementsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-200 rounded-full" />
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
            <div className="h-8 bg-slate-200 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DisbursementsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDisbursement, setSelectedDisbursement] =
    useState<AdminDisbursement | null>(null);
  const pageSize = 10;
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [disbursements, setDisbursements] = useState<AdminDisbursement[]>([]);
  const [pagination, setPagination] = useState<
    DisbursementsListResponse["pagination"] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<string | null>(null);

  const [stats, setStats] = useState<DisbursementStatsResponse["data"] | null>(
    null,
  );
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchDisbursements = useCallback(async () => {
    setIsLoading(true);
    setIsError(null);
    try {
      const params: DisbursementQueryParams = {
        page: currentPage,
        limit: pageSize,
        ...(statusFilter !== "all" && {
          status: statusFilter as DisbursementQueryParams["status"],
        }),
        ...(debouncedSearch && { search: debouncedSearch }),
      };
      const result = await disbursementService.adminGetAllDisbursements(params);
      setDisbursements(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setIsError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, debouncedSearch]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const result = await disbursementService.adminGetDisbursementStats();
      setStats(result.data);
    } catch (err) {
      console.error("Failed to fetch stats:", getErrorMessage(err));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisbursements();
  }, [fetchDisbursements]);

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
    fetchDisbursements();
    fetchStats();
  };

  const pendingCount = stats?.statusBreakdown.pending.count ?? 0;
  const pendingAmount = stats?.statusBreakdown.pending.totalAmount ?? 0;

  const statValues = useMemo(() => {
    if (!stats) return null;
    return {
      pending: formatCurrency(stats.statusBreakdown.pending.totalAmount),
      pendingCount: stats.statusBreakdown.pending.count,
      processing: formatCurrency(stats.statusBreakdown.processing.totalAmount),
      processingCount: stats.statusBreakdown.processing.count,
      completed: formatCurrency(stats.statusBreakdown.completed.totalAmount),
      completedCount: stats.statusBreakdown.completed.count,
      platformFees: formatCurrency(stats.totalPlatformFees),
      totalCount: stats.totalDisbursements,
    };
  }, [stats]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Disbursements</h1>
          <p className="text-slate-500 mt-1">
            Send collected payments to hostel managers via MoMo
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {pendingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-800">
                {pendingCount} Pending Disbursement
                {pendingCount !== 1 ? "s" : ""}
              </p>
              <p className="text-sm text-amber-600">
                Total: {formatCurrency(pendingAmount)} to be sent to managers
              </p>
            </div>
          </div>
        </motion.div>
      )}

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
              const value =
                stat.key === "platformFees"
                  ? (statValues?.platformFees ?? "GHS 0.00")
                  : ((statValues?.[
                      stat.key as keyof typeof statValues
                    ] as string) ?? "GHS 0.00");
              const count =
                stat.key === "platformFees"
                  ? (statValues?.totalCount ?? 0)
                  : ((statValues?.[
                      `${stat.key}Count` as keyof typeof statValues
                    ] as number) ?? 0);

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
                      <p className="text-xs text-slate-500">{stat.label}</p>
                      <p className="text-lg font-bold text-slate-800">
                        {value}
                      </p>
                      <p className="text-xs text-slate-400">
                        {count} transaction{count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by manager, reference, phone..."
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
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Failed to load disbursements
          </h3>
          <p className="text-red-600 mb-4">{isError}</p>
          <Button
            variant="outline"
            onClick={fetchDisbursements}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}

      {isLoading && <DisbursementsSkeleton />}

      {!isLoading && !isError && disbursements.length > 0 && (
        <>
          <div className="space-y-4">
            {disbursements.map((disbursement) => {
              const netAmount = parseFloat(disbursement.amount);
              const grossAmount = parseFloat(disbursement.payment.amount);
              const fee = parseFloat(disbursement.platformFee);

              return (
                <motion.div
                  key={disbursement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={disbursement.recipientName}
                              size="md"
                            />
                            <div>
                              <h3 className="font-semibold text-slate-800">
                                {disbursement.recipientName}
                              </h3>
                              <p className="text-sm text-slate-500">
                                {disbursement.payment.booking.hostel.name} ·{" "}
                                {disbursement.payment.booking.booker.firstName}{" "}
                                {disbursement.payment.booking.booker.lastName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xl font-bold text-slate-800">
                              {formatCurrency(netAmount)}
                            </p>
                            <Badge
                              variant={getStatusVariant(disbursement.status)}
                              size="sm"
                            >
                              <DisbursementStatusIcon
                                status={disbursement.status}
                                className="w-3 h-3 mr-1"
                              />
                              {disbursement.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {disbursement.recipientPhone}
                          </span>
                          <span>Gross: {formatCurrency(grossAmount)}</span>
                          <span className="text-purple-500">
                            Fee: {formatCurrency(fee)}
                          </span>
                          <span>Ref: {disbursement.disbursementReference}</span>
                          {disbursement.disbursedAt && (
                            <span>
                              Sent: {formatDate(disbursement.disbursedAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setSelectedDisbursement(disbursement)}
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {disbursement.status === "PENDING" && (
                          <Button
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700"
                            onClick={() =>
                              setSelectedDisbursement(disbursement)
                            }
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Send
                          </Button>
                        )}
                        {disbursement.status === "PROCESSING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setSelectedDisbursement(disbursement)
                            }
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Check
                          </Button>
                        )}
                      </div>
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

      {!isLoading && !isError && disbursements.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Banknote className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            No disbursements found
          </h3>
          <p className="text-slate-500">
            {debouncedSearch || statusFilter !== "all"
              ? "Adjust your filters to find disbursements."
              : "No disbursements have been created yet."}
          </p>
        </div>
      )}

      <AnimatePresence>
        {selectedDisbursement && (
          <DisbursementDetailModal
            disbursement={selectedDisbursement}
            onClose={() => setSelectedDisbursement(null)}
            onActionComplete={handleRefresh}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
