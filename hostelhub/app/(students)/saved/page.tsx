"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Trash2,
  Search,
  MapPin,
  Star,
  Building2,
  ChevronRight,
  X,
  Filter,
  ChevronDown,
  Check,
  Sparkles,
  Shield,
  ArrowRight,
  Wifi,
  Car,
  Zap,
  Droplets,
  Bed,
  AlertCircle,
  BookmarkX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSavedHostels } from "@/hooks/useSavedHostels";
import type { SavedHostelItem } from "@/services/saved-hostel.service";

const sortOptions = [
  { value: "recent", label: "Recently Added" },
  { value: "name", label: "Name: A to Z" },
  { value: "distance", label: "Nearest to Campus" },
] as const;

const facilityIcons: Record<string, React.ElementType> = {
  wifi: Wifi,
  parking: Car,
  electricity: Zap,
  water: Droplets,
  security: Shield,
};

function HostelCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="aspect-4/3 bg-slate-200" />
      <div className="p-5 space-y-3">
        <div className="h-5 w-3/4 bg-slate-200 rounded-lg" />
        <div className="h-4 w-1/2 bg-slate-100 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-slate-100 rounded-full" />
          <div className="h-6 w-16 bg-slate-100 rounded-full" />
        </div>
        <div className="pt-3 border-t border-slate-100 flex justify-between">
          <div className="h-6 w-24 bg-slate-200 rounded-lg" />
          <div className="h-6 w-20 bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  type,
  searchQuery,
  onClear,
}: {
  type: "no-saved" | "no-results";
  searchQuery?: string;
  onClear?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-6">
        {type === "no-saved" ? (
          <Heart className="w-10 h-10 text-slate-300" />
        ) : (
          <Search className="w-10 h-10 text-slate-300" />
        )}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">
        {type === "no-saved" ? "No saved hostels" : "No results found"}
      </h3>
      <p className="text-slate-500 max-w-sm mb-6">
        {type === "no-saved"
          ? "Start browsing hostels and save the ones you like for easy access later."
          : `No saved hostels match "${searchQuery}"`}
      </p>
      {type === "no-saved" ? (
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
          Clear Search
        </button>
      )}
    </motion.div>
  );
}

function SavedHostelCard({
  savedItem,
  index,
  onRemove,
}: {
  savedItem: SavedHostelItem;
  index: number;
  onRemove: (hostelId: string) => void;
}) {
  const { hostel } = savedItem;
  const lowestPrice = hostel.priceRange.min;
  const hostelImage =
    hostel.images[0]?.url ||
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <Link href={`/hostels/${hostel.id}`}>
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
        >
          <div className="relative aspect-4/3 overflow-hidden">
            <Image
              src={hostelImage}
              alt={hostel.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />

            <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white rounded-full text-xs font-semibold">
                  <Shield className="w-3 h-3" />
                  Verified
                </span>
                {hostel.distanceToCampus && hostel.distanceToCampus <= 0.5 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-500 text-white rounded-full text-xs font-semibold">
                    <Sparkles className="w-3 h-3" />
                    Near Campus
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove(hostel.id);
                }}
                className="p-2.5 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:scale-110"
                title="Remove from saved"
              >
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              </button>
            </div>

            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-2">
                {hostel.rating && (
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-bold text-slate-800">
                      {hostel.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({hostel.reviewCount})
                    </span>
                  </div>
                )}
                {hostel.distanceToCampus && (
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg">
                    <MapPin className="w-3.5 h-3.5 text-primary-500" />
                    <span className="text-xs font-medium text-slate-700">
                      {hostel.distanceToCampus}km
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-5">
            <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-primary-600 transition-colors">
              {hostel.name}
            </h3>
            <p className="text-sm text-slate-500 flex items-center gap-1 mb-3">
              <MapPin className="w-3.5 h-3.5" />
              {hostel.address}
            </p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {hostel.facilities.slice(0, 4).map((facility) => {
                const Icon = facilityIcons[facility.name.toLowerCase()] || Zap;
                return (
                  <span
                    key={facility.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs"
                  >
                    <Icon className="w-3 h-3" />
                    {facility.name}
                  </span>
                );
              })}
              {hostel.facilities.length > 4 && (
                <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs">
                  +{hostel.facilities.length - 4}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500">Starting from</p>
                <p className="text-xl font-bold text-slate-900">
                  GHS {lowestPrice.toLocaleString()}
                  <span className="text-sm font-normal text-slate-500">
                    /sem
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm text-slate-600">
                  <Bed className="w-4 h-4" />
                  <span>{hostel.totalAvailable} rooms</span>
                </div>
                <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-600 transition-colors">
                  <ChevronRight className="w-5 h-5 text-primary-600 group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default function SavedHostelsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] =
    useState<(typeof sortOptions)[number]["value"]>("recent");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [hostelToRemove, setHostelToRemove] = useState<string | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const { savedHostels, isLoading, error, unsaveHostel, clearAll, savedCount } =
    useSavedHostels({
      sortBy,
      search: searchQuery,
      limit: 12,
      autoFetch: isAuthenticated && ["STUDENT", "GUEST"].includes(user?.role || ""),
    });

  useEffect(() => {
    const allowedRoles = ["STUDENT", "GUEST"];

    if (
      !authLoading &&
      (!isAuthenticated || !allowedRoles.includes(user?.role || ""))
    ) {
      router.push("/login?redirect=/saved");
    }
  }, [isAuthenticated, user, authLoading, router]);

  useEffect(() => {
    if (!showSortDropdown) return;
    const handler = () => setShowSortDropdown(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showSortDropdown]);

  const handleRemove = async (hostelId: string) => {
    const success = await unsaveHostel(hostelId);
    if (success) {
      setHostelToRemove(null);
    }
  };

  const handleClearAll = async () => {
    await clearAll();
    setIsClearAllModalOpen(false);
  };

  const stats = {
    total: savedCount,
    verified: savedHostels.length,
    nearCampus: savedHostels.filter(
      (item) =>
        item.hostel.distanceToCampus && item.hostel.distanceToCampus <= 0.5,
    ).length,
    avgPrice:
      savedHostels.length > 0
        ? Math.round(
            savedHostels.reduce(
              (sum, item) => sum + item.hostel.priceRange.min,
              0,
            ) / savedHostels.length,
          )
        : 0,
  };

  const currentSortLabel =
    sortOptions.find((o) => o.value === sortBy)?.label || "Recently Added";

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative bg-linear-to-br from-slate-900 via-primary-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[3rem_3rem]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/20 rounded-full blur-[80px]" />

        <div className="relative container-custom py-10 sm:py-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs text-slate-300 mb-4">
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                  {stats.total} saved hostel{stats.total !== 1 && "s"}
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  Saved{" "}
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-rose-400 to-primary-400">
                    Hostels
                  </span>
                </h1>
                <p className="text-slate-400">
                  Your curated list of favorite accommodations
                </p>
              </div>
              {savedHostels.length > 0 && (
                <button
                  onClick={() => setIsClearAllModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors border border-white/10 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-500/20 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {stats.total}
                    </p>
                    <p className="text-xs text-slate-400">Saved</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {stats.verified}
                    </p>
                    <p className="text-xs text-slate-400">Verified</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {stats.nearCampus}
                    </p>
                    <p className="text-xs text-slate-400">Near Campus</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      GHS {stats.avgPrice.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">Avg. Price</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {savedHostels.length > 0 && (
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
                  placeholder="Search saved hostels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/90 backdrop-blur-sm rounded-xl border-0 focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800 placeholder:text-slate-400 transition-all text-sm"
                />
              </div>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSortDropdown(!showSortDropdown);
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-white/90 backdrop-blur-sm rounded-xl text-sm font-medium text-slate-700 hover:bg-white transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">{currentSortLabel}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {showSortDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-30 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value);
                            setShowSortDropdown(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between",
                            sortBy === option.value
                              ? "bg-primary-50 text-primary-600 font-semibold"
                              : "text-slate-700 hover:bg-slate-50",
                          )}
                        >
                          {option.label}
                          {sortBy === option.value && (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0">
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-6"
          >
            <span className="text-sm text-slate-500">Searching for:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
              &quot;{searchQuery}&quot;
              <button
                onClick={() => setSearchQuery("")}
                className="ml-1 hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
            <span className="text-sm text-slate-400">
              ({savedHostels.length} result{savedHostels.length !== 1 && "s"})
            </span>
          </motion.div>
        )}

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <HostelCardSkeleton key={i} />
            ))}
          </div>
        ) : savedHostels.length === 0 ? (
          <EmptyState type="no-saved" />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-slate-600">
                Showing{" "}
                <span className="font-semibold">{savedHostels.length}</span>{" "}
                hostel
                {savedHostels.length !== 1 && "s"}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedHostels.map((item, index) => (
                <SavedHostelCard
                  key={item.hostel.id}
                  savedItem={item}
                  index={index}
                  onRemove={setHostelToRemove}
                />
              ))}
            </div>
          </>
        )}

        {!isLoading && savedHostels.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 p-6 sm:p-8 bg-linear-to-r from-primary-600 to-primary-700 rounded-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Discover More Hostels
                </h3>
                <p className="text-primary-100">
                  Browse our full collection of verified student hostels near
                  CUG
                </p>
              </div>
              <Link
                href="/hostels"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 rounded-xl font-semibold hover:bg-primary-50 transition-colors shadow-lg shrink-0"
              >
                Browse All Hostels
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {hostelToRemove && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setHostelToRemove(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                      <BookmarkX className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Remove from Saved
                      </h3>
                      <p className="text-sm text-slate-500">
                        This action can be undone
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setHostelToRemove(null)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <p className="text-sm text-slate-600 mb-6">
                  Are you sure you want to remove this hostel from your saved
                  list? You can always save it again later.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setHostelToRemove(null)}
                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRemove(hostelToRemove)}
                    className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl font-semibold text-sm hover:bg-rose-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isClearAllModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setIsClearAllModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Clear All Saved
                      </h3>
                      <p className="text-sm text-slate-500">
                        This cannot be undone
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsClearAllModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-red-800">
                    You are about to remove{" "}
                    <span className="font-bold">{savedHostels.length}</span>{" "}
                    hostel
                    {savedHostels.length !== 1 && "s"} from your saved list.
                    This action cannot be undone.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsClearAllModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
