"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCheck,
  Ban,
  CheckCircle2,
  Mail,
  Phone,
  Building2,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  GraduationCap,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import {
  useAdminUsers,
  useAdminUserDetail,
  useUpdateUserStatus,
  useVerifyManager,
} from "@/hooks/useAdminUsers";
import type { AdminUser } from "@/services/admin.service";

type UserRole = "STUDENT" | "MANAGER" | "ADMIN" | "GUEST";
type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getRoleConfig(role: UserRole) {
  const configs = {
    STUDENT: {
      label: "Student",
      variant: "primary" as const,
      icon: GraduationCap,
    },
    MANAGER: {
      label: "Manager",
      variant: "warning" as const,
      icon: Building2,
    },
    ADMIN: { label: "Admin", variant: "error" as const, icon: Shield },
    GUEST: {
      label: "Guest",
      variant: "secondary" as const,
      icon: Users,
    },
  };
  return configs[role];
}

function getStatusConfig(status: UserStatus) {
  const configs = {
    ACTIVE: { label: "Active", variant: "success" as const },
    SUSPENDED: { label: "Suspended", variant: "error" as const },
    INACTIVE: { label: "Inactive", variant: "secondary" as const },
  };
  return configs[status];
}

function getVerificationConfig(status: VerificationStatus) {
  const configs = {
    PENDING: { label: "Pending", variant: "warning" as const },
    VERIFIED: { label: "Verified", variant: "success" as const },
    REJECTED: { label: "Rejected", variant: "error" as const },
  };
  return configs[status];
}

function getUserDisplayName(user: AdminUser) {
  return `${user.firstName} ${user.lastName}`;
}

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className={cn(
        "fixed top-6 right-6 z-60 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg",
        type === "success"
          ? "bg-green-50 border border-green-200 text-green-800"
          : "bg-red-50 border border-red-200 text-red-800",
      )}
    >
      {type === "success" ? (
        <CheckCircle2 className="w-5 h-5 text-green-600" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-600" />
      )}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 p-1 hover:bg-black/5 rounded">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

function RejectionReasonModal({
  onConfirm,
  onClose,
  isLoading,
}: {
  onConfirm: (reason: string) => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-55"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md bg-white rounded-2xl shadow-2xl z-55 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Rejection Reason</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Please provide a reason for rejecting this manager&apos;s
            verification. They will be notified.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter rejection reason (min 10 characters)..."
            rows={4}
            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-slate-400">
            {reason.length}/500 characters (minimum 10)
          </p>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            fullWidth
            disabled={reason.trim().length < 10 || isLoading}
            onClick={() => onConfirm(reason.trim())}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Ban className="w-4 h-4 mr-2" />
            )}
            Reject Manager
          </Button>
        </div>
      </motion.div>
    </>
  );
}

function UserDetailModal({
  userId,
  onClose,
  onStatusUpdate,
  onVerification,
}: {
  userId: string;
  onClose: () => void;
  onStatusUpdate: (
    userId: string,
    status: UserStatus,
    userName: string,
  ) => Promise<void>;
  onVerification: (
    managerId: string,
    action: "VERIFY" | "REJECT",
    userName: string,
    rejectionReason?: string,
  ) => Promise<void>;
}) {
  const { user, isLoading, error } = useAdminUserDetail(userId);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: UserStatus) => {
    if (!user) return;
    setActionLoading(newStatus);
    try {
      await onStatusUpdate(
        user.id,
        newStatus,
        getUserDisplayName(user as AdminUser),
      );
      onClose();
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerify = async () => {
    if (!user) return;
    setActionLoading("VERIFY");
    try {
      await onVerification(
        user.id,
        "VERIFY",
        getUserDisplayName(user as AdminUser),
      );
      onClose();
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reason: string) => {
    if (!user) return;
    setActionLoading("REJECT");
    try {
      await onVerification(
        user.id,
        "REJECT",
        getUserDisplayName(user as AdminUser),
        reason,
      );
      setShowRejectionModal(false);
      onClose();
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Loading user details...</p>
        </div>
      );
    }

    if (error || !user) {
      return (
        <div className="p-12 flex flex-col items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
          <p className="text-sm text-red-600">
            {error || "Failed to load user details"}
          </p>
        </div>
      );
    }

    const roleConfig = getRoleConfig(user.role as UserRole);
    const statusConfig = getStatusConfig(user.status as UserStatus);
    const isManager = user.role === "MANAGER";
    const isStudent = user.role === "STUDENT";
    const isGuest = user.role === "GUEST";
    const verificationStatus = user.managerProfile?.verificationStatus;

    return (
      <>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Avatar name={getUserDisplayName(user as AdminUser)} size="xl" />
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {getUserDisplayName(user as AdminUser)}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant={roleConfig.variant} size="sm">
                  {roleConfig.label}
                </Badge>
                <Badge variant={statusConfig.variant} size="sm">
                  {statusConfig.label}
                </Badge>
                {isManager && verificationStatus && (
                  <Badge
                    variant={
                      getVerificationConfig(
                        verificationStatus as VerificationStatus,
                      ).variant
                    }
                    size="sm"
                  >
                    {verificationStatus === "VERIFIED" && (
                      <CheckCircle2 className="w-3 h-3 mr-0.5" />
                    )}
                    {
                      getVerificationConfig(
                        verificationStatus as VerificationStatus,
                      ).label
                    }
                  </Badge>
                )}
                {user.emailVerified && (
                  <Badge variant="success" size="sm">
                    <Mail className="w-3 h-3 mr-0.5" />
                    Email Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail className="w-4 h-4 text-slate-400" />
              {user.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              {user.phone || "No phone"}
            </div>
          </div>

          {isManager && user.managerProfile && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700">
                Manager Details
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Business Name</p>
                  <p className="text-sm font-medium text-slate-800">
                    {user.managerProfile.businessName || "—"}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Id Card</p>
                  <p className="text-sm font-medium text-slate-800">
                    {user.managerProfile.idNumber || "—"}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Hostels</p>
                  <p className="text-sm font-medium text-slate-800">
                    {user._count?.hostels ?? 0}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Verification</p>
                  <p className="text-sm font-medium text-slate-800">
                    {verificationStatus || "—"}
                  </p>
                </div>
              </div>
              {user.managerProfile.idImage && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-2">ID Document</p>
                  <a
                    href={user.managerProfile.idImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <ImageIcon className="w-4 h-4" />
                    View ID Image
                  </a>
                </div>
              )}
              {user.managerProfile.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-500 font-medium mb-1">
                    Rejection Reason
                  </p>
                  <p className="text-sm text-red-700">
                    {user.managerProfile.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          )}

          {isStudent && user.studentProfile && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700">
                Student Details
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Student ID</p>
                  <p className="text-sm font-medium text-slate-800">
                    {user.studentProfile.studentId || "—"}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Programme</p>
                  <p className="text-sm font-medium text-slate-800">
                    {user.studentProfile.programme || "—"}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Level</p>
                  <p className="text-sm font-medium text-slate-800">
                    {user.studentProfile.level
                      ? `Level ${user.studentProfile.level}`
                      : "—"}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Bookings</p>
                  <p className="text-sm font-medium text-slate-800">
                    {user._count?.bookings ?? 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400">Joined</p>
              <p className="text-sm font-medium text-slate-800">
                {formatDate(user.createdAt)}
              </p>
            </div>
            {user.updatedAt && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Last Updated</p>
                <p className="text-sm font-medium text-slate-800">
                  {formatDate(user.updatedAt)}
                </p>
              </div>
            )}
            {user._count?.complaints !== undefined && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Complaints</p>
                <p className="text-sm font-medium text-slate-800">
                  {user._count.complaints}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100">
          <div className="flex flex-col gap-3">
            {isManager &&
              verificationStatus === "PENDING" &&
              user.status !== "SUSPENDED" && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    fullWidth
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setShowRejectionModal(true)}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === "REJECT" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Ban className="w-4 h-4 mr-2" />
                    )}
                    Reject
                  </Button>
                  <Button
                    fullWidth
                    onClick={handleVerify}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === "VERIFY" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Approve
                  </Button>
                </div>
              )}

            {isManager && verificationStatus === "REJECTED" && (
              <Button
                fullWidth
                onClick={handleVerify}
                disabled={actionLoading !== null}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading === "VERIFY" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Approve Manager
              </Button>
            )}

            <div className="flex gap-3">
              {user.status === "ACTIVE" && user.role !== "ADMIN" && (
                <Button
                  variant="outline"
                  fullWidth
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleStatusChange("SUSPENDED")}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === "SUSPENDED" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Ban className="w-4 h-4 mr-2" />
                  )}
                  Suspend Account
                </Button>
              )}

              {user.status === "SUSPENDED" && (
                <Button
                  variant="outline"
                  fullWidth
                  className="text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => handleStatusChange("ACTIVE")}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === "ACTIVE" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4 mr-2" />
                  )}
                  Reactivate Account
                </Button>
              )}

              {user.status === "INACTIVE" && (
                <Button
                  variant="outline"
                  fullWidth
                  className="text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => handleStatusChange("ACTIVE")}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === "ACTIVE" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4 mr-2" />
                  )}
                  Activate Account
                </Button>
              )}

              <Button variant="outline" fullWidth onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </>
    );
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-y-auto max-h-[90vh]"
      >
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-800">User Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {renderContent()}
      </motion.div>

      <AnimatePresence>
        {showRejectionModal && (
          <RejectionReasonModal
            onConfirm={handleReject}
            onClose={() => setShowRejectionModal(false)}
            isLoading={actionLoading === "REJECT"}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const pageSize = 10;

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(1);
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const { users, pagination, isLoading, error, refetch } = useAdminUsers({
    page: currentPage,
    limit: pageSize,
    role: roleFilter !== "all" ? roleFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: debouncedSearch || undefined,
  });

  const { updateStatus } = useUpdateUserStatus();
  const { verifyManager } = useVerifyManager();

  const stats = useMemo(() => {
  return {
    total: pagination?.totalItems ?? users.length,
    students: users.filter((u) => u.role === "STUDENT").length,
    managers: users.filter((u) => u.role === "MANAGER").length,
    guests: users.filter((u) => u.role === "GUEST").length,
    pending: users.filter(
      (u) =>
        u.role === "MANAGER" &&
        u.managerProfile?.verificationStatus === "PENDING",
    ).length,
  };
}, [users, pagination]);
  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 5000);
    },
    [],
  );

  const handleStatusUpdate = useCallback(
    async (userId: string, status: UserStatus, userName: string) => {
      try {
        await updateStatus(userId, { status });
        showToast(
          `${userName}'s account has been ${status.toLowerCase()} successfully`,
          "success",
        );
        refetch();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update status";
        showToast(message, "error");
        throw err;
      }
    },
    [updateStatus, showToast, refetch],
  );

  const handleVerification = useCallback(
    async (
      managerId: string,
      action: "VERIFY" | "REJECT",
      userName: string,
      rejectionReason?: string,
    ) => {
      try {
        await verifyManager(managerId, {
          action,
          rejectionReason,
        });
        const message =
          action === "VERIFY"
            ? `${userName} has been verified successfully. They can now list hostels.`
            : `${userName}'s verification has been rejected.`;
        showToast(message, "success");
        refetch();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Verification action failed";
        showToast(message, "error");
        throw err;
      }
    },
    [verifyManager, showToast, refetch],
  );

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Users</h1>
          <p className="text-slate-500 mt-1">
            Manage all platform users — students and managers
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Users",
            value: stats.total,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-200",
          },
          {
            label: "Students",
            value: stats.students,
            icon: GraduationCap,
            color: "text-green-600",
            bg: "bg-green-50",
            border: "border-green-200",
          },
          {
            label: "Managers",
            value: stats.managers,
            icon: Building2,
            color: "text-purple-600",
            bg: "bg-purple-50",
            border: "border-purple-200",
          },
          {
            label: "Pending Approval",
            value: stats.pending,
            icon: UserCheck,
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-200",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn("bg-white rounded-xl border p-4", stat.border)}
          >
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as UserRole | "all");
              setCurrentPage(1);
            }}
            className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg bg-white cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="MANAGER">Managers</option>
            <option value="GUEST">Guests</option>
            <option value="ADMIN">Admins</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as UserStatus | "all");
              setCurrentPage(1);
            }}
            className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg bg-white cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-red-600 border-red-200"
          >
            Retry
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Loading users...</p>
        </div>
      ) : users.length > 0 ? (
        <>
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {[
                    "User",
                    "Role",
                    "Status",
                    "Verification",
                    "Joined",
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
                {users.map((user) => {
                  const roleConfig = getRoleConfig(user.role as UserRole);
                  const statusConfig = getStatusConfig(
                    user.status as UserStatus,
                  );
                  const verificationStatus =
                    user.managerProfile?.verificationStatus;
                  const displayName = getUserDisplayName(user);

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={displayName} size="sm" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-slate-800 text-sm">
                                {displayName}
                              </p>
                              {user.managerProfile?.verified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                              )}
                            </div>
                            <p className="text-xs text-slate-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={roleConfig.variant} size="sm">
                          {roleConfig.label}
                        </Badge>
                        {user.managerProfile?.businessName && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {user.managerProfile.businessName}
                          </p>
                        )}
                        {user.studentProfile?.programme && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {user.studentProfile.programme}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusConfig.variant} size="sm">
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {user.role === "MANAGER" && verificationStatus ? (
                          <Badge
                            variant={
                              getVerificationConfig(
                                verificationStatus as VerificationStatus,
                              ).variant
                            }
                            size="sm"
                          >
                            {
                              getVerificationConfig(
                                verificationStatus as VerificationStatus,
                              ).label
                            }
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedUserId(user.id)}
                          className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="View details"
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
            {users.map((user) => {
              const roleConfig = getRoleConfig(user.role as UserRole);
              const statusConfig = getStatusConfig(user.status as UserStatus);
              const verificationStatus =
                user.managerProfile?.verificationStatus;
              const displayName = getUserDisplayName(user);

              return (
                <div
                  key={user.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:border-primary-300 transition-colors"
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={displayName} size="md" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-slate-800 text-sm">
                            {displayName}
                          </p>
                          {user.managerProfile?.verified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <Eye className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={roleConfig.variant} size="sm">
                      {roleConfig.label}
                    </Badge>
                    <Badge variant={statusConfig.variant} size="sm">
                      {statusConfig.label}
                    </Badge>
                    {user.role === "MANAGER" && verificationStatus && (
                      <Badge
                        variant={
                          getVerificationConfig(
                            verificationStatus as VerificationStatus,
                          ).variant
                        }
                        size="sm"
                      >
                        {
                          getVerificationConfig(
                            verificationStatus as VerificationStatus,
                          ).label
                        }
                      </Badge>
                    )}
                  </div>
                  {user.managerProfile?.businessName && (
                    <p className="text-xs text-slate-400 mt-2">
                      <Building2 className="w-3 h-3 inline mr-1" />
                      {user.managerProfile.businessName}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-slate-200">
              <p className="text-sm text-slate-500">
                {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, pagination?.totalItems ?? 0)}{" "}
                of {pagination?.totalItems ?? 0}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-sm text-slate-600">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl border py-16 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            No users found
          </h3>
          <p className="text-slate-500 mb-4">
            {debouncedSearch || roleFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your search or filters."
              : "No users have registered yet."}
          </p>
          {(debouncedSearch ||
            roleFilter !== "all" ||
            statusFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setDebouncedSearch("");
                setRoleFilter("all");
                setStatusFilter("all");
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      <AnimatePresence>
        {selectedUserId && (
          <UserDetailModal
            userId={selectedUserId}
            onClose={() => setSelectedUserId(null)}
            onStatusUpdate={handleStatusUpdate}
            onVerification={handleVerification}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
