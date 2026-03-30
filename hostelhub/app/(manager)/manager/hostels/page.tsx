/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  MoreVertical,
  ChevronDown,
  Grid3X3,
  List,
  ImageIcon,
  AlertTriangle,
  DoorOpen,
  Loader2,
  RefreshCw,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { useManagerHostels, useDeleteHostel } from "@/hooks/useManagerHostels";
import type {
  HostelListItem,
  HostelStatus,
  RoomType,
} from "@/services/hostel.service";
import Image from "next/image";

type ViewMode = "grid" | "list";

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
      icon: XCircle,
    },
    SUSPENDED: {
      label: "Suspended",
      variant: "secondary" as const,
      icon: XCircle,
    },
  };
  return configs[status] || configs.PENDING;
}

function calculateOccupancyStats(roomTypes?: RoomType[]) {
  if (!roomTypes || roomTypes.length === 0) {
    return {
      totalRooms: 0,
      availableRooms: 0,
      occupiedRooms: 0,
      totalSpots: 0,
      availableSpots: 0,
      occupiedSpots: 0,
      occupancyRate: 0,
    };
  }

  const totalRooms = roomTypes.reduce(
    (sum, rt) => sum + (rt.totalRooms || 0),
    0,
  );
  const availableRooms = roomTypes.reduce(
    (sum, rt) => sum + (rt.availableRooms || 0),
    0,
  );
  const totalSpots = roomTypes.reduce(
    (sum, rt) => sum + (rt.totalSpots || 0),
    0,
  );
  const availableSpots = roomTypes.reduce(
    (sum, rt) => sum + (rt.availableSpots || 0),
    0,
  );

  const occupiedRooms = totalRooms - availableRooms;
  const occupiedSpots = totalSpots - availableSpots;

  const occupancyRate =
    totalSpots > 0 ? Math.round((occupiedSpots / totalSpots) * 100) : 0;

  return {
    totalRooms,
    availableRooms,
    occupiedRooms,
    totalSpots,
    availableSpots,
    occupiedSpots,
    occupancyRate,
  };
}

function getPriceRange(roomTypes?: RoomType[]) {
  if (!roomTypes || roomTypes.length === 0) {
    return null;
  }

  const prices = roomTypes
    .map((rt) => Number(rt.pricePerPerson))
    .filter((p) => p > 0);

  if (prices.length === 0) return null;

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
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
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={cn(
        "fixed bottom-6 right-6 z-60 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg",
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

function PortfolioStats({ hostels }: { hostels: HostelListItem[] }) {
  const stats = useMemo(() => {
    const activeHostels = hostels.filter((h) => h.status === "APPROVED");

    let totalSpots = 0;
    let availableSpots = 0;
    let totalRooms = 0;

    activeHostels.forEach((hostel) => {
      const occupancy = calculateOccupancyStats(hostel.roomTypes);
      totalSpots += occupancy.totalSpots;
      availableSpots += occupancy.availableSpots;
      totalRooms += occupancy.totalRooms;
    });

    const occupiedSpots = totalSpots - availableSpots;
    const occupancyRate =
      totalSpots > 0 ? Math.round((occupiedSpots / totalSpots) * 100) : 0;

    return [
      {
        label: "Total Properties",
        value: hostels.length.toString(),
        subtitle: `${activeHostels.length} active`,
        icon: Building2,
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
      },
      {
        label: "Total Spots",
        value: totalSpots.toString(),
        subtitle: `${occupiedSpots} occupied`,
        icon: Users,
        color: "text-purple-600",
        bg: "bg-purple-50",
        border: "border-purple-200",
      },
      {
        label: "Occupancy Rate",
        value: `${occupancyRate}%`,
        subtitle: `${availableSpots} spots available`,
        icon: DoorOpen,
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-200",
      },
      {
        label: "Pending",
        value: hostels.filter((h) => h.status === "PENDING").length.toString(),
        subtitle: "Awaiting review",
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
      },
    ];
  }, [hostels]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={cn("bg-white rounded-xl border p-4", stat.border)}
        >
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              <p className="text-xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.subtitle}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function HostelGridCard({
  hostel,
  onDelete,
}: {
  hostel: HostelListItem;
  onDelete: (hostel: HostelListItem) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const statusConfig = getStatusConfig(hostel.status);

  const occupancyStats = useMemo(
    () => calculateOccupancyStats(hostel.roomTypes),
    [hostel.roomTypes],
  );
  const priceRange = useMemo(
    () => getPriceRange(hostel.roomTypes),
    [hostel.roomTypes],
  );

  const primaryImage =
    hostel.images?.find((img) => img.isPrimary) || hostel.images?.[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group"
    >
      <div className="relative h-44 bg-linear-to-br from-primary-500 to-primary-700">
        {primaryImage ? (
          <Image
            fill
            src={primaryImage.url}
            alt={hostel.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-white/40" />
          </div>
        )}

        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant={statusConfig.variant} size="sm">
            <statusConfig.icon className="w-3 h-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>

        <div className="absolute top-3 right-3">
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 bg-black/30 hover:bg-black/50 rounded-lg text-white transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20"
                  >
                    <Link
                      href={`/manager/hostels/${hostel.id}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      onClick={() => setShowMenu(false)}
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                    <Link
                      href={`/manager/hostels/${hostel.id}/edit`}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      onClick={() => setShowMenu(false)}
                    >
                      <Edit className="w-4 h-4" />
                      Edit Hostel
                    </Link>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(hostel);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full border-t border-slate-100"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Hostel
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {hostel.rejectionReason && (
          <div className="absolute bottom-3 left-3 right-3">
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-md flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Rejected
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <Link href={`/manager/hostels/${hostel.id}`}>
          <h3 className="font-semibold text-slate-800 group-hover:text-primary-600 transition-colors">
            {hostel.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{hostel.address}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
          <div className="text-center">
            <p className="text-lg font-bold text-slate-800">
              {occupancyStats.totalSpots}
            </p>
            <p className="text-xs text-slate-400">Total Spots</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-800">
              {occupancyStats.occupancyRate}%
            </p>
            <p className="text-xs text-slate-400">Occupied</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">
              {occupancyStats.availableSpots}
            </p>
            <p className="text-xs text-slate-400">Available</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {occupancyStats.totalRooms} rooms ({occupancyStats.availableRooms}{" "}
              with space)
            </span>
            {hostel.roomTypes && hostel.roomTypes.length > 0 && (
              <span className="text-slate-400">
                {hostel.roomTypes.length} room type
                {hostel.roomTypes.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {priceRange && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">Price Range</p>
            <p className="text-sm font-semibold text-slate-800">
              {formatCurrency(priceRange.min)}
              {priceRange.min !== priceRange.max &&
                ` – ${formatCurrency(priceRange.max)}`}
            </p>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Link href={`/manager/hostels/${hostel.id}`} className="flex-1">
            <Button variant="outline" size="sm" fullWidth>
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
          </Link>
          <Link href={`/manager/hostels/${hostel.id}/edit`} className="flex-1">
            <Button variant="outline" size="sm" fullWidth>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function DeleteConfirmModal({
  hostelName,
  isDeleting,
  onClose,
  onConfirm,
}: {
  hostelName: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
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
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 p-6"
      >
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 text-center mb-2">
          Delete Hostel?
        </h3>
        <p className="text-sm text-slate-500 text-center mb-6">
          Are you sure you want to delete &quot;{hostelName}&quot;? This action
          cannot be undone. All rooms, bookings, and data associated with this
          hostel will be permanently removed.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            className="bg-red-600 hover:bg-red-700"
            onClick={onConfirm}
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
  );
}

export default function ManagerHostelsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<HostelStatus | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [deleteTarget, setDeleteTarget] = useState<HostelListItem | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const { hostels, pagination, isLoading, error, refetch } = useManagerHostels({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: debouncedSearch || undefined,
  });

  const { deleteHostel, isDeleting } = useDeleteHostel();

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 5000);
    },
    [],
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteHostel(deleteTarget.id);
      showToast(
        `"${deleteTarget.name}" has been deleted successfully`,
        "success",
      );
      setDeleteTarget(null);
      refetch();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete hostel";
      showToast(message, "error");
    }
  };

  const portfolioSummary = useMemo(() => {
    let totalSpots = 0;
    let availableSpots = 0;

    hostels.forEach((hostel) => {
      if (hostel.status === "APPROVED") {
        const stats = calculateOccupancyStats(hostel.roomTypes);
        totalSpots += stats.totalSpots;
        availableSpots += stats.availableSpots;
      }
    });

    return {
      totalSpots,
      availableSpots,
      occupiedSpots: totalSpots - availableSpots,
      occupancyRate:
        totalSpots > 0
          ? Math.round(((totalSpots - availableSpots) / totalSpots) * 100)
          : 0,
    };
  }, [hostels]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Hostels</h1>
          <p className="text-slate-500 mt-1">
            {portfolioSummary.totalSpots > 0 && (
              <>
                {portfolioSummary.occupiedSpots} of{" "}
                {portfolioSummary.totalSpots} spots occupied (
                {portfolioSummary.occupancyRate}%)
              </>
            )}
            {portfolioSummary.totalSpots === 0 &&
              "Manage your hostel portfolio and track performance"}
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
          <Link href="/manager/hostels/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New Hostel
            </Button>
          </Link>
        </div>
      </div>

      <PortfolioStats hostels={hostels} />

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search hostels by name or address..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as HostelStatus | "all")
              }
              className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="APPROVED">Active</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "grid"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-600",
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "list"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-600",
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
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
          <p className="text-sm text-slate-500">Loading your hostels...</p>
        </div>
      ) : hostels.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {hostels.length} hostel{hostels.length !== 1 ? "s" : ""} found
            </p>
          </div>

          <AnimatePresence mode="popLayout">
            {viewMode === "grid" ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {hostels.map((hostel) => (
                  <HostelGridCard
                    key={hostel.id}
                    hostel={hostel}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {hostels.map((hostel) => (
                  <HostelGridCard
                    key={hostel.id}
                    hostel={hostel}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            {search || statusFilter !== "all"
              ? "No hostels found"
              : "No hostels yet"}
          </h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            {search || statusFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Get started by adding your first hostel to the platform."}
          </p>
          {!search && statusFilter === "all" && (
            <Link href="/manager/hostels/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Hostel
              </Button>
            </Link>
          )}
        </div>
      )}

      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmModal
            hostelName={deleteTarget.name}
            isDeleting={isDeleting}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
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
