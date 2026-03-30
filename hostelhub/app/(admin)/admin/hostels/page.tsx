"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Search,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Ban,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  MapPin,
  Image as ImageIcon,
  Clock,
  Phone,
  CreditCard,
  ExternalLink,
  Home,
  DoorOpen,
  Banknote,
  Shield,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import {
  useAdminHostels,
  useAdminHostelDetail,
  useUpdateHostelStatus,
} from "@/hooks/useAdminHostels";
import type { AdminHostel } from "@/services/admin.service";
import Image from "next/image";

type HostelStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED"
  | "UNAVAILABLE";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 0,
  }).format(num);
}

function getStatusConfig(status: HostelStatus) {
  const configs = {
    PENDING: { label: "Pending", variant: "warning" as const, icon: Clock },
    APPROVED: {
      label: "Approved",
      variant: "success" as const,
      icon: CheckCircle2,
    },
    REJECTED: { label: "Rejected", variant: "error" as const, icon: Ban },
    SUSPENDED: { label: "Suspended", variant: "error" as const, icon: Shield },
    UNAVAILABLE: {
      label: "Unavailable",
      variant: "secondary" as const,
      icon: DoorOpen,
    },
  };
  return configs[status];
}

function getOccupancyLabel(type: string) {
  const labels: Record<string, string> = {
    IN_1: "1 in a Room",
    IN_2: "2 in a Room",
    IN_3: "3 in a Room",
    IN_4: "4 in a Room",
  };
  return labels[type] || type;
}

function getPricingPeriodLabel(period: string) {
  const labels: Record<string, string> = {
    PER_YEAR: "Academic Year",
    PER_SEMESTER: "Semester",
  };
  return labels[period] || period;
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
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={cn(
        "fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:top-6 z-60 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg sm:max-w-md",
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
  title = "Rejection Reason",
  description = "Please provide a reason for rejecting this hostel. The manager will be notified.",
}: {
  onConfirm: (reason: string) => void;
  onClose: () => void;
  isLoading: boolean;
  title?: string;
  description?: string;
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
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">{description}</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason (min 10 characters)..."
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
            Reject
          </Button>
        </div>
      </motion.div>
    </>
  );
}

function ImageGallery({ images }: { images: AdminHostel["images"] }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const primaryImage = images.find((img) => img.isPrimary) || images[0];

  if (images.length === 0) {
    return (
      <div className="bg-slate-100 rounded-lg h-48 flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-slate-400" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <div className="relative h-48 rounded-lg overflow-hidden">
          <Image
            src={primaryImage?.url || "/placeholder-hostel.jpg"}
            alt="Primary hostel image"
            fill
            className="object-cover"
          />
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((image) => (
              <button
                key={image.id}
                onClick={() => setSelectedImage(image.url)}
                className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 border-transparent hover:border-primary-500 transition-colors"
              >
                <Image
                  src={image.url}
                  alt="Hostel image"
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
      <AnimatePresence>
        {selectedImage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-60"
              onClick={() => setSelectedImage(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 z-60 flex items-center justify-center"
            >
              <div className="relative w-full max-w-4xl max-h-[90vh]">
                <Image
                  src={selectedImage}
                  alt="Hostel image"
                  width={1200}
                  height={800}
                  className="object-contain w-full h-full rounded-lg"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function HostelDetailModal({
  hostelId,
  onClose,
  onStatusUpdate,
}: {
  hostelId: string;
  onClose: () => void;
  onStatusUpdate: (
    hostelId: string,
    status: HostelStatus,
    hostelName: string,
    rejectionReason?: string,
  ) => Promise<void>;
}) {
  const { hostel, isLoading, error } = useAdminHostelDetail(hostelId);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleStatusChange = async (
    newStatus: HostelStatus,
    reason?: string,
  ) => {
    if (!hostel) return;
    setActionLoading(newStatus);
    try {
      await onStatusUpdate(hostel.id, newStatus, hostel.name, reason);
      onClose();
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reason: string) => {
    await handleStatusChange("REJECTED", reason);
    setShowRejectionModal(false);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Loading hostel details...</p>
        </div>
      );
    }

    if (error || !hostel) {
      return (
        <div className="p-12 flex flex-col items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
          <p className="text-sm text-red-600">
            {error || "Failed to load hostel details"}
          </p>
        </div>
      );
    }

    const statusConfig = getStatusConfig(hostel.status as HostelStatus);
    const lowestPrice =
      hostel.roomTypes.length > 0
        ? Math.min(
            ...hostel.roomTypes.map((rt) => parseFloat(rt.pricePerPerson)),
          )
        : null;
    const totalAvailableRooms = hostel.roomTypes.reduce(
      (sum, rt) => sum + rt.availableRooms,
      0,
    );

    return (
      <>
        <div className="p-6 space-y-6">
          <ImageGallery images={hostel.images} />

          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {hostel.name}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                  <MapPin className="w-4 h-4" />
                  {hostel.address}
                </div>
              </div>
              <Badge variant={statusConfig.variant} size="sm">
                <statusConfig.icon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
            {hostel.distanceToCampus && (
              <p className="text-xs text-slate-400 mt-1">
                {hostel.distanceToCampus} km from campus
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <Home className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-700">
                {hostel.totalRooms}
              </p>
              <p className="text-xs text-blue-600">Total Rooms</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <DoorOpen className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-green-700">
                {totalAvailableRooms}
              </p>
              <p className="text-xs text-green-600">Available</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <Banknote className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-purple-700">
                {lowestPrice ? formatCurrency(lowestPrice) : "—"}
              </p>
              <p className="text-xs text-purple-600">From</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">
              Description
            </h4>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">
              {hostel.description}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              Manager
            </h4>
            <div className="flex items-center gap-3">
              <Avatar
                name={`${hostel.manager.firstName} ${hostel.manager.lastName}`}
                size="md"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800">
                    {hostel.manager.firstName} {hostel.manager.lastName}
                  </p>
                  {hostel.manager.managerProfile?.verified && (
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <p className="text-xs text-slate-500">{hostel.manager.email}</p>
                {hostel.manager.managerProfile?.businessName && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {hostel.manager.managerProfile.businessName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {hostel.roomTypes.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700">
                Room Types
              </h4>
              <div className="space-y-2">
                {hostel.roomTypes.map((roomType) => (
                  <div
                    key={roomType.id}
                    className="bg-slate-50 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-800 text-sm">
                        {getOccupancyLabel(roomType.occupancyType)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {roomType.availableRooms} of {roomType.totalRooms}{" "}
                        available
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">
                        {formatCurrency(roomType.pricePerPerson)}
                      </p>
                      <p className="text-xs text-slate-400">per person</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hostel.facilities.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700">
                Facilities
              </h4>
              <div className="flex flex-wrap gap-2">
                {hostel.facilities.map((facility) => (
                  <Badge key={facility.id} variant="secondary" size="sm">
                    {facility.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {hostel.paymentDetail && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700">
                Payment Details
              </h4>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">
                    {hostel.paymentDetail.momoProvider} -{" "}
                    {hostel.paymentDetail.momoNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">
                    {hostel.paymentDetail.accountName}
                  </span>
                </div>
                {hostel.paymentDetail.alternatePhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">
                      {hostel.paymentDetail.alternatePhone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400">Pricing Period</p>
              <p className="text-sm font-medium text-slate-800">
                {getPricingPeriodLabel(hostel.pricingPeriod)}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400">Semester Payment</p>
              <p className="text-sm font-medium text-slate-800">
                {hostel.allowSemesterPayment ? "Allowed" : "Not Allowed"}
              </p>
            </div>
            {hostel._count && (
              <>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Total Bookings</p>
                  <p className="text-sm font-medium text-slate-800">
                    {hostel._count.bookings}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Complaints</p>
                  <p className="text-sm font-medium text-slate-800">
                    {hostel._count.complaints}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400">Created</p>
              <p className="text-sm font-medium text-slate-800">
                {formatDate(hostel.createdAt)}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400">Last Updated</p>
              <p className="text-sm font-medium text-slate-800">
                {formatDate(hostel.updatedAt)}
              </p>
            </div>
          </div>

          {hostel.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-xs text-red-500 font-medium mb-1">
                Rejection Reason
              </p>
              <p className="text-sm text-red-700">{hostel.rejectionReason}</p>
            </div>
          )}
          {hostel.status === "APPROVED" && (
            <a
              href={`/hostels/${hostel.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium py-2 px-4 bg-primary-50 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Public Page
            </a>
          )}
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100">
          <div className="flex flex-col gap-3">
            {hostel.status === "PENDING" && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setShowRejectionModal(true)}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === "REJECTED" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Ban className="w-4 h-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button
                  fullWidth
                  onClick={() => handleStatusChange("APPROVED")}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === "APPROVED" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Approve
                </Button>
              </div>
            )}

            {hostel.status === "REJECTED" && (
              <Button
                fullWidth
                onClick={() => handleStatusChange("APPROVED")}
                disabled={actionLoading !== null}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading === "APPROVED" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Approve Hostel
              </Button>
            )}

            <div className="flex gap-3">
              {hostel.status === "APPROVED" && (
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
                  Suspend Hostel
                </Button>
              )}

              {hostel.status === "SUSPENDED" && (
                <Button
                  variant="outline"
                  fullWidth
                  className="text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => handleStatusChange("APPROVED")}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === "APPROVED" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Reactivate Hostel
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
        className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl bg-white rounded-2xl shadow-2xl z-50 overflow-y-auto max-h-[90vh]"
      >
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-800">Hostel Details</h2>
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
            isLoading={actionLoading === "REJECTED"}
            title="Reject Hostel"
            description="Please provide a reason for rejecting this hostel listing. The manager will be notified and can make changes and resubmit."
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function AdminHostelsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<HostelStatus | "all">("all");
  const [selectedHostelId, setSelectedHostelId] = useState<string | null>(null);
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

  const hostelParams = useMemo(
    () => ({
      page: currentPage,
      limit: pageSize,
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: debouncedSearch || undefined,
    }),
    [currentPage, pageSize, statusFilter, debouncedSearch],
  );

  const { hostels, pagination, isLoading, error, refetch } =
    useAdminHostels(hostelParams);

  const { updateStatus } = useUpdateHostelStatus();

  const stats = useMemo(() => {
    const safeHostels = hostels ?? [];

    return {
      total: pagination?.totalItems ?? 0,
      pending: safeHostels.filter((h) => h.status === "PENDING").length,
      approved: safeHostels.filter((h) => h.status === "APPROVED").length,
      suspended: safeHostels.filter((h) => h.status === "SUSPENDED").length,
    };
  }, [hostels, pagination]);
  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 5000);
    },
    [],
  );

  const handleStatusUpdate = useCallback(
    async (
      hostelId: string,
      status: HostelStatus,
      hostelName: string,
      rejectionReason?: string,
    ) => {
      try {
        await updateStatus(hostelId, { status, rejectionReason });
        const statusMessages: Record<HostelStatus, string> = {
          APPROVED: `${hostelName} has been approved and is now visible to students.`,
          REJECTED: `${hostelName} has been rejected. The manager has been notified.`,
          SUSPENDED: `${hostelName} has been suspended and is no longer visible.`,
          PENDING: `${hostelName} status changed to pending.`,
          UNAVAILABLE: `${hostelName} marked as unavailable.`,
        };
        showToast(statusMessages[status], "success");
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

  const totalPages = pagination?.totalPages ?? 1;

  const getHostelImage = (hostel: AdminHostel) => {
    const primaryImage = hostel.images.find((img) => img.isPrimary);
    return primaryImage?.url || hostel.images[0]?.url || null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hostels</h1>
          <p className="text-slate-500 mt-1">
            Manage hostel listings. Approve, reject, or suspend
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
            label: "Total Hostels",
            value: stats.total,
            icon: Building2,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-200",
          },
          {
            label: "Pending Review",
            value: stats.pending,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-200",
          },
          {
            label: "Approved",
            value: stats.approved,
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-50",
            border: "border-green-200",
          },
          {
            label: "Suspended",
            value: stats.suspended,
            icon: Ban,
            color: "text-red-600",
            bg: "bg-red-50",
            border: "border-red-200",
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
            placeholder="Search by name or address..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as HostelStatus | "all");
              setCurrentPage(1);
            }}
            className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg bg-white cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="UNAVAILABLE">Unavailable</option>
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
          <p className="text-sm text-slate-500">Loading hostels...</p>
        </div>
      ) : hostels.length > 0 ? (
        <>
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {[
                    "Hostel",
                    "Manager",
                    "Rooms",
                    "Status",
                    "Created",
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
                {hostels.map((hostel) => {
                  const statusConfig = getStatusConfig(
                    hostel.status as HostelStatus,
                  );
                  const imageUrl = getHostelImage(hostel);
                  const lowestPrice =
                    hostel.roomTypes.length > 0
                      ? Math.min(
                          ...hostel.roomTypes.map((rt) =>
                            parseFloat(rt.pricePerPerson),
                          ),
                        )
                      : null;

                  return (
                    <tr
                      key={hostel.id}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={hostel.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-sm">
                              {hostel.name}
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {hostel.address.length > 30
                                ? hostel.address.substring(0, 30) + "..."
                                : hostel.address}
                            </p>
                            {lowestPrice && (
                              <p className="text-xs text-green-600 font-medium mt-0.5">
                                From {formatCurrency(lowestPrice)}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={`${hostel.manager.firstName} ${hostel.manager.lastName}`}
                            size="sm"
                          />
                          <div>
                            <p className="text-sm text-slate-800">
                              {hostel.manager.firstName}{" "}
                              {hostel.manager.lastName}
                            </p>
                            {hostel.manager.managerProfile?.businessName && (
                              <p className="text-xs text-slate-400">
                                {hostel.manager.managerProfile.businessName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-800">
                          {hostel.totalRooms} rooms
                        </p>
                        <p className="text-xs text-slate-400">
                          {hostel.roomTypes.length} type(s)
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusConfig.variant} size="sm">
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(hostel.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedHostelId(hostel.id)}
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
            {hostels.map((hostel) => {
              const statusConfig = getStatusConfig(
                hostel.status as HostelStatus,
              );
              const imageUrl = getHostelImage(hostel);
              const lowestPrice =
                hostel.roomTypes.length > 0
                  ? Math.min(
                      ...hostel.roomTypes.map((rt) =>
                        parseFloat(rt.pricePerPerson),
                      ),
                    )
                  : null;

              return (
                <div
                  key={hostel.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:border-primary-300 transition-colors"
                  onClick={() => setSelectedHostelId(hostel.id)}
                >
                  <div className="relative h-32 bg-slate-100">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={hostel.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={statusConfig.variant} size="sm">
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {hostel.name}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {hostel.address}
                        </p>
                      </div>
                      <Eye className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={`${hostel.manager.firstName} ${hostel.manager.lastName}`}
                          size="xs"
                        />
                        <span className="text-xs text-slate-500">
                          {hostel.manager.firstName} {hostel.manager.lastName}
                        </span>
                      </div>
                      {lowestPrice && (
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(lowestPrice)}
                        </span>
                      )}
                    </div>
                  </div>
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
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            No hostels found
          </h3>
          <p className="text-slate-500 mb-4">
            {debouncedSearch || statusFilter !== "all"
              ? "Try adjusting your search or filters."
              : "No hostels have been listed yet."}
          </p>
          {(debouncedSearch || statusFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setDebouncedSearch("");
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
        {selectedHostelId && (
          <HostelDetailModal
            hostelId={selectedHostelId}
            onClose={() => setSelectedHostelId(null)}
            onStatusUpdate={handleStatusUpdate}
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
