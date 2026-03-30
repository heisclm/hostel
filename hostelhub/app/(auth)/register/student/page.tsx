"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Building2,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectOption } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { cn } from "@/lib/utils";
import { authService } from "@/services/auth.services";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/ui";

const steps = [
  {
    id: 1,
    title: "Personal Info",
    subtitle: "Tell us about yourself",
    icon: User,
    color: "from-primary-500 to-primary-600",
    lightBg: "bg-primary-50",
    lightText: "text-primary-600",
    lightBorder: "border-primary-200",
  },
  {
    id: 2,
    title: "Academic Info",
    subtitle: "Your university details",
    icon: BookOpen,
    color: "from-secondary-500 to-secondary-600",
    lightBg: "bg-secondary-50",
    lightText: "text-secondary-600",
    lightBorder: "border-secondary-200",
  },
  {
    id: 3,
    title: "Security",
    subtitle: "Secure your account",
    icon: ShieldCheck,
    color: "from-accent-500 to-accent-600",
    lightBg: "bg-accent-50",
    lightText: "text-accent-600",
    lightBorder: "border-accent-200",
  },
];

const levelOptions: SelectOption[] = [
  { value: "100", label: "Level 100" },
  { value: "200", label: "Level 200" },
  { value: "300", label: "Level 300" },
  { value: "400", label: "Level 400" },
  { value: "500", label: "Level 500" },
  { value: "600", label: "Level 600" },
  { value: "700", label: "Level 700" },
  { value: "800", label: "Level 800" },
];

const programmeOptions: SelectOption[] = [
  { value: "cs", label: "Computer Science" },
  { value: "business", label: "Business Administration" },
  { value: "engineering", label: "Engineering" },
  { value: "nursing", label: "Nursing" },
  { value: "law", label: "Law" },
  { value: "arts", label: "Arts & Social Sciences" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
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
  studentId: string;
  level: string;
  programme: string;
  academicYear: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export default function StudentRegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const generateAcademicYearOptions = (): {
    options: SelectOption[];
    currentYear: string;
  } => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const academicYearStart = currentMonth >= 7 ? currentYear : currentYear - 1;
    const currentAcademicYear = `${academicYearStart}/${academicYearStart + 1}`;

    const options: SelectOption[] = [];

    for (let i = -2; i <= 2; i++) {
      const startYear = academicYearStart + i;
      const endYear = startYear + 1;
      const value = `${startYear}/${endYear}`;
      options.push({ value, label: value });
    }

    return { options, currentYear: currentAcademicYear };
  };

  const { options: academicYearOptions, currentYear: defaultAcademicYear } =
    generateAcademicYearOptions();

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    studentId: "",
    level: "",
    programme: "",
    academicYear: defaultAcademicYear,
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user, isAuthenticated, logout: authLogout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      if (!formData.studentId.trim())
        newErrors.studentId = "Student ID is required";
      if (!formData.level) newErrors.level = "Please select your level";
      if (!formData.programme)
        newErrors.programme = "Please select your programme";
    }

    if (step === 3) {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (passwordRequirements.some((r) => !r.test(formData.password))) {
        newErrors.password = "Password does not meet all requirements";
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = "You must agree to the terms and conditions";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep((p) => Math.min(p + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep((p) => Math.max(p - 1, 1));
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePhoneChange = (value: string) => {
    setFormData((prev) => ({ ...prev, phone: value }));
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSwitchAccount = async () => {
    setIsLoggingOut(true);
    try {
      await authLogout();
      toast.success("Signed out. You can now create a new account.");
    } catch {
      toast.error("Failed to sign out");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSubmit = async () => {
    if (currentStep !== 3) return;
    if (!validateStep(3)) return;

    setIsLoading(true);
    try {
      if (isAuthenticated) {
        try {
          await authLogout();
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch {}
      }

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.replace(/\s/g, ""),
        password: formData.password,
        studentId: formData.studentId.trim(),
        level: formData.level,
        programme: formData.programme,
        academicYear: formData.academicYear,
      };

      const response = await authService.registerStudent(payload);

      toast.success(
        response.message || "Account created! Please verify your email.",
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
      } else if (message.toLowerCase().includes("student id")) {
        setErrors((prev) => ({ ...prev, studentId: message }));
        setCurrentStep(2);
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
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
                  onChange={handleInputChange}
                  error={errors.firstName}
                  leftIcon={<User className="w-4 h-4" />}
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  error={errors.lastName}
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                leftIcon={<Mail className="w-4 h-4" />}
                hint="Use your CUG student email if available"
              />

              <PhoneInput
                label="Phone Number"
                value={formData.phone}
                onChange={handlePhoneChange}
                error={errors.phone}
                hint="For booking confirmations via SMS"
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5">
              <Input
                label="Student ID"
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                error={errors.studentId}
                leftIcon={<CreditCard className="w-4 h-4" />}
                hint="Found on your student ID card"
              />

              <Select
                label="Academic Level"
                options={levelOptions}
                value={formData.level}
                onChange={(value) => handleSelectChange("level", value)}
                error={errors.level}
                placeholder="Select your level"
              />

              <Select
                label="Programme"
                options={programmeOptions}
                value={formData.programme}
                onChange={(value) => handleSelectChange("programme", value)}
                error={errors.programme}
                placeholder="Select your programme"
              />

              <Select
                label="Academic Year"
                options={academicYearOptions}
                value={formData.academicYear}
                onChange={(value) => handleSelectChange("academicYear", value)}
                error={errors.academicYear}
                placeholder="Select academic year"
              />

              <div className="flex items-start gap-3 p-4 bg-secondary-50 border border-secondary-200 rounded-2xl">
                <div className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center shrink-0 mt-0.5">
                  <GraduationCap className="w-4 h-4 text-secondary-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-secondary-800 mb-0.5">
                    CUG Students Only
                  </p>
                  <p className="text-xs text-secondary-600 leading-relaxed">
                    This platform is exclusively for Catholic University of Ghana
                    students. Your student ID will be verified during approval.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
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
                          {formData.password ? (
                            met ? (
                              <Check className="w-2.5 h-2.5 text-white" />
                            ) : (
                              <X className="w-2.5 h-2.5 text-white" />
                            )
                          ) : null}
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
                    onChange={handleInputChange}
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

              <div className="pt-1">
                <Checkbox
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleCheckboxChange}
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
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative flex-col overflow-hidden bg-linear-to-br from-slate-900 via-primary-950 to-slate-900">
        <div className="absolute -top-40 -left-40 w-125 h-125 bg-primary-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-accent-500/10 rounded-full blur-[80px]" />

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
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-slate-300">
                  Join 500+ CUG students
                </span>
              </div>

              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
                Start your
                <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-400 to-secondary-400">
                  journey here
                </span>
              </h2>

              <p className="text-slate-400 text-lg leading-relaxed max-w-sm mb-12">
                Create your free account and get instant access to verified
                hostels near Catholic University of Ghana.
              </p>

              <div className="space-y-4">
                {steps.map((step) => {
                  const Icon = step.icon;
                  const isActive = step.id === currentStep;
                  const isDone = step.id < currentStep;

                  return (
                    <motion.div
                      key={step.id}
                      animate={{
                        opacity: isActive ? 1 : isDone ? 0.7 : 0.4,
                        x: isActive ? 0 : 0,
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
                      <div>
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
                        <div className="ml-auto">
                          <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <p className="text-slate-500 text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              Sign in instead
            </Link>
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="lg:hidden flex items-center justify-between p-5 border-b border-slate-100 bg-white shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-linear-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
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
            <AnimatePresence>
              {isAuthenticated && user && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-amber-800 mb-1">
                          Already signed in
                        </p>
                        <p className="text-xs text-amber-700 mb-3">
                          You&apos;re currently signed in as{" "}
                          <span className="font-semibold">
                            {user.firstName} {user.lastName}
                          </span>{" "}
                          ({user.role.toLowerCase()}). Creating a new account
                          will sign you out of the current session.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              router.push(
                                user.role === "MANAGER"
                                  ? "/manager/dashboard"
                                  : user.role === "ADMIN"
                                    ? "/admin/dashboard"
                                    : "/",
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                          >
                            Continue as {user.firstName}
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={handleSwitchAccount}
                            disabled={isLoggingOut}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-amber-700 text-xs font-semibold rounded-lg border border-amber-300 hover:bg-amber-50 transition-colors disabled:opacity-50"
                          >
                            <LogOut className="w-3 h-3" />
                            {isLoggingOut ? "Signing out..." : "Sign out first"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-6 lg:hidden">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      step.id === currentStep
                        ? "flex-1 bg-primary-600"
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

            <div className="hidden lg:flex items-center gap-3 mb-8">
              {steps.map((step, index) => {
                const isDone = step.id < currentStep;
                const isActive = step.id === currentStep;

                return (
                  <div key={step.id} className="flex items-center gap-3 flex-1">
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
                      <div className="flex-1 h-px bg-slate-200 mx-1">
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
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className={cn(
                      "flex items-center gap-2 bg-linear-to-r shadow-lg",
                      activeStep.color,
                      "shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-shadow",
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
                    className="flex items-center gap-2 bg-linear-to-r from-primary-500 to-primary-600 shadow-lg shadow-primary-500/25"
                  >
                    {!isLoading && (
                      <>
                        Create Account
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
