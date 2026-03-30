"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  Shield,
  FileText,
  Star,
  Users,
  Home,
  CreditCard,
  Edit,
  ExternalLink,
  BadgeCheck,
  XCircle,
  AlertCircle,
  TrendingUp,
  Bed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { authService } from "@/services/auth.services";
import { AxiosError } from "axios";

interface ManagerData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  role: "MANAGER";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  managerProfile: {
    id: string;
    businessName: string;
    idNumber: string;
    idImage: string;
    verified: boolean;
    verifiedAt: Date | null;
    verifiedBy: string | null;
    rejectionReason: string | null;
    verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
    createdAt: Date;
  };

  stats: {
    totalHostels: number;
    totalRooms: number;
    activeBookings: number;
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    totalReviews: number;
    occupancyRate: number;
  };
}

interface ApiUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "MANAGER";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  managerProfile: {
    id: string;
    businessName: string;
    idNumber: string;
    idImage: string;
    verified: boolean;
    verifiedAt: string | null;
    verifiedBy: string | null;
    rejectionReason: string | null;
    verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
    createdAt: string;
  };
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-slate-200 rounded-2xl" />
          <div className="space-y-3">
            <div className="h-6 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-32 bg-slate-100 rounded" />
            <div className="h-4 w-40 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 p-4"
          >
            <div className="h-10 w-10 bg-slate-100 rounded-lg mb-3" />
            <div className="h-6 w-16 bg-slate-200 rounded mb-1" />
            <div className="h-4 w-20 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            color,
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xl font-bold text-slate-800">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
          {subValue && <p className="text-xs text-slate-400">{subValue}</p>}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  badge,
  badgeColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-slate-500" />
        </div>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-800">{value}</span>
        {badge && (
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              badgeColor,
            )}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ManagerProfilePage() {
  const [manager, setManager] = useState<ManagerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const memberDays = useMemo(() => {
    if (!manager) return 0;
    const now = new Date();
    return Math.floor(
      (now.getTime() - manager.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );
  }, [manager]);

  useEffect(() => {
    const fetchManager = async () => {
      try {
        const response = await authService.getMe();
        const user = response.data?.user as unknown as ApiUser;

        if (user && user.role === "MANAGER") {
          setManager({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: "MANAGER",
            status: user.status,
            emailVerified: user.emailVerified,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
            avatar: undefined,
            managerProfile: {
              id: user.managerProfile.id,
              businessName: user.managerProfile.businessName,
              idNumber: user.managerProfile.idNumber,
              idImage: user.managerProfile.idImage,
              verified: user.managerProfile.verified,
              verifiedAt: user.managerProfile.verifiedAt
                ? new Date(user.managerProfile.verifiedAt)
                : null,
              verifiedBy: user.managerProfile.verifiedBy,
              rejectionReason: user.managerProfile.rejectionReason,
              verificationStatus: user.managerProfile.verificationStatus,
              createdAt: new Date(user.managerProfile.createdAt),
            },
            stats: {
              totalHostels: 0,
              totalRooms: 0,
              activeBookings: 0,
              totalBookings: 0,
              totalRevenue: 0,
              averageRating: 0,
              totalReviews: 0,
              occupancyRate: 0,
            },
          });
        }
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          toast.error("Failed to load profile");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchManager();
  }, []);

  const maskGhanaCard = (cardNumber: string) => {
    if (cardNumber.length <= 6) return cardNumber;
    return (
      cardNumber.substring(0, 4) +
      "****" +
      cardNumber.substring(cardNumber.length - 2)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-100 text-emerald-700";
      case "INACTIVE":
        return "bg-slate-100 text-slate-700";
      case "SUSPENDED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return "bg-emerald-100 text-emerald-700";
      case "PENDING":
        return "bg-amber-100 text-amber-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-slate-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
        <ProfileSkeleton />
      </div>
    );
  }

  if (!manager) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-slate-300" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">
          Profile Not Found
        </h2>
        <p className="text-slate-500">
          Unable to load your profile information.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center">
            <User className="w-7 h-7 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
            <p className="text-slate-500">View your account information</p>
          </div>
        </div>
        <Link
          href="/manager/settings"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Edit Profile
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 overflow-hidden"
      >
        <div className="bg-linear-to-r from-primary-600 to-primary-700 px-6 py-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/20 border-4 border-white/30">
                {manager.avatar ? (
                  <Image
                    src={manager.avatar}
                    alt={manager.firstName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary-400 to-primary-600">
                    <span className="text-3xl font-bold text-white">
                      {manager.firstName[0]}
                      {manager.lastName[0]}
                    </span>
                  </div>
                )}
              </div>
              {manager.managerProfile.verified && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center border-2 border-white">
                  <BadgeCheck className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                <h2 className="text-2xl font-bold text-white">
                  {manager.firstName} {manager.lastName}
                </h2>
              </div>
              <p className="text-primary-100 mb-2">
                {manager.managerProfile.businessName}
              </p>
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-semibold",
                    getStatusColor(manager.status),
                  )}
                >
                  {manager.status}
                </span>
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-semibold",
                    getVerificationColor(
                      manager.managerProfile.verificationStatus,
                    ),
                  )}
                >
                  {manager.managerProfile.verificationStatus === "VERIFIED" && (
                    <CheckCircle2 className="w-3 h-3 inline mr-1" />
                  )}
                  {manager.managerProfile.verificationStatus}
                </span>
                <span className="px-2.5 py-1 bg-white/20 text-white rounded-full text-xs font-medium">
                  Member for {memberDays} days
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          icon={Home}
          label="Total Hostels"
          value={manager.stats.totalHostels}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={Bed}
          label="Total Rooms"
          value={manager.stats.totalRooms}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          icon={Users}
          label="Active Bookings"
          value={manager.stats.activeBookings}
          subValue={`of ${manager.stats.totalBookings} total`}
          color="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          icon={Star}
          label="Average Rating"
          value={manager.stats.averageRating}
          subValue={`${manager.stats.totalReviews} reviews`}
          color="bg-amber-100 text-amber-600"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid sm:grid-cols-2 gap-4"
      >
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-800">
                  GHS {manager.stats.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <TrendingUp className="w-4 h-4" />
            <span>From {manager.stats.totalBookings} bookings</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Occupancy Rate</p>
                <p className="text-2xl font-bold text-slate-800">
                  {manager.stats.occupancyRate}%
                </p>
              </div>
            </div>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${manager.stats.occupancyRate}%` }}
            />
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
            <User className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-slate-800">
              Personal Information
            </h3>
          </div>
          <div className="p-6">
            <InfoRow
              icon={User}
              label="Full Name"
              value={`${manager.firstName} ${manager.lastName}`}
            />
            <InfoRow
              icon={Mail}
              label="Email Address"
              value={manager.email}
              badge={manager.emailVerified ? "Verified" : "Unverified"}
              badgeColor={
                manager.emailVerified
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }
            />
            <InfoRow icon={Phone} label="Phone Number" value={manager.phone} />
            <InfoRow
              icon={Shield}
              label="Account Status"
              value={manager.status}
              badge={manager.status}
              badgeColor={getStatusColor(manager.status)}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
            <Building2 className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-slate-800">
              Business Information
            </h3>
          </div>
          <div className="p-6">
            <InfoRow
              icon={Building2}
              label="Business Name"
              value={manager.managerProfile.businessName}
            />
            <InfoRow
              icon={FileText}
              label="ID Card"
              value={maskGhanaCard(manager.managerProfile.idNumber)}
            />
            <InfoRow
              icon={CheckCircle2}
              label="Verification"
              value={manager.managerProfile.verificationStatus}
              badge={manager.managerProfile.verificationStatus}
              badgeColor={getVerificationColor(
                manager.managerProfile.verificationStatus,
              )}
            />
            {manager.managerProfile.verifiedAt && (
              <InfoRow
                icon={Calendar}
                label="Verified On"
                value={manager.managerProfile.verifiedAt.toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                )}
              />
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-slate-200 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <Clock className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-slate-800">Account Timeline</h3>
        </div>
        <div className="p-6">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />

            <div className="space-y-6">
              <div className="relative flex gap-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center z-10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-medium text-slate-800">Account Created</p>
                  <p className="text-sm text-slate-500">
                    {manager.createdAt.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {manager.managerProfile.verifiedAt && (
                <div className="relative flex gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center z-10">
                    <BadgeCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-medium text-slate-800">
                      Account Verified
                    </p>
                    <p className="text-sm text-slate-500">
                      {manager.managerProfile.verifiedAt.toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </p>
                    {manager.managerProfile.verifiedBy && (
                      <p className="text-xs text-slate-400 mt-1">
                        Verified by {manager.managerProfile.verifiedBy}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="relative flex gap-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center z-10">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-medium text-slate-800">Last Updated</p>
                  <p className="text-sm text-slate-500">
                    {manager.updatedAt.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {manager.managerProfile.verificationStatus === "REJECTED" &&
        manager.managerProfile.rejectionReason && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-red-50 rounded-xl border border-red-200 p-5"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-800">
                  Verification Rejected
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {manager.managerProfile.rejectionReason}
                </p>
                <Link
                  href="/manager/settings"
                  className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium mt-3"
                >
                  Update your information
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid sm:grid-cols-3 gap-4"
      >
        <Link
          href="/manager/hostels"
          className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-primary-200 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Home className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-800">My Hostels</p>
              <p className="text-xs text-slate-500">
                {manager.stats.totalHostels} hostels
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/manager/bookings"
          className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-primary-200 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-slate-800">Bookings</p>
              <p className="text-xs text-slate-500">
                {manager.stats.activeBookings} active
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/manager/settings"
          className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-primary-200 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Edit className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-slate-800">Edit Profile</p>
              <p className="text-xs text-slate-500">Update your info</p>
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
