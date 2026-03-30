/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Star,
  Users,
  Edit,
  Trash2,
  Phone,
  Mail,
  Wifi,
  Zap,
  Droplets,
  Shield,
  Car,
  UtensilsCrossed,
  Wind,
  Tv,
  CheckCircle2,
  Clock,
  ImageIcon,
  AlertTriangle,
  DoorOpen,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import {
  useManagerHostelDetail,
  useDeleteHostel,
} from "@/hooks/useManagerHostels";
import type { HostelDetail, HostelStatus } from "@/services/hostel.service";
import Image from "next/image";

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

function getStatusConfig(status: HostelStatus) {
  const configs = {
    APPROVED: {
      label: "Active",
      variant: "success" as const,
      icon: CheckCircle2,
    },
    PENDING: {
      label: "Pending Review",
      variant: "warning" as const,
      icon: Clock,
    },
    REJECTED: {
      label: "Rejected",
      variant: "error" as const,
      icon: AlertTriangle,
    },
    SUSPENDED: {
      label: "Suspended",
      variant: "secondary" as const,
      icon: AlertTriangle,
    },
  };
  return configs[status] || configs.PENDING;
}

function getAmenityIcon(amenity: string) {
  const icons: Record<string, React.ElementType> = {
    wifi: Wifi,
    water: Droplets,
    electricity: Zap,
    security: Shield,
    parking: Car,
    kitchen: UtensilsCrossed,
    ac: Wind,
    tv: Tv,
    laundry: Droplets,
    study_room: Building2,
  };
  return icons[amenity.toLowerCase()] || CheckCircle2;
}

function getRoomTypeLabel(type: string) {
  const labels: Record<string, string> = {
    SINGLE: "Single",
    DOUBLE: "Double",
    TRIPLE: "Triple",
    QUAD: "Quad",
    DORMITORY: "Dormitory",
  };
  return labels[type] || type;
}

type ActiveTab = "overview" | "rooms" | "reviews";

function TabButton({
  label,
  active,
  onClick,
  badge,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative cursor-pointer px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
        active ? "text-primary-600" : "text-slate-500 hover:text-slate-700",
      )}
    >
      <span className="flex items-center gap-2">
        {label}
        {badge !== undefined && badge > 0 && (
          <Badge variant={active ? "primary" : "secondary"} size="sm">
            {badge}
          </Badge>
        )}
      </span>
      {active && (
        <motion.div
          layoutId="hostel-tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
        />
      )}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
      <p className="text-slate-500">Loading hostel details...</p>
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        Failed to load hostel
      </h3>
      <p className="text-slate-500 mb-4 text-center max-w-md">{error}</p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Building2 className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        Hostel not found
      </h3>
      <p className="text-slate-500 mb-4">
        The hostel you&apos;re looking for doesn&apos;t exist or has been
        removed.
      </p>
      <Link href="/manager/hostels">
        <Button>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Hostels
        </Button>
      </Link>
    </div>
  );
}

function OverviewTab({ hostel }: { hostel: HostelDetail }) {
  const totalRooms =
    hostel.roomTypes?.reduce((sum, rt) => sum + rt.totalRooms, 0) || 0;
  const availableRooms =
    hostel.roomTypes?.reduce((sum, rt) => sum + rt.availableRooms, 0) || 0;
  const occupiedRooms = totalRooms - availableRooms;
  const occupancyRate =
    totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const priceRange = hostel.roomTypes?.reduce(
    (acc, rt) => ({
      min: Math.min(acc.min, rt.pricePerPerson),
      max: Math.max(acc.max, rt.pricePerPerson),
    }),
    { min: Infinity, max: 0 },
  ) || { min: 0, max: 0 };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Rooms",
            value: totalRooms.toString(),
            icon: DoorOpen,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Occupancy Rate",
            value: `${occupancyRate}%`,
            icon: Users,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Available",
            value: availableRooms.toString(),
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon className={cn("w-4 h-4", stat.color)} />
              </div>
            </div>
            <p className="text-xl font-bold text-slate-800">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-800">About</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            {hostel.description || "No description provided."}
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-xs text-slate-400">Location</p>
              <p className="text-sm font-medium text-slate-700">
                {hostel.address}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Near University</p>
              <p className="text-sm font-medium text-slate-700">
                {hostel.distanceToCampus}
              </p>
            </div>

            {priceRange.min !== Infinity && (
              <div>
                <p className="text-xs text-slate-400">Price Range</p>
                <p className="text-sm font-medium text-slate-700">
                  {formatCurrency(priceRange.min)} -{" "}
                  {formatCurrency(priceRange.max)}
                </p>
              </div>
            )}
          </div>

          {hostel.manager?.phone || hostel.manager?.email ? (
            <div className="pt-2">
              <p className="text-xs text-slate-400 mb-2">Contact</p>
              <div className="space-y-2">
                {hostel.manager?.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {hostel.manager?.phone}
                  </div>
                )}
                {hostel.manager?.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {hostel.manager?.email}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          {hostel.facilities && hostel.facilities.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">
                Amenities
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {hostel.facilities.map((facility) => {
                  const Icon = getAmenityIcon(facility.name);
                  return (
                    <div
                      key={facility.id}
                      className="flex items-center gap-2 text-sm text-slate-600"
                    >
                      <Icon className="w-4 h-4 text-primary-500" />
                      {facility.name}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {hostel.paymentDetail && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">
            Payment Information
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-400">Account Name</p>
              <p className="text-sm font-medium text-slate-700">
                {hostel.paymentDetail.accountName}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Account Number</p>
              <p className="text-sm font-medium text-slate-700">
                {hostel.paymentDetail.momoNumber}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Bank</p>
              <p className="text-sm font-medium text-slate-700">
                {hostel.paymentDetail.momoProvider}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoomsTab({ hostel }: { hostel: HostelDetail }) {
  const roomTypes = hostel.roomTypes || [];

  if (roomTypes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 py-12 text-center">
        <DoorOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500 mb-4">
          No room types configured yet
        </p>
        <Link href={`/manager/hostels/${hostel.id}/edit`}>
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Add Room Types
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {roomTypes.map((roomType) => (
        <div
          key={roomType.id}
          className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-slate-400" />
              </div>
              <Badge
                variant={roomType.availableRooms > 0 ? "success" : "secondary"}
                size="sm"
              >
                {roomType.availableRooms > 0 ? "Available" : "Full"}
              </Badge>
            </div>

            {roomType.description && (
              <p className="text-sm text-slate-500 mb-3">
                {roomType.description}
              </p>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Capacity</span>
                <span className="font-medium text-slate-700">
                  {roomType.occupancyType} {roomType.occupancyType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Rooms</span>
                <span className="font-medium text-slate-700">
                  {roomType.totalRooms}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Available</span>
                <span className="font-medium text-green-600">
                  {roomType.availableRooms}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-500">Price per Semester</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(roomType.pricePerPerson)}
                </span>
              </div>
            </div>

            {roomType.amenities && roomType.amenities.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-2">Amenities</p>
                <div className="flex flex-wrap gap-1">
                  {roomType.amenities.map((amenity, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HostelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hostelId = params.id as string;

  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { hostel, isLoading, error, refetch } =
    useManagerHostelDetail(hostelId);
  const { deleteHostel, isDeleting } = useDeleteHostel();

  const handleDelete = async () => {
    if (!hostel) return;

    try {
      await deleteHostel(hostel.id);
      router.push("/manager/hostels");
    } catch (err) {
      console.error("Failed to delete hostel:", err);
    }
  };

  const tabs: { id: ActiveTab; label: string; badge?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "rooms", label: "Room Types", badge: hostel?.roomTypes?.length || 0 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex cursor-pointer items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Hostels
        </button>
        <LoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex cursor-pointer items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Hostels
        </button>
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  if (!hostel) {
    return (
      <div className="space-y-6">
        <NotFoundState />
      </div>
    );
  }

  const statusConfig = getStatusConfig(hostel.status);
  const primaryImage =
    hostel.images?.find((img) => img.isPrimary) || hostel.images?.[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="flex cursor-pointer items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Hostels
        </button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href={`/manager/hostels/${hostel.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="h-48 sm:h-64 bg-linear-to-br from-primary-600 to-primary-800 relative">
          {primaryImage ? (
            <Image
              fill
              src={primaryImage.url}
              alt={hostel.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white/60">
                <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">No images uploaded</p>
              </div>
            </div>
          )}

          <div className="absolute top-4 left-4 flex gap-2">
            <Badge variant={statusConfig.variant} size="md">
              <statusConfig.icon className="w-3.5 h-3.5 mr-1" />
              {statusConfig.label}
            </Badge>
            {hostel.status && (
              <Badge variant="primary" size="md">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {hostel.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {hostel.address}
                </span>
              </div>
            </div>
          </div>

          {hostel.status === "REJECTED" && hostel.rejectionReason && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Rejection Reason
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    {hostel.rejectionReason}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex overflow-x-auto border-b border-slate-200 px-2">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              label={tab.label}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              badge={tab.badge}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "overview" && <OverviewTab hostel={hostel} />}
          {activeTab === "rooms" && <RoomsTab hostel={hostel} />}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 p-6"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center mb-2">
                Delete Hostel?
              </h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Are you sure you want to delete &quot;{hostel.name}&quot;? This
                action cannot be undone and all associated data will be
                permanently removed.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete Hostel
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
