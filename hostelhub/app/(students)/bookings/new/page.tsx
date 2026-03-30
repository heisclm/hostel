/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  Shield,
  CheckCircle2,
  AlertCircle,
  Phone,
  Loader2,
  ArrowRight,
  XCircle,
  RefreshCw,
  Clock,
  BadgeCheck,
  CreditCard,
  Sparkles,
  FileText,
  ImageIcon,
  GraduationCap,
  UserCircle,
} from "lucide-react";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Checkbox } from "@/components/ui/Checkbox";
import { cn } from "@/lib/utils";
import { usePublicHostelById } from "@/hooks/usePublicHostels";
import {
  useCreateBooking,
  useInitiatePayment,
  useVerifyPayment,
} from "@/hooks/useBooking";
import { useAuth } from "@/context/AuthContext";
import type {
  PaymentPlan,
  SemesterPeriod,
  Booking,
  PaymentVerificationResponse,
} from "@/types/booking";
import type {
  OccupancyType,
  PricingPeriod,
} from "@/services/public.hostel.service";

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

function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 9) {
    return `${year}/${year + 1}`;
  }
  return `${year - 1}/${year}`;
}

function getNextAcademicYear(): string {
  const current = getCurrentAcademicYear();
  const [start] = current.split("/").map(Number);
  return `${start + 1}/${start + 2}`;
}

type BookingStep =
  | "details"
  | "payment"
  | "processing"
  | "success"
  | "failed"
  | "timeout";

function BookingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative bg-linear-to-br from-slate-900 via-primary-900 to-slate-900">
        <div className="container-custom py-8">
          <div className="h-6 w-32 bg-white/10 rounded-lg animate-pulse mb-6" />
          <div className="h-10 w-72 bg-white/10 rounded-lg animate-pulse mb-3" />
          <div className="h-5 w-48 bg-white/10 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-40 bg-white rounded-2xl animate-pulse" />
            <div className="h-64 bg-white rounded-2xl animate-pulse" />
            <div className="h-48 bg-white rounded-2xl animate-pulse" />
          </div>
          <div>
            <div className="h-80 bg-white rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingErrorState({
  error,
  hostelId,
}: {
  error: string;
  hostelId?: string | null;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          {error || "Invalid booking details"}
        </h3>
        <p className="text-slate-500 mb-6 max-w-sm mx-auto">
          Something went wrong loading the booking information. Please try
          again.
        </p>
        <Link
          href={hostelId ? `/hostels/${hostelId}` : "/hostels"}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {hostelId ? "Back to Hostel" : "Browse Hostels"}
        </Link>
      </div>
    </div>
  );
}

function StepIndicator({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: { label: string; icon: React.ReactNode }[];
}) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
              index <= currentStep
                ? "bg-white/20 text-white border border-white/20"
                : "bg-white/5 text-white/40 border border-white/5",
            )}
          >
            <span
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                index < currentStep
                  ? "bg-green-400 text-green-900"
                  : index === currentStep
                    ? "bg-white text-primary-900"
                    : "bg-white/10 text-white/40",
              )}
            >
              {index < currentStep ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                index + 1
              )}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-8 h-px",
                index < currentStep ? "bg-white/40" : "bg-white/10",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function PriceBreakdown({
  baseAmount,
  platformFee,
  platformFeePercent,
  totalAmount,
  compact = false,
}: {
  baseAmount: number;
  platformFee: number;
  platformFeePercent: number;
  totalAmount: number;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Room Price</span>
        <span className="font-medium text-slate-800">
          GHS {baseAmount.toLocaleString()}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-500 flex items-center gap-1">
          Service Fee
          <span className="text-xs text-slate-400">
            ({platformFeePercent}%)
          </span>
        </span>
        <span className="font-medium text-slate-800">
          GHS {platformFee.toLocaleString()}
        </span>
      </div>
      <div
        className={cn(
          "flex items-baseline justify-between pt-3 border-t border-slate-100",
          compact ? "" : "mt-1",
        )}
      >
        <span className="font-semibold text-slate-800">Total</span>
        <div className="text-right">
          <span
            className={cn(
              "font-bold text-primary-600",
              compact ? "text-lg" : "text-2xl",
            )}
          >
            GHS {totalAmount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}


function UserTypeBadge({ userRole }: { userRole?: string }) {
  if (!userRole) return null;

  const config = {
    STUDENT: {
      icon: GraduationCap,
      label: "Student",
      color: "bg-green-100 text-green-700 border-green-200",
    },
    GUEST: {
      icon: UserCircle,
      label: "Guest",
      color: "bg-violet-100 text-violet-700 border-violet-200",
    },
  };

  const userConfig = config[userRole as keyof typeof config];
  if (!userConfig) return null;

  const Icon = userConfig.icon;

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-full text-xs font-semibold", userConfig.color)}>
      <Icon className="w-3.5 h-3.5" />
      {userConfig.label}
    </div>
  );
}



function NewBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hostelId = searchParams.get("hostel");
  const roomTypeId = searchParams.get("roomType");
  const { user, isAuthenticated } = useAuth();

  const {
    hostel,
    isLoading: hostelLoading,
    error: hostelError,
  } = usePublicHostelById(hostelId || "");

  const {
    createBooking,
    booking: createdBooking,
    isLoading: createLoading,
    error: createError,
    setError: setCreateError,
  } = useCreateBooking();

  const {
    initiatePayment,
    paymentData,
    isLoading: paymentLoading,
    error: paymentError,
    setError: setPaymentError,
  } = useInitiatePayment();

  const {
    startPolling,
    stopPolling,
    result: verifyResult,
    error: verifyError,
  } = useVerifyPayment();

  const [currentStep, setCurrentStep] = useState<BookingStep>("details");
  const [bookingData, setBookingData] = useState<Booking | null>(null);
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan>("FULL_YEAR");
  const [semesterPeriod, setSemesterPeriod] =
    useState<SemesterPeriod>("FIRST_SEMESTER");
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const PLATFORM_FEE_PERCENT = 2;

  const canBook = user?.role === "STUDENT" || user?.role === "GUEST";


  const selectedRoom = hostel?.roomTypes?.find((rt) => rt.id === roomTypeId);

  useEffect(() => {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`/bookings/new?hostel=${hostelId}&roomType=${roomTypeId}`);
      router.push(`/login?returnUrl=${returnUrl}`);
      return;
    }
    
    if (!canBook) {
      router.push("/hostels");
      return;
    }
  }, [isAuthenticated, canBook, router, hostelId, roomTypeId]);

  const calculateBaseAmount = useCallback((): number => {
    if (!selectedRoom || !hostel) return 0;
    const price = Number(selectedRoom.pricePerPerson);
    if (hostel.pricingPeriod === "PER_SEMESTER") {
      return paymentPlan === "FULL_YEAR" ? price * 2 : price;
    } else {
      return paymentPlan === "SEMESTER" ? price / 2 : price;
    }
  }, [selectedRoom, hostel, paymentPlan]);

  const baseAmount = calculateBaseAmount();
  const platformFee = parseFloat(
    ((baseAmount * PLATFORM_FEE_PERCENT) / 100).toFixed(2),
  );
  const totalAmount = parseFloat((baseAmount + platformFee).toFixed(2));

  const validateDetailsForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!hostelId) newErrors.hostel = "Hostel is required";
    if (!roomTypeId) newErrors.roomType = "Room type is required";
    if (!phoneNumber) {
      newErrors.phoneNumber = "Phone number is required for payment";
    } else if (!/^(\+?233|0)[235]\d{8}$/.test(phoneNumber.replace(/\s/g, ""))) {
      newErrors.phoneNumber = "Please enter a valid MTN Ghana number";
    }
    if (paymentPlan === "SEMESTER" && !semesterPeriod) {
      newErrors.semesterPeriod = "Please select a semester";
    }
    if (!agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateBooking = async () => {
    if (!validateDetailsForm()) return;
    try {
      setCreateError(null);
      const response = await createBooking({
        hostelId: hostelId!,
        roomTypeId: roomTypeId!,
        paymentPlan,
        ...(paymentPlan === "SEMESTER" && { semesterPeriod }),
        academicYear,
        ...(notes && { notes }),
      });
      setBookingData(response.data);
      setCurrentStep("payment");
    } catch (err) {}
  };

  const handleInitiatePayment = async () => {
    if (!bookingData) return;
    try {
      setPaymentError(null);
      await initiatePayment(bookingData.id, phoneNumber);
      setCurrentStep("processing");
      startPolling(bookingData.id, {
        interval: 5000,
        maxAttempts: 24,
        onSuccess: (data: PaymentVerificationResponse) => {
          setCurrentStep("success");
        },
        onFailed: (data: PaymentVerificationResponse) => {
          setCurrentStep("failed");
        },
        onTimeout: () => {
          setCurrentStep("timeout");
        },
      });
    } catch (err) {}
  };

  const handleRetryPayment = () => {
    setCurrentStep("payment");
    setPaymentError(null);
  };

  const handleBackToDetails = () => {
    setCurrentStep("details");
    setCreateError(null);
    setPaymentError(null);
    setBookingData(null);
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  if (hostelLoading) return <BookingSkeleton />;
  if (hostelError || !hostel || !selectedRoom)
    return (
      <BookingErrorState
        error={hostelError || "Invalid booking details"}
        hostelId={hostelId}
      />
    );

  const primaryImage =
    hostel.images?.find((img) => img.isPrimary) || hostel.images?.[0];

  const getStepNumber = () => {
    switch (currentStep) {
      case "details":
        return 0;
      case "payment":
        return 1;
      case "processing":
      case "success":
      case "failed":
      case "timeout":
        return 2;
      default:
        return 0;
    }
  };

  if (currentStep === "success") {
    const booking = bookingData;
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="relative bg-linear-to-br from-primary-900 via-blue-800 to-primary-900 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[3rem_3rem]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px]" />

          <div className="relative container-custom py-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-4xl font-bold text-white mb-3"
            >
              Payment Successful!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/70 text-lg"
            >
              Your booking has been confirmed
            </motion.p>
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
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-slate-500">
                  Booking Reference
                </span>
                <span className="font-mono font-bold text-primary-600 text-lg">
                  {booking?.bookingReference}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 relative shrink-0">
                    {primaryImage ? (
                      <Image
                        src={primaryImage.url}
                        alt={hostel.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-linear-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-white/40" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">
                      {hostel.name}
                    </h4>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {hostel.address}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-400 mb-1">Room Type</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {OCCUPANCY_LABELS[selectedRoom.occupancyType]}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-400 mb-1">Payment Plan</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {paymentPlan === "FULL_YEAR"
                        ? "Full Academic Year"
                        : `${semesterPeriod === "FIRST_SEMESTER" ? "1st" : "2nd"} Semester`}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-400 mb-1">Academic Year</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {academicYear}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                    <p className="text-xs text-green-600 mb-1">Amount Paid</p>
                    <p className="text-lg font-bold text-green-700">
                      GHS {totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 mb-6">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-slate-800 mb-1">
                    What happens next?
                  </p>
                  <ul className="space-y-1.5 text-slate-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      The hostel manager will assign you a room
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      You&apos;ll be notified once your room is confirmed
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      Contact the manager for check-in details
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/bookings"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                <FileText className="w-4 h-4" />
                View My Bookings
              </Link>
              <Link
                href="/hostels"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30"
              >
                Browse More Hostels
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (currentStep === "failed") {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="relative bg-linear-to-br from-slate-900 via-red-900/60 to-slate-900 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[3rem_3rem]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/20 rounded-full blur-[100px]" />

          <div className="relative container-custom py-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <XCircle className="w-10 h-10 text-red-500" />
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Payment Failed
            </h1>
            <p className="text-white/70 max-w-md mx-auto">
              We couldn&apos;t process your payment. This could be due to
              insufficient funds, network issues, or the transaction was
              declined.
            </p>
            {verifyResult?.failureReason && (
              <p className="text-red-300 text-sm mt-3">
                Reason: {verifyResult.failureReason}
              </p>
            )}
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
          <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/hostels/${hostelId}`)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Hostel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRetryPayment}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === "timeout") {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="relative bg-linear-to-br from-slate-900 via-amber-900/50 to-slate-900 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[3rem_3rem]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/20 rounded-full blur-[100px]" />

          <div className="relative container-custom py-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Clock className="w-10 h-10 text-amber-500" />
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Payment Timeout
            </h1>
            <p className="text-white/70 max-w-md mx-auto">
              We didn&apos;t receive a response in time. Your payment may still
              be processing.
            </p>
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
          <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <Link
              href="/bookings"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Check My Bookings
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRetryPayment}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === "processing") {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="relative bg-linear-to-br from-slate-900 via-primary-900 to-slate-900 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[3rem_3rem]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500/20 rounded-full blur-[80px]" />

          <div className="relative container-custom py-12 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
              className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full mx-auto mb-6"
            />
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Processing Payment
            </h1>
            <p className="text-white/70">
              Please check your phone and approve the MoMo payment of GHS{" "}
              {totalAmount.toLocaleString()}
            </p>
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
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto"
          >
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">
                      Booking created
                    </p>
                    <p className="text-sm text-slate-500">
                      Reference: {bookingData?.bookingReference}
                    </p>
                  </div>
                </div>

                <div className="ml-5 border-l-2 border-green-200 h-4" />

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">
                      Payment request sent
                    </p>
                    <p className="text-sm text-slate-500">
                      GHS {totalAmount.toLocaleString()} to {phoneNumber}
                    </p>
                  </div>
                </div>

                <div className="ml-5 border-l-2 border-primary-200 h-4" />

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                    <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">
                      Waiting for approval
                    </p>
                    <p className="text-sm text-slate-500">
                      Enter your MoMo PIN on your phone
                    </p>
                  </div>
                </div>

                <div className="ml-5 border-l-2 border-slate-100 h-4" />

                <div className="flex items-center gap-4 opacity-40">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-600">
                      Confirm booking
                    </p>
                    <p className="text-sm text-slate-400">
                      Your room will be reserved
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-sm text-slate-400 mb-4">
                  This may take up to 2 minutes. Please don&apos;t close this
                  page.
                </p>
                <div className="flex items-center justify-center gap-1.5">
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:0ms]" />
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:150ms]" />
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (currentStep === "payment") {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="relative bg-linear-to-br from-slate-900 via-primary-900 to-slate-900 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[3rem_3rem]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500/20 rounded-full blur-[80px]" />

          <div className="relative container-custom pt-6 pb-8">
            <button
              onClick={handleBackToDetails}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs text-slate-300 hover:bg-white/20 transition-colors mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Details
            </button>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <StepIndicator
                currentStep={1}
                steps={[
                  { label: "Details", icon: <FileText className="w-4 h-4" /> },
                  {
                    label: "Payment",
                    icon: <CreditCard className="w-4 h-4" />,
                  },
                  {
                    label: "Confirmation",
                    icon: <CheckCircle2 className="w-4 h-4" />,
                  },
                ]}
              />
              <h1 className="text-3xl sm:text-4xl font-bold text-white mt-6 mb-2">
                Confirm Payment
              </h1>
              <p className="text-slate-300">
                Review your order and complete payment
              </p>
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
          <div className="max-w-2xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Order Summary
              </h2>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl mb-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 relative shrink-0">
                  {primaryImage ? (
                    <Image
                      src={primaryImage.url}
                      alt={hostel.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-white/40" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">
                    {hostel.name}
                  </h4>
                  <p className="text-sm text-slate-500">{hostel.address}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Room Type</span>
                  <span className="font-medium text-slate-800">
                    {OCCUPANCY_LABELS[selectedRoom.occupancyType]}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Payment Plan</span>
                  <span className="font-medium text-slate-800">
                    {paymentPlan === "FULL_YEAR"
                      ? "Full Academic Year"
                      : `${semesterPeriod === "FIRST_SEMESTER" ? "First" : "Second"} Semester`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Academic Year</span>
                  <span className="font-medium text-slate-800">
                    {academicYear}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <PriceBreakdown
                    baseAmount={baseAmount}
                    platformFee={platformFee}
                    platformFeePercent={PLATFORM_FEE_PERCENT}
                    totalAmount={totalAmount}
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Payment Method
              </h2>

              <div className="border-2 border-primary-500 rounded-xl p-4 bg-primary-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center">
                    <span className="text-xl font-bold text-amber-900">M</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">
                      MTN Mobile Money
                    </p>
                    <p className="text-sm text-slate-500">
                      Pay from your MoMo wallet
                    </p>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-primary-600" />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 bg-slate-50 rounded-xl p-4">
                <Phone className="w-5 h-5 text-slate-400" />
                <span className="font-medium text-slate-800 flex-1">
                  {phoneNumber}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 bg-amber-100 border border-amber-200 text-amber-700 text-xs font-semibold rounded-full">
                  MTN
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 ml-1">
                A payment prompt will be sent to this number
              </p>
            </motion.div>

            {paymentError && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-5"
              >
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-red-800">Payment Error</p>
                  <p className="text-red-700">{paymentError}</p>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-5"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-slate-800 mb-1">
                  Secure Payment
                </p>
                <p className="text-slate-600">
                  Your payment is secured and processed by MTN MoMo. You will
                  receive a prompt on your phone to approve the transaction.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex gap-3 pt-2"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBackToDetails}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleInitiatePayment}
                disabled={paymentLoading}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all",
                  paymentLoading
                    ? "bg-primary-400 text-white cursor-not-allowed"
                    : "bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/30",
                )}
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    Pay GHS {totalAmount.toLocaleString()}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative bg-linear-to-br from-slate-900 via-primary-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[3rem_3rem]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500/20 rounded-full blur-[80px]" />

        <div className="relative container-custom pt-6 pb-8">
          <Link
            href={`/hostels/${hostelId}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs text-slate-300 hover:bg-white/20 transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to {hostel.name}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <StepIndicator
              currentStep={0}
              steps={[
                { label: "Details", icon: <FileText className="w-4 h-4" /> },
                {
                  label: "Payment",
                  icon: <CreditCard className="w-4 h-4" />,
                },
                {
                  label: "Confirmation",
                  icon: <CheckCircle2 className="w-4 h-4" />,
                },
              ]}
            />
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 mb-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  Book Your Room
                </h1>
                <p className="text-slate-300">
                  Complete the details below to reserve your room
                </p>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
                <UserTypeBadge userRole={user?.role} />
                <span className="text-sm text-white/90 font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
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

      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 relative shrink-0">
                  {primaryImage ? (
                    <Image
                      src={primaryImage.url}
                      alt={hostel.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-white/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-800">
                      {hostel.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 border border-primary-200 rounded-full text-[10px] font-semibold text-primary-700">
                      <BadgeCheck className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {hostel.address}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Selected Room
              </h2>
              <div className="border-2 border-primary-500 bg-primary-50/50 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900">
                        {OCCUPANCY_LABELS[selectedRoom.occupancyType]}
                      </h3>
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-full">
                        {selectedRoom.availableRooms} available
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {getOccupancyNumber(selectedRoom.occupancyType)}{" "}
                        {getOccupancyNumber(selectedRoom.occupancyType) === 1
                          ? "person"
                          : "people"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {selectedRoom.totalRooms} rooms total
                      </span>
                    </div>
                    {selectedRoom.amenities?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedRoom.amenities.slice(0, 4).map((amenity) => (
                          <span
                            key={amenity}
                            className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-md"
                          >
                            {amenity}
                          </span>
                        ))}
                        {selectedRoom.amenities.length > 4 && (
                          <span className="text-xs text-slate-400 px-2 py-1">
                            +{selectedRoom.amenities.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      GHS {Number(selectedRoom.pricePerPerson).toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-500">
                      /{getPricingLabel(hostel.pricingPeriod)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Academic Year
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[getCurrentAcademicYear(), getNextAcademicYear()].map(
                  (year) => (
                    <label
                      key={year}
                      className={cn(
                        "flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all",
                        academicYear === year
                          ? "border-primary-500 bg-primary-50/50 shadow-sm shadow-primary-500/10"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      <input
                        type="radio"
                        name="academicYear"
                        value={year}
                        checked={academicYear === year}
                        onChange={() => setAcademicYear(year)}
                        className="sr-only"
                      />
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                          academicYear === year
                            ? "border-primary-500"
                            : "border-slate-300",
                        )}
                      >
                        {academicYear === year && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-700">
                          {year}
                        </span>
                        <p className="text-xs text-slate-400">Academic Year</p>
                      </div>
                    </label>
                  ),
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Payment Plan
              </h2>
              <div className="space-y-3">
                <label
                  className={cn(
                    "flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all",
                    paymentPlan === "FULL_YEAR"
                      ? "border-primary-500 bg-primary-50/50 shadow-sm shadow-primary-500/10"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <input
                    type="radio"
                    name="paymentPlan"
                    value="FULL_YEAR"
                    checked={paymentPlan === "FULL_YEAR"}
                    onChange={() => setPaymentPlan("FULL_YEAR")}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                      paymentPlan === "FULL_YEAR"
                        ? "border-primary-500"
                        : "border-slate-300",
                    )}
                  >
                    {paymentPlan === "FULL_YEAR" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">
                        Full Academic Year
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 text-[10px] font-semibold rounded-full">
                        <Sparkles className="w-3 h-3" />
                        Best Value
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pay for both semesters at once
                    </p>
                  </div>
                  <span className="font-bold text-primary-600">
                    GHS{" "}
                    {hostel.pricingPeriod === "PER_SEMESTER"
                      ? (
                          Number(selectedRoom.pricePerPerson) * 2
                        ).toLocaleString()
                      : Number(selectedRoom.pricePerPerson).toLocaleString()}
                  </span>
                </label>

                {hostel.allowSemesterPayment && (
                  <label
                    className={cn(
                      "flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all",
                      paymentPlan === "SEMESTER"
                        ? "border-primary-500 bg-primary-50/50 shadow-sm shadow-primary-500/10"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <input
                      type="radio"
                      name="paymentPlan"
                      value="SEMESTER"
                      checked={paymentPlan === "SEMESTER"}
                      onChange={() => setPaymentPlan("SEMESTER")}
                      className="sr-only"
                    />
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                        paymentPlan === "SEMESTER"
                          ? "border-primary-500"
                          : "border-slate-300",
                      )}
                    >
                      {paymentPlan === "SEMESTER" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-slate-700">
                        Per Semester
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Pay for one semester at a time
                      </p>
                    </div>
                    <span className="font-bold text-primary-600">
                      GHS{" "}
                      {hostel.pricingPeriod === "PER_SEMESTER"
                        ? Number(selectedRoom.pricePerPerson).toLocaleString()
                        : (
                            Number(selectedRoom.pricePerPerson) / 2
                          ).toLocaleString()}
                    </span>
                  </label>
                )}
              </div>

              <AnimatePresence>
                {paymentPlan === "SEMESTER" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Select Semester
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {(
                          [
                            {
                              value: "FIRST_SEMESTER" as SemesterPeriod,
                              label: "First Semester",
                            },
                            {
                              value: "SECOND_SEMESTER" as SemesterPeriod,
                              label: "Second Semester",
                            },
                          ] as const
                        ).map((option) => (
                          <label
                            key={option.value}
                            className={cn(
                              "flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all",
                              semesterPeriod === option.value
                                ? "border-primary-500 bg-primary-50/50"
                                : "border-slate-200 hover:border-slate-300",
                            )}
                          >
                            <input
                              type="radio"
                              name="semesterPeriod"
                              value={option.value}
                              checked={semesterPeriod === option.value}
                              onChange={() => setSemesterPeriod(option.value)}
                              className="sr-only"
                            />
                            <div
                              className={cn(
                                "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                semesterPeriod === option.value
                                  ? "border-primary-500"
                                  : "border-slate-300",
                              )}
                            >
                              {semesterPeriod === option.value && (
                                <div className="w-2 h-2 rounded-full bg-primary-500" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-slate-700">
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </div>
                      {errors.semesterPeriod && (
                        <p className="text-sm text-red-500 mt-2">
                          {errors.semesterPeriod}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Payment Information
              </h2>

              <div className="mb-4 flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="w-10 h-10 bg-amber-400 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-amber-900">M</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    MTN Mobile Money
                  </p>
                  <p className="text-xs text-slate-500">
                    Payment prompt will be sent to your phone
                  </p>
                </div>
              </div>

              <PhoneInput
                label="MTN MoMo Number"
                value={phoneNumber}
                onChange={(value) => {
                  setPhoneNumber(value);
                  if (errors.phoneNumber) {
                    setErrors((prev) => ({ ...prev, phoneNumber: "" }));
                  }
                }}
                error={errors.phoneNumber}
                hint="A MoMo payment request will be sent to this number"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Additional Notes
                <span className="text-sm font-normal text-slate-400 ml-2">
                  (optional)
                </span>
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or notes for the hostel manager..."
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none placeholder:text-slate-400"
              />
              <p className="text-xs text-slate-400 mt-1 text-right">
                {notes.length}/500
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <Checkbox
                checked={agreeToTerms}
                onChange={(e) => {
                  setAgreeToTerms(e.target.checked);
                  if (errors.agreeToTerms) {
                    setErrors((prev) => ({ ...prev, agreeToTerms: "" }));
                  }
                }}
                error={errors.agreeToTerms}
                label={
                  <span className="text-sm">
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      className="text-primary-600 hover:underline font-medium"
                    >
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/booking-policy"
                      className="text-primary-600 hover:underline font-medium"
                    >
                      Booking Policy
                    </Link>
                  </span>
                }
              />
            </motion.div>

            {createError && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-5"
              >
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-red-800">Booking Error</p>
                  <p className="text-red-700">{createError}</p>
                </div>
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Order Summary
                </h3>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Room</span>
                    <span className="font-medium text-slate-800">
                      {OCCUPANCY_LABELS[selectedRoom.occupancyType]}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Plan</span>
                    <span className="font-medium text-slate-800">
                      {paymentPlan === "FULL_YEAR"
                        ? "Full Year"
                        : "Per Semester"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Year</span>
                    <span className="font-medium text-slate-800">
                      {academicYear}
                    </span>
                  </div>
                  {paymentPlan === "SEMESTER" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Semester</span>
                      <span className="font-medium text-slate-800">
                        {semesterPeriod === "FIRST_SEMESTER"
                          ? "1st Semester"
                          : "2nd Semester"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4 mb-5">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Room Price</span>
                      <span className="font-medium text-slate-800">
                        GHS {baseAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">
                        Service Fee{" "}
                        <span className="text-xs text-slate-400">
                          ({PLATFORM_FEE_PERCENT}%)
                        </span>
                      </span>
                      <span className="font-medium text-slate-800">
                        GHS {platformFee.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                      <span className="font-semibold text-slate-800">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-primary-600">
                        GHS {totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateBooking}
                  disabled={createLoading}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all",
                    createLoading
                      ? "bg-primary-400 text-white cursor-not-allowed"
                      : "bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/30",
                  )}
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Booking...
                    </>
                  ) : (
                    <>
                      Proceed to Payment
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>

                <p className="text-xs text-slate-400 mt-3 text-center">
                  Includes a {PLATFORM_FEE_PERCENT}% platform service fee
                </p>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-2">Payment Method</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-400 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-amber-900">
                        M
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-700">
                        MTN Mobile Money
                      </span>
                      <p className="text-xs text-slate-400">
                        Secure instant payment
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
              >
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Secure Booking
                  </p>
                  <p className="text-xs text-slate-500">
                    Your data is encrypted and protected
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={<BookingSkeleton />}>
      <NewBookingContent />
    </Suspense>
  );
}
