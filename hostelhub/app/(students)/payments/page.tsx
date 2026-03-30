"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Search,
  Filter,
  ChevronDown,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Building2,
  Calendar,
  Receipt,
  Wallet,
  ArrowDownRight,
  Eye,
  ChevronRight,
  MoreVertical,
  Copy,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  paymentService,
  type StudentPayment,
  type StudentPaymentStats,
} from "@/services/payment.service";

type PaymentStatus = "PENDING" | "SUCCESSFUL" | "FAILED" | "REFUNDED";

interface TransformedPayment {
  id: string;
  transactionId: string;
  bookingId: string;
  hostelId: string;
  hostelName: string;
  hostelImage: string;
  roomName: string;
  amount: number;
  fee: number;
  totalAmount: number;
  status: PaymentStatus;
  paymentMethod: string;
  paymentPhone?: string;
  description: string;
  semester: string;
  academicYear: string;
  createdAt: Date;
  completedAt?: Date;
  failureReason?: string;
}

const statusConfig: Record<
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
    label: "Completed",
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
    icon: ArrowDownRight,
  },
};

const filterOptions = [
  { value: "all", label: "All Payments" },
  { value: "SUCCESSFUL", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

const dateFilterOptions = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

function getOccupancyLabel(type: string): string {
  const labels: Record<string, string> = {
    IN_1: "Single Room",
    IN_2: "Double Room",
    IN_3: "Triple Room",
    IN_4: "Quad Room",
  };
  return labels[type] || type;
}

function transformPayment(payment: StudentPayment): TransformedPayment {
  const hostelImage = payment.booking.hostel.images?.[0]?.url || "";

  return {
    id: payment.id,
    transactionId: payment.paymentReference,
    bookingId: payment.booking.id,
    hostelId: payment.booking.hostel.id,
    hostelName: payment.booking.hostel.name,
    hostelImage,
    roomName: getOccupancyLabel(payment.booking.roomType.occupancyType),
    amount: Number(payment.booking.baseAmount),
    fee: Number(payment.booking.platformFee),
    totalAmount: Number(payment.amount),
    status: payment.status,
    paymentMethod: payment.method || "MTN_MOMO",
    paymentPhone: payment.payerPhone || undefined,
    description: "Room booking payment",
    semester:
      payment.booking.semesterPeriod === "FIRST_SEMESTER"
        ? "First Semester"
        : payment.booking.semesterPeriod === "SECOND_SEMESTER"
          ? "Second Semester"
          : "Full Year",
    academicYear: payment.booking.academicYear || "",
    createdAt: new Date(payment.createdAt),
    completedAt: payment.paidAt ? new Date(payment.paidAt) : undefined,
    failureReason: payment.failureReason || undefined,
  };
}

function PaymentCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-200 rounded-xl" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-slate-200 rounded-lg" />
              <div className="h-3 w-24 bg-slate-100 rounded-lg" />
            </div>
          </div>
          <div className="h-6 w-20 bg-slate-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="h-6 w-28 bg-slate-200 rounded-lg" />
          <div className="h-4 w-20 bg-slate-100 rounded-lg" />
        </div>
      </div>
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-6">
        <Receipt className="w-10 h-10 text-slate-300" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">
        No payments found
      </h3>
      <p className="text-slate-500 max-w-sm mb-6">
        {filter === "all"
          ? "You haven't made any payments yet. Book a hostel to get started."
          : `No ${filterOptions.find((f) => f.value === filter)?.label?.toLowerCase() || filter} payments found.`}
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
    </motion.div>
  );
}

function PaymentCard({
  payment,
  index,
  onViewDetails,
  onRetryPayment,
}: {
  payment: TransformedPayment;
  index: number;
  onViewDetails: (payment: TransformedPayment) => void;
  onDownloadReceipt: (payment: TransformedPayment) => void;
  onRetryPayment: (payment: TransformedPayment) => void;
}) {
  const status = statusConfig[payment.status];
  const StatusIcon = status.icon;
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <motion.div
        whileHover={{ y: -2 }}
        className="group bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100">
                {payment.hostelImage ? (
                  <Image
                    src={payment.hostelImage}
                    alt={payment.hostelName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-slate-300" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {payment.hostelName}
                </h3>
                <p className="text-sm text-slate-500">{payment.roomName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
                  status.bgColor,
                  status.color,
                  status.borderColor,
                )}
              >
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </span>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-slate-400" />
                </button>

                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-20 overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          onViewDetails(payment);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>

                      {payment.status === "FAILED" && (
                        <button
                          onClick={() => {
                            onRetryPayment(payment);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-3 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Retry Payment
                        </button>
                      )}
                      <Link
                        href={`/student/bookings/${payment.bookingId}`}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Booking
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-yellow-400">
                M
              </div>
              <span className="text-sm text-slate-600">MTN MoMo</span>
            </div>
            {payment.paymentPhone && (
              <span className="text-sm text-slate-500">
                •&nbsp;{payment.paymentPhone}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-slate-400">Transaction ID:</span>
            <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded-lg text-slate-600">
              {payment.transactionId}
            </code>
          </div>

          {payment.status === "FAILED" && payment.failureReason && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl mb-4">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{payment.failureReason}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div>
              <p className="text-2xl font-bold text-slate-900">
                GHS {payment.totalAmount.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">
                {formatDate(payment.createdAt)} at{" "}
                {formatTime(payment.createdAt)}
              </p>
            </div>
            <button
              onClick={() => onViewDetails(payment)}
              className="flex items-center gap-1 text-primary-600 text-sm font-semibold hover:gap-2 transition-all"
            >
              View Details
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PaymentDetailsModal({
  payment,
  onClose,

  onRetryPayment,
}: {
  payment: TransformedPayment;
  onClose: () => void;
  onDownloadReceipt: (payment: TransformedPayment) => void;
  onRetryPayment: (payment: TransformedPayment) => void;
}) {
  const status = statusConfig[payment.status];
  const StatusIcon = status.icon;
  const [copiedTxn, setCopiedTxn] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleCopyTxn = () => {
    navigator.clipboard.writeText(payment.transactionId);
    setCopiedTxn(true);
    toast.success("Transaction ID copied!");
    setTimeout(() => setCopiedTxn(false), 2000);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="relative p-6 bg-linear-to-br from-slate-900 via-primary-900 to-slate-900">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size:1.5rem_1.5rem" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="relative">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-4",
                status.bgColor,
                status.color,
              )}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {status.label}
            </span>
            <p className="text-4xl font-bold text-white mb-1">
              GHS {payment.totalAmount.toLocaleString()}
            </p>
            <p className="text-slate-400 text-sm">
              {formatDate(payment.createdAt)}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-200">
              {payment.hostelImage ? (
                <Image
                  src={payment.hostelImage}
                  alt={payment.hostelName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-slate-300" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">
                {payment.hostelName}
              </h3>
              <p className="text-sm text-slate-500">{payment.roomName}</p>
              <p className="text-xs text-slate-400">
                {payment.semester} • {payment.academicYear}
              </p>
            </div>
            <Link
              href={`/student/bookings/${payment.bookingId}`}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
            </Link>
          </div>

          {payment.status === "FAILED" && payment.failureReason && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-red-800 text-sm">
                  Payment Failed
                </p>
                <p className="text-sm text-red-700">{payment.failureReason}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900">Payment Details</h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">Transaction ID</span>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-slate-700">
                    {payment.transactionId}
                  </code>
                  <button
                    onClick={handleCopyTxn}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    {copiedTxn ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">Payment Method</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-yellow-400">
                    M
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    MTN Mobile Money
                  </span>
                </div>
              </div>

              {payment.paymentPhone && (
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Phone Number</span>
                  <span className="text-sm font-medium text-slate-700">
                    {payment.paymentPhone}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">Date & Time</span>
                <span className="text-sm font-medium text-slate-700">
                  {formatDate(payment.createdAt)} at{" "}
                  {formatTime(payment.createdAt)}
                </span>
              </div>

              {payment.completedAt && (
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Completed At</span>
                  <span className="text-sm font-medium text-slate-700">
                    {formatDate(payment.completedAt)} at{" "}
                    {formatTime(payment.completedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900">Amount Breakdown</h4>
            <div className="p-4 bg-slate-50 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Subtotal</span>
                <span className="text-sm font-medium text-slate-700">
                  GHS {payment.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Processing Fee</span>
                <span className="text-sm font-medium text-slate-700">
                  GHS {payment.fee.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="font-semibold text-slate-800">Total</span>
                <span className="text-lg font-bold text-slate-900">
                  GHS {payment.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {payment.status === "FAILED" && (
              <button
                onClick={() => onRetryPayment(payment)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Payment
              </button>
            )}
            {payment.status === "PENDING" && (
              <Link
                href={`/student/bookings/${payment.bookingId}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Complete Payment
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

function FilterDropdown({
  value,
  options,
  onChange,
  icon: Icon,
  placeholder,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  icon: React.ElementType;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  const currentLabel =
    options.find((o) => o.value === value)?.label || placeholder;

  const isBrowser = typeof window !== "undefined";

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right - 192 + window.scrollX,
        width: 192,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const dropdownContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "absolute",
            top: position.top,
            left: position.left,
            width: position.width,
          }}
          className="bg-white border border-slate-200 rounded-xl shadow-2xl z-9999 overflow-hidden"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between",
                value === option.value
                  ? "bg-primary-50 text-primary-600 font-semibold"
                  : "text-slate-700 hover:bg-slate-50",
              )}
            >
              {option.label}
              {value === option.value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-3 bg-white/90 backdrop-blur-sm rounded-xl text-sm font-medium text-slate-700 hover:bg-white transition-colors",
          isOpen && "bg-white ring-2 ring-primary-500",
        )}
      >
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline">{currentLabel}</span>
        <ChevronDown
          className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isBrowser && createPortal(dropdownContent, document.body)}
    </>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<TransformedPayment[]>([]);
  const [stats, setStats] = useState<StudentPaymentStats | null>(null);
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] =
    useState<TransformedPayment | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await paymentService.getMyPayments({
        limit: 50,
        status: filter !== "all" ? (filter as PaymentStatus) : undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (response.success) {
        const transformed = response.data.map(transformPayment);
        setPayments(transformed);
        setStats(response.stats);
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      setError("Failed to load payments. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      searchQuery === "" ||
      payment.hostelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesDate = true;
    if (dateFilter !== "all") {
      const now = new Date();
      const paymentDate = new Date(payment.createdAt);
      switch (dateFilter) {
        case "today":
          matchesDate = paymentDate.toDateString() === now.toDateString();
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = paymentDate >= weekAgo;
          break;
        case "month":
          matchesDate =
            paymentDate.getMonth() === now.getMonth() &&
            paymentDate.getFullYear() === now.getFullYear();
          break;
        case "year":
          matchesDate = paymentDate.getFullYear() === now.getFullYear();
          break;
      }
    }

    return matchesSearch && matchesDate;
  });

  const pendingPayments = filteredPayments.filter(
    (p) => p.status === "PENDING",
  );
  const completedPayments = filteredPayments.filter(
    (p) => p.status === "SUCCESSFUL",
  );
  const otherPayments = filteredPayments.filter(
    (p) => p.status === "FAILED" || p.status === "REFUNDED",
  );

  const handleViewDetails = (payment: TransformedPayment) => {
    setSelectedPayment(payment);
  };

  const handleDownloadReceipt = (payment: TransformedPayment) => {
    toast.success(`Downloading receipt for ${payment.transactionId}`);
  };

  const handleRetryPayment = (payment: TransformedPayment) => {
    toast.success(`Retrying payment for ${payment.hostelName}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative bg-linear-to-br from-slate-900 via-primary-900 to-slate-900">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[3rem_3rem] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative container-custom py-10 sm:py-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs text-slate-300 mb-4">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  {stats?.total || 0} total transaction
                  {(stats?.total || 0) !== 1 && "s"}
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  Payment{" "}
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-primary-400">
                    History
                  </span>
                </h1>
                <p className="text-slate-400">
                  Track all your hostel payments and transactions
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={fetchPayments}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-4 py-3 bg-white/10 text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={cn("w-4 h-4", isLoading && "animate-spin")}
                  />
                  Refresh
                </button>
                <Link
                  href="/hostels"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-100 transition-colors shadow-lg shrink-0"
                >
                  <Building2 className="w-4 h-4" />
                  Book Hostel
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-500/20 rounded-lg flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-slate-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {stats?.total || 0}
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
                      {stats?.successful || 0}
                    </p>
                    <p className="text-xs text-slate-400">Completed</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {stats?.pending || 0}
                    </p>
                    <p className="text-xs text-slate-400">Pending</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      GHS {(stats?.totalSpent || 0).toLocaleString()}
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
            className="flex flex-wrap gap-2 p-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl"
          >
            <div className="flex-1 min-w-50 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by hostel or transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/90 backdrop-blur-sm rounded-xl border-0 focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800 placeholder:text-slate-400 transition-all text-sm"
              />
            </div>

            <FilterDropdown
              value={filter}
              options={filterOptions}
              onChange={setFilter}
              icon={Filter}
              placeholder="All Payments"
            />

            <FilterDropdown
              value={dateFilter}
              options={dateFilterOptions}
              onChange={setDateFilter}
              icon={Calendar}
              placeholder="All Time"
            />
          </motion.div>
        </div>

        <div className="relative z-10">
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
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={fetchPayments}
              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
            >
              Retry
            </button>
          </motion.div>
        )}

        {(filter !== "all" || dateFilter !== "all") && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-2 mb-6"
          >
            <span className="text-sm text-slate-500">Filtered by:</span>
            {filter !== "all" && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
                  statusConfig[filter as PaymentStatus]?.bgColor,
                  statusConfig[filter as PaymentStatus]?.color,
                  statusConfig[filter as PaymentStatus]?.borderColor,
                )}
              >
                {statusConfig[filter as PaymentStatus]?.label}
                <button
                  onClick={() => setFilter("all")}
                  className="ml-1 hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {dateFilter !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200">
                {dateFilterOptions.find((o) => o.value === dateFilter)?.label}
                <button
                  onClick={() => setDateFilter("all")}
                  className="ml-1 hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </motion.div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <PaymentCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredPayments.length === 0 ? (
          <EmptyState filter={filter} onClear={() => setFilter("all")} />
        ) : (
          <div className="space-y-8">
            {pendingPayments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Pending Payments
                    </h2>
                    <p className="text-sm text-slate-500">
                      {pendingPayments.length} payment
                      {pendingPayments.length !== 1 && "s"} awaiting completion
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {pendingPayments.map((payment, index) => (
                    <PaymentCard
                      key={payment.id}
                      payment={payment}
                      index={index}
                      onViewDetails={handleViewDetails}
                      onDownloadReceipt={handleDownloadReceipt}
                      onRetryPayment={handleRetryPayment}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {completedPayments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Completed Payments
                    </h2>
                    <p className="text-sm text-slate-500">
                      {completedPayments.length} successful payment
                      {completedPayments.length !== 1 && "s"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {completedPayments.map((payment, index) => (
                    <PaymentCard
                      key={payment.id}
                      payment={payment}
                      index={index}
                      onViewDetails={handleViewDetails}
                      onDownloadReceipt={handleDownloadReceipt}
                      onRetryPayment={handleRetryPayment}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {otherPayments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Failed & Refunded
                    </h2>
                    <p className="text-sm text-slate-500">
                      {otherPayments.length} transaction
                      {otherPayments.length !== 1 && "s"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {otherPayments.map((payment, index) => (
                    <PaymentCard
                      key={payment.id}
                      payment={payment}
                      index={index}
                      onViewDetails={handleViewDetails}
                      onDownloadReceipt={handleDownloadReceipt}
                      onRetryPayment={handleRetryPayment}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedPayment && (
          <PaymentDetailsModal
            payment={selectedPayment}
            onClose={() => setSelectedPayment(null)}
            onDownloadReceipt={handleDownloadReceipt}
            onRetryPayment={handleRetryPayment}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
