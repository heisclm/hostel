"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Download,
  Eye,
  Phone,
  Mail,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  UserCheck,
  UserX,
  Clock,
  X,
  ArrowUpDown,
  CreditCard,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { useManagerTenants } from "@/hooks/useTenants";
import { useDebounce } from "@/hooks/useDebounce";

import type {
  TenantData,
  TenantStats as TenantStatsType,
} from "@/types/tenants";

type TenantStatus = "active" | "checked_out" | "overdue" | "pending";

function formatCurrency(amount: number) {
  return `GHS ${amount.toLocaleString()}`;
}

function formatDate(dateString: string | null) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusConfig(status: TenantStatus) {
  const configs = {
    active: {
      label: "Active",
      variant: "success" as const,
      icon: UserCheck,
    },
    checked_out: {
      label: "Checked Out",
      variant: "secondary" as const,
      icon: UserX,
    },
    overdue: {
      label: "Overdue",
      variant: "error" as const,
      icon: AlertCircle,
    },
    pending: {
      label: "Pending",
      variant: "warning" as const,
      icon: Clock,
    },
  };
  return configs[status];
}

function mapStatusToBackend(status: TenantStatus | "all"): string | undefined {
  const map: Record<string, string | undefined> = {
    all: undefined,
    active: "CHECKED_IN",
    checked_out: "CHECKED_OUT",
    overdue: "CHECKED_IN",
    pending: "CONFIRMED",
  };
  return map[status];
}

function mapSortToBackend(
  sort: string,
): "checkInDate" | "name" | "roomNumber" | "createdAt" {
  const map: Record<
    string,
    "checkInDate" | "name" | "roomNumber" | "createdAt"
  > = {
    name: "name",
    room: "roomNumber",
    balance: "createdAt",
    date: "checkInDate",
  };
  return map[sort] || "checkInDate";
}

function StatsCards({
  stats,
  isLoading,
}: {
  stats: TenantStatsType | undefined;
  isLoading: boolean;
}) {
  const cards = [
    {
      label: "Active Tenants",
      value: stats?.active ?? 0,
      icon: UserCheck,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
    },
    {
      label: "Overdue Payments",
      value: stats?.overdue ?? 0,
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
    },
    {
      label: "Outstanding Balance",
      value: formatCurrency(stats?.totalOutstanding ?? 0),
      icon: CreditCard,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      isAmount: true,
    },
    {
      label: "Total Collected",
      value: formatCurrency(stats?.totalCollected ?? 0),
      icon: CreditCard,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      isAmount: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((stat) => (
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
              {isLoading ? (
                <div className="h-7 w-16 bg-slate-200 animate-pulse rounded mt-1" />
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

function TenantDetailModal({
  tenant,
  onClose,
}: {
  tenant: TenantData;
  onClose: () => void;
}) {
  const statusConfig = getStatusConfig(tenant.status);
  const paymentProgress =
    tenant.totalDue > 0 ? (tenant.totalPaid / tenant.totalDue) * 100 : 0;

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
          <h2 className="text-lg font-bold text-slate-800">Tenant Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Avatar
              name={tenant.booker.name}
              src={tenant.booker.avatar}
              size="xl"
            />
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {tenant.booker.name}
              </h3>
              <p className="text-sm text-slate-500">
                {tenant.booker.bookerId || tenant.id}
              </p>
              <Badge variant={statusConfig.variant} size="sm" className="mt-1">
                <statusConfig.icon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <h4 className="text-sm font-semibold text-slate-800">Contact</h4>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail className="w-4 h-4 text-slate-400" />
              {tenant.booker.email}
            </div>
            {tenant.booker.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                {tenant.booker.phone}
              </div>
            )}
          </div>
          {(tenant.booker.university || tenant.booker.programme) && (
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-3">
                Academic Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: "University",
                    value: tenant.booker.university,
                  },
                  {
                    label: "Programme",
                    value: tenant.booker.programme,
                  },
                  { label: "Level", value: tenant.booker.level },
                  {
                    label: "Student ID",
                    value: tenant.booker.bookerId,
                  },
                ]
                  .filter((item) => item.value)
                  .map((item) => (
                    <div
                      key={item.label}
                      className="bg-slate-50 rounded-lg p-3"
                    >
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className="text-sm font-medium text-slate-800">
                        {item.value}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-3">
              Accommodation
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Hostel</p>
                <p className="text-sm font-medium text-slate-800">
                  {tenant.hostel.name}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Room</p>
                <p className="text-sm font-medium text-slate-800">
                  {tenant.roomNumber || "Not assigned"}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Check-in</p>
                <p className="text-sm font-medium text-slate-800">
                  {formatDate(tenant.checkIn)}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Check-out</p>
                <p className="text-sm font-medium text-slate-800">
                  {formatDate(tenant.checkOut)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-3">
              Payment Status
            </h4>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Total Due</span>
                <span className="text-sm font-bold text-slate-800">
                  {formatCurrency(tenant.totalDue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Paid</span>
                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(tenant.totalPaid)}
                </span>
              </div>
              {tenant.balance > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Balance</span>
                  <span className="text-sm font-semibold text-red-600">
                    {formatCurrency(tenant.balance)}
                  </span>
                </div>
              )}
              <div className="pt-1">
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      paymentProgress >= 100
                        ? "bg-green-500"
                        : paymentProgress > 0
                          ? "bg-amber-500"
                          : "bg-slate-300",
                    )}
                    style={{
                      width: `${Math.min(paymentProgress, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1 text-right">
                  {Math.round(paymentProgress)}% paid
                </p>
              </div>
              {tenant.lastPaymentDate && (
                <p className="text-xs text-slate-400">
                  Last payment: {formatDate(tenant.lastPaymentDate)}
                </p>
              )}
            </div>
          </div>
          {tenant.booker.emergencyContact.name && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-red-800 mb-2">
                Emergency Contact
              </h4>
              <p className="text-sm font-medium text-red-700">
                {tenant.booker.emergencyContact.name}
              </p>
              {tenant.booker.emergencyContact.relationship && (
                <p className="text-xs text-red-600">
                  {tenant.booker.emergencyContact.relationship}
                </p>
              )}
              {tenant.booker.emergencyContact.phone && (
                <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                  <Phone className="w-4 h-4" />
                  {tenant.booker.emergencyContact.phone}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose}>
            Close
          </Button>
          <Button fullWidth>
            <MessageSquare className="w-4 h-4 mr-2" />
            Message
          </Button>
        </div>
      </motion.div>
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 bg-slate-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/4" />
            </div>
            <div className="h-6 bg-slate-200 rounded w-16" />
            <div className="h-6 bg-slate-200 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TenantsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TenantStatus | "all">("all");
  const [hostelFilter, setHostelFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "room" | "balance" | "date">(
    "name",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTenant, setSelectedTenant] = useState<TenantData | null>(null);
  const pageSize = 20;

  const debouncedSearch = useDebounce(search, 400);

  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: pageSize,
      status: mapStatusToBackend(statusFilter),
      search: debouncedSearch || undefined,
      hostelId: hostelFilter !== "all" ? hostelFilter : undefined,
      sortBy: mapSortToBackend(sortBy),
      sortOrder: sortBy === "balance" ? ("desc" as const) : ("asc" as const),
    }),
    [currentPage, statusFilter, debouncedSearch, hostelFilter, sortBy],
  );

  const { data, isLoading, isError, error, refetch, isFetching } =
    useManagerTenants(queryParams);

  const responseData = data?.data;
  const pagination = responseData?.pagination;
  const stats = responseData?.stats;
  const hostels = responseData?.hostels ?? [];
  const totalPages = pagination?.totalPages ?? 1;

  const displayTenants = useMemo(() => {
    const tenants = responseData?.tenants ?? [];
    if (statusFilter === "overdue") {
      return tenants.filter((t) => t.status === "overdue");
    }
    return tenants;
  }, [responseData?.tenants, statusFilter]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setCurrentPage(1);
    },
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tenants</h1>
          <p className="text-slate-500 mt-1">
            Manage all tenants across your hostels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("w-4 h-4 mr-2", isFetching && "animate-spin")}
            />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <StatsCards stats={stats} isLoading={isLoading} />

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, student ID, or room..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as TenantStatus | "all");
                setCurrentPage(1);
              }}
              className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
              <option value="pending">Pending</option>
              <option value="checked_out">Checked Out</option>
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
                <option key={h.id} value={h.id}>
                  {h.name}
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
              <option value="name">Sort by Name</option>
              <option value="room">Sort by Room</option>
              <option value="balance">Sort by Balance</option>
              <option value="date">Sort by Date</option>
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-1">
            Failed to load tenants
          </h3>
          <p className="text-red-600 text-sm mb-4">
            {(error as Error)?.message || "Something went wrong."}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      )}

      {isLoading && <TableSkeleton />}

      {!isLoading && !isError && (
        <>
          {displayTenants.length > 0 ? (
            <>
              <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden">
                {isFetching && (
                  <div className="h-1 bg-primary-100 overflow-hidden">
                    <div className="h-full bg-primary-500 animate-pulse w-full" />
                  </div>
                )}
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Tenant
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Hostel & Room
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Programme
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Balance
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayTenants.map((tenant) => {
                      const statusConfig = getStatusConfig(tenant.status);
                      return (
                        <tr
                          key={tenant.id}
                          className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar
                                name={tenant.booker.name}
                                src={tenant.booker.avatar}
                                size="sm"
                              />
                              <div>
                                <p className="font-medium text-slate-800 text-sm">
                                  {tenant.booker.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {tenant.booker.bookerId || tenant.id}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-700">
                              {tenant.hostel.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {tenant.roomNumber
                                ? `Room ${tenant.roomNumber}`
                                : "Not assigned"}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-700">
                              {tenant.booker.programme || "—"}
                            </p>
                            <p className="text-xs text-slate-400">
                              {tenant.booker.level || ""}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            {tenant.balance > 0 ? (
                              <p className="text-sm font-semibold text-red-600">
                                {formatCurrency(tenant.balance)}
                              </p>
                            ) : (
                              <p className="text-sm font-medium text-green-600">
                                Paid
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusConfig.variant} size="sm">
                              {statusConfig.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setSelectedTenant(tenant)}
                                className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="Message"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              {tenant.booker.phone && (
                                <a
                                  href={`tel:${tenant.booker.phone}`}
                                  className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                  title="Call"
                                >
                                  <Phone className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden grid gap-4 sm:grid-cols-2">
                {displayTenants.map((tenant) => {
                  const statusConfig = getStatusConfig(tenant.status);
                  return (
                    <motion.div
                      key={tenant.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={tenant.booker.name}
                            src={tenant.booker.avatar}
                            size="md"
                          />
                          <div>
                            <h3 className="font-semibold text-slate-800 text-sm">
                              {tenant.booker.name}
                            </h3>
                            <p className="text-xs text-slate-400">
                              {tenant.booker.bookerId || tenant.id}
                            </p>
                          </div>
                        </div>
                        <Badge variant={statusConfig.variant} size="sm">
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <p className="text-xs text-slate-400">Hostel</p>
                          <p className="text-slate-700 font-medium">
                            {tenant.hostel.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Room</p>
                          <p className="text-slate-700 font-medium">
                            {tenant.roomNumber || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Programme</p>
                          <p className="text-slate-700 font-medium text-xs">
                            {tenant.booker.programme || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Balance</p>
                          <p
                            className={cn(
                              "font-semibold",
                              tenant.balance > 0
                                ? "text-red-600"
                                : "text-green-600",
                            )}
                          >
                            {tenant.balance > 0
                              ? formatCurrency(tenant.balance)
                              : "Paid"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-slate-100">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedTenant(tenant)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Message
                        </Button>
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
                      {((pagination?.page ?? 1) - 1) * pageSize + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        (pagination?.page ?? 1) * pageSize,
                        pagination?.total ?? 0,
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {pagination?.total ?? 0}
                    </span>{" "}
                    tenants
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
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                No tenants found
              </h3>
              <p className="text-slate-500">
                {search || statusFilter !== "all" || hostelFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "No tenants have been checked in yet."}
              </p>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {selectedTenant && (
          <TenantDetailModal
            tenant={selectedTenant}
            onClose={() => setSelectedTenant(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
