"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  MapPin,
  BadgeCheck,
  Users,
  ImageIcon,
  Wifi,
  Car,
  Zap,
  Droplets,
  Shield,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { usePublicHostels } from "@/hooks/usePublicHostels";
import type {
  PublicHostelListItem,
  OccupancyType,
} from "@/services/public.hostel.service";
import { SaveButton } from "../ui/SaveButton";

const OCCUPANCY_LABELS: Record<OccupancyType, string> = {
  IN_1: "Single",
  IN_2: "Double",
  IN_3: "Triple",
  IN_4: "Quad",
};

const facilityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-3 h-3" />,
  parking: <Car className="w-3 h-3" />,
  electricity: <Zap className="w-3 h-3" />,
  water: <Droplets className="w-3 h-3" />,
  security: <Shield className="w-3 h-3" />,
};

function FeaturedHostelCard({ hostel }: { hostel: PublicHostelListItem }) {
  const minPrice =
    hostel.priceRange?.min ||
    Math.min(...hostel.roomTypes.map((r) => Number(r.pricePerPerson)));
  const totalAvailable = hostel.roomTypes.reduce(
    (s, r) => s + r.availableRooms,
    0,
  );
  const primaryImage =
    hostel.images?.find((img) => img.isPrimary) || hostel.images?.[0];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300 overflow-hidden h-full flex flex-col"
    >
      <div className="relative h-44 sm:h-48 overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={hostel.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-white/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-black/5 to-transparent" />

        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          <span className="flex items-center gap-1 px-2 py-0.5 bg-white/95 backdrop-blur-sm rounded-full text-[10px] sm:text-xs font-semibold text-primary-700 shadow-sm">
            <BadgeCheck className="w-3 h-3 text-primary-600" />
            Verified
          </span>
          {totalAvailable <= 3 && totalAvailable > 0 && (
            <span className="px-2 py-0.5 bg-orange-500 text-white rounded-full text-[10px] sm:text-xs font-semibold">
              {totalAvailable} left
            </span>
          )}
        </div>

        <SaveButton
          hostelId={hostel.id}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100"
        />

        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1">
            <p className="text-white/70 text-[10px]">From</p>
            <p className="text-white font-bold text-sm sm:text-base leading-none">
              GHS {minPrice.toLocaleString()}
              <span className="text-white/60 text-[10px] font-normal">
                /{hostel.pricingPeriod === "PER_SEMESTER" ? "sem" : "year"}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-1 bg-emerald-500 rounded-lg px-2 py-1 shadow-lg">
            <Users className="w-3 h-3 text-white" />
            <span className="text-white font-bold text-xs sm:text-sm">
              {totalAvailable}
            </span>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        <div className="mb-2">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-1 group-hover:text-primary-600 transition-colors line-clamp-1">
            {hostel.name}
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-primary-500 shrink-0" />
            <span className="truncate">{hostel.address}</span>
            {hostel.distanceToCampus && (
              <span className="ml-auto text-primary-600 font-semibold whitespace-nowrap">
                {hostel.distanceToCampus}km
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {hostel.facilities.slice(0, 3).map((f) => (
            <span
              key={f.id}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-[10px] text-slate-500"
            >
              {facilityIcons[f.name.toLowerCase()] || (
                <Shield className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">{f.name}</span>
            </span>
          ))}
          {hostel.facilities.length > 3 && (
            <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-[10px] text-slate-400">
              +{hostel.facilities.length - 3}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {hostel.roomTypes.slice(0, 2).map((rt) => (
            <span
              key={rt.id}
              className="px-1.5 py-0.5 bg-primary-50 text-primary-700 text-[10px] rounded font-medium"
            >
              {OCCUPANCY_LABELS[rt.occupancyType]}
            </span>
          ))}
          {hostel.roomTypes.length > 2 && (
            <span className="px-1.5 py-0.5 bg-slate-50 text-slate-500 text-[10px] rounded">
              +{hostel.roomTypes.length - 2}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
          <p className="text-[10px] sm:text-xs text-slate-400">
            {hostel.totalRooms} rooms
          </p>
          <Link href={`/hostels/${hostel.id}`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-[10px] sm:text-xs font-semibold hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all"
            >
              View
              <ArrowRight className="w-3 h-3" />
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="h-44 sm:h-48 bg-slate-200" />
      <div className="p-3 sm:p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-5 w-12 bg-slate-100 rounded" />
          ))}
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <div className="h-3 w-16 bg-slate-100 rounded" />
          <div className="h-7 w-16 bg-slate-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
        <AlertCircle className="w-7 h-7 text-red-500" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">
        Failed to load hostels
      </h3>
      <p className="text-slate-500 text-sm max-w-sm mb-4">
        We couldn&apos;t fetch the featured hostels. Please try again.
      </p>
      <button
        onClick={onRetry}
        className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <ImageIcon className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">
        No hostels available yet
      </h3>
      <p className="text-slate-500 text-sm max-w-sm">
        Check back soon for new listings!
      </p>
    </div>
  );
}

export function FeaturedHostelsSection() {
  const { hostels, isLoading, error, refetch } = usePublicHostels({
    page: 1,
    limit: 4,
    sortBy: "newest",
  });

  return (
    <section className="relative py-16 sm:py-20 lg:py-28 bg-slate-50 overflow-hidden">
      <div className="absolute top-0 right-0 w-80 sm:w-120 h-80 sm:h-120 bg-primary-500/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-60 sm:w-100 h-60 sm:h-100 bg-secondary-500/5 rounded-full blur-[80px]" />

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6 mb-8 sm:mb-12"
        >
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-liinear-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-full mb-3 sm:mb-4"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
              <span className="text-xs sm:text-sm font-semibold text-orange-700">
                Trending This Week
              </span>
            </motion.div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-900 mb-2 sm:mb-3">
              Most Popular{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-600 via-secondary-600 to-accent-600">
                Student Hostels
              </span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl">
              Discover the top-rated accommodations loved by CUG students for
              their quality, location, and value for money.
            </p>
          </div>

          <Link
            href="/hostels"
            className="hidden sm:inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:scale-105 group"
          >
            <span>Explore All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
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
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <FeaturedHostelCard hostel={hostel} />
              </motion.div>
            ))
          )}
        </div>

        {!isLoading && !error && hostels.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size:2rem_2rem" />
            <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-primary-500/10 rounded-full blur-[80px]" />

            <div className="relative z-10 text-center sm:text-left flex-1">
              <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white/10 border border-white/10 rounded-full mb-3 sm:mb-4">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <span className="text-[10px] sm:text-xs font-medium text-white">
                  50+ verified hostels available
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                Can&apos;t Find What You&apos;re Looking For?
              </h3>
              <p className="text-slate-400 text-sm sm:text-base">
                Browse our complete collection of verified hostels near CUG
                campus
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Link
                href="/hostels"
                className="inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-3 sm:py-4 bg-white text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl group"
              >
                <span>View All Hostels</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/hostels?filter=verified"
                className="inline-flex items-center justify-center gap-2 px-5 sm:px-8 py-3 sm:py-4 bg-white/10 border border-white/20 text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-all backdrop-blur-sm"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Verified Only</span>
              </Link>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-6 sm:hidden"
        >
          <Link
            href="/hostels"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors shadow-lg"
          >
            <span>View All Hostels</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
