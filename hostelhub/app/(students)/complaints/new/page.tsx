/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  AlertCircle,
  Send,
  Building2,
  Tag,
  FileText,
  MessageSquare,
  CheckCircle2,
  ChevronDown,
  Check,
  Loader2,
  Home,
  RefreshCw,
  Eye,
  Shield,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  complaintService,
  type EligibleHostel,
  type CreateComplaintPayload,
} from "@/services/complaint.service";

const complaintCategories = [
  {
    value: "maintenance",
    label: "Maintenance Issue",
    icon: "🔧",
    description: "Broken fixtures, repairs needed",
  },
  {
    value: "utilities",
    label: "Utilities",
    icon: "💡",
    description: "Water, electricity issues",
  },
  {
    value: "security",
    label: "Security Concern",
    icon: "🔒",
    description: "Safety and security issues",
  },
  {
    value: "noise",
    label: "Noise Complaint",
    icon: "🔊",
    description: "Disturbances from neighbors",
  },
  {
    value: "cleanliness",
    label: "Cleanliness",
    icon: "🧹",
    description: "Hygiene and sanitation",
  },
  {
    value: "management",
    label: "Management Issue",
    icon: "👔",
    description: "Staff or policy concerns",
  },
  {
    value: "other",
    label: "Other",
    icon: "📋",
    description: "Other issues",
  },
];

const visibilityOptions = [
  {
    value: "ADMIN_AND_MANAGER",
    label: "Admin & Hostel Manager",
    description:
      "Both the platform admin and your hostel manager can see and respond to this complaint. Best for hostel-related issues.",
    icon: Users,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    recommended: true,
  },
  {
    value: "ADMIN_ONLY",
    label: "Admin Only",
    description:
      "Only the platform admin can see this complaint. The hostel manager will not be notified. Use this for sensitive issues or complaints about management.",
    icon: Shield,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-100",
    recommended: false,
  },
];

interface FormData {
  hostelId: string;
  category: string;
  subject: string;
  message: string;
  visibility: "ADMIN_ONLY" | "ADMIN_AND_MANAGER";
  attachments: File[];
}

function NoEligibleHostels({
  onRetry,
  errorMessage,
}: {
  onRetry: () => void;
  errorMessage?: string;
}) {
  return (
    <div className="container-custom py-8 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 flex items-center justify-center mb-6">
            <Home className="w-10 h-10 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            No Active Booking Found
          </h3>
          <p className="text-slate-500 max-w-sm mb-2">
            You can only submit complaints for hostels where you have an active
            booking (checked in). Please book a hostel first or ensure
            you&apos;ve checked in.
          </p>
          {errorMessage && (
            <p className="text-sm text-red-500 mb-4 bg-red-50 px-4 py-2 rounded-lg">
              {errorMessage}
            </p>
          )}
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-5 py-3 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <Link
              href="/complaints"
              className="inline-flex items-center gap-2 px-5 py-3 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Complaints
            </Link>
            <Link
              href="/hostels"
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Browse Hostels
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="container-custom py-8 max-w-2xl mx-auto">
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-4" />
        <p className="text-slate-500 text-sm">
          Loading your eligible hostels...
        </p>
      </div>
    </div>
  );
}

function NewComplaintForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedHostel = searchParams.get("hostel");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHostels, setIsLoadingHostels] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [eligibleHostels, setEligibleHostels] = useState<EligibleHostel[]>([]);
  const [formData, setFormData] = useState<FormData>({
    hostelId: preselectedHostel || "",
    category: "",
    subject: "",
    message: "",
    visibility: "ADMIN_AND_MANAGER",
    attachments: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showHostelDropdown, setShowHostelDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const fetchEligibleHostels = async () => {
    setIsLoadingHostels(true);
    setLoadError(undefined);

    try {
      const response = await complaintService.getEligibleHostels();

      if (response.success) {
        setEligibleHostels(response.data);

        if (response.data.length === 1 && !preselectedHostel) {
          setFormData((prev) => ({
            ...prev,
            hostelId: response.data[0].id,
          }));
        }

        if (preselectedHostel && response.data.length > 0) {
          const isEligible = response.data.some(
            (h: EligibleHostel) => h.id === preselectedHostel,
          );
          if (!isEligible) {
            if (response.data.length === 1) {
              setFormData((prev) => ({
                ...prev,
                hostelId: response.data[0].id,
              }));
            } else {
              setFormData((prev) => ({ ...prev, hostelId: "" }));
            }
            toast.error(
              "The selected hostel is not available for complaints. Please choose from your active bookings.",
            );
          }
        }

        if (response.data.length === 0 && response.message) {
          setLoadError(response.message);
        }
      } else {
        setLoadError(response.message || "Failed to load eligible hostels");
      }
    } catch (error: unknown) {
      console.error("Failed to fetch eligible hostels:", error);
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
      };
      const status = err?.response?.status;
      const message = err?.response?.data?.message;

      if (status === 401) {
        setLoadError("Please log in to submit a complaint.");
        toast.error("Please log in to continue");
      } else if (status === 403) {
        setLoadError("You don't have permission to submit complaints.");
      } else {
        setLoadError(
          message || "Failed to load eligible hostels. Please try again.",
        );
        toast.error("Failed to load eligible hostels");
      }
    } finally {
      setIsLoadingHostels(false);
    }
  };

  useEffect(() => {
    fetchEligibleHostels();
  }, []);

  useEffect(() => {
    if (!showHostelDropdown && !showCategoryDropdown) return;
    const handler = () => {
      setShowHostelDropdown(false);
      setShowCategoryDropdown(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showHostelDropdown, showCategoryDropdown]);

  const selectedHostel = eligibleHostels.find(
    (h: EligibleHostel) => h.id === formData.hostelId,
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.hostelId) {
      newErrors.hostelId = "Please select a hostel";
    }
    if (!formData.category) {
      newErrors.category = "Please select a category";
    }
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    } else if (formData.subject.length < 10) {
      newErrors.subject = "Subject must be at least 10 characters";
    }
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.length < 50) {
      newErrors.message =
        "Please provide more details (at least 50 characters)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const payload: CreateComplaintPayload = {
        hostelId: formData.hostelId,
        subject: formData.subject,
        message: formData.message,
        category: formData.category || undefined,
        visibility: formData.visibility,
      };

      const response = await complaintService.createComplaint(payload);

      if (response.success) {
        toast.success("Complaint submitted successfully!");
        router.push("/complaints");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message =
        err?.response?.data?.message ||
        "Failed to submit complaint. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const renderContent = () => {
    if (isLoadingHostels) {
      return <LoadingState />;
    }

    if (eligibleHostels.length === 0) {
      return (
        <NoEligibleHostels
          onRetry={fetchEligibleHostels}
          errorMessage={loadError}
        />
      );
    }

    return (
      <div className="container-custom py-8 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-600" />
                Select Hostel
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Only hostels with active bookings are shown
              </p>
            </div>
            <div className="p-5">
              {eligibleHostels.length === 1 ? (
                <div className="flex items-center gap-4 p-4 bg-primary-50 border border-primary-200 rounded-xl">
                  {eligibleHostels[0].image && (
                    <Image
                      src={eligibleHostels[0].image}
                      alt={eligibleHostels[0].name}
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-primary-900">
                      {eligibleHostels[0].name}
                    </p>
                    <p className="text-sm text-primary-700">
                      {eligibleHostels[0].address}
                    </p>
                    {eligibleHostels[0].roomNumber && (
                      <p className="text-xs text-primary-600 mt-1">
                        Room: {eligibleHostels[0].roomNumber}
                      </p>
                    )}
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-primary-600 shrink-0" />
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHostelDropdown(!showHostelDropdown);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-left transition-all",
                      errors.hostelId
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
                    )}
                  >
                    {selectedHostel ? (
                      <div className="flex items-center gap-3">
                        {selectedHostel.image && (
                          <Image
                            src={selectedHostel.image}
                            alt={selectedHostel.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-slate-900">
                            {selectedHostel.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {selectedHostel.address}
                            {selectedHostel.roomNumber &&
                              ` • Room ${selectedHostel.roomNumber}`}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">
                        Choose the hostel this complaint is about
                      </span>
                    )}
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-slate-400 transition-transform shrink-0",
                        showHostelDropdown && "rotate-180",
                      )}
                    />
                  </button>

                  {showHostelDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {eligibleHostels.map((hostel) => (
                        <button
                          key={hostel.id}
                          type="button"
                          onClick={() => {
                            handleChange("hostelId", hostel.id);
                            setShowHostelDropdown(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-3 text-left transition-colors",
                            formData.hostelId === hostel.id
                              ? "bg-primary-50"
                              : "hover:bg-slate-50",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {hostel.image && (
                              <Image
                                src={hostel.image}
                                alt={hostel.name}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <p
                                className={cn(
                                  "font-medium",
                                  formData.hostelId === hostel.id
                                    ? "text-primary-700"
                                    : "text-slate-900",
                                )}
                              >
                                {hostel.name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {hostel.address}
                                {hostel.roomNumber &&
                                  ` • Room ${hostel.roomNumber}`}
                              </p>
                            </div>
                          </div>
                          {formData.hostelId === hostel.id && (
                            <Check className="w-5 h-5 text-primary-600 shrink-0" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              )}
              {errors.hostelId && (
                <p className="text-sm text-red-500 mt-2">{errors.hostelId}</p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary-600" />
                Category
              </h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {complaintCategories.slice(0, 4).map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => handleChange("category", category.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center",
                      formData.category === category.value
                        ? "border-primary-500 bg-primary-50 ring-2 ring-primary-500/20"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300",
                    )}
                  >
                    <span className="text-2xl">{category.icon}</span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        formData.category === category.value
                          ? "text-primary-700"
                          : "text-slate-700",
                      )}
                    >
                      {category.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="relative mt-4">
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="text-sm text-primary-600 font-medium hover:underline"
                >
                  {showCategoryDropdown ? "Show less" : "More categories..."}
                </button>

                {showCategoryDropdown && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 grid grid-cols-3 gap-3"
                  >
                    {complaintCategories.slice(4).map((category) => (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => handleChange("category", category.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center",
                          formData.category === category.value
                            ? "border-primary-500 bg-primary-50 ring-2 ring-primary-500/20"
                            : "border-slate-200 bg-slate-50 hover:border-slate-300",
                        )}
                      >
                        <span className="text-2xl">{category.icon}</span>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            formData.category === category.value
                              ? "text-primary-700"
                              : "text-slate-700",
                          )}
                        >
                          {category.label}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {errors.category && (
                <p className="text-sm text-red-500 mt-3">{errors.category}</p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Complaint Details
              </h2>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Brief description of the issue"
                  value={formData.subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border transition-all text-slate-800 placeholder:text-slate-400",
                    errors.subject
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-200 bg-slate-50 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white",
                  )}
                />
                {errors.subject ? (
                  <p className="text-sm text-red-500 mt-2">{errors.subject}</p>
                ) : (
                  <p className="text-xs text-slate-500 mt-2">
                    Minimum 10 characters
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Describe the Issue
                </label>
                <textarea
                  placeholder="Please provide as much detail as possible about the issue you're experiencing..."
                  value={formData.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  rows={6}
                  maxLength={1000}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border transition-all text-slate-800 placeholder:text-slate-400 resize-none",
                    errors.message
                      ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-200 bg-slate-50 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white",
                  )}
                />
                <div className="flex items-center justify-between mt-2">
                  {errors.message ? (
                    <p className="text-sm text-red-500">{errors.message}</p>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Minimum 50 characters
                    </p>
                  )}
                  <p className="text-xs text-slate-400">
                    {formData.message.length}/1000
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary-600" />
                Who should see this?
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Choose who can view and respond to your complaint
              </p>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                {visibilityOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = formData.visibility === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleChange("visibility", option.value)}
                      className={cn(
                        "w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all",
                        isSelected
                          ? "border-primary-500 bg-primary-50 ring-2 ring-primary-500/20"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300",
                      )}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                          isSelected ? "bg-primary-100" : option.iconBg,
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-5 h-5",
                            isSelected ? "text-primary-600" : option.iconColor,
                          )}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              "font-semibold text-sm",
                              isSelected
                                ? "text-primary-900"
                                : "text-slate-800",
                            )}
                          >
                            {option.label}
                          </p>
                          {option.recommended && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-full">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-sm mt-1",
                            isSelected ? "text-primary-700" : "text-slate-500",
                          )}
                        >
                          {option.description}
                        </p>
                      </div>

                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-colors",
                          isSelected
                            ? "border-primary-600 bg-primary-600"
                            : "border-slate-300",
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {formData.visibility === "ADMIN_ONLY" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      Your hostel manager will <strong>not</strong> be notified
                      about this complaint. Only the platform admin will be able
                      to see and respond to it.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-blue-50 border border-blue-200 rounded-2xl p-5"
          >
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-blue-900 mb-2">
                  What happens next?
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-blue-800">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    {formData.visibility === "ADMIN_ONLY"
                      ? "Your complaint will be sent to the platform admin only"
                      : "Your complaint will be sent to the hostel manager and admin"}
                  </li>
                  <li className="flex items-start gap-2 text-sm text-blue-800">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    You&apos;ll receive updates via SMS and on this platform
                  </li>
                  <li className="flex items-start gap-2 text-sm text-blue-800">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    Most complaints are resolved within 48-72 hours
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3 pt-2"
          >
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3.5 px-6 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-semibold transition-all",
                isSubmitting
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/25",
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Complaint
                </>
              )}
            </motion.button>
          </motion.div>
        </form>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative bg-linear-to-br from-slate-900 via-primary-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size:3rem_3rem" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500/20 rounded-full blur-[80px]" />

        <div className="relative container-custom py-10 sm:py-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link
              href="/complaints"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs text-slate-300 hover:bg-white/20 transition-colors mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Complaints
            </Link>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs text-slate-300 mb-4">
              <MessageSquare className="w-3.5 h-3.5 text-primary-400" />
              New Complaint
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Submit a{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-400 to-secondary-400">
                Complaint
              </span>
            </h1>
            <p className="text-slate-400 max-w-xl">
              Let us know about any issues you&apos;re experiencing with your
              hostel. We&apos;ll work to resolve it as quickly as possible.
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

      {renderContent()}
    </div>
  );
}

export default function NewComplaintPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      }
    >
      <NewComplaintForm />
    </Suspense>
  );
}
