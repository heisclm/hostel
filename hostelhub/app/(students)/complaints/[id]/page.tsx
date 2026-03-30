"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import axios from "axios";
import {
  ArrowLeft,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  Calendar,
  MapPin,
  Tag,
  XCircle,
  ArrowRight,
  RefreshCw,
  Loader2,
  Eye,
  Shield,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  complaintService,
  type Complaint,
  type ComplaintResponse,
} from "@/services/complaint.service";
import { useAuth } from "@/context/AuthContext";

type ComplaintStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

const statusConfig: Record<
  ComplaintStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    iconBg: string;
    headerBg: string;
    headerBorder: string;
    icon: React.ElementType;
    description: string;
  }
> = {
  OPEN: {
    label: "Open",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    iconBg: "bg-amber-100",
    headerBg: "bg-amber-500/20",
    headerBorder: "border-amber-500/30",
    icon: Clock,
    description: "Your complaint is awaiting review",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconBg: "bg-blue-100",
    headerBg: "bg-blue-500/20",
    headerBorder: "border-blue-500/30",
    icon: AlertCircle,
    description: "The hostel management is working on your complaint",
  },
  RESOLVED: {
    label: "Resolved",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    iconBg: "bg-emerald-100",
    headerBg: "bg-emerald-500/20",
    headerBorder: "border-emerald-500/30",
    icon: CheckCircle2,
    description: "This complaint has been resolved",
  },
  CLOSED: {
    label: "Closed",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-200",
    iconBg: "bg-slate-200",
    headerBg: "bg-slate-500/20",
    headerBorder: "border-slate-500/30",
    icon: XCircle,
    description: "This complaint has been closed",
  },
};

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getResponderName(response: ComplaintResponse): string {
  return `${response.responder.firstName} ${response.responder.lastName}`;
}

function getResponderRole(response: ComplaintResponse): string {
  const roleMap: Record<string, string> = {
    STUDENT: "Student",
    MANAGER: "Hostel Manager",
    ADMIN: "Admin",
  };
  return roleMap[response.responder.role] || response.responder.role;
}

function getVisibilityLabel(visibility: string): {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
} {
  if (visibility === "ADMIN_ONLY") {
    return {
      label: "Admin Only",
      icon: Shield,
      color: "text-purple-700",
      bgColor: "bg-purple-50 border-purple-200",
    };
  }
  return {
    label: "Admin & Manager",
    icon: Users,
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
  };
}

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative bg-linear-to-br from-slate-900 via-primary-900 to-slate-900">
        <div className="container-custom py-8">
          <div className="h-6 w-32 bg-white/10 rounded-lg animate-pulse mb-6" />
          <div className="h-8 w-64 bg-white/10 rounded-lg animate-pulse mb-3" />
          <div className="h-5 w-48 bg-white/10 rounded-lg animate-pulse" />
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
      <div className="container-custom py-8 max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="h-24 bg-white rounded-2xl animate-pulse" />
          <div className="h-48 bg-white rounded-2xl animate-pulse" />
          <div className="h-64 bg-white rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          Complaint Not Found
        </h3>
        <p className="text-slate-500 mb-6 max-w-sm">
          The complaint you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </p>
        <Link
          href="/complaints"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Complaints
        </Link>
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          Something went wrong
        </h2>
        <p className="text-slate-500 max-w-sm mb-6 mx-auto">{message}</p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/complaints"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Complaints
          </Link>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ComplaintDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const complaintId = params.id as string;

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const fetchComplaint = useCallback(async () => {
    if (!complaintId) return;

    setIsLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const response = await complaintService.getComplaintDetail(complaintId);

      if (response.success && response.data) {
        setComplaint(response.data);
      } else {
        setNotFound(true);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch complaint:", err);

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message = err.response?.data?.message as string | undefined;

        if (status === 404) {
          setNotFound(true);
        } else if (status === 401) {
          setError("Please log in to view this complaint.");
        } else if (status === 403) {
          setError("You don't have permission to view this complaint.");
        } else {
          setError(message || "Failed to load complaint details.");
        }
      } else {
        setError("Failed to load complaint details. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    fetchComplaint();
  }, [fetchComplaint]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!complaint) return;

    setIsSending(true);

    try {
      const response = await complaintService.addResponse(complaint.id, {
        message: newMessage.trim(),
      });

      if (response.success) {
        setNewMessage("");
        toast.success("Reply sent successfully");

        await fetchComplaint();
      }
    } catch (err: unknown) {
      console.error("Failed to send reply:", err);

      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message as string | undefined;
        toast.error(message || "Failed to send reply. Please try again.");
      } else {
        toast.error("Failed to send reply. Please try again.");
      }
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return <DetailSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchComplaint} />;
  if (notFound || !complaint) return <NotFound />;

  const status = statusConfig[complaint.status] || statusConfig.OPEN;
  const StatusIcon = status.icon;
  const canReply =
    complaint.status !== "CLOSED" && complaint.status !== "RESOLVED";

  const studentName = complaint.user
    ? `${complaint.user.firstName} ${complaint.user.lastName}`
    : "Unknown Student";

  const hostelName = complaint.hostel?.name || "Unknown Hostel";
  const hostelAddress = complaint.hostel?.address || "";
  const responses = complaint.responses || [];
  const responseCount = complaint._count?.responses ?? responses.length;
  const visibilityInfo = getVisibilityLabel(complaint.visibility);
  const VisibilityIcon = visibilityInfo.icon;

  const isCurrentUser = (responderId: string) => {
    return user?.id === responderId;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative bg-linear-to-br from-slate-900 via-primary-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size:3rem_3rem" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500/20 rounded-full blur-[80px]" />

        <div className="relative container-custom py-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link
              href="/complaints"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs text-slate-300 hover:bg-white/20 transition-colors mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Complaints
            </Link>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
                  status.headerBg,
                  `text-${status.color.replace("text-", "").replace("-700", "-300")}`,
                  `border ${status.headerBorder}`,
                )}
              >
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 border border-white/10 text-slate-300">
                <VisibilityIcon className="w-3 h-3" />
                {visibilityInfo.label}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
              {complaint.subject}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-400 text-sm">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                {hostelName}
              </span>
              {complaint.category && (
                <span className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  <span className="capitalize">{complaint.category}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(complaint.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                {responseCount} response{responseCount !== 1 && "s"}
              </span>
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

      <div className="container-custom py-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-2xl p-5 mb-6 flex items-start gap-4 border",
            status.bgColor,
            status.borderColor,
          )}
        >
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
              status.iconBg,
            )}
          >
            <StatusIcon className={cn("w-6 h-6", status.color)} />
          </div>
          <div className="flex-1">
            <p className={cn("font-semibold text-lg", status.color)}>
              {status.label}
            </p>
            <p className="text-sm text-slate-600">{status.description}</p>
            <p className="text-xs text-slate-500 mt-1">
              Last updated: {formatDateTime(complaint.updatedAt)}
            </p>
          </div>

          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shrink-0",
              visibilityInfo.bgColor,
              visibilityInfo.color,
            )}
          >
            <Eye className="w-3 h-3" />
            {visibilityInfo.label}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6 overflow-hidden"
        >
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-600" />
              Original Complaint
            </h2>
          </div>
          <div className="p-5">
            <div className="flex items-start gap-4 mb-4">
              <Avatar name={studentName} size="lg" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-slate-900">{studentName}</p>
                  {user?.id === complaint.userId && (
                    <span className="px-2 py-0.5 bg-primary-50 border border-primary-200 text-primary-700 text-xs font-medium rounded-full">
                      You
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDateTime(complaint.createdAt)}
                </p>
              </div>
            </div>

            <div className="pl-14">
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {complaint.message}
              </p>

              {(hostelName || hostelAddress) && (
                <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {hostelName}
                    {hostelAddress && ` — ${hostelAddress}`}
                  </div>
                </div>
              )}

              {complaint.category && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-600">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span className="capitalize">{complaint.category}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6 overflow-hidden"
        >
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-600" />
              Conversation
            </h2>
            <span className="text-sm text-slate-500">
              {responseCount} response{responseCount !== 1 && "s"}
            </span>
          </div>
          <div className="p-5">
            {responses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-medium text-slate-800 mb-1">
                  No responses yet
                </p>
                <p className="text-sm text-slate-500">
                  {complaint.visibility === "ADMIN_ONLY"
                    ? "The platform admin will respond shortly"
                    : "The hostel management will respond shortly"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {responses.map((response, index) => {
                  const responderName = getResponderName(response);
                  const responderRole = getResponderRole(response);
                  const isMe = isCurrentUser(response.responderId);
                  const isStudent = response.responder.role === "STUDENT";
                  const isManager = response.responder.role === "MANAGER";
                  const isAdmin = response.responder.role === "ADMIN";

                  return (
                    <motion.div
                      key={response.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      {index > 0 && (
                        <div className="border-t border-slate-100 mb-6" />
                      )}
                      <div className="flex items-start gap-4">
                        <Avatar name={responderName} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="font-semibold text-slate-900">
                              {responderName}
                            </p>
                            <span
                              className={cn(
                                "px-2 py-0.5 text-xs font-medium rounded-full border",
                                isStudent &&
                                  "bg-primary-50 border-primary-200 text-primary-700",
                                isManager &&
                                  "bg-secondary-50 border-secondary-200 text-secondary-700",
                                isAdmin &&
                                  "bg-purple-50 border-purple-200 text-purple-700",
                              )}
                            >
                              {responderRole}
                            </span>
                            {isMe && (
                              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mb-3 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDateTime(response.createdAt)}
                          </p>
                          <div
                            className={cn(
                              "p-4 rounded-xl",
                              isMe
                                ? "bg-primary-50 border border-primary-100"
                                : isAdmin
                                  ? "bg-purple-50 border border-purple-100"
                                  : "bg-slate-50 border border-slate-100",
                            )}
                          >
                            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {response.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {canReply && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-primary-600" />
                Add a Reply
              </h2>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800 placeholder:text-slate-400 resize-none"
                />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">
                      {complaint.visibility === "ADMIN_ONLY"
                        ? "Your reply will be visible to the platform admin only"
                        : "Your reply will be visible to the hostel manager and admin"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {newMessage.length}/1000 characters
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSendMessage}
                    disabled={isSending || !newMessage.trim()}
                    className={cn(
                      "inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all",
                      isSending || !newMessage.trim()
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/25",
                    )}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Reply
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {complaint.status === "RESOLVED" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-emerald-800 mb-1">
                  Issue Resolved
                </p>
                <p className="text-sm text-emerald-700 mb-1">
                  This complaint has been marked as resolved.
                  {complaint.resolvedAt &&
                    ` Resolved on ${formatDate(complaint.resolvedAt)}.`}
                </p>
                <p className="text-sm text-emerald-600 mb-3">
                  If you&apos;re still experiencing issues, you can submit a new
                  complaint.
                </p>
                <Link
                  href="/complaints/new"
                  className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                  Submit a new complaint
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {complaint.status === "CLOSED" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-5 bg-slate-100 border border-slate-200 rounded-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6 text-slate-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 mb-1">
                  Complaint Closed
                </p>
                <p className="text-sm text-slate-600 mb-3">
                  This complaint has been closed. No further replies can be
                  added.
                </p>
                <Link
                  href="/complaints/new"
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Submit a new complaint
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
