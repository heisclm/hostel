"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Search,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowUpDown,
  Building2,
  RefreshCw,
  X,
  FileText,
  Banknote,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

type PaymentStatus = "completed" | "pending" | "failed" | "refunded";
type PaymentMethod = "mobile_money" | "bank_transfer" | "cash" | "card";

interface Payment {
  id: string;
  tenantName: string;
  tenantEmail: string;
  hostelName: string;
  roomNumber: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  reference: string;
  date: string;
  description: string;
  academicYear: string;
  semester: string;
}

const mockPayments: Payment[] = [
  {
    id: "PAY-001",
    tenantName: "Ama Mensah",
    tenantEmail: "ama.mensah@university.edu.gh",
    hostelName: "Sunrise Hostel",
    roomNumber: "A-101",
    amount: 3500,
    status: "completed",
    method: "mobile_money",
    reference: "MM-2025011000456",
    date: "2025-01-10T14:30:00Z",
    description: "Full semester payment",
    academicYear: "2024/2025",
    semester: "Semester 2",
  },
  {
    id: "PAY-002",
    tenantName: "Kofi Boateng",
    tenantEmail: "kofi.boat@university.edu.gh",
    hostelName: "Sunrise Hostel",
    roomNumber: "B-205",
    amount: 2800,
    status: "completed",
    method: "bank_transfer",
    reference: "BT-2025010800123",
    date: "2025-01-08T10:15:00Z",
    description: "Full semester payment",
    academicYear: "2024/2025",
    semester: "Semester 2",
  },
  {
    id: "PAY-003",
    tenantName: "Yaw Asante",
    tenantEmail: "yaw.asante@university.edu.gh",
    hostelName: "Sunrise Hostel",
    roomNumber: "A-108",
    amount: 1750,
    status: "completed",
    method: "mobile_money",
    reference: "MM-2025011200789",
    date: "2025-01-12T16:45:00Z",
    description: "Partial payment (50%)",
    academicYear: "2024/2025",
    semester: "Semester 2",
  },
  {
    id: "PAY-004",
    tenantName: "Akua Darko",
    tenantEmail: "akua.darko@university.edu.gh",
    hostelName: "Palm Heights",
    roomNumber: "C-302",
    amount: 3200,
    status: "completed",
    method: "cash",
    reference: "CASH-20241220001",
    date: "2024-12-20T09:00:00Z",
    description: "Full semester payment",
    academicYear: "2024/2025",
    semester: "Semester 2",
  },
  {
    id: "PAY-005",
    tenantName: "Nana Yaw Osei",
    tenantEmail: "nana.osei@university.edu.gh",
    hostelName: "Palm Heights",
    roomNumber: "A-103",
    amount: 1800,
    status: "pending",
    method: "mobile_money",
    reference: "MM-2025011300234",
    date: "2025-01-13T07:45:00Z",
    description: "Full semester payment - awaiting confirmation",
    academicYear: "2024/2025",
    semester: "Semester 2",
  },
  {
    id: "PAY-006",
    tenantName: "Kwesi Adjei",
    tenantEmail: "kwesi.adj@university.edu.gh",
    hostelName: "Sunrise Hostel",
    roomNumber: "C-401",
    amount: 2200,
    status: "refunded",
    method: "mobile_money",
    reference: "MM-2025010500567",
    date: "2025-01-05T08:20:00Z",
    description: "Refund - booking cancelled",
    academicYear: "2024/2025",
    semester: "Semester 2",
  },
  {
    id: "PAY-007",
    tenantName: "Abena Serwaa",
    tenantEmail: "abena.s@university.edu.gh",
    hostelName: "Sunrise Hostel",
    roomNumber: "A-205",
    amount: 2000,
    status: "completed",
    method: "card",
    reference: "CARD-2025010900890",
    date: "2025-01-09T13:00:00Z",
    description: "Partial payment",
    academicYear: "2024/2025",
    semester: "Semester 2",
  },
  {
    id: "PAY-008",
    tenantName: "Adjoa Poku",
    tenantEmail: "adjoa.poku@university.edu.gh",
    hostelName: "Sunrise Hostel",
    roomNumber: "B-301",
    amount: 2800,
    status: "failed",
    method: "mobile_money",
    reference: "MM-2025011400345",
    date: "2025-01-14T11:30:00Z",
    description: "Payment failed - insufficient funds",
    academicYear: "2024/2025",
    semester: "Semester 2",
  },
  {
    id: "PAY-009",
    tenantName: "Kwabena Fosu",
    tenantEmail: "kwabena.f@university.edu.gh",
    hostelName: "Palm Heights",
    roomNumber: "C-201",
    amount: 3200,
    status: "completed",
    method: "bank_transfer",
    reference: "BT-2025010700456",
    date: "2025-01-07T12:00:00Z",
    description: "Full semester payment",
    academicYear: "2024/2025",
    semester: "Semester 2",
  },
];

function formatCurrency(amount: number) {
  return `GHS ${amount.toLocaleString()}`;
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusConfig(status: PaymentStatus) {
  const configs = {
    completed: {
      label: "Completed",
      variant: "success" as const,
      icon: CheckCircle2,
    },
    pending: {
      label: "Pending",
      variant: "warning" as const,
      icon: Clock,
    },
    failed: {
      label: "Failed",
      variant: "error" as const,
      icon: XCircle,
    },
    refunded: {
      label: "Refunded",
      variant: "secondary" as const,
      icon: RefreshCw,
    },
  };
  return configs[status];
}

function getMethodConfig(method: PaymentMethod) {
  const configs = {
    mobile_money: { label: "Mobile Money", icon: Phone },
    bank_transfer: { label: "Bank Transfer", icon: Building2 },
    cash: { label: "Cash", icon: Banknote },
    card: { label: "Card", icon: CreditCard },
  };
  return configs[method];
}

function PaymentStats({ payments }: { payments: Payment[] }) {
  const stats = useMemo(() => {
    const completed = payments.filter((p) => p.status === "completed");
    const totalReceived = completed.reduce((sum, p) => sum + p.amount, 0);
    const pending = payments.filter((p) => p.status === "pending");
    const totalPending = pending.reduce((sum, p) => sum + p.amount, 0);
    const refunded = payments.filter((p) => p.status === "refunded");
    const totalRefunded = refunded.reduce((sum, p) => sum + p.amount, 0);
    const failed = payments.filter((p) => p.status === "failed").length;

    return [
      {
        label: "Total Received",
        value: formatCurrency(totalReceived),
        icon: ArrowDownRight,
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-200",
        subtext: `${completed.length} transactions`,
      },
      {
        label: "Pending",
        value: formatCurrency(totalPending),
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        subtext: `${pending.length} transactions`,
      },
      {
        label: "Refunded",
        value: formatCurrency(totalRefunded),
        icon: ArrowUpRight,
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        subtext: `${refunded.length} transactions`,
      },
      {
        label: "Failed",
        value: failed.toString(),
        icon: XCircle,
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        subtext: "transactions",
      },
    ];
  }, [payments]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("bg-white rounded-xl border p-4", stat.border)}
        >
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              <p className="text-lg font-bold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.subtext}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function PaymentDetailModal({
  payment,
  onClose,
}: {
  payment: Payment;
  onClose: () => void;
}) {
  const statusConfig = getStatusConfig(payment.status);
  const methodConfig = getMethodConfig(payment.method);

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
        className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-y-auto max-h-[90vh]"
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
              {formatCurrency(payment.amount)}
            </p>
            <Badge variant={statusConfig.variant} size="md" className="mt-2">
              <statusConfig.icon className="w-3.5 h-3.5 mr-1.5" />
              {statusConfig.label}
            </Badge>
          </div>

          <div className="space-y-4">
            {[
              { label: "Transaction ID", value: payment.id },
              { label: "Reference", value: payment.reference },
              { label: "Date & Time", value: formatDateTime(payment.date) },
              { label: "Method", value: methodConfig.label },
              { label: "Description", value: payment.description },
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
          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">
              Tenant
            </h4>
            <div className="flex items-center gap-3">
              <Avatar name={payment.tenantName} size="md" />
              <div>
                <p className="font-medium text-slate-800">
                  {payment.tenantName}
                </p>
                <p className="text-xs text-slate-500">
                  {payment.hostelName} · Room {payment.roomNumber}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Academic Year</span>
              <span className="font-medium text-slate-800">
                {payment.academicYear}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-slate-500">Semester</span>
              <span className="font-medium text-slate-800">
                {payment.semester}
              </span>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 flex gap-3">
          <Button variant="outline" fullWidth>
            <FileText className="w-4 h-4 mr-2" />
            Download Receipt
          </Button>
          <Button variant="outline" fullWidth onClick={onClose}>
            Close
          </Button>
        </div>
      </motion.div>
    </>
  );
}

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">(
    "all",
  );
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "all">(
    "all",
  );
  const [hostelFilter, setHostelFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "high" | "low">(
    "newest",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const pageSize = 8;

  const hostels = useMemo(
    () => [...new Set(mockPayments.map((p) => p.hostelName))],
    [],
  );

  const filteredPayments = useMemo(() => {
    let result = [...mockPayments];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.tenantName.toLowerCase().includes(s) ||
          p.id.toLowerCase().includes(s) ||
          p.reference.toLowerCase().includes(s),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (methodFilter !== "all") {
      result = result.filter((p) => p.method === methodFilter);
    }

    if (hostelFilter !== "all") {
      result = result.filter((p) => p.hostelName === hostelFilter);
    }

    switch (sortBy) {
      case "newest":
        result.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        break;
      case "oldest":
        result.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
        break;
      case "high":
        result.sort((a, b) => b.amount - a.amount);
        break;
      case "low":
        result.sort((a, b) => a.amount - b.amount);
        break;
    }

    return result;
  }, [search, statusFilter, methodFilter, hostelFilter, sortBy]);

  const totalPages = Math.ceil(filteredPayments.length / pageSize);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
          <p className="text-slate-500 mt-1">
            Track and manage all payment transactions
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      <PaymentStats payments={mockPayments} />

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or reference..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as PaymentStatus | "all");
                setCurrentPage(1);
              }}
              className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value as PaymentMethod | "all");
                setCurrentPage(1);
              }}
              className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer"
            >
              <option value="all">All Methods</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={hostelFilter}
              onChange={(e) => {
                setHostelFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer"
            >
              <option value="all">All Hostels</option>
              {hostels.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="high">Amount: High</option>
              <option value="low">Amount: Low</option>
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {paginatedPayments.length > 0 ? (
        <>
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {[
                    "Transaction",
                    "Tenant",
                    "Amount",
                    "Method",
                    "Status",
                    "Date",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.map((payment) => {
                  const statusConfig = getStatusConfig(payment.status);
                  const methodConfig = getMethodConfig(payment.method);
                  return (
                    <tr
                      key={payment.id}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-800">
                          {payment.id}
                        </p>
                        <p className="text-xs text-slate-400 truncate max-w-37.5">
                          {payment.reference}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={payment.tenantName} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {payment.tenantName}
                            </p>
                            <p className="text-xs text-slate-400">
                              {payment.hostelName} · {payment.roomNumber}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-800">
                          {formatCurrency(payment.amount)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <methodConfig.icon className="w-4 h-4 text-slate-400" />
                          {methodConfig.label}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusConfig.variant} size="sm">
                          <statusConfig.icon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-600">
                          {formatDate(payment.date)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden space-y-4">
            {paginatedPayments.map((payment) => {
              const statusConfig = getStatusConfig(payment.status);
              const methodConfig = getMethodConfig(payment.method);
              return (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border border-slate-200 p-4"
                  onClick={() => setSelectedPayment(payment)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={payment.tenantName} size="sm" />
                      <div>
                        <p className="font-medium text-slate-800 text-sm">
                          {payment.tenantName}
                        </p>
                        <p className="text-xs text-slate-400">{payment.id}</p>
                      </div>
                    </div>
                    <Badge variant={statusConfig.variant} size="sm">
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div>
                      <p className="text-lg font-bold text-slate-800">
                        {formatCurrency(payment.amount)}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        <methodConfig.icon className="w-3 h-3" />
                        {methodConfig.label}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      {formatDate(payment.date)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white rounded-xl border border-slate-200">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, filteredPayments.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium">{filteredPayments.length}</span>{" "}
                payments
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "w-9 h-9 rounded-lg text-sm font-medium transition-colors",
                        page === currentPage
                          ? "bg-primary-600 text-white"
                          : "text-slate-600 hover:bg-slate-100",
                      )}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            No payments found
          </h3>
          <p className="text-slate-500">
            Try adjusting your search or filters.
          </p>
        </div>
      )}

      <AnimatePresence>
        {selectedPayment && (
          <PaymentDetailModal
            payment={selectedPayment}
            onClose={() => setSelectedPayment(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
