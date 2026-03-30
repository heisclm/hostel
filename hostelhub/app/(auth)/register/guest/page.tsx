"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Building2,
  Users,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  LogOut,
  AlertTriangle,
  Briefcase,
  GraduationCap,
  UserCircle,
  Heart,
  Calendar,
  FileText,
  Building,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectOption } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { cn } from "@/lib/utils";
import { AuthResponse, authService } from "@/services/auth.services";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/ui";

const steps = [
  {
    id: 1,
    title: "Personal Info",
    subtitle: "Tell us about yourself",
    icon: User,
    color: "from-violet-500 to-violet-600",
    lightBg: "bg-violet-50",
    lightText: "text-violet-600",
    lightBorder: "border-violet-200",
  },
  {
    id: 2,
    title: "Guest Details",
    subtitle: "How you'll use HostelHub",
    icon: Users,
    color: "from-purple-500 to-purple-600",
    lightBg: "bg-purple-50",
    lightText: "text-purple-600",
    lightBorder: "border-purple-200",
  },
  {
    id: 3,
    title: "Security",
    subtitle: "Secure your account",
    icon: ShieldCheck,
    color: "from-fuchsia-500 to-fuchsia-600",
    lightBg: "bg-fuchsia-50",
    lightText: "text-fuchsia-600",
    lightBorder: "border-fuchsia-200",
  },
];

const guestTypes = [
  {
    value: "PARENT_GUARDIAN",
    label: "Parent / Guardian",
    description: "Helping a student find accommodation",
    icon: Heart,
    color: "from-rose-500 to-rose-600",
    lightBg: "bg-rose-50",
    lightBorder: "border-rose-200",
    lightText: "text-rose-600",
  },
  {
    value: "UNIVERSITY_STAFF",
    label: "University Staff",
    description: "CUG faculty or administrative staff",
    icon: Briefcase,
    color: "from-blue-500 to-blue-600",
    lightBg: "bg-blue-50",
    lightBorder: "border-blue-200",
    lightText: "text-blue-600",
  },
  {
    value: "PROSPECTIVE_STUDENT",
    label: "Prospective Student",
    description: "Planning for future enrollment",
    icon: GraduationCap,
    color: "from-emerald-500 to-emerald-600",
    lightBg: "bg-emerald-50",
    lightBorder: "border-emerald-200",
    lightText: "text-emerald-600",
  },
  {
    value: "VISITOR",
    label: "Visitor",
    description: "Exploring hostel options",
    icon: UserCircle,
    color: "from-amber-500 to-amber-600",
    lightBg: "bg-amber-50",
    lightBorder: "border-amber-200",
    lightText: "text-amber-600",
  },
];

const relationshipOptions: SelectOption[] = [
  { value: "parent", label: "Parent" },
  { value: "guardian", label: "Guardian" },
  { value: "sponsor", label: "Sponsor" },
  { value: "sibling", label: "Sibling" },
  { value: "relative", label: "Other Relative" },
];

const departmentOptions: SelectOption[] = [
  { value: "administration", label: "Administration" },
  { value: "academic_affairs", label: "Academic Affairs" },
  { value: "student_affairs", label: "Student Affairs" },
  { value: "finance", label: "Finance" },
  { value: "ict", label: "ICT" },
  { value: "library", label: "Library" },
  { value: "security", label: "Security" },
  { value: "maintenance", label: "Maintenance" },
  { value: "faculty", label: "Faculty/Teaching Staff" },
  { value: "other", label: "Other" },
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

const visitPurposeOptions: SelectOption[] = [
  { value: "research", label: "Research" },
  { value: "conference", label: "Conference/Event" },
  { value: "business", label: "Business Visit" },
  { value: "consultation", label: "Consultation" },
  { value: "tourism", label: "Tourism" },
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
  guestType: string;
  beneficiaryName: string;
  beneficiaryPhone: string;
  beneficiaryEmail: string;
  relationshipType: string;
  staffId: string;
  department: string;
  admissionNumber: string;
  expectedMatricDate: string;
  programmeAdmitted: string;
  purpose: string;
  organization: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export default function GuestRegisterPage() {
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
    guestType: "",
    beneficiaryName: "",
    beneficiaryPhone: "",
    beneficiaryEmail: "",
    relationshipType: "",
    staffId: "",
    department: "",
    admissionNumber: "",
    expectedMatricDate: "",
    programmeAdmitted: "",
    purpose: "",
    organization: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user, isAuthenticated, logout: authLogout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const activeStep = steps[currentStep - 1];
  const selectedGuestType = guestTypes.find(
    (t) => t.value === formData.guestType,
  );

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
      if (!formData.guestType) {
        newErrors.guestType = "Please select how you'll use HostelHub";
      }

      if (formData.guestType === "PARENT_GUARDIAN") {
        if (!formData.beneficiaryName.trim())
          newErrors.beneficiaryName = "Student/beneficiary name is required";
        if (!formData.relationshipType)
          newErrors.relationshipType = "Please select your relationship";
      }

      if (formData.guestType === "UNIVERSITY_STAFF") {
        if (!formData.staffId.trim())
          newErrors.staffId = "Staff ID is required";
        if (!formData.department)
          newErrors.department = "Please select your department";
      }

      if (formData.guestType === "PROSPECTIVE_STUDENT") {
        if (!formData.programmeAdmitted)
          newErrors.programmeAdmitted = "Please select your intended programme";
      }

      if (formData.guestType === "VISITOR") {
        if (!formData.purpose)
          newErrors.purpose = "Please select your visit purpose";
      }
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

  const handleGuestTypeSelect = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      guestType: value,
      beneficiaryName: "",
      beneficiaryPhone: "",
      beneficiaryEmail: "",
      relationshipType: "",
      staffId: "",
      department: "",
      admissionNumber: "",
      expectedMatricDate: "",
      programmeAdmitted: "",
      purpose: "",
      organization: "",
    }));
    if (errors.guestType) setErrors((prev) => ({ ...prev, guestType: "" }));
  };

  const handlePhoneChange = (value: string) => {
    setFormData((prev) => ({ ...prev, phone: value }));
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
  };

  const handleBeneficiaryPhoneChange = (value: string) => {
    setFormData((prev) => ({ ...prev, beneficiaryPhone: value }));
    if (errors.beneficiaryPhone)
      setErrors((prev) => ({ ...prev, beneficiaryPhone: "" }));
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

      const basePayload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.replace(/\s/g, ""),
        password: formData.password,
      };

      let response: AuthResponse;

      switch (formData.guestType) {
        case "PARENT_GUARDIAN":
          response = await authService.registerParentGuardian({
            ...basePayload,
            beneficiaryName: formData.beneficiaryName.trim(),
            beneficiaryPhone:
              formData.beneficiaryPhone.replace(/\s/g, "") || "",
            beneficiaryEmail: formData.beneficiaryEmail.trim() || undefined,
            relationshipType: formData.relationshipType,
          });
          break;

        case "UNIVERSITY_STAFF":
          response = await authService.registerUniversityStaff({
            ...basePayload,
            staffId: formData.staffId.trim(),
            department: formData.department,
          });
          break;

        case "PROSPECTIVE_STUDENT":
          response = await authService.registerProspectiveStudent({
            ...basePayload,
            admissionNumber: formData.admissionNumber.trim() || "",
            programmeAdmitted: formData.programmeAdmitted,
            expectedMatricDate: formData.expectedMatricDate || undefined,
          });
          break;

        case "VISITOR":
          response = await authService.registerVisitor({
            ...basePayload,
            purpose: formData.purpose,
            organization: formData.organization.trim() || undefined,
          });
          break;

        default:
          throw new Error("Please select a guest type");
      }

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
      } else if (message.toLowerCase().includes("staff id")) {
        setErrors((prev) => ({ ...prev, staffId: message }));
        setCurrentStep(2);
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderGuestTypeFields = () => {
    switch (formData.guestType) {
      case "PARENT_GUARDIAN":
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5 mt-6 pt-6 border-t border-slate-100"
          >
            <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                <Heart className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-rose-800 mb-0.5">
                  Student Information
                </p>
                <p className="text-xs text-rose-600 leading-relaxed">
                  Tell us about the student you&apos;re helping find
                  accommodation.
                </p>
              </div>
            </div>

            <Input
              label="Student/Beneficiary Name"
              name="beneficiaryName"
              value={formData.beneficiaryName}
              onChange={handleInputChange}
              error={errors.beneficiaryName}
              leftIcon={<User className="w-4 h-4" />}
              placeholder="Full name of the student"
            />

            <Select
              label="Your Relationship"
              options={relationshipOptions}
              value={formData.relationshipType}
              onChange={(value) =>
                handleSelectChange("relationshipType", value)
              }
              error={errors.relationshipType}
              placeholder="Select your relationship"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PhoneInput
                label="Student's Phone (Optional)"
                value={formData.beneficiaryPhone}
                onChange={handleBeneficiaryPhoneChange}
                error={errors.beneficiaryPhone}
              />

              <Input
                label="Student's Email (Optional)"
                type="email"
                name="beneficiaryEmail"
                value={formData.beneficiaryEmail}
                onChange={handleInputChange}
                error={errors.beneficiaryEmail}
                leftIcon={<Mail className="w-4 h-4" />}
                placeholder="student@email.com"
              />
            </div>
          </motion.div>
        );

      case "UNIVERSITY_STAFF":
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5 mt-6 pt-6 border-t border-slate-100"
          >
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <Briefcase className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-0.5">
                  Staff Verification
                </p>
                <p className="text-xs text-blue-600 leading-relaxed">
                  Your staff details will be verified with CUG records.
                </p>
              </div>
            </div>

            <Input
              label="Staff ID"
              name="staffId"
              value={formData.staffId}
              onChange={handleInputChange}
              error={errors.staffId}
              leftIcon={<FileText className="w-4 h-4" />}
              placeholder="Your CUG staff ID"
              hint="Found on your staff ID card"
            />

            <Select
              label="Department"
              options={departmentOptions}
              value={formData.department}
              onChange={(value) => handleSelectChange("department", value)}
              error={errors.department}
              placeholder="Select your department"
            />
          </motion.div>
        );

      case "PROSPECTIVE_STUDENT":
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5 mt-6 pt-6 border-t border-slate-100"
          >
            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800 mb-0.5">
                  Future CUG Student
                </p>
                <p className="text-xs text-emerald-600 leading-relaxed">
                  Plan ahead and explore hostels before you matriculate.
                </p>
              </div>
            </div>

            <Input
              label="Admission Number (Optional)"
              name="admissionNumber"
              value={formData.admissionNumber}
              onChange={handleInputChange}
              error={errors.admissionNumber}
              leftIcon={<FileText className="w-4 h-4" />}
              placeholder="If you have one"
              hint="Leave blank if not yet admitted"
            />

            <Select
              label="Intended Programme"
              options={programmeOptions}
              value={formData.programmeAdmitted}
              onChange={(value) =>
                handleSelectChange("programmeAdmitted", value)
              }
              error={errors.programmeAdmitted}
              placeholder="Select your intended programme"
            />

            <Input
              label="Expected Matriculation Date (Optional)"
              type="date"
              name="expectedMatricDate"
              value={formData.expectedMatricDate}
              onChange={handleInputChange}
              error={errors.expectedMatricDate}
              leftIcon={<Calendar className="w-4 h-4" />}
            />
          </motion.div>
        );

      case "VISITOR":
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5 mt-6 pt-6 border-t border-slate-100"
          >
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <UserCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-0.5">
                  Welcome, Visitor!
                </p>
                <p className="text-xs text-amber-600 leading-relaxed">
                  Explore our hostel listings and find the perfect
                  accommodation.
                </p>
              </div>
            </div>

            <Select
              label="Purpose of Visit"
              options={visitPurposeOptions}
              value={formData.purpose}
              onChange={(value) => handleSelectChange("purpose", value)}
              error={errors.purpose}
              placeholder="Why are you visiting?"
            />

            <Input
              label="Organization (Optional)"
              name="organization"
              value={formData.organization}
              onChange={handleInputChange}
              error={errors.organization}
              leftIcon={<Building className="w-4 h-4" />}
              placeholder="Your company or organization"
            />
          </motion.div>
        );

      default:
        return null;
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
                hint="We'll send verification and updates here"
              />

              <PhoneInput
                label="Phone Number"
                value={formData.phone}
                onChange={handlePhoneChange}
                error={errors.phone}
                hint="For account recovery and notifications"
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  I am a... <span className="text-red-500">*</span>
                </label>
                {errors.guestType && (
                  <p className="text-sm text-red-500 mb-3">
                    {errors.guestType}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {guestTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.guestType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleGuestTypeSelect(type.value)}
                        className={cn(
                          "p-4 rounded-2xl border-2 text-left transition-all group",
                          isSelected
                            ? `${type.lightBorder} ${type.lightBg}`
                            : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br transition-transform group-hover:scale-105",
                              isSelected
                                ? type.color
                                : "from-slate-200 to-slate-300",
                            )}
                          >
                            <Icon
                              className={cn(
                                "w-5 h-5",
                                isSelected ? "text-white" : "text-slate-500",
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "font-semibold text-sm",
                                isSelected ? type.lightText : "text-slate-900",
                              )}
                            >
                              {type.label}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                              {type.description}
                            </p>
                          </div>
                          {isSelected && (
                            <div
                              className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br",
                                type.color,
                              )}
                            >
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {formData.guestType && renderGuestTypeFields()}
              </AnimatePresence>
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

              {selectedGuestType && (
                <div
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border",
                    selectedGuestType.lightBg,
                    selectedGuestType.lightBorder,
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br",
                      selectedGuestType.color,
                    )}
                  >
                    <selectedGuestType.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        selectedGuestType.lightText,
                      )}
                    >
                      Creating {selectedGuestType.label} Account
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedGuestType.description}
                    </p>
                  </div>
                </div>
              )}

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
                        className="text-violet-600 hover:underline font-medium"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="text-violet-600 hover:underline font-medium"
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
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900">
        <div className="absolute -top-40 -left-40 w-125 h-125 bg-violet-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[80px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:4rem_4rem]" />

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          <Link href="/">
            <Logo variant="white" />
          </Link>

          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 mb-8">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-slate-300">
                  Explore CUG Hostels
                </span>
              </div>

              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
                Welcome to
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                  HostelHub
                </span>
              </h2>

              <p className="text-slate-400 text-lg leading-relaxed max-w-sm mb-12">
                Whether you&apos;re a parent, staff member, or prospective
                student, explore verified hostels near Catholic University of
                Ghana.
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-sm">
                {guestTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.guestType === type.value;

                  return (
                    <motion.div
                      key={type.value}
                      animate={{
                        opacity: isSelected ? 1 : 0.5,
                        scale: isSelected ? 1.02 : 1,
                      }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all",
                        isSelected
                          ? "bg-white/15 border-white/25"
                          : "bg-white/5 border-white/10",
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br",
                          isSelected
                            ? type.color
                            : "from-slate-600 to-slate-700",
                        )}
                      >
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isSelected ? "text-white" : "text-slate-400",
                        )}
                      >
                        {type.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <div className="flex items-center gap-4">
            <p className="text-slate-500 text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="lg:hidden flex items-center justify-between p-5 border-b border-slate-100 bg-white shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-violet-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">HostelHub</span>
          </Link>
          <Link
            href="/login"
            className="text-sm text-violet-600 font-medium hover:text-violet-700"
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
                        ? "flex-1 bg-violet-600"
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
                    "w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg",
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
                              ? `bg-gradient-to-br ${step.color} text-white shadow-md`
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
                  <Link
                    href="/register"
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to options
                  </Link>
                )}

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className={cn(
                      "flex items-center gap-2 bg-gradient-to-r shadow-lg",
                      activeStep.color,
                      "shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-shadow",
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
                    className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-violet-600 shadow-lg shadow-violet-500/25"
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
                className="text-violet-600 font-medium hover:underline"
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
