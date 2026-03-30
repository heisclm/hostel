"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Building2,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  FileText,
  Upload,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  ClipboardList,
  BadgeCheck,
  Phone,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { cn } from "@/lib/utils";
import { authService } from "@/services/auth.services";
import { Logo } from "@/components/ui";

const steps = [
  {
    id: 1,
    title: "Personal Info",
    subtitle: "Your contact details",
    icon: User,
    color: "from-primary-500 to-primary-600",
    lightBg: "bg-primary-50",
    lightText: "text-primary-600",
    lightBorder: "border-primary-200",
    ringColor: "ring-primary-500",
  },
  {
    id: 2,
    title: "Business Info",
    subtitle: "About your hostel",
    icon: Building2,
    color: "from-secondary-500 to-secondary-600",
    lightBg: "bg-secondary-50",
    lightText: "text-secondary-600",
    lightBorder: "border-secondary-200",
    ringColor: "ring-secondary-500",
  },
  {
    id: 3,
    title: "Verification",
    subtitle: "Identity & documents",
    icon: BadgeCheck,
    color: "from-violet-500 to-violet-600",
    lightBg: "bg-violet-50",
    lightText: "text-violet-600",
    lightBorder: "border-violet-200",
    ringColor: "ring-violet-500",
  },
  {
    id: 4,
    title: "Security",
    subtitle: "Secure your account",
    icon: ShieldCheck,
    color: "from-accent-500 to-accent-600",
    lightBg: "bg-accent-50",
    lightText: "text-accent-600",
    lightBorder: "border-accent-200",
    ringColor: "ring-accent-500",
  },
];

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "Uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "Contains a number", test: (p) => /\d/.test(p) },
];

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName: string;
  businessAddress: string;
  businessDescription: string;
  idType: string;
  idNumber: string;
  idDocument: File | null;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  agreeToManagerTerms: boolean;
}

function FileUploadCard({
  label,
  optional,
  file,
  error,
  onChange,
}: {
  label: string;
  optional?: boolean;
  file: File | null;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {optional && (
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            Optional
          </span>
        )}
      </div>
      <label
        className={cn(
          "group flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl cursor-pointer transition-all",
          error
            ? "border-red-300 bg-red-50"
            : file
              ? "border-green-300 bg-green-50"
              : "border-slate-200 bg-slate-50 hover:border-primary-300 hover:bg-primary-50/50",
        )}
      >
        <div className="flex flex-col items-center gap-2 text-center px-4">
          {file ? (
            <>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-green-700 truncate max-w-50">
                {file.name}
              </p>
              <p className="text-xs text-green-500">Click to replace</p>
            </>
          ) : (
            <>
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  error
                    ? "bg-red-100"
                    : "bg-slate-100 group-hover:bg-primary-100",
                )}
              >
                <Upload
                  className={cn(
                    "w-5 h-5 transition-colors",
                    error
                      ? "text-red-400"
                      : "text-slate-400 group-hover:text-primary-500",
                  )}
                />
              </div>
              <div>
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-primary-600">
                    Click to upload
                  </span>{" "}
                  or drag & drop
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  PNG, JPG or PDF — max 5MB
                </p>
              </div>
            </>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          accept="image/*,.pdf"
          onChange={onChange}
        />
      </label>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function ManagerRegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    businessName: "",
    businessAddress: "",
    businessDescription: "",
    idType: "ghana_card",
    idNumber: "",
    idDocument: null,
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    agreeToManagerTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeStep = steps[currentStep - 1];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim())
        newErrors.firstName = "First name is required";
      if (!formData.lastName.trim())
        newErrors.lastName = "Last name is required";
      if (!formData.email) {
        newErrors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Please enter a valid email";
      }
      if (!formData.phone) {
        newErrors.phone = "Phone number is required";
      } else if (!/^0[235]\d{8}$/.test(formData.phone.replace(/\s/g, ""))) {
        newErrors.phone = "Please enter a valid Ghana phone number";
      }
    }

    if (step === 2) {
      if (!formData.businessName.trim())
        newErrors.businessName = "Business name is required";
      if (!formData.businessAddress.trim())
        newErrors.businessAddress = "Address is required";
      if (!formData.businessDescription.trim()) {
        newErrors.businessDescription = "Description is required";
      } else if (formData.businessDescription.length < 50) {
        newErrors.businessDescription =
          "Description must be at least 50 characters";
      }
    }

    if (step === 3) {
      if (!formData.idNumber.trim()) {
        newErrors.idNumber = "ID number is required";
      } else if (formData.idType === "ghana_card") {
        if (!/^GHA-\d{9}-\d$/.test(formData.idNumber)) {
          newErrors.idNumber =
            "Format: GHA-XXXXXXXXX-X (e.g., GHA-123456789-0)";
        }
      } else if (formData.idType === "passport") {
        if (!/^[A-Z0-9]{6,12}$/i.test(formData.idNumber)) {
          newErrors.idNumber = "Passport must be 6-12 alphanumeric characters";
        }
      }
      if (!formData.idDocument) {
        newErrors.idDocument = "ID document is required";
      }
    }

    if (step === 4) {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (passwordRequirements.some((r) => !r.test(formData.password))) {
        newErrors.password = "Password does not meet all requirements";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
      if (!formData.agreeToTerms)
        newErrors.agreeToTerms = "You must agree to the terms";
      if (!formData.agreeToManagerTerms)
        newErrors.agreeToManagerTerms = "You must agree to the manager terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    console.log("handleNext called, currentStep:", currentStep);
    if (validateStep(currentStep)) setCurrentStep((p) => Math.min(p + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep((p) => Math.max(p - 1, 1));
    setErrors({});
  };

  const handleSubmit = async () => {
    console.log("handleSubmit called, currentStep:", currentStep);

    if (currentStep !== 4) return;

    if (!validateStep(4)) return;

    if (!formData.idDocument) {
      setErrors((prev) => ({
        ...prev,
        idDocument: "ID document is required",
      }));
      setCurrentStep(3);
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.replace(/\s/g, ""),
        password: formData.password,
        businessName: formData.businessName.trim(),
        businessAddress: formData.businessAddress.trim(),
        businessDescription: formData.businessDescription.trim(),
        idType: formData.idType,
        idNumber: formData.idNumber.trim(),
      };

      const response = await authService.registerManager(
        payload,
        formData.idDocument,
      );

      toast.success(
        response.message ||
          "Application submitted! We'll review it within 24-48 hours.",
        { duration: 6000 },
      );
      router.push("/login");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.";

      if (message.toLowerCase().includes("email")) {
        setErrors((prev) => ({ ...prev, email: message }));
        setCurrentStep(1);
      } else if (message.toLowerCase().includes("phone")) {
        setErrors((prev) => ({ ...prev, phone: message }));
        setCurrentStep(1);
      } else if (
        message.toLowerCase().includes("id number") ||
        message.toLowerCase().includes("id card")
      ) {
        setErrors((prev) => ({ ...prev, idNumber: message }));
        setCurrentStep(3);
      } else if (message.toLowerCase().includes("business name")) {
        setErrors((prev) => ({ ...prev, businessName: message }));
        setCurrentStep(2);
      } else if (
        message.toLowerCase().includes("document") ||
        message.toLowerCase().includes("image")
      ) {
        setErrors((prev) => ({ ...prev, idDocument: message }));
        setCurrentStep(3);
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked =
      "checked" in e.target
        ? (e.target as HTMLInputElement).checked
        : undefined;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "idDocument",
  ) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      const maxSize = 5 * 1024 * 1024;
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];

      if (file.size > maxSize) {
        setErrors((prev) => ({
          ...prev,
          [field]: "File size must be less than 5MB",
        }));
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          [field]: "Only PNG, JPG, and PDF files are allowed",
        }));
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [field]: file }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const renderStep = () => {
    const variants = {
      enter: { opacity: 0, x: 30 },
      center: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -30 },
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                  leftIcon={<User className="w-4 h-4" />}
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <PhoneInput
                label="Phone Number"
                value={formData.phone}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, phone: value }));
                  if (errors.phone)
                    setErrors((prev) => ({ ...prev, phone: "" }));
                }}
                error={errors.phone}
                hint="For verification and notifications"
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5">
              <Input
                label="Business / Hostel Name"
                name="businessName"
                placeholder="e.g., Sunrise Hostel"
                value={formData.businessName}
                onChange={handleChange}
                error={errors.businessName}
                leftIcon={<Building2 className="w-4 h-4" />}
              />

              <Input
                label="Business Address"
                name="businessAddress"
                placeholder="e.g., Near CUG Main Gate, Miotso"
                value={formData.businessAddress}
                onChange={handleChange}
                error={errors.businessAddress}
                leftIcon={<MapPin className="w-4 h-4" />}
              />

              <Textarea
                label="Business Description"
                name="businessDescription"
                placeholder="Describe your hostel, facilities, and what makes it unique for CUG students..."
                value={formData.businessDescription}
                onChange={handleChange}
                error={errors.businessDescription}
                rows={4}
                showCount
                maxLength={500}
              />

              <div className="flex items-start gap-3 p-4 bg-secondary-50 border border-secondary-200 rounded-2xl">
                <div className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-secondary-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-secondary-800 mb-0.5">
                    Tips for a great listing
                  </p>
                  <p className="text-xs text-secondary-600 leading-relaxed">
                    Include details about room types, distance from campus,
                    available facilities, and pricing. This helps students make
                    informed decisions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200 rounded-2xl">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-violet-800 mb-0.5">
                    Why we verify
                  </p>
                  <p className="text-xs text-violet-600 leading-relaxed">
                    To protect our students, all hostel managers must verify
                    their identity. Your documents are stored securely and
                    reviewed within 24–48 hours.
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  ID Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "ghana_card", label: "Ghana Card", icon: "🪪" },
                    { value: "passport", label: "Passport", icon: "📘" },
                  ].map((option) => {
                    const selected = formData.idType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            idType: option.value,
                          }))
                        }
                        className={cn(
                          "flex items-center gap-3 p-3.5 rounded-2xl border-2 text-sm font-medium transition-all",
                          selected
                            ? "border-violet-400 bg-violet-50 text-violet-700 shadow-sm"
                            : "border-slate-200 text-slate-600 hover:border-slate-300",
                        )}
                      >
                        <span className="text-xl">{option.icon}</span>
                        {option.label}
                        {selected && (
                          <div className="ml-auto w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Input
                label="ID Number"
                name="idNumber"
                placeholder={
                  formData.idType === "ghana_card"
                    ? "GHA-XXXXXXXXX-X"
                    : "Passport number"
                }
                value={formData.idNumber}
                onChange={handleChange}
                error={errors.idNumber}
                leftIcon={<FileText className="w-4 h-4" />}
              />

              <FileUploadCard
                label="Upload ID Document"
                file={formData.idDocument}
                error={errors.idDocument}
                onChange={(e) => handleFileChange(e, "idDocument")}
              />

              
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    leftIcon={<Lock className="w-4 h-4" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-8.5 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <PasswordStrength
                  password={formData.password}
                  className="mt-3"
                />

                <div className="grid grid-cols-2 gap-2 mt-3">
                  {passwordRequirements.map((req) => {
                    const met = req.test(formData.password);
                    return (
                      <div
                        key={req.label}
                        className={cn(
                          "flex items-center gap-2 text-xs px-3 py-2 rounded-xl border transition-all",
                          formData.password
                            ? met
                              ? "bg-green-50 border-green-200 text-green-700"
                              : "bg-red-50 border-red-200 text-red-600"
                            : "bg-slate-50 border-slate-200 text-slate-400",
                        )}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
                            formData.password
                              ? met
                                ? "bg-green-500"
                                : "bg-red-400"
                              : "bg-slate-300",
                          )}
                        >
                          {formData.password &&
                            (met ? (
                              <Check className="w-2.5 h-2.5 text-white" />
                            ) : (
                              <X className="w-2.5 h-2.5 text-white" />
                            ))}
                        </div>
                        {req.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="relative">
                  <Input
                    label="Confirm Password"
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    leftIcon={<Lock className="w-4 h-4" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-8.5 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {formData.confirmPassword && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-center gap-2 text-xs mt-2 px-3 py-2 rounded-xl border",
                      formData.password === formData.confirmPassword
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-red-50 border-red-200 text-red-600",
                    )}
                  >
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Passwords match
                      </>
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5" /> Passwords do not match
                      </>
                    )}
                  </motion.div>
                )}
              </div>

              <div className="space-y-3 pt-1">
                <Checkbox
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  error={errors.agreeToTerms}
                  label={
                    <span className="text-sm text-slate-600">
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-primary-600 hover:underline font-medium"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="text-primary-600 hover:underline font-medium"
                      >
                        Privacy Policy
                      </Link>
                    </span>
                  }
                />

                <Checkbox
                  name="agreeToManagerTerms"
                  checked={formData.agreeToManagerTerms}
                  onChange={handleChange}
                  error={errors.agreeToManagerTerms}
                  label={
                    <span className="text-sm text-slate-600">
                      I confirm all information is accurate and agree to the{" "}
                      <Link
                        href="/manager-agreement"
                        className="text-primary-600 hover:underline font-medium"
                      >
                        Hostel Manager Agreement
                      </Link>
                    </span>
                  }
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-sm font-semibold text-slate-800 mb-3">
                  What happens next?
                </p>
                <div className="space-y-3">
                  {[
                    {
                      icon: ClipboardList,
                      text: "We review your application within 24–48 hours",
                      color: "text-primary-600 bg-primary-100",
                    },
                    {
                      icon: Phone,
                      text: "You'll receive an SMS confirmation once approved",
                      color: "text-secondary-600 bg-secondary-100",
                    },
                    {
                      icon: Building2,
                      text: "Log in and start adding your hostel listings",
                      color: "text-accent-600 bg-accent-100",
                    },
                  ].map(({ icon: Icon, text, color }, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                          color,
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pt-1">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="hidden lg:flex lg:w-[42%] xl:w-[45%] relative flex-col overflow-hidden bg-linear-to-br from-slate-900 via-secondary-950 to-slate-900">
        <div className="absolute -top-40 -left-40 w-125 h-125 bg-secondary-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size:4rem_4rem" />

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          <Link href="/">
            <Logo variant={"white"} />
          </Link>

          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 mb-8">
                <Building2 className="w-4 h-4 text-secondary-400" />
                <span className="text-sm text-slate-300">
                  For Hostel Managers
                </span>
              </div>

              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
                List your hostel,
                <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-secondary-400 to-primary-400">
                  grow your business
                </span>
              </h2>

              <p className="text-slate-400 text-lg leading-relaxed max-w-sm mb-12">
                Reach hundreds of CUG students looking for quality
                accommodation. Manage bookings, get paid securely, and grow your
                occupancy.
              </p>

              <div className="space-y-3">
                {steps.map((step) => {
                  const Icon = step.icon;
                  const isActive = step.id === currentStep;
                  const isDone = step.id < currentStep;

                  return (
                    <motion.div
                      key={step.id}
                      animate={{
                        opacity: isActive ? 1 : isDone ? 0.7 : 0.35,
                      }}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                        isActive
                          ? "bg-white/10 border-white/20"
                          : isDone
                            ? "bg-white/5 border-white/10"
                            : "bg-transparent border-transparent",
                      )}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-linear-to-br",
                          isDone
                            ? "from-green-400 to-green-600"
                            : isActive
                              ? step.color
                              : "from-slate-600 to-slate-700",
                        )}
                      >
                        {isDone ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <Icon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            isActive ? "text-white" : "text-slate-400",
                          )}
                        >
                          Step {step.id}: {step.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {step.subtitle}
                        </p>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 rounded-full bg-secondary-400 animate-pulse" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4"
          >
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">
                Verified Manager Badge
              </p>
              <p className="text-slate-500 text-xs mt-0.5">
                Earn a verified badge after approval — builds trust with
                students.
              </p>
            </div>
          </motion.div>

          <p className="text-slate-500 text-sm mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-secondary-400 hover:text-secondary-300 font-medium transition-colors"
            >
              Sign in instead
            </Link>
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="lg:hidden flex items-center justify-between p-5 border-b border-slate-100 bg-white shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-linear-to-br from-secondary-400 to-secondary-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">HostelHub</span>
          </Link>
          <Link
            href="/login"
            className="text-sm text-primary-600 font-medium hover:text-primary-700"
          >
            Sign in
          </Link>
        </div>

        <div className="flex-1 flex items-start justify-center p-5 sm:p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg"
          >
            <div className="mb-8">
              <div className="flex items-center gap-1.5 mb-6 lg:hidden">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      step.id === currentStep
                        ? "flex-1 bg-secondary-500"
                        : step.id < currentStep
                          ? "w-8 bg-green-500"
                          : "w-8 bg-slate-200",
                    )}
                  />
                ))}
              </div>

              <div className="flex items-center gap-4 mb-2">
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center bg-linear-to-br shadow-lg",
                    activeStep.color,
                  )}
                >
                  <activeStep.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Step {currentStep} of {steps.length}
                  </p>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {activeStep.title}
                  </h1>
                </div>
              </div>
              <p className="text-slate-500 text-sm ml-16">
                {activeStep.subtitle}
              </p>
            </div>

            <div className="hidden lg:flex items-center gap-2 mb-8 overflow-x-auto pb-1">
              {steps.map((step, index) => {
                const isDone = step.id < currentStep;
                const isActive = step.id === currentStep;

                return (
                  <div
                    key={step.id}
                    className="flex items-center gap-2 flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                          isDone
                            ? "bg-green-500 text-white"
                            : isActive
                              ? `bg-linear-to-br ${step.color} text-white shadow-md`
                              : "bg-slate-100 text-slate-400",
                        )}
                      >
                        {isDone ? <Check className="w-4 h-4" /> : step.id}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium whitespace-nowrap",
                          isActive
                            ? "text-slate-800"
                            : isDone
                              ? "text-green-600"
                              : "text-slate-400",
                        )}
                      >
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex-1 h-px bg-slate-200 mx-1 min-w-4">
                        <div
                          className={cn(
                            "h-full bg-green-400 transition-all duration-500",
                            isDone ? "w-full" : "w-0",
                          )}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
              {renderStep()}

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBack}
                    className="flex items-center gap-2 text-slate-600"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className={cn(
                      "flex items-center gap-2 bg-linear-to-r shadow-lg transition-shadow",
                      activeStep.color,
                      "hover:shadow-xl",
                    )}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    isLoading={isLoading}
                    className="flex items-center gap-2 bg-linear-to-r from-secondary-500 to-secondary-600 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    {!isLoading && (
                      <>
                        Submit Application
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            <p className="text-center text-sm text-slate-500 mt-6 lg:hidden">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary-600 font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
