/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Grid3X3,
  List,
  MapPin,
  Building2,
  SlidersHorizontal,
  X,
  ChevronDown,
  ArrowUpDown,
  Wifi,
  Zap,
  Car,
  Shield,
  Droplets,
  Heart,
  BadgeCheck,
  ArrowRight,
  SortAsc,
  Check,
  ImageIcon,
  Users,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/utils";
import { usePublicHostels } from "@/hooks/usePublicHostels";
import type {
  PublicHostelListItem,
  OccupancyType,
} from "@/services/public.hostel.service";
import { SaveButton } from "@/components/ui/SaveButton";

interface LocalFilters {
  search: string;
  minPrice?: number;
  maxPrice?: number;
  maxDistance?: number;
  facilities: string[];
  occupancyType?: OccupancyType;
  sortBy: "price_asc" | "price_desc" | "distance" | "newest";
}

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "distance", label: "Nearest to Campus" },
];

const ITEMS_PER_PAGE = 9;

const defaultFilters: LocalFilters = {
  search: "",
  minPrice: undefined,
  maxPrice: undefined,
  maxDistance: undefined,
  facilities: [],
  occupancyType: undefined,
  sortBy: "newest",
};

const facilityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-3.5 h-3.5" />,
  parking: <Car className="w-3.5 h-3.5" />,
  electricity: <Zap className="w-3.5 h-3.5" />,
  water: <Droplets className="w-3.5 h-3.5" />,
  security: <Shield className="w-3.5 h-3.5" />,
};

const OCCUPANCY_LABELS: Record<OccupancyType, string> = {
  IN_1: "Single",
  IN_2: "Double",
  IN_3: "Triple",
  IN_4: "Quad",
};

function getOccupancyNumber(type: OccupancyType): number {
  const map: Record<OccupancyType, number> = {
    IN_1: 1,
    IN_2: 2,
    IN_3: 3,
    IN_4: 4,
  };
  return map[type];
}

function HostelCard({
  hostel,
  variant = "grid",
}: {
  hostel: PublicHostelListItem;
  variant?: "grid" | "list";
}) {
  const [saved, setSaved] = useState(false);

  const minPrice =
    hostel.priceRange?.min ||
    Math.min(...hostel.roomTypes.map((r) => Number(r.pricePerPerson)));
  const totalAvailable = hostel.roomTypes.reduce(
    (s, r) => s + r.availableRooms,
    0,
  );
  const primaryImage =
    hostel.images?.find((img) => img.isPrimary) || hostel.images?.[0];

  if (variant === "list") {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-slate-200 transition-all duration-300 overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row">
          <div className="relative sm:w-64 lg:w-72 shrink-0 h-52 sm:h-auto overflow-hidden">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={hostel.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-white/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent" />

            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              <span className="flex items-center gap-1 px-2 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-primary-700 shadow-sm">
                <BadgeCheck className="w-3.5 h-3.5 text-primary-600" />
                Verified
              </span>
              {totalAvailable <= 3 && totalAvailable > 0 && (
                <span className="px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-semibold">
                  Only {totalAvailable} left!
                </span>
              )}
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                setSaved((v) => !v);
              }}
              className="absolute cursor-pointer top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors"
            >
              <SaveButton
                hostelId={hostel.id}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100"
              />
            </button>
          </div>

          <div className="flex-1 p-5 flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">
                  {hostel.name}
                </h3>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary-500" />
                  {hostel.address}
                  {hostel.distanceToCampus && (
                    <>
                      {" "}
                      •{" "}
                      <span className="text-primary-600 font-medium">
                        {hostel.distanceToCampus}km from campus
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">
              {hostel.description}
            </p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {hostel.facilities.slice(0, 5).map((f) => (
                <span
                  key={f.id}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 font-medium"
                >
                  {facilityIcons[f.name.toLowerCase()] || (
                    <Shield className="w-3.5 h-3.5" />
                  )}
                  {f.name}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {hostel.roomTypes.slice(0, 3).map((rt) => (
                <span
                  key={rt.id}
                  className="px-2 py-1 bg-primary-50 border border-primary-200 text-primary-700 text-xs font-medium rounded-lg"
                >
                  {OCCUPANCY_LABELS[rt.occupancyType]} - GHS{" "}
                  {Number(rt.pricePerPerson).toLocaleString()}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Starting from</p>
                <p className="text-2xl font-bold text-slate-900">
                  GHS {minPrice.toLocaleString()}
                  <span className="text-sm font-normal text-slate-400">
                    /{hostel.pricingPeriod === "PER_SEMESTER" ? "sem" : "year"}
                  </span>
                </p>
              </div>
              <Link href={`/hostels/${hostel.id}`}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm shadow-primary-500/25"
                >
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300 overflow-hidden"
    >
      <div className="relative h-52 overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={hostel.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-white/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-black/5 to-transparent" />

        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="flex items-center gap-1 px-2 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-primary-700 shadow-sm">
            <BadgeCheck className="w-3 h-3 text-primary-600" />
            Verified
          </span>
          {totalAvailable <= 3 && totalAvailable > 0 && (
            <span className="px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-semibold">
              {totalAvailable} left
            </span>
          )}
        </div>

        <SaveButton
          hostelId={hostel.id}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100"
        />

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div className="bg-black/50 backdrop-blur-sm rounded-xl px-3 py-1.5">
            <p className="text-white/70 text-xs">From</p>
            <p className="text-white font-bold text-lg leading-none">
              GHS {minPrice.toLocaleString()}
              <span className="text-white/60 text-xs font-normal">
                /{hostel.pricingPeriod === "PER_SEMESTER" ? "sem" : "year"}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-1 bg-emerald-500 rounded-xl px-2.5 py-1.5 shadow-lg">
            <Users className="w-3.5 h-3.5 text-white" />
            <span className="text-white font-bold text-sm">
              {totalAvailable}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-bold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors">
            {hostel.name}
          </h3>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-primary-500 shrink-0" />
            {hostel.address}
            {hostel.distanceToCampus && (
              <span className="ml-auto text-primary-600 font-semibold whitespace-nowrap">
                {hostel.distanceToCampus}km away
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {hostel.facilities.slice(0, 4).map((f) => (
            <span
              key={f.id}
              className="flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-500"
            >
              {facilityIcons[f.name.toLowerCase()] || (
                <Shield className="w-3.5 h-3.5" />
              )}
              {f.name}
            </span>
          ))}
          {hostel.facilities.length > 4 && (
            <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-400">
              +{hostel.facilities.length - 4}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {hostel.roomTypes.slice(0, 2).map((rt) => (
            <span
              key={rt.id}
              className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-md font-medium"
            >
              {OCCUPANCY_LABELS[rt.occupancyType]}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {hostel.totalRooms} rooms total
          </p>
          <Link href={`/hostels/${hostel.id}`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-50 text-primary-700 border border-primary-200 rounded-xl text-xs font-semibold hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all"
            >
              View Details
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-6">
        <Building2 className="w-10 h-10 text-slate-300" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">
        No hostels found
      </h3>
      <p className="text-slate-500 max-w-sm mb-6 leading-relaxed">
        We couldn&apos;t find hostels matching your criteria. Try adjusting your
        filters or search terms.
      </p>
      <button
        onClick={onClear}
        className="flex cursor-pointer items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
      >
        <X className="w-4 h-4" />
        Clear All Filters
      </button>
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
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">
        Something went wrong
      </h3>
      <p className="text-slate-500 max-w-sm mb-6 leading-relaxed">{error}</p>
      <button
        onClick={onRetry}
        className="flex cursor-pointer items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}

function CardSkeleton({ variant }: { variant: "grid" | "list" }) {
  if (variant === "list") {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
        <div className="flex">
          <div className="w-72 h-48 bg-slate-200 shrink-0" />
          <div className="flex-1 p-5 space-y-3">
            <div className="h-5 bg-slate-200 rounded-lg w-3/4" />
            <div className="h-4 bg-slate-200 rounded-lg w-1/2" />
            <div className="h-3 bg-slate-100 rounded-lg w-full" />
            <div className="h-3 bg-slate-100 rounded-lg w-5/6" />
            <div className="flex gap-2 mt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 w-16 bg-slate-100 rounded-lg" />
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <div className="h-7 w-28 bg-slate-200 rounded-lg" />
              <div className="h-9 w-28 bg-slate-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="h-52 bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
        <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 w-16 bg-slate-100 rounded-lg" />
          ))}
        </div>
        <div className="flex justify-between items-center pt-2">
          <div className="h-3 w-20 bg-slate-100 rounded" />
          <div className="h-8 w-24 bg-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function HostelsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<LocalFilters>(defaultFilters);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileSort, setShowMobileSort] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
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

  const { hostels, pagination, isLoading, error, refetch } = usePublicHostels({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    search: debouncedSearch || undefined,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    maxDistance: filters.maxDistance,
    facilities: filters.facilities.length > 0 ? filters.facilities : undefined,
    occupancyType: filters.occupancyType,
    sortBy: filters.sortBy,
  });

  useEffect(() => {
    if (!showMobileSort) return;
    const h = () => setShowMobileSort(false);
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, [showMobileSort]);

  useEffect(() => {
    document.body.style.overflow = showMobileFilters ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileFilters]);

  const updateFilters = useCallback(
    (updater: LocalFilters | ((prev: LocalFilters) => LocalFilters)) => {
      setFilters(updater);
      setCurrentPage(1);
    },
    [],
  );

  const handleSearch = useCallback(() => {
    setDebouncedSearch(searchQuery);
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSortChange = useCallback(
    (value: string) => {
      updateFilters((prev) => ({
        ...prev,
        sortBy: value as LocalFilters["sortBy"],
      }));
    },
    [updateFilters],
  );

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setDebouncedSearch("");
    updateFilters(defaultFilters);
  }, [updateFilters]);

  const removeDistanceFilter = useCallback(() => {
    updateFilters((prev) => ({ ...prev, maxDistance: undefined }));
  }, [updateFilters]);

  const removeOccupancyFilter = useCallback(() => {
    updateFilters((prev) => ({ ...prev, occupancyType: undefined }));
  }, [updateFilters]);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filters.minPrice !== undefined) c++;
    if (filters.maxPrice !== undefined) c++;
    if (filters.maxDistance !== undefined) c++;
    if (filters.occupancyType) c++;
    if (filters.facilities?.length) c += filters.facilities.length;
    return c;
  }, [filters]);

  const currentSortLabel =
    sortOptions.find((o) => o.value === filters.sortBy)?.label ?? "Sort";

  const totalPages = pagination?.totalPages || 1;
  const totalResults = pagination?.totalItems || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative bg-linear-to-br from-slate-900 via-primary-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[3rem_3rem]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500/20 rounded-full blur-[80px]" />

        <div className="relative container-custom py-10 sm:py-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs text-slate-300 mb-4">
              <Building2 className="w-3.5 h-3.5 text-primary-400" />
              {isLoading ? "Loading..." : `${totalResults} verified hostels`}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
              Find Your{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-400 to-secondary-400">
                Perfect Hostel
              </span>
            </h1>
            <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
              Browse verified, affordable student accommodation near your
              campus.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="flex gap-2 p-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl shadow-2xl">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or location..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/90 backdrop-blur-sm rounded-xl border-0 focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800 placeholder:text-slate-400 transition-all text-sm"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="shrink-0 cursor-pointer px-5 sm:px-7 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-primary-500/30 flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 sm:hidden" />
                )}
                <span className="hidden sm:inline">Search</span>
              </button>
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

      <div className="container-custom pt-6 pb-12">
        <div className="flex items-center gap-2 mb-4 lg:hidden">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="flex cursor-pointer items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-primary-300 hover:text-primary-600 transition-colors shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 bg-primary-600 text-white text-xs rounded-full font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMobileSort((v) => !v);
              }}
              className="flex cursor-pointer items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-primary-300 transition-colors shadow-sm"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span className="max-w-22.5 truncate text-xs">
                {currentSortLabel}
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            <AnimatePresence>
              {showMobileSort && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl z-30 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        handleSortChange(option.value);
                        setShowMobileSort(false);
                      }}
                      className={cn(
                        "w-full cursor-pointer text-left px-4 py-3 text-sm transition-colors flex items-center justify-between",
                        filters.sortBy === option.value
                          ? "bg-primary-50 text-primary-600 font-semibold"
                          : "text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      {option.label}
                      {filters.sortBy === option.value && (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1" />

          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {(["grid", "list"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "p-1.5 rounded-lg cursor-pointer transition-colors",
                  viewMode === mode
                    ? "bg-primary-100 text-primary-600"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                {mode === "grid" ? (
                  <Grid3X3 className="w-4 h-4" />
                ) : (
                  <List className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>
        </div>

        {(filters.maxDistance || filters.occupancyType) && (
          <div className="flex flex-wrap gap-2 mb-4 lg:hidden">
            {filters.maxDistance && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-full text-xs font-semibold">
                <MapPin className="w-3 h-3" />
                Within {filters.maxDistance}km
                <button
                  onClick={removeDistanceFilter}
                  className="ml-0.5 cursor-pointer hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.occupancyType && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-full text-xs font-semibold capitalize">
                {OCCUPANCY_LABELS[filters.occupancyType]} room
                <button
                  onClick={removeOccupancyFilter}
                  className="ml-0.5 cursor-pointer hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        <div className="flex gap-6">
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <HostelFiltersComponent
                filters={filters}
                onFiltersChange={updateFilters}
                totalResults={totalResults}
                isLoading={isLoading}
              />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="hidden lg:flex items-center justify-between mb-6 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-600">
                  {isLoading ? (
                    <span className="animate-pulse">Loading hostels…</span>
                  ) : (
                    <>
                      <span className="font-bold text-slate-900">
                        {totalResults}
                      </span>{" "}
                      hostels found
                    </>
                  )}
                </p>

                {filters.maxDistance && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 border border-primary-200 rounded-full text-xs font-semibold">
                    <MapPin className="w-3 h-3" />≤ {filters.maxDistance}km
                    <button
                      onClick={removeDistanceFilter}
                      className="ml-0.5 cursor-pointer hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.occupancyType && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 border border-primary-200 rounded-full text-xs font-semibold capitalize">
                    {OCCUPANCY_LABELS[filters.occupancyType]} room
                    <button
                      onClick={removeOccupancyFilter}
                      className="ml-0.5 cursor-pointer hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <SortAsc className="w-4 h-4 text-slate-400" />
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="text-sm text-slate-700 bg-transparent border-0 focus:ring-0 cursor-pointer font-medium pr-6"
                  >
                    {sortOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-px h-5 bg-slate-200" />

                <div className="flex items-center bg-slate-100 rounded-xl p-1">
                  {(["grid", "list"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        viewMode === mode
                          ? "bg-white cursor-pointer text-primary-600 shadow-sm"
                          : "text-slate-400 hover:text-slate-600",
                      )}
                    >
                      {mode === "grid" ? (
                        <Grid3X3 className="w-4 h-4" />
                      ) : (
                        <List className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-3 lg:hidden">
              {isLoading ? (
                "Loading…"
              ) : (
                <>
                  <span className="font-bold text-slate-800">
                    {totalResults}
                  </span>{" "}
                  hostels found
                </>
              )}
            </p>

            {isLoading && (
              <div
                className={cn(
                  "grid gap-4 sm:gap-5",
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1",
                )}
              >
                {[...Array(6)].map((_, i) => (
                  <CardSkeleton key={i} variant={viewMode} />
                ))}
              </div>
            )}

            {!isLoading && error && (
              <ErrorState error={error} onRetry={refetch} />
            )}

            {!isLoading && !error && hostels.length === 0 && (
              <EmptyResults onClear={clearFilters} />
            )}

            {!isLoading && !error && hostels.length > 0 && (
              <>
                <div
                  className={cn(
                    "grid gap-4 sm:gap-5",
                    viewMode === "grid"
                      ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                      : "grid-cols-1",
                  )}
                >
                  {hostels.map((hostel, i) => (
                    <motion.div
                      key={hostel.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.06 }}
                    >
                      <HostelCard hostel={hostel} variant={viewMode} />
                    </motion.div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={(page) => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
              onClick={() => setShowMobileFilters(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-[85vw] max-w-sm bg-white z-50 lg:hidden flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-primary-600" />
                  <span className="font-bold text-slate-900">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 bg-primary-600 text-white text-xs rounded-full font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 cursor-pointer rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <HostelFiltersComponent
                  filters={filters}
                  onFiltersChange={updateFilters}
                  totalResults={totalResults}
                  isLoading={isLoading}
                />
              </div>

              <div className="shrink-0 p-4 border-t border-slate-100 grid grid-cols-2 gap-3 bg-white">
                <button
                  onClick={() => {
                    clearFilters();
                    setShowMobileFilters(false);
                  }}
                  className="py-3 px-4 cursor-pointer border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="py-3 px-4 cursor-pointer bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
                >
                  Show {totalResults} Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function HostelFiltersComponent({
  filters,
  onFiltersChange,
  totalResults,
  isLoading,
}: {
  filters: LocalFilters;
  onFiltersChange: (filters: LocalFilters) => void;
  totalResults: number;
  isLoading: boolean;
}) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "price",
    "distance",
    "facilities",
    "roomType",
  ]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const facilityOptions = [
    { id: "wifi", label: "WiFi", icon: Wifi },
    { id: "parking", label: "Parking", icon: Car },
    { id: "electricity", label: "24/7 Power", icon: Zap },
    { id: "water", label: "Water Supply", icon: Droplets },
    { id: "security", label: "Security", icon: Shield },
  ];

  const distanceOptions: { value: number | undefined; label: string }[] = [
    { value: undefined, label: "Any Distance" },
    { value: 0.5, label: "Within 500m" },
    { value: 1, label: "Within 1km" },
    { value: 2, label: "Within 2km" },
    { value: 5, label: "Within 5km" },
  ];

  const occupancyOptions: {
    value: OccupancyType | undefined;
    label: string;
  }[] = [
    { value: undefined, label: "All Room Types" },
    { value: "IN_1", label: "Single Room (1 person)" },
    { value: "IN_2", label: "Double Room (2 people)" },
    { value: "IN_3", label: "Triple Room (3 people)" },
    { value: "IN_4", label: "Quad Room (4 people)" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-slate-800">Filters</h3>
        <span className="text-xs text-slate-500">
          {isLoading ? "..." : `${totalResults} results`}
        </span>
      </div>

      <div className="space-y-6">
        <div>
          <button
            onClick={() => toggleSection("price")}
            className="flex cursor-pointer items-center justify-between w-full text-left"
          >
            <span className="font-medium text-slate-800">Price Range</span>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-slate-400 transition-transform",
                expandedSections.includes("price") && "rotate-180",
              )}
            />
          </button>
          {expandedSections.includes("price") && (
            <div className="pt-4 space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">
                    Min
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice || ""}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        minPrice: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">
                    Max
                  </label>
                  <input
                    type="number"
                    placeholder="Any"
                    value={filters.maxPrice || ""}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        maxPrice: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {(filters.minPrice !== undefined ||
                filters.maxPrice !== undefined) && (
                <button
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      minPrice: undefined,
                      maxPrice: undefined,
                    })
                  }
                  className="text-sm cursor-pointer text-primary-600 hover:underline"
                >
                  Clear price filter
                </button>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 pt-6">
          <button
            onClick={() => toggleSection("distance")}
            className="flex cursor-pointer  items-center justify-between w-full text-left"
          >
            <span className="font-medium text-slate-800">
              Distance to Campus
            </span>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-slate-400 transition-transform",
                expandedSections.includes("distance") && "rotate-180",
              )}
            />
          </button>
          {expandedSections.includes("distance") && (
            <div className="pt-4 space-y-2">
              {distanceOptions.map((option) => (
                <label
                  key={option.value ?? "all"}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="distance"
                    checked={filters.maxDistance === option.value}
                    onChange={() =>
                      onFiltersChange({
                        ...filters,
                        maxDistance: option.value,
                      })
                    }
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                      filters.maxDistance === option.value
                        ? "border-primary-500 bg-primary-500"
                        : "border-slate-300 group-hover:border-slate-400",
                    )}
                  >
                    {filters.maxDistance === option.value && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm",
                      filters.maxDistance === option.value
                        ? "text-primary-600 font-medium"
                        : "text-slate-600",
                    )}
                  >
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 pt-6">
          <button
            onClick={() => toggleSection("roomType")}
            className="flex cursor-pointer items-center justify-between w-full text-left"
          >
            <span className="font-medium text-slate-800">Room Type</span>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-slate-400 transition-transform",
                expandedSections.includes("roomType") && "rotate-180",
              )}
            />
          </button>
          {expandedSections.includes("roomType") && (
            <div className="pt-4 space-y-2">
              {occupancyOptions.map((option) => (
                <label
                  key={option.value ?? "all"}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="occupancy"
                    checked={filters.occupancyType === option.value}
                    onChange={() =>
                      onFiltersChange({
                        ...filters,
                        occupancyType: option.value,
                      })
                    }
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                      filters.occupancyType === option.value
                        ? "border-primary-500 bg-primary-500"
                        : "border-slate-300 group-hover:border-slate-400",
                    )}
                  >
                    {filters.occupancyType === option.value && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm",
                      filters.occupancyType === option.value
                        ? "text-primary-600 font-medium"
                        : "text-slate-600",
                    )}
                  >
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 pt-6">
          <button
            onClick={() => toggleSection("facilities")}
            className="flex cursor-pointer items-center justify-between w-full text-left"
          >
            <span className="font-medium text-slate-800">Facilities</span>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-slate-400 transition-transform",
                expandedSections.includes("facilities") && "rotate-180",
              )}
            />
          </button>
          {expandedSections.includes("facilities") && (
            <div className="pt-4 space-y-3">
              {facilityOptions.map((facility) => {
                const isSelected = filters.facilities?.includes(facility.id);
                return (
                  <label
                    key={facility.id}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        const newFacilities = isSelected
                          ? filters.facilities?.filter(
                              (f) => f !== facility.id,
                            ) || []
                          : [...(filters.facilities || []), facility.id];
                        onFiltersChange({
                          ...filters,
                          facilities: newFacilities,
                        });
                      }}
                      className="sr-only"
                    />
                    <div
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        isSelected
                          ? "border-primary-500 bg-primary-500"
                          : "border-slate-300 group-hover:border-slate-400",
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <facility.icon
                      className={cn(
                        "w-4 h-4",
                        isSelected ? "text-primary-600" : "text-slate-500",
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm",
                        isSelected
                          ? "text-primary-600 font-medium"
                          : "text-slate-600",
                      )}
                    >
                      {facility.label}
                    </span>
                  </label>
                );
              })}

              {filters.facilities && filters.facilities.length > 0 && (
                <button
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      facilities: [],
                    })
                  }
                  className="text-sm cursor-pointer text-primary-600 hover:underline mt-2"
                >
                  Clear all facilities
                </button>
              )}
            </div>
          )}
        </div>

        {(filters.minPrice !== undefined ||
          filters.maxPrice !== undefined ||
          filters.maxDistance !== undefined ||
          filters.occupancyType !== undefined ||
          (filters.facilities && filters.facilities.length > 0)) && (
          <div className="border-t border-slate-100 pt-6">
            <button
              onClick={() =>
                onFiltersChange({
                  search: filters.search,
                  minPrice: undefined,
                  maxPrice: undefined,
                  maxDistance: undefined,
                  facilities: [],
                  occupancyType: undefined,
                  sortBy: filters.sortBy,
                })
              }
              className="w-full cursor-pointer flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-600 hover:text-primary-600 border border-slate-200 rounded-xl hover:border-primary-300 transition-colors"
            >
              <X className="w-4 h-4" />
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
