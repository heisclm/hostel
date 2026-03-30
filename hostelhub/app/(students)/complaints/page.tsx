"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  X,
  Building2,
  Calendar,
  ArrowRight,
  XCircle,
  Check,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { complaintService, type Complaint } from "@/services/complaint.service";
import toast from "react-hot-toast";

type ComplaintStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

const statusConfig: Record<
  ComplaintStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ElementType;
  }
> = {
  OPEN: {
    label: "Open",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: Clock,
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: AlertCircle,
  },
  RESOLVED: {
    label: "Resolved",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    icon: CheckCircle2,
  },
  CLOSED: {
    label: "Closed",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-200",
    icon: XCircle,
  },
};

const filterOptions = [
  { value: "all", label: "All Complaints" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

function ComplaintCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-48 bg-slate-200 rounded-lg" />
            <div className="h-5 w-20 bg-slate-100 rounded-full" />
          </div>
          <div className="h-4 w-32 bg-slate-100 rounded-lg" />
          <div className="h-4 w-full bg-slate-100 rounded-lg" />
          <div className="h-4 w-3/4 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-8 w-8 bg-slate-100 rounded-lg" />
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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-6">
        <MessageSquare className="w-10 h-10 text-slate-300" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">
        No complaints found
      </h3>
      <p className="text-slate-500 max-w-sm mb-6">
        {filter === "all"
          ? "You haven't submitted any complaints yet. If you're experiencing any issues, let us know!"
          : `No ${filter.replace("_", " ").toLowerCase()} complaints found.`}
      </p>
      {filter === "all" ? (
        <Link
          href="/complaints/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Submit a Complaint
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

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-red-300" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">
        Failed to load complaints
      </h3>
      <p className="text-slate-500 max-w-sm mb-6">
        Something went wrong while fetching your complaints. Please try again.
      </p>
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

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);

    try {
      const params: { page?: number; limit?: number; status?: string } = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filter !== "all") {
        params.status = filter;
      }

      const response = await complaintService.getMyComplaints(params);

      if (response.success) {
        setComplaints(response.data);
        if (response.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: response.pagination!.total,
            pages: response.pagination!.pages,
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
      setIsError(true);
      toast.error("Failed to load complaints");
    } finally {
      setIsLoading(false);
    }
  }, [filter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  useEffect(() => {
    if (!showFilterDropdown) return;
    const handler = () => setShowFilterDropdown(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showFilterDropdown]);

  const filteredComplaints = complaints.filter((complaint) => {
    if (!debouncedSearch) return true;
    const query = debouncedSearch.toLowerCase();
    return (
      complaint.subject.toLowerCase().includes(query) ||
      complaint.hostel?.name?.toLowerCase().includes(query) ||
      complaint.id.toLowerCase().includes(query) ||
      complaint.category?.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: complaints.length,
    open: complaints.filter((c) => c.status === "OPEN").length,
    inProgress: complaints.filter((c) => c.status === "IN_PROGRESS").length,
    resolved: complaints.filter((c) => c.status === "RESOLVED").length,
  };

  const currentFilterLabel =
    filterOptions.find((o) => o.value === filter)?.label || "All";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getLatestResponse = (complaint: Complaint) => {
    if (!complaint.responses || complaint.responses.length === 0) return null;
    return complaint.responses[complaint.responses.length - 1];
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative bg-linear-to-br from-slate-900 via-primary-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size:3rem_3rem" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500/20 rounded-full blur-[80px]" />

        <div className="relative container-custom py-10 sm:py-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs text-slate-300 mb-4">
                  <MessageSquare className="w-3.5 h-3.5 text-primary-400" />
                  {stats.total} total complaints
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  My{" "}
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-400 to-secondary-400">
                    Complaints
                  </span>
                </h1>
                <p className="text-slate-400">
                  Track and manage your submitted complaints
                </p>
              </div>
              <Link
                href="/complaints/new"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-100 transition-colors shadow-lg shrink-0"
              >
                <Plus className="w-4 h-4" />
                New Complaint
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-500/20 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-slate-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {stats.total}
                    </p>
                    <p className="text-xs text-slate-400">Total</p>
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
                      {stats.open}
                    </p>
                    <p className="text-xs text-slate-400">Open</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {stats.inProgress}
                    </p>
                    <p className="text-xs text-slate-400">In Progress</p>
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
                      {stats.resolved}
                    </p>
                    <p className="text-xs text-slate-400">Resolved</p>
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
                placeholder="Search by subject, hostel, or ID..."
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
                <ChevronDown className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showFilterDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-30 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilter(option.value);
                          setShowFilterDropdown(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between",
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" className="w-full">
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
                statusConfig[filter as ComplaintStatus]?.bgColor,
                statusConfig[filter as ComplaintStatus]?.color,
                statusConfig[filter as ComplaintStatus]?.borderColor,
              )}
            >
              {statusConfig[filter as ComplaintStatus]?.label}
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
              <ComplaintCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={fetchComplaints} />
        ) : filteredComplaints.length === 0 ? (
          <EmptyState filter={filter} onClear={() => setFilter("all")} />
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-4">
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {filteredComplaints.length}
              </span>{" "}
              complaint{filteredComplaints.length !== 1 && "s"}
            </p>

            <div className="space-y-4">
              {filteredComplaints.map((complaint, index) => {
                const status = statusConfig[complaint.status];
                const StatusIcon = status.icon;
                const latestResponse = getLatestResponse(complaint);

                return (
                  <motion.div
                    key={complaint.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/complaints/${complaint.id}`}>
                      <motion.div
                        whileHover={{ y: -2 }}
                        className="group bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md p-5 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                                {complaint.subject}
                              </h3>
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

                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-3">
                              {complaint.hostel && (
                                <>
                                  <span className="flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4 text-slate-400" />
                                    {complaint.hostel.name}
                                  </span>
                                  <span className="text-slate-300">•</span>
                                </>
                              )}
                              {complaint.category && (
                                <>
                                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded capitalize">
                                    {complaint.category}
                                  </span>
                                  <span className="text-slate-300">•</span>
                                </>
                              )}
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                {formatDate(complaint.createdAt)}
                              </span>
                              {complaint._count &&
                                complaint._count.responses > 0 && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="flex items-center gap-1.5 text-primary-600">
                                      <MessageSquare className="w-4 h-4" />
                                      {complaint._count.responses} response
                                      {complaint._count.responses !== 1 && "s"}
                                    </span>
                                  </>
                                )}
                            </div>

                            <p className="text-sm text-slate-600 line-clamp-2">
                              {complaint.message}
                            </p>

                            {latestResponse && (
                              <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                <p className="text-xs font-medium text-slate-500 mb-1">
                                  Latest Response from{" "}
                                  {latestResponse.responder.firstName}{" "}
                                  {latestResponse.responder.lastName}:
                                </p>
                                <p className="text-sm text-slate-700 line-clamp-1">
                                  {latestResponse.message}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm text-primary-600 font-medium group-hover:underline">
                              View Details
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-primary-50 flex items-center justify-center transition-colors">
                              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition-colors" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-500">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.min(prev.pages, prev.page + 1),
                    }))
                  }
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
