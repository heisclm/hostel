"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Shield,
  Heart,
  Share2,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Car,
  Zap,
  Droplets,
  Users,
  X,
  Calendar,
  Building2,
  BadgeCheck,
  ArrowRight,
  Camera,
  ImageIcon,
  AlertCircle,
  RefreshCw,
  LogIn,
  GraduationCap,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { usePublicHostelById } from "@/hooks/usePublicHostels";

import type {
  RoomType,
  OccupancyType,
  PricingPeriod,
} from "@/services/public.hostel.service";
import { useAuth } from "@/context/AuthContext";
import HostelReviews from "@/components/hostels/HostelReviews";

const facilityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-4 h-4" />,
  parking: <Car className="w-4 h-4" />,
  electricity: <Zap className="w-4 h-4" />,
  water: <Droplets className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
};

const OCCUPANCY_LABELS: Record<OccupancyType, string> = {
  IN_1: "Single Room",
  IN_2: "Double Room",
  IN_3: "Triple Room",
  IN_4: "Quad Room",
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

function getPricingLabel(period: PricingPeriod): string {
  return period === "PER_SEMESTER" ? "semester" : "year";
}

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative bg-linear-to-br from-slate-900 via-primary-900 to-slate-900">
        <div className="container-custom py-8">
          <div className="h-6 w-32 bg-white/10 rounded-lg animate-pulse mb-6" />
          <div className="h-10 w-72 bg-white/10 rounded-lg animate-pulse mb-3" />
          <div className="h-5 w-48 bg-white/10 rounded-lg animate-pulse" />
        </div>
        <div className="h-80 bg-slate-800 animate-pulse" />
      </div>
      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-40 bg-white rounded-2xl animate-pulse" />
            <div className="h-64 bg-white rounded-2xl animate-pulse" />
          </div>
          <div>
            <div className="h-80 bg-white rounded-2xl animate-pulse" />
          </div>
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
          <Building2 className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          Hostel not found
        </h3>
        <p className="text-slate-500 mb-6 max-w-sm">
          The hostel you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </p>
        <Link
          href="/hostels"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hostels
        </Link>
      </div>
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          Something went wrong
        </h3>
        <p className="text-slate-500 mb-6 max-w-sm">{error}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}

export default function HostelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { user, isAuthenticated } = useAuth();
  const { hostel, isLoading, error, refetch } = usePublicHostelById(id);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);

  const canBook = isAuthenticated && (user?.role === "STUDENT" || user?.role === "GUEST");
  const isManager = isAuthenticated && user?.role === "MANAGER";
  const isAdmin = isAuthenticated && user?.role === "ADMIN";

  const getUserTypeLabel = () => {
    if (!isAuthenticated) return null;
    switch (user?.role) {
      case "STUDENT":
        return "Student";
      case "GUEST":
        return "Guest";
      case "MANAGER":
        return "Manager";
      case "ADMIN":
        return "Admin";
      default:
        return user?.role;
    }
  };

  const nextImage = () => {
    if (!hostel || hostel.images.length === 0) return;
    setCurrentImageIndex((prev) =>
      prev === hostel.images.length - 1 ? 0 : prev + 1,
    );
  };

  const prevImage = () => {
    if (!hostel || hostel.images.length === 0) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? hostel.images.length - 1 : prev - 1,
    );
  };

  const handleBookRoom = (room: RoomType) => {
    if (!isAuthenticated) {
      setSelectedRoom(room);
      setIsLoginPromptOpen(true);
      return;
    }

    if (!canBook) {
      setSelectedRoom(room);
      setIsLoginPromptOpen(true);
      return;
    }

    setSelectedRoom(room);
    setIsBookingModalOpen(true);
  };

  const handleConfirmBooking = () => {
    if (!selectedRoom || !hostel) return;
    router.push(
      `/bookings/new?hostel=${hostel.id}&roomType=${selectedRoom.id}`,
    );
  };

  const handleLoginRedirect = () => {
    const returnUrl = encodeURIComponent(`/hostels/${id}`);
    router.push(`/login?returnUrl=${returnUrl}`);
  };

  if (isLoading) return <DetailSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!hostel) return <NotFound />;

  const totalAvailable = hostel.roomTypes.reduce(
    (s, r) => s + r.availableRooms,
    0,
  );
  const minPrice =
    hostel.roomTypes.length > 0
      ? Math.min(...hostel.roomTypes.map((r) => Number(r.pricePerPerson)))
      : 0;
  const primaryImage =
    hostel.images?.find((img) => img.isPrimary) || hostel.images?.[0];

  return (
    <div className="min-h-screen bg-slate-50">
     
      <div className="relative bg-linear-to-br from-slate-900 via-primary-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[3rem_3rem]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500/20 rounded-full blur-[80px]" />

        <div className="relative container-custom pt-6 pb-4">
          <Link
            href="/hostels"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs text-slate-300 hover:bg-white/20 transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Hostels
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs font-semibold text-white">
                <BadgeCheck className="w-3.5 h-3.5 text-primary-400" />
                Verified Hostel
              </span>
              {totalAvailable <= 5 && totalAvailable > 0 && (
                <span className="px-3 py-1.5 bg-orange-500 rounded-full text-xs font-semibold text-white">
                  Only {totalAvailable} rooms left!
                </span>
              )}
              {totalAvailable === 0 && (
                <span className="px-3 py-1.5 bg-red-500 rounded-full text-xs font-semibold text-white">
                  Fully Booked
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
              {hostel.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-300 text-sm">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary-400" />
                {hostel.address}
              </span>
              {hostel.distanceToCampus && (
                <span className="text-primary-400 font-semibold">
                  {hostel.distanceToCampus}km from campus
                </span>
              )}
            </div>
          </motion.div>
        </div>

        <div className="relative container-custom pb-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="grid grid-cols-4 gap-2 h-64 sm:h-80 lg:h-96">
              <div
                className="col-span-4 lg:col-span-2 lg:row-span-2 relative rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() =>
                  hostel.images.length > 0 && setIsLightboxOpen(true)
                }
              >
                {primaryImage ? (
                  <Image
                    src={primaryImage.url}
                    alt={hostel.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-white/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>

              {hostel.images.slice(1, 5).map((image, index) => (
                <div
                  key={image.id}
                  className={cn(
                    "hidden lg:block relative overflow-hidden cursor-pointer group",
                    index === 0 && "rounded-tr-2xl",
                    index === 3 && "rounded-br-2xl",
                  )}
                  onClick={() => {
                    setCurrentImageIndex(index + 1);
                    setIsLightboxOpen(true);
                  }}
                >
                  <Image
                    src={image.url}
                    alt={`${hostel.name} ${index + 2}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  {index === 3 && hostel.images.length > 5 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-semibold">
                        +{hostel.images.length - 5} more
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="absolute top-4 right-4 flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsLiked(!isLiked)}
                className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors"
              >
                <Heart
                  className={cn(
                    "w-5 h-5",
                    isLiked && "fill-red-500 text-red-500",
                  )}
                />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
            </div>

            {hostel.images.length > 0 && (
              <button
                onClick={() => setIsLightboxOpen(true)}
                className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-sm font-medium hover:bg-white/20 transition-colors"
              >
                <Camera className="w-4 h-4" />
                {hostel.images.length} Photos
              </button>
            )}
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

      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
          
            {hostel.facilities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
              >
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  Facilities
                </h2>
                <div className="flex flex-wrap gap-2">
                  {hostel.facilities.map((f) => (
                    <span
                      key={f.id}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700"
                    >
                      {facilityIcons[f.name.toLowerCase()] || (
                        <Shield className="w-4 h-4" />
                      )}
                      {f.name}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                About This Hostel
              </h2>
              <div className="space-y-4">
                {hostel.description.split("\n\n").map((paragraph, index) => (
                  <p key={index} className="text-slate-600 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Pricing Period</p>
                  <p className="text-sm font-medium text-slate-700">
                    {hostel.pricingPeriod === "PER_SEMESTER"
                      ? "Per Semester"
                      : "Per Academic Year"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Total Rooms</p>
                  <p className="text-sm font-medium text-slate-700">
                    {hostel.totalRooms} rooms
                  </p>
                </div>
                {hostel.allowSemesterPayment &&
                  hostel.pricingPeriod === "PER_YEAR" && (
                    <div className="sm:col-span-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-medium rounded-full">
                        <Calendar className="w-3.5 h-3.5" />
                        Semester payment option available
                      </span>
                    </div>
                  )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Available Rooms
                </h2>
                <span className="text-sm text-slate-500">
                  {totalAvailable} available
                </span>
              </div>

              {!canBook && totalAvailable > 0 && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <LogIn className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {!isAuthenticated
                        ? "Sign in to book a room"
                        : isManager || isAdmin
                          ? "Manager and admin accounts cannot book rooms"
                          : "Sign in to book a room"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {!isAuthenticated
                        ? "Students and guests can make bookings"
                        : isManager || isAdmin
                          ? "Please use a student or guest account to book"
                          : "Students and guests can make bookings"}
                    </p>
                  </div>
                  {!isAuthenticated && (
                    <button
                      onClick={handleLoginRedirect}
                      className="shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              )}

              {canBook && totalAvailable > 0 && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                    {user?.role === "STUDENT" ? (
                      <GraduationCap className="w-5 h-5 text-green-600" />
                    ) : (
                      <UserCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      Ready to book as {getUserTypeLabel()}
                    </p>
                    <p className="text-xs text-slate-500">
                      Signed in as {user?.firstName} {user?.lastName}
                    </p>
                  </div>
                </div>
              )}

              {hostel.roomTypes.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No room types configured yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {hostel.roomTypes.map((room, index) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                      whileHover={{ y: -2 }}
                      className="group p-4 bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-2xl transition-all hover:shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900">
                              {OCCUPANCY_LABELS[room.occupancyType]}
                            </h3>
                            {room.availableRooms > 0 ? (
                              <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-full">
                                {room.availableRooms} available
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-full">
                                Fully booked
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {getOccupancyNumber(room.occupancyType)}{" "}
                              {getOccupancyNumber(room.occupancyType) === 1
                                ? "person"
                                : "people"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              {room.totalRooms} rooms
                            </span>
                          </div>

                          {room.description && (
                            <p className="text-sm text-slate-500 mb-3">
                              {room.description}
                            </p>
                          )}

                          {room.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {room.amenities.slice(0, 4).map((amenity) => (
                                <span
                                  key={amenity}
                                  className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-md"
                                >
                                  {amenity}
                                </span>
                              ))}
                              {room.amenities.length > 4 && (
                                <span className="text-xs text-slate-400 px-2 py-1">
                                  +{room.amenities.length - 4} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-slate-900">
                              GHS {Number(room.pricePerPerson).toLocaleString()}
                            </p>
                            <p className="text-sm text-slate-500">
                              /{getPricingLabel(hostel.pricingPeriod)}
                            </p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleBookRoom(room)}
                            disabled={room.availableRooms === 0}
                            className={cn(
                              "flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all",
                              room.availableRooms === 0
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-500/25",
                            )}
                          >
                            {room.availableRooms === 0 ? (
                              "Sold Out"
                            ) : !isAuthenticated ? (
                              <>
                                Sign in to Book
                                <LogIn className="w-4 h-4" />
                              </>
                            ) : canBook ? (
                              <>
                                Book Now
                                <ArrowRight className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                Sign in to Book
                                <LogIn className="w-4 h-4" />
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Student Reviews
              </h2>
              <HostelReviews hostelId={hostel.id} />
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
              >
                <div className="mb-5">
                  <p className="text-sm text-slate-500 mb-1">Starting from</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-900">
                      GHS {minPrice.toLocaleString()}
                    </span>
                    <span className="text-slate-500">
                      /{getPricingLabel(hostel.pricingPeriod)}
                    </span>
                  </div>
                </div>

                {canBook ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const availableRoom = hostel.roomTypes.find(
                        (r) => r.availableRooms > 0,
                      );
                      if (availableRoom) {
                        handleBookRoom(availableRoom);
                      }
                    }}
                    disabled={totalAvailable === 0}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors mb-5",
                      totalAvailable > 0
                        ? "bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/30"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed",
                    )}
                  >
                    {totalAvailable > 0 ? (
                      <>
                        Book Now
                        <ArrowRight className="w-5 h-5" />
                      </>
                    ) : (
                      "Fully Booked"
                    )}
                  </motion.button>
                ) : (
                  <div className="mb-5">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleLoginRedirect}
                      disabled={totalAvailable === 0}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors",
                        totalAvailable > 0
                          ? "bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/30"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed",
                      )}
                    >
                      {totalAvailable > 0 ? (
                        <>
                          <LogIn className="w-5 h-5" />
                          Sign in to Book
                        </>
                      ) : (
                        "Fully Booked"
                      )}
                    </motion.button>
                    {totalAvailable > 0 && (
                      <p className="text-xs text-slate-400 text-center mt-2">
                        {isManager || isAdmin
                          ? "Use a student or guest account to book"
                          : "Students and guests can book"}
                      </p>
                    )}
                  </div>
                )}

                {hostel.manager && (
                  <div className="border-t border-slate-100 pt-5">
                    <p className="text-sm font-medium text-slate-900 mb-3">
                      Contact Manager
                    </p>
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar
                        name={`${hostel.manager.firstName} ${hostel.manager.lastName}`}
                        size="md"
                      />
                      <div>
                        <p className="font-medium text-slate-900">
                          {hostel.manager.firstName} {hostel.manager.lastName}
                        </p>
                        <p className="text-sm text-slate-500">Hostel Manager</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {hostel.manager.phone && (
                        <a
                          href={`tel:${hostel.manager.phone}`}
                          className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          {hostel.manager.phone}
                        </a>
                      )}
                      {hostel.manager.email && (
                        <a
                          href={`mailto:${hostel.manager.email}`}
                          className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          {hostel.manager.email}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isLightboxOpen && hostel.images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="absolute top-4 left-4 text-white text-sm">
              {currentImageIndex + 1} / {hostel.images.length}
            </div>

            <div className="relative w-full h-full flex items-center justify-center p-4">
              <div className="relative max-w-4xl max-h-[80vh] w-full h-full">
                <Image
                  src={hostel.images[currentImageIndex].url}
                  alt={`${hostel.name} ${currentImageIndex + 1}`}
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {hostel.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 max-w-full overflow-x-auto px-4">
              {hostel.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    "w-16 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0",
                    index === currentImageIndex
                      ? "border-white"
                      : "border-transparent opacity-50 hover:opacity-75",
                  )}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={image.url}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={isLoginPromptOpen}
        onClose={() => setIsLoginPromptOpen(false)}
        title="Sign in Required"
        description={
          !isAuthenticated
            ? "Sign in with a student or guest account to book a room"
            : "Only student and guest accounts can make bookings"
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 relative shrink-0">
              {primaryImage ? (
                <Image
                  src={primaryImage.url}
                  alt={hostel.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-linear-to-br from-primary-400 to-primary-600" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">{hostel.name}</h4>
              <p className="text-sm text-slate-500">{hostel.address}</p>
            </div>
          </div>

          {selectedRoom && (
            <div className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800">
                    {OCCUPANCY_LABELS[selectedRoom.occupancyType]}
                  </h4>
                  <p className="text-sm text-slate-500 mt-1">
                    {getOccupancyNumber(selectedRoom.occupancyType)}{" "}
                    {getOccupancyNumber(selectedRoom.occupancyType) === 1
                      ? "person"
                      : "people"}{" "}
                    per room
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary-600">
                    GHS {Number(selectedRoom.pricePerPerson).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-500">
                    /{getPricingLabel(hostel.pricingPeriod)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Students</p>
                <p className="text-xs text-green-600">Can book rooms</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-violet-50 border border-violet-200 rounded-xl">
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                <UserCircle className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-violet-800">Guests</p>
                <p className="text-xs text-violet-600">Can book rooms</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <LogIn className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-sm text-slate-700">
              {!isAuthenticated
                ? "Sign in or create an account to continue with your booking."
                : isManager
                  ? "You are currently signed in as a manager. Please sign in with a student or guest account to book rooms."
                  : isAdmin
                    ? "Admin accounts cannot make bookings. Please use a student or guest account."
                    : "Sign in with a student or guest account to book."}
            </p>
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => setIsLoginPromptOpen(false)}>
            Cancel
          </Button>
          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  href={`/register/student?returnUrl=${encodeURIComponent(`/hostels/${id}`)}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-primary-200 text-primary-700 rounded-lg font-semibold text-sm hover:bg-primary-50 transition-colors"
                  onClick={() => setIsLoginPromptOpen(false)}
                >
                  <GraduationCap className="w-4 h-4" />
                  Student Account
                </Link>
                <Link
                  href={`/register/guest?returnUrl=${encodeURIComponent(`/hostels/${id}`)}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-violet-200 text-violet-700 rounded-lg font-semibold text-sm hover:bg-violet-50 transition-colors"
                  onClick={() => setIsLoginPromptOpen(false)}
                >
                  <UserCircle className="w-4 h-4" />
                  Guest Account
                </Link>
              </div>
              <Button onClick={handleLoginRedirect}>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </div>
          ) : (
            <Button onClick={handleLoginRedirect}>
              <LogIn className="w-4 h-4 mr-2" />
              Switch Account
            </Button>
          )}
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        title="Confirm Booking"
        description="Review your selection before proceeding to payment"
      >
        {selectedRoom && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 relative">
                {primaryImage ? (
                  <Image
                    src={primaryImage.url}
                    alt={hostel.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-linear-to-br from-primary-400 to-primary-600" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">{hostel.name}</h4>
                <p className="text-sm text-slate-500">{hostel.address}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                {user?.role === "STUDENT" ? (
                  <GraduationCap className="w-5 h-5 text-slate-600" />
                ) : (
                  <UserCircle className="w-5 h-5 text-slate-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Booking as {getUserTypeLabel()}
                </p>
                <p className="text-xs text-slate-500">
                  {user?.firstName} {user?.lastName} • {user?.email}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-800">
                  {OCCUPANCY_LABELS[selectedRoom.occupancyType]}
                </h4>
                <span className="px-2 py-0.5 bg-primary-50 border border-primary-200 text-primary-700 text-xs font-medium rounded-full">
                  {getOccupancyNumber(selectedRoom.occupancyType)}{" "}
                  {getOccupancyNumber(selectedRoom.occupancyType) === 1
                    ? "person"
                    : "people"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {getOccupancyNumber(selectedRoom.occupancyType)} person
                  {getOccupancyNumber(selectedRoom.occupancyType) > 1 && "s"}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />1{" "}
                  {getPricingLabel(hostel.pricingPeriod)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-slate-600">Total Amount</span>
                <span className="text-xl font-bold text-primary-600">
                  GHS {Number(selectedRoom.pricePerPerson).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="w-10 h-10 bg-amber-400 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-amber-900">M</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Pay with MTN Mobile Money
                </p>
                <p className="text-xs text-slate-500">
                  Secure payment processed instantly
                </p>
              </div>
            </div>
          </div>
        )}

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setIsBookingModalOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirmBooking}>Proceed to Payment</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}