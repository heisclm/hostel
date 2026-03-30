/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronDown,
  Send,
  X,
  Building2,
  User,
  ArrowUpDown,
  MessageCircle,
  Shield,
  ArrowRight,
  Phone,
  Mail,
  Download,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { complaintService, Complaint } from "@/services/complaint.service";
import toast from "react-hot-toast";

type ComplaintStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type Category =
  | "MAINTENANCE"
  | "WATER"
  | "ELECTRICITY"
  | "SECURITY"
  | "NOISE"
  | "CLEANLINESS"
  | "WIFI"
  | "MANAGEMENT"
  | "PAYMENT"
  | "OTHER";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return formatDate(dateString);
}

function getDaysOpen(createdAt: string, resolvedAt?: string | null): number {
  const start = new Date(createdAt);
  const end = resolvedAt ? new Date(resolvedAt) : new Date();
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatusConfig(status: ComplaintStatus) {
  const configs = {
    OPEN: {
      label: "Open",
      variant: "error" as const,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    IN_PROGRESS: {
      label: "In Progress",
      variant: "warning" as const,
      icon: Loader2,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    RESOLVED: {
      label: "Resolved",
      variant: "success" as const,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    CLOSED: {
      label: "Closed",
      variant: "secondary" as const,
      icon: XCircle,
      color: "text-slate-600",
      bg: "bg-slate-50",
    },
  };
  return configs[status];
}

function getPriorityConfig(priority?: Priority) {
  const configs = {
    LOW: { label: "Low", variant: "secondary" as const, color: "bg-blue-500" },
    MEDIUM: {
      label: "Medium",
      variant: "warning" as const,
      color: "bg-amber-500",
    },
    HIGH: { label: "High", variant: "error" as const, color: "bg-red-500" },
    URGENT: {
      label: "Urgent",
      variant: "error" as const,
      color: "bg-red-700",
    },
  };
  return priority ? configs[priority] : configs.MEDIUM;
}

function getCategoryLabel(category?: string | null) {
  const labels: Record<string, string> = {
    maintenance: "Maintenance",
    utilities: "Utilities",
    security: "Security",
    noise: "Noise",
    cleanliness: "Cleanliness",
    management: "Management Issue",
    other: "Other",
    MAINTENANCE: "Maintenance",
    WATER: "Water Supply",
    ELECTRICITY: "Electricity",
    SECURITY: "Security",
    NOISE: "Noise",
    CLEANLINESS: "Cleanliness",
    WIFI: "WiFi / Internet",
    MANAGEMENT: "Management Issue",
    PAYMENT: "Payment Dispute",
    OTHER: "Other",
  };
  return category ? labels[category] || category : "General";
}

function getUserRoleLabel(role?: string): string {
  const roleMap: Record<string, string> = {
    STUDENT: "Student",
    GUEST: "Guest",
    MANAGER: "Manager",
    ADMIN: "Admin",
  };
  return role ? roleMap[role] || role : "User";
}

function getGuestTypeLabel(guestType?: string): string {
  const typeMap: Record<string, string> = {
    PARENT_GUARDIAN: "Parent/Guardian",
    UNIVERSITY_STAFF: "University Staff",
    PROSPECTIVE_STUDENT: "Prospective Student",
    VISITOR: "Visitor",
  };
  return guestType ? typeMap[guestType] || guestType : "";
}

function getTenantName(complaint: Complaint): string {
  if (complaint.user) {
    return `${complaint.user.firstName} ${complaint.user.lastName}`;
  }
  return "Unknown Tenant";
}

function getManagerName(complaint: Complaint): string {
  if (complaint.hostel?.manager) {
    return `${complaint.hostel.manager.firstName} ${complaint.hostel.manager.lastName}`;
  }
  return "Unknown Manager";
}

function getResponderName(responder: {
  firstName: string;
  lastName: string;
}): string {
  return `${responder.firstName} ${responder.lastName}`;
}

function getResponderRoleLabel(role: string): string {
  const roleMap: Record<string, string> = {
    STUDENT: "Student",
    MANAGER: "Manager",
    ADMIN: "Admin",
  };
  return roleMap[role] || role;
}

function ComplaintStats({
  stats,
  isLoading,
}: {
  stats: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    escalated?: number;
    avgDaysOpen?: number;
  } | null;
  isLoading: boolean;
}) {
  const statItems = useMemo(() => {
    if (!stats) return [];

    return [
      {
        label: "Open",
        value: stats.open,
        icon: AlertTriangle,
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
      },
      {
        label: "Escalated",
        value: stats.escalated || 0,
        icon: Shield,
        color: "text-red-700",
        bg: "bg-red-100",
        border: "border-red-300",
      },
      {
        label: "In Progress",
        value: stats.inProgress,
        icon: Loader2,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
      },
      {
        label: "Resolved",
        value: stats.resolved + stats.closed,
        icon: CheckCircle2,
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-200",
      },
      {
        label: "Avg. Days Open",
        value: stats.avgDaysOpen || 0,
        icon: Clock,
        color: "text-purple-600",
        bg: "bg-purple-50",
        border: "border-purple-200",
      },
    ];
  }, [stats]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-200 rounded-lg" />
              <div>
                <div className="h-3 w-16 bg-slate-200 rounded mb-2" />
                <div className="h-6 w-8 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {statItems.map((stat) => (
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
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ComplaintDetailPanel({
  complaintId,
  onClose,
  onStatusChange,
  onAddResponse,
}: {
  complaintId: string;
  onClose: () => void;
  onStatusChange: (
    complaintId: string,
    status: ComplaintStatus,
  ) => Promise<void>;
  onAddResponse: (complaintId: string, message: string) => Promise<void>;
}) {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "conversation" | "details"
  >("conversation");

  useEffect(() => {
    const fetchDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const res = await complaintService.getComplaintDetail(complaintId);
        if (res.success) {
          setComplaint(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch complaint detail:", error);
        toast.error("Failed to load complaint details");
      } finally {
        setIsLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [complaintId]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !complaint) return;

    setIsSubmitting(true);
    try {
      await onAddResponse(complaint.id, replyText);
      setReplyText("");

      const res = await complaintService.getComplaintDetail(complaint.id);
      if (res.success) {
        setComplaint(res.data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: ComplaintStatus) => {
    if (!complaint) return;

    setIsUpdatingStatus(true);
    try {
      await onStatusChange(complaint.id, newStatus);

      const res = await complaintService.getComplaintDetail(complaint.id);
      if (res.success) {
        setComplaint(res.data);
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoadingDetail) {
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
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed right-0 top-0 bottom-0 w-full sm:w-135 bg-white shadow-2xl z-50 flex items-center justify-center"
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </motion.div>
      </>
    );
  }

  if (!complaint) {
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
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed right-0 top-0 bottom-0 w-full sm:w-135 bg-white shadow-2xl z-50 flex items-center justify-center"
        >
          <div className="text-center">
            <p className="text-slate-500">Failed to load complaint</p>
            <button
              onClick={onClose}
              className="mt-4 text-primary-600 font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      </>
    );
  }

  const sConfig = getStatusConfig(complaint.status);
  const pConfig = getPriorityConfig(complaint.priority);
  const daysOpen = getDaysOpen(complaint.createdAt, complaint.resolvedAt);
  const responses = complaint.responses || [];

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
        initial={{ opacity: 0, x: "100%" }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-135 bg-white shadow-2xl z-50 flex flex-col"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {complaint.escalated && (
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <Shield className="w-4 h-4 text-red-600" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Complaint Details
              </h2>
              <p className="text-xs text-slate-400">
                Opened {formatRelative(complaint.createdAt)}
                {daysOpen > 0 && ` · ${daysOpen} days open`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-semibold text-slate-800 mb-2">
            {complaint.subject}
          </h3>
          <p className="text-sm text-slate-500 mb-3">{complaint.message}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant={sConfig.variant} size="sm">
              <sConfig.icon className="w-3 h-3 mr-1" />
              {sConfig.label}
            </Badge>
            {complaint.priority && (
              <Badge variant={pConfig.variant} size="sm">
                {pConfig.label} Priority
              </Badge>
            )}
            <Badge variant="secondary" size="sm">
              {getCategoryLabel(complaint.category)}
            </Badge>
            <Badge variant="secondary" size="sm">
              {complaint.visibility === "ADMIN_ONLY"
                ? "🔒 Admin Only"
                : "👥 Admin & Manager"}
            </Badge>
          </div>

          {complaint.escalated && complaint.escalationReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-red-800 mb-1 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Escalation Reason
              </p>
              <p className="text-sm text-red-700">
                {complaint.escalationReason}
              </p>
              {complaint.escalatedAt && (
                <p className="text-xs text-red-500 mt-1">
                  Escalated on {formatDate(complaint.escalatedAt)}
                </p>
              )}
            </div>
          )}

          {complaint.status !== "CLOSED" && (
            <div className="flex flex-wrap gap-2">
              {complaint.status === "OPEN" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-amber-600 border-amber-200 hover:bg-amber-50"
                  onClick={() => handleStatusChange("IN_PROGRESS")}
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus && (
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  )}
                  Mark In Progress
                </Button>
              )}
              {(complaint.status === "OPEN" ||
                complaint.status === "IN_PROGRESS") && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleStatusChange("RESOLVED")}
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  )}
                  Mark Resolved
                </Button>
              )}
              {complaint.status === "RESOLVED" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("CLOSED")}
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus && (
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  )}
                  Close Complaint
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex border-b border-slate-100 px-6 shrink-0">
          <button
            onClick={() => setActiveSection("conversation")}
            className={cn(
              "px-4 py-3 text-sm font-medium relative",
              activeSection === "conversation"
                ? "text-primary-600"
                : "text-slate-500",
            )}
          >
            Conversation ({responses.length})
            {activeSection === "conversation" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
            )}
          </button>
          <button
            onClick={() => setActiveSection("details")}
            className={cn(
              "px-4 py-3 text-sm font-medium relative",
              activeSection === "details"
                ? "text-primary-600"
                : "text-slate-500",
            )}
          >
            Parties & Details
            {activeSection === "details" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeSection === "conversation" ? (
            <div className="p-6 space-y-4">
              <div className="flex gap-3">
                <Avatar name={getTenantName(complaint)} size="sm" />
                <div className="max-w-[80%] rounded-xl p-3 bg-slate-100 text-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-semibold">
                      {getTenantName(complaint)}
                    </p>
                    <span className="text-xs text-slate-500">
                      ({getUserRoleLabel(complaint.user?.role)})
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {complaint.message}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatTime(complaint.createdAt)} ·{" "}
                    {formatDate(complaint.createdAt)}
                  </p>
                </div>
              </div>

              {responses.map((response) => {
                const responder = response.responder;
                if (!responder) return null;

                const isAdmin = responder.role === "ADMIN";
                const isManager = responder.role === "MANAGER";
                const responderName = getResponderName(responder);

                return (
                  <div
                    key={response.id}
                    className={cn("flex gap-3", isAdmin && "flex-row-reverse")}
                  >
                    <Avatar name={responderName} size="sm" />
                    <div
                      className={cn(
                        "max-w-[80%] rounded-xl p-3",
                        isAdmin
                          ? "bg-primary-50 text-primary-900"
                          : isManager
                            ? "bg-blue-50 text-blue-900"
                            : "bg-slate-100 text-slate-800",
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-semibold">{responderName}</p>
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isAdmin
                              ? "text-primary-600"
                              : isManager
                                ? "text-blue-500"
                                : "text-slate-500",
                          )}
                        >
                          ({getResponderRoleLabel(responder.role)})
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {response.message}
                      </p>
                      <p className="text-xs opacity-60 mt-1">
                        {formatTime(response.createdAt)} ·{" "}
                        {formatDate(response.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}

              {responses.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No responses yet</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  Tenant (Complainant)
                </h4>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={getTenantName(complaint)} size="md" />
                  <div>
                    <p className="font-medium text-slate-800">
                      {getTenantName(complaint)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {complaint.hostel?.name || "N/A"}
                    </p>
                  </div>
                </div>
                {complaint.user && (
                  <div className="space-y-1.5">
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {complaint.user.email}
                    </p>
                    {complaint.user.phone && (
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {complaint.user.phone}
                      </p>
                    )}
                    {complaint.user.studentProfile?.studentId && (
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        ID: {complaint.user.studentProfile.studentId}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {complaint.hostel?.manager && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    Hostel Manager
                  </h4>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={getManagerName(complaint)} size="md" />
                    <div>
                      <p className="font-medium text-blue-800">
                        {getManagerName(complaint)}
                      </p>
                      <p className="text-xs text-blue-600">
                        {complaint.hostel.name}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm text-blue-700 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-blue-400" />
                      {complaint.hostel.manager.email}
                    </p>
                    {complaint.hostel.manager.phone && (
                      <p className="text-sm text-blue-700 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-blue-400" />
                        {complaint.hostel.manager.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-2">
                  Visibility
                </h4>
                <p className="text-sm text-slate-600">
                  {complaint.visibility === "ADMIN_ONLY" ? (
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-500" />
                      Admin Only — The hostel manager cannot see this complaint
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-500" />
                      Admin & Manager — Both admin and hostel manager can see
                      this
                    </span>
                  )}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-3">
                  Timeline
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-slate-500">Created</span>
                    <span className="text-slate-700 font-medium ml-auto">
                      {formatDate(complaint.createdAt)}
                    </span>
                  </div>
                  {complaint.escalatedAt && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-slate-500">Escalated</span>
                      <span className="text-red-600 font-medium ml-auto">
                        {formatDate(complaint.escalatedAt)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-slate-500">Last Updated</span>
                    <span className="text-slate-700 font-medium ml-auto">
                      {formatDate(complaint.updatedAt)}
                    </span>
                  </div>
                  {complaint.resolvedAt && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-slate-500">Resolved</span>
                      <span className="text-green-600 font-medium ml-auto">
                        {formatDate(complaint.resolvedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {complaint.status !== "CLOSED" && activeSection === "conversation" && (
          <div className="p-4 border-t border-slate-100 shrink-0">
            <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Replying as Admin
              <span className="text-slate-300 ml-2">
                (Shift+Enter for new line)
              </span>
            </p>
            <div className="flex gap-2 items-end">
              <textarea
                placeholder="Type your response..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none min-h-11 max-h-30"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (replyText.trim() && !isSubmitting) {
                      handleSendReply();
                    }
                  }
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                }}
                disabled={isSubmitting}
              />
              <Button
                disabled={!replyText.trim() || isSubmitting}
                onClick={handleSendReply}
                className="shrink-0"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    escalated?: number;
    avgDaysOpen?: number;
  } | null>(null);
  const [hostels, setHostels] = useState<{ id: string; name: string }[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "all">(
    "all",
  );
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [hostelFilter, setHostelFilter] = useState<string>("all");
  const [escalatedOnly, setEscalatedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "priority" | "days_open"
  >("newest");
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(
    null,
  );
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setIsLoadingComplaints(true);
    try {
      const [complaintsRes, statsRes] = await Promise.all([
        complaintService.getAllComplaints({
          status: statusFilter !== "all" ? statusFilter : undefined,
          priority: priorityFilter !== "all" ? priorityFilter : undefined,
          hostelId: hostelFilter !== "all" ? hostelFilter : undefined,
          escalated: escalatedOnly || undefined,
          search: debouncedSearch || undefined,
        }),
        complaintService.getAdminComplaintStats(),
      ]);

      if (complaintsRes.success) {
        setComplaints(complaintsRes.data);

        const uniqueHostels = complaintsRes.data
          .filter((c) => c.hostel)
          .map((c) => ({ id: c.hostel!.id, name: c.hostel!.name }))
          .filter((h, i, arr) => arr.findIndex((x) => x.id === h.id) === i);
        setHostels(uniqueHostels);
      }

      if (statsRes.success) {
        setStats(statsRes.data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
      toast.error("Failed to load complaints");
    } finally {
      setIsLoading(false);
      setIsLoadingComplaints(false);
    }
  }, [
    statusFilter,
    priorityFilter,
    hostelFilter,
    escalatedOnly,
    debouncedSearch,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sortedComplaints = useMemo(() => {
    const result = [...complaints];

    const priorityOrder: Record<string, number> = {
      URGENT: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    };

    switch (sortBy) {
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
      case "priority":
        result.sort(
          (a, b) =>
            (priorityOrder[a.priority || "MEDIUM"] || 2) -
            (priorityOrder[b.priority || "MEDIUM"] || 2),
        );
        break;
      case "days_open":
        result.sort(
          (a, b) =>
            getDaysOpen(b.createdAt, b.resolvedAt) -
            getDaysOpen(a.createdAt, a.resolvedAt),
        );
        break;
    }

    return result;
  }, [complaints, sortBy]);

  const handleStatusChange = async (
    complaintId: string,
    newStatus: ComplaintStatus,
  ) => {
    try {
      await complaintService.updateComplaintStatus(complaintId, {
        status: newStatus,
      });
      toast.success(
        `Complaint marked as ${newStatus.replace("_", " ").toLowerCase()}`,
      );

      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId ? { ...c, status: newStatus } : c,
        ),
      );

      const statsRes = await complaintService.getAdminComplaintStats();
      if (statsRes.success) {
        setStats(statsRes.data.stats);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update complaint status");
      throw error;
    }
  };

  const handleAddResponse = async (complaintId: string, message: string) => {
    try {
      await complaintService.addResponse(complaintId, { message });
      toast.success("Response sent successfully");

      const detailRes = await complaintService.getComplaintDetail(complaintId);
      if (detailRes.success) {
        setComplaints((prev) =>
          prev.map((c) => (c.id === detailRes.data.id ? detailRes.data : c)),
        );
      }
    } catch (error) {
      console.error("Failed to add response:", error);
      toast.error("Failed to send response");
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">All Complaints</h1>
          <p className="text-slate-500 mt-1">
            Monitor and manage complaints across all hostels
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant={escalatedOnly ? "primary" : "outline"}
            size="sm"
            onClick={() => setEscalatedOnly(!escalatedOnly)}
            className={
              escalatedOnly ? "" : "text-red-600 border-red-200 hover:bg-red-50"
            }
          >
            <Shield className="w-4 h-4 mr-2" />
            {escalatedOnly ? "Showing Escalated" : "Escalated Only"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoadingComplaints}
          >
            <RefreshCw
              className={cn(
                "w-4 h-4 mr-2",
                isLoadingComplaints && "animate-spin",
              )}
            />
            Refresh
          </Button>
        </div>
      </div>

      <ComplaintStats stats={stats} isLoading={isLoadingComplaints} />

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, tenant, hostel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as ComplaintStatus | "all")
                }
                className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg bg-white cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) =>
                  setPriorityFilter(e.target.value as Priority | "all")
                }
                className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg bg-white cursor-pointer"
              >
                <option value="all">All Priority</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={hostelFilter}
                onChange={(e) => setHostelFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg bg-white cursor-pointer"
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
                className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg bg-white cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">By Priority</option>
                <option value="days_open">Days Open</option>
              </select>
              <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {isLoadingComplaints ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse"
            >
              <div className="flex gap-4">
                <div className="w-1 h-24 bg-slate-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-5 w-2/3 bg-slate-200 rounded mb-2" />
                  <div className="h-4 w-full bg-slate-200 rounded mb-3" />
                  <div className="flex gap-4">
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedComplaints.length > 0 ? (
        <div className="space-y-4">
          {sortedComplaints.map((complaint) => {
            const sConfig = getStatusConfig(complaint.status);
            const pConfig = getPriorityConfig(complaint.priority);
            const daysOpen = getDaysOpen(
              complaint.createdAt,
              complaint.resolvedAt,
            );

            return (
              <motion.div
                key={complaint.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow cursor-pointer",
                  complaint.escalated ? "border-red-200" : "border-slate-200",
                )}
                onClick={() => setSelectedComplaintId(complaint.id)}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-1 self-stretch rounded-full shrink-0",
                        pConfig.color,
                      )}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          {complaint.escalated && (
                            <Shield className="w-4 h-4 text-red-600 shrink-0" />
                          )}
                          <h3 className="font-semibold text-slate-800">
                            {complaint.subject}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={sConfig.variant} size="sm">
                            <sConfig.icon className="w-3 h-3 mr-1" />
                            {sConfig.label}
                          </Badge>
                          {complaint.priority && (
                            <Badge variant={pConfig.variant} size="sm">
                              {pConfig.label}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                        {complaint.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {getTenantName(complaint)}
                        </span>
                        <span className="flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" />
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {complaint.hostel?.name || "N/A"}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {complaint._count?.responses || 0} responses
                        </span>
                        {daysOpen > 0 &&
                          complaint.status !== "RESOLVED" &&
                          complaint.status !== "CLOSED" && (
                            <span
                              className={cn(
                                "font-medium",
                                daysOpen > 3
                                  ? "text-red-500"
                                  : "text-slate-400",
                              )}
                            >
                              {daysOpen}d open
                            </span>
                          )}
                        <Badge variant="secondary" size="sm">
                          {getCategoryLabel(complaint.category)}
                        </Badge>
                        {complaint.visibility === "ADMIN_ONLY" && (
                          <Badge variant="secondary" size="sm">
                            🔒 Admin Only
                          </Badge>
                        )}
                        <span className="text-slate-400 ml-auto">
                          {formatRelative(complaint.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            No complaints found
          </h3>
          <p className="text-slate-500">
            {escalatedOnly
              ? "No escalated complaints at the moment."
              : "Adjust your filters to find complaints."}
          </p>
        </div>
      )}

      <AnimatePresence>
        {selectedComplaintId && (
          <ComplaintDetailPanel
            complaintId={selectedComplaintId}
            onClose={() => setSelectedComplaintId(null)}
            onStatusChange={handleStatusChange}
            onAddResponse={handleAddResponse}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
