/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Shield,
  Wifi,
  Users,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Building2,
  BadgeCheck,
  Heart,
  ChevronRight,
  Play,
  ImageIcon,
  Droplets,
  Car,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePublicHostels } from "@/hooks/usePublicHostels";
import type { PublicHostelListItem } from "@/services/public.hostel.service";
import { SaveButton } from "../ui/SaveButton";

const stats = [
  {
    label: "Verified Hostels",
    value: "50+",
    icon: Shield,
    color: "text-emerald-400",
  },
  {
    label: "Happy Students",
    value: "500+",
    icon: Users,
    color: "text-blue-400",
  },
  { label: "Avg. Response", value: "2hrs", icon: Zap, color: "text-amber-400" },
];

const quickFilters = [
  { label: "All Hostels", value: "", href: "/hostels" },
  { label: "Near Campus", value: "near", href: "/hostels?maxDistance=1" },
  { label: "Single Room", value: "IN_1", href: "/hostels?occupancyType=IN_1" },
  { label: "Shared Room", value: "IN_2", href: "/hostels?occupancyType=IN_2" },
  { label: "WiFi Included", value: "wifi", href: "/hostels?facilities=wifi" },
  { label: "Under GHS 800", value: "budget", href: "/hostels?maxPrice=800" },
];

const facilityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-4 h-4 text-slate-400" />,
  parking: <Car className="w-4 h-4 text-slate-400" />,
  electricity: <Zap className="w-4 h-4 text-slate-400" />,
  water: <Droplets className="w-4 h-4 text-slate-400" />,
  security: <Shield className="w-4 h-4 text-slate-400" />,
};

function FeaturedHostelCard({ hostel }: { hostel: PublicHostelListItem }) {
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

  const displayFacilities = hostel.facilities.slice(0, 3);

  return (
    <Link href={`/hostels/${hostel.id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300 overflow-hidden h-full"
      >
        <div className="relative h-48 overflow-hidden">
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
          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />

          <div className="absolute top-3 left-3 flex gap-2">
            <span className="flex items-center gap-1 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-primary-700 shadow-sm">
              <BadgeCheck className="w-3.5 h-3.5 text-primary-600" />
              Verified
            </span>
            {totalAvailable <= 5 && totalAvailable > 0 && (
              <span className="px-2.5 py-1 bg-orange-500 text-white rounded-full text-xs font-semibold">
                {totalAvailable} left
              </span>
            )}
          </div>

          <SaveButton
            hostelId={hostel.id}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100"
          />

          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2">
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
          <h3 className="font-bold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-1">
            {hostel.name}
          </h3>
          <p className="text-sm text-slate-500 flex items-center gap-1 mb-3">
            <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
            <span className="truncate">{hostel.address}</span>
            {hostel.distanceToCampus && (
              <span className="ml-auto text-primary-600 font-semibold whitespace-nowrap">
                {hostel.distanceToCampus}km
              </span>
            )}
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {displayFacilities.map((f) => (
                <span key={f.id} title={f.name}>
                  {facilityIcons[f.name.toLowerCase()] || (
                    <Shield className="w-4 h-4 text-slate-400" />
                  )}
                </span>
              ))}
              {hostel.facilities.length > 3 && (
                <span className="text-xs text-slate-400">
                  +{hostel.facilities.length - 3}
                </span>
              )}
            </div>
            <span className="text-sm text-primary-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              View Details
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="h-48 bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-100 rounded w-1/2" />
        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-4 h-4 bg-slate-100 rounded" />
            ))}
          </div>
          <div className="h-4 w-20 bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-slate-100">
      <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6 text-red-500" />
      </div>
      <h3 className="font-bold text-slate-800 mb-1">Failed to load hostels</h3>
      <p className="text-slate-500 text-sm mb-4">Please try again</p>
      <button
        onClick={onRetry}
        className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold text-sm hover:bg-primary-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-slate-100">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
        <Building2 className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="font-bold text-slate-800 mb-1">No hostels available</h3>
      <p className="text-slate-500 text-sm">
        Check back soon for new listings!
      </p>
    </div>
  );
}

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  const { hostels, isLoading, error, refetch } = usePublicHostels({
    page: 1,
    limit: 3,
    sortBy: "newest",
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/hostels?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/hostels");
    }
  };

  const handleFilterClick = (filter: (typeof quickFilters)[0]) => {
    setActiveFilter(filter.value);
    router.push(filter.href);
  };

  return (
    <section className="relative min-h-screen bg-slate-50 overflow-hidden">
      <div className="relative bg-linear-to-br from-slate-900 via-primary-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size:3rem_3rem" />
        <div className="absolute top-0 right-0 w-96 sm:w-40rem h-96 sm:h-40rem bg-primary-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-64 sm:w-30rem h-64 sm:h-30rem bg-secondary-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-50rem h-80 sm:h-50rem bg-accent-500/10 rounded-full blur-[150px]" />

        <div className="relative container-custom pt-10 sm:pt-12 pb-24 sm:pb-32 lg:pt-20 lg:pb-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 sm:mb-10"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full mb-4 sm:mb-6"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span className="text-xs sm:text-sm font-medium text-white">
                Trusted by 500+ CUG Students
              </span>
              <div className="hidden sm:flex -space-x-2 ml-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-linear-to-br from-primary-400 to-secondary-500 border-2 border-slate-900"
                  />
                ))}
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-4 sm:mb-6"
            >
              Find Your Perfect
              <br />
              <span className="relative inline-block mt-1 sm:mt-2">
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-400 via-secondary-400 to-accent-400">
                  Student Hostel
                </span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-1 sm:h-1.5 bg-linear-to-r from-primary-500 via-secondary-500 to-accent-500 rounded-full origin-left"
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto mb-6 sm:mb-8 px-4"
            >
              Discover verified hostels near Catholic University of Ghana.
              <br className="hidden sm:block" />
              Book securely, pay with MoMo, move in stress-free.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8 sm:mb-10"
            >
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <stat.icon
                      className={cn("w-4 h-4 sm:w-5 sm:h-5", stat.color)}
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-lg sm:text-xl font-bold text-white">
                      {stat.value}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-400">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="max-w-3xl mx-auto px-4 sm:px-0"
          >
            <div className="flex gap-2 p-1.5 sm:p-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl sm:rounded-2xl shadow-2xl">
              <div className="flex-1 relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by hostel name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white/95 backdrop-blur-sm rounded-lg sm:rounded-xl border-0 focus:ring-2 focus:ring-primary-500 focus:bg-white text-slate-800 placeholder:text-slate-400 transition-all text-sm sm:text-base"
                />
              </div>
              <button
                onClick={handleSearch}
                className="shrink-0 cursor-pointer px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-linear-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all shadow-lg shadow-primary-500/30 flex items-center gap-2"
              >
                <span className="hidden sm:inline">Search</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-5">
              {quickFilters.map((filter) => (
                <Link
                  key={filter.value}
                  href={filter.href}
                  onClick={() => setActiveFilter(filter.value)}
                  className={cn(
                    "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all",
                    activeFilter === filter.value
                      ? "bg-white text-slate-900"
                      : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/10",
                  )}
                >
                  {filter.label}
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            className="w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0 60L1440 60L1440 30C1200 0 960 10 720 20C480 30 240 40 0 20Z"
              fill="#f8fafc"
            />
          </svg>
        </div>
      </div>

      <div className="container-custom pt-6 sm:pt-8 pb-12 sm:pb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                Featured Hostels
              </h2>
              <p className="text-slate-500 text-sm sm:text-base mt-0.5 sm:mt-1">
                Hand-picked accommodations for CUG students
              </p>
            </div>
            <Link
              href="/hostels"
              className="hidden sm:flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {isLoading ? (
              [...Array(3)].map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <CardSkeleton />
                </motion.div>
              ))
            ) : error ? (
              <ErrorState onRetry={refetch} />
            ) : hostels.length === 0 ? (
              <EmptyState />
            ) : (
              hostels.map((hostel, index) => (
                <motion.div
                  key={hostel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <FeaturedHostelCard hostel={hostel} />
                </motion.div>
              ))
            )}
          </div>

          <div className="mt-4 sm:mt-6 sm:hidden">
            <Link
              href="/hostels"
              className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              View All Hostels
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          <div className="sm:col-span-2 bg-linear-to-br from-primary-600 to-primary-700 rounded-xl sm:rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-20 sm:w-24 h-20 sm:h-24 bg-white/10 rounded-full blur-xl" />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="px-2.5 sm:px-3 py-1 bg-white/20 rounded-full text-[10px] sm:text-xs font-semibold">
                  For Managers
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-1.5 sm:mb-2">
                List Your Hostel
              </h3>
              <p className="text-primary-100 text-xs sm:text-sm mb-3 sm:mb-4">
                Reach thousands of students looking for accommodation near CUG.
                Easy setup, secure payments.
              </p>
              <Link
                href="/register?role=manager"
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-white text-primary-700 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold hover:bg-primary-50 transition-colors"
              >
                Get Started
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm sm:text-base">
                  100%
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  Verified
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              All hostels are physically inspected and verified by our team.
            </p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                <span className="text-base sm:text-lg font-bold text-amber-600">
                  ₵
                </span>
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm sm:text-base">
                  MoMo
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500">Payment</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              Pay securely with Mobile Money. Instant confirmation.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mt-8 sm:mt-12 bg-linear-to-r from-slate-900 to-slate-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size:2rem_2rem" />
          <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-primary-500/20 rounded-full blur-[80px]" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
            <div className="flex-1 text-center lg:text-left">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3">
                Ready to Find Your Home Away From Home?
              </h3>
              <p className="text-slate-400 text-sm sm:text-base max-w-xl">
                Join hundreds of CUG students who found their perfect hostel
                through HostelHub. Start your search today!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Link
                href="/hostels"
                className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-slate-900 rounded-xl font-semibold text-sm sm:text-base hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
              >
                Browse Hostels
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link
                href="/register"
                className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 border border-white/20 text-white rounded-xl font-semibold text-sm sm:text-base hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                Watch Demo
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
