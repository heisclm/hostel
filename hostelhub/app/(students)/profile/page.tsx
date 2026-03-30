"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  Edit2,
  Camera,
  Save,
  X,
  Shield,
  Lock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  BookOpen,
  Clock,
  ArrowRight,
  Loader2,
  PhoneCall,
  Heart,
  Briefcase,
  Building,
  FileText,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  useAuth,
  User as AuthUser,
  type UserRole,
  type GuestType,
} from "@/context/AuthContext";
import { authService, UpdateProfilePayload } from "@/services/auth.services";
import { AxiosError } from "axios";

interface ApiErrorResponse {
  message?: string;
}

const levelOptions = [
  { value: 100, label: "Level 100" },
  { value: 200, label: "Level 200" },
  { value: 300, label: "Level 300" },
  { value: 400, label: "Level 400" },
  { value: 500, label: "Level 500 (Postgraduate)" },
  { value: 600, label: "Level 600" },
  { value: 700, label: "Level 700" },
  { value: 800, label: "Level 800" },
];

const programmeOptions = [
  { value: "Computer Science", label: "Computer Science" },
  { value: "Business Administration", label: "Business Administration" },
  { value: "Engineering", label: "Engineering" },
  { value: "Nursing", label: "Nursing" },
  { value: "Law", label: "Law" },
  { value: "Arts & Social Sciences", label: "Arts & Social Sciences" },
  { value: "Education", label: "Education" },
  { value: "Medicine", label: "Medicine" },
  { value: "Pharmacy", label: "Pharmacy" },
  { value: "Agriculture", label: "Agriculture" },
];

const relationshipOptions = [
  { value: "parent", label: "Parent" },
  { value: "guardian", label: "Guardian" },
  { value: "sponsor", label: "Sponsor" },
  { value: "sibling", label: "Sibling" },
  { value: "relative", label: "Other Relative" },
];

const departmentOptions = [
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

const visitPurposeOptions = [
  { value: "research", label: "Research" },
  { value: "conference", label: "Conference/Event" },
  { value: "business", label: "Business Visit" },
  { value: "consultation", label: "Consultation" },
  { value: "tourism", label: "Tourism" },
  { value: "other", label: "Other" },
];

interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone: string;
  programme: string;
  level: number;
  academicYear: string;
  emergencyContact: string;
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
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.message || error.message || "An unexpected error occurred";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

function buildFormDataFromUser(userData: AuthUser): ProfileFormData {
  return {
    firstName: userData.firstName || "",
    lastName: userData.lastName || "",
    phone: userData.phone || "",
    programme: userData.studentProfile?.programme || "",
    level: userData.studentProfile?.level || 100,
    academicYear: userData.studentProfile?.academicYear || "",
    emergencyContact: userData.studentProfile?.emergencyContact || "",
    beneficiaryName: userData.guestProfile?.beneficiaryName || "",
    beneficiaryPhone: userData.guestProfile?.beneficiaryPhone || "",
    beneficiaryEmail: userData.guestProfile?.beneficiaryEmail || "",
    relationshipType: userData.guestProfile?.relationshipType || "",
    staffId: userData.guestProfile?.staffId || "",
    department: userData.guestProfile?.department || "",
    admissionNumber: userData.guestProfile?.admissionNumber || "",
    expectedMatricDate: userData.guestProfile?.expectedMatricDate || "",
    programmeAdmitted: userData.guestProfile?.programmeAdmitted || "",
    purpose: userData.guestProfile?.purpose || "",
    organization: userData.guestProfile?.organization || "",
  };
}

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "STUDENT":
      return "Student";
    case "GUEST":
      return "Guest";
    case "MANAGER":
      return "Manager";
    case "ADMIN":
      return "Administrator";
    default:
      return "User";
  }
}

function getGuestTypeLabel(guestType: GuestType): string {
  switch (guestType) {
    case "PARENT_GUARDIAN":
      return "Parent/Guardian";
    case "UNIVERSITY_STAFF":
      return "University Staff";
    case "PROSPECTIVE_STUDENT":
      return "Prospective Student";
    case "VISITOR":
      return "Visitor";
    default:
      return "Guest";
  }
}

function getGuestTypeIcon(guestType: GuestType) {
  switch (guestType) {
    case "PARENT_GUARDIAN":
      return Heart;
    case "UNIVERSITY_STAFF":
      return Briefcase;
    case "PROSPECTIVE_STUDENT":
      return GraduationCap;
    case "VISITOR":
      return Users;
    default:
      return User;
  }
}

function getRoleBadgeColor(role: UserRole, guestType?: GuestType): string {
  if (role === "GUEST") {
    switch (guestType) {
      case "PARENT_GUARDIAN":
        return "bg-rose-500/20 border-rose-500/30 text-rose-300";
      case "UNIVERSITY_STAFF":
        return "bg-blue-500/20 border-blue-500/30 text-blue-300";
      case "PROSPECTIVE_STUDENT":
        return "bg-emerald-500/20 border-emerald-500/30 text-emerald-300";
      case "VISITOR":
        return "bg-amber-500/20 border-amber-500/30 text-amber-300";
      default:
        return "bg-violet-500/20 border-violet-500/30 text-violet-300";
    }
  }
  return "bg-primary-500/20 border-primary-500/30 text-primary-300";
}

export default function ProfilePage() {
  const { user, isLoading: authLoading, refreshUser, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [formData, setFormData] = useState<ProfileFormData>(
    buildFormDataFromUser({} as AuthUser),
  );

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const syncFormData = useCallback((userData: AuthUser) => {
    setFormData(buildFormDataFromUser(userData));
  }, []);

  useEffect(() => {
    if (user) {
      syncFormData(user);
    }
  }, [user, syncFormData]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const payload: UpdateProfilePayload = {};

      if (formData.firstName !== user.firstName)
        payload.firstName = formData.firstName;
      if (formData.lastName !== user.lastName)
        payload.lastName = formData.lastName;
      if (formData.phone !== user.phone) payload.phone = formData.phone;

      if (user.role === "STUDENT") {
        if (formData.programme !== (user.studentProfile?.programme || ""))
          payload.programme = formData.programme;
        if (formData.level !== (user.studentProfile?.level || 100))
          payload.level = formData.level;
        if (formData.academicYear !== (user.studentProfile?.academicYear || ""))
          payload.academicYear = formData.academicYear;
        if (
          formData.emergencyContact !==
          (user.studentProfile?.emergencyContact || "")
        )
          payload.emergencyContact = formData.emergencyContact;
      }

      if (user.role === "GUEST" && user.guestProfile) {
        const gp = user.guestProfile;

        if (gp.guestType === "PARENT_GUARDIAN") {
          if (formData.beneficiaryName !== (gp.beneficiaryName || ""))
            payload.beneficiaryName = formData.beneficiaryName;
          if (formData.beneficiaryPhone !== (gp.beneficiaryPhone || ""))
            payload.beneficiaryPhone = formData.beneficiaryPhone;
          if (formData.beneficiaryEmail !== (gp.beneficiaryEmail || ""))
            payload.beneficiaryEmail = formData.beneficiaryEmail;
          if (formData.relationshipType !== (gp.relationshipType || ""))
            payload.relationshipType = formData.relationshipType;
        }

        if (gp.guestType === "UNIVERSITY_STAFF") {
          if (formData.staffId !== (gp.staffId || ""))
            payload.staffId = formData.staffId;
          if (formData.department !== (gp.department || ""))
            payload.department = formData.department;
        }

        if (gp.guestType === "PROSPECTIVE_STUDENT") {
          if (formData.admissionNumber !== (gp.admissionNumber || ""))
            payload.admissionNumber = formData.admissionNumber;
          if (formData.programmeAdmitted !== (gp.programmeAdmitted || ""))
            payload.programmeAdmitted = formData.programmeAdmitted;
          if (formData.expectedMatricDate !== (gp.expectedMatricDate || ""))
            payload.expectedMatricDate = formData.expectedMatricDate;
        }

        if (gp.guestType === "VISITOR") {
          if (formData.purpose !== (gp.purpose || ""))
            payload.purpose = formData.purpose;
          if (formData.organization !== (gp.organization || ""))
            payload.organization = formData.organization;
        }
      }

      const hasChanges = Object.keys(payload).length > 0;
      if (!hasChanges) {
        toast("No changes to save", { icon: "ℹ️" });
        setIsEditing(false);
        return;
      }

      const response = await authService.updateProfile(payload);

      if (response.success) {
        toast.success(response.message || "Profile updated successfully");

        if (response.data?.user) {
          updateUser(response.data.user as unknown as AuthUser);
        } else {
          await refreshUser();
        }

        setIsEditing(false);
      } else {
        toast.error(response.message || "Failed to update profile");
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      syncFormData(user);
    }
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!/\d/.test(passwordData.newPassword)) {
      toast.error("Password must contain at least one number");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.success) {
        toast.success(response.message || "Password changed successfully");
        setIsPasswordModalOpen(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowCurrentPassword(false);
        setShowNewPassword(false);
      } else {
        toast.error(response.message || "Failed to change password");
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-slate-500 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  const fullName = `${user.firstName} ${user.lastName}`;
  const isStudent = user.role === "STUDENT";
  const isGuest = user.role === "GUEST";
  const guestType = user.guestProfile?.guestType;
  const GuestTypeIcon = guestType ? getGuestTypeIcon(guestType) : Users;

  const stats = [
    {
      label: "Student ID",
      value: user.studentProfile?.studentId || "N/A",
      icon: GraduationCap,
      color: "text-primary-600",
      bg: "bg-primary-50",
      border: "border-primary-200",
      show: isStudent,
    },
    {
      label: "Level",
      value: user.studentProfile?.level
        ? `Level ${user.studentProfile.level}`
        : "Not set",
      icon: BookOpen,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      show: isStudent,
    },
    {
      label: "Account Type",
      value: guestType ? getGuestTypeLabel(guestType) : "Guest",
      icon: GuestTypeIcon,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-200",
      show: isGuest,
    },
    {
      label:
        guestType === "UNIVERSITY_STAFF"
          ? "Department"
          : guestType === "PARENT_GUARDIAN"
            ? "Beneficiary"
            : guestType === "PROSPECTIVE_STUDENT"
              ? "Programme"
              : "Organization",
      value:
        guestType === "UNIVERSITY_STAFF"
          ? user.guestProfile?.department || "Not set"
          : guestType === "PARENT_GUARDIAN"
            ? user.guestProfile?.beneficiaryName || "Not set"
            : guestType === "PROSPECTIVE_STUDENT"
              ? user.guestProfile?.programmeAdmitted || "Not set"
              : user.guestProfile?.organization || "Not set",
      icon:
        guestType === "UNIVERSITY_STAFF"
          ? Building
          : guestType === "PARENT_GUARDIAN"
            ? Heart
            : guestType === "PROSPECTIVE_STUDENT"
              ? BookOpen
              : Building,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      show: isGuest,
    },
    {
      label: "Member Since",
      value: new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      icon: Clock,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      show: true,
    },
  ].filter((s) => s.show);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative bg-linear-to-br from-slate-900 via-primary-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size:3rem_3rem" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500/20 rounded-full blur-[80px]" />

        <div className="relative container-custom py-12 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6"
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
              <div className="relative">
                <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-2xl bg-linear-to-br from-primary-400 to-secondary-500 p-1">
                  <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden">
                    <Avatar name={fullName} size="xl" />
                  </div>
                </div>
                <button className="absolute cursor-pointer -bottom-2 -right-2 p-2.5 bg-white text-slate-700 rounded-xl shadow-lg hover:bg-slate-50 transition-colors border border-slate-200">
                  <Camera className="w-4 h-4" />
                </button>
                {user.emailVerified && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="text-center sm:text-left">
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                  {fullName}
                </h1>
                <p className="text-slate-400 mb-3">{user.email}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  {isStudent && user.studentProfile?.studentId && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs font-semibold text-white">
                      <GraduationCap className="w-3.5 h-3.5 text-primary-400" />
                      {user.studentProfile.studentId}
                    </span>
                  )}
                  {isGuest && guestType && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
                        getRoleBadgeColor(user.role, guestType),
                      )}
                    >
                      <GuestTypeIcon className="w-3.5 h-3.5" />
                      {getGuestTypeLabel(guestType)}
                    </span>
                  )}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
                      user.emailVerified
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                        : "bg-amber-500/20 border-amber-500/30 text-amber-300",
                    )}
                  >
                    {user.emailVerified ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Email Not Verified
                      </>
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-xs font-semibold text-white capitalize">
                    {getRoleLabel(user.role)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center sm:justify-start">
              {!isEditing ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsEditing(true)}
                  className="inline-flex cursor-pointer items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-100 transition-colors shadow-lg"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </motion.button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="inline-flex cursor-pointer items-center gap-2 px-5 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex cursor-pointer items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-100 transition-colors shadow-lg disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </motion.button>
                </div>
              )}
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

      <div className="container-custom py-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "grid gap-4 mb-8",
            stats.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3",
          )}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className={cn("p-4 rounded-2xl border", stat.bg, stat.border)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white">
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-slate-900 truncate">
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6"
        >
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              Personal Information
            </h2>
          </div>
          <div className="p-5">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">
                  First Name
                </label>
                {isEditing ? (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <User className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-800 font-medium">
                      {user.firstName}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">
                  Last Name
                </label>
                {isEditing ? (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <User className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-800 font-medium">
                      {user.lastName}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">
                  Email Address
                </label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-800 font-medium">
                    {user.email}
                  </span>
                  {isEditing && (
                    <span className="ml-auto px-2 py-0.5 bg-slate-200 text-slate-500 text-xs font-semibold rounded-full">
                      Cannot change
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="0241234567"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-800 font-medium">
                      {user.phone}
                    </span>
                  </div>
                )}
              </div>

              {isStudent && user.studentProfile?.studentId && (
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-2">
                    Student ID
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <GraduationCap className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-800 font-medium">
                      {user.studentProfile.studentId}
                    </span>
                    <span className="ml-auto px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                      Verified
                    </span>
                  </div>
                </div>
              )}

              {isStudent && (
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-2">
                    Emergency Contact
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <PhoneCall className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.emergencyContact}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            emergencyContact: e.target.value,
                          }))
                        }
                        placeholder="0241234567"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <PhoneCall className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-800 font-medium">
                        {user.studentProfile?.emergencyContact || "Not set"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {isStudent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6"
          >
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary-600" />
                Academic Information
              </h2>
            </div>
            <div className="p-5">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-2">
                    Programme
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.programme}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          programme: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800 appearance-none cursor-pointer"
                    >
                      <option value="">Select programme</option>
                      {programmeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <BookOpen className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-800 font-medium">
                        {user.studentProfile?.programme || "Not set"}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-2">
                    Level
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.level}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          level: parseInt(e.target.value, 10),
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800 appearance-none cursor-pointer"
                    >
                      {levelOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-800 font-medium">
                        {user.studentProfile?.level
                          ? `Level ${user.studentProfile.level}`
                          : "Not set"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-500 mb-2">
                    Academic Year
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={formData.academicYear}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            academicYear: e.target.value,
                          }))
                        }
                        placeholder="2024/2025"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800"
                      />
                      <p className="text-xs text-slate-400 mt-1.5">
                        Format: YYYY/YYYY (e.g., 2024/2025)
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-800 font-medium">
                        {user.studentProfile?.academicYear || "Not set"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {isGuest && guestType === "PARENT_GUARDIAN" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6"
          >
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600" />
                Beneficiary Information
              </h2>
            </div>
            <div className="p-5">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-2">
                    Beneficiary Name
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={formData.beneficiaryName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            beneficiaryName: e.target.value,
                          }))
                        }
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <User className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-800 font-medium">
                        {user.guestProfile?.beneficiaryName || "Not set"}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-2">
                    Relationship
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.relationshipType}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          relationshipType: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800 appearance-none cursor-pointer"
                    >
                      <option value="">Select relationship</option>
                      {relationshipOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <Heart className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-800 font-medium capitalize">
                        {user.guestProfile?.relationshipType || "Not set"}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-2">
                    Beneficiary Phone
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.beneficiaryPhone}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            beneficiaryPhone: e.target.value,
                          }))
                        }
                        placeholder="0241234567"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <Phone className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-800 font-medium">
                        {user.guestProfile?.beneficiaryPhone || "Not set"}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-2">
                    Beneficiary Email
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={formData.beneficiaryEmail}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            beneficiaryEmail: e.target.value,
                          }))
                        }
                        placeholder="student@email.com"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <Mail className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-800 font-medium">
                        {user.guestProfile?.beneficiaryEmail || "Not set"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {isGuest && guestType === "UNIVERSITY_STAFF" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6"
          >
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Staff Information
              </h2>
            </div>
            <div className="p-5">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-2">
                    Staff ID
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={formData.staffId}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            staffId: e.target.value,
                          }))
                        }
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-800 font-medium">
                        {user.guestProfile?.staffId || "Not set"}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-2">
                    Department
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.department}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          department: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800 appearance-none cursor-pointer"
                    >
                      <option value="">Select department</option>
                      {departmentOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <Building className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-800 font-medium capitalize">
                        {user.guestProfile?.department?.replace("_", " ") ||
                          "Not set"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {isGuest && guestType === "PROSPECTIVE_STUDENT" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6"
          >
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                Admission Information
              </h2>
            </div>
            <div className="p-5">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-2">
                    Admission Number
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={formData.admissionNumber}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            admissionNumber: e.target.value,
                          }))
                        }
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-800 font-medium">
                        {user.guestProfile?.admissionNumber || "Not set"}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-2">
                    Programme Admitted
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.programmeAdmitted}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          programmeAdmitted: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800 appearance-none cursor-pointer"
                    >
                      <option value="">Select programme</option>
                      {programmeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <BookOpen className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-800 font-medium">
                        {user.guestProfile?.programmeAdmitted || "Not set"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-500 mb-2">
                    Expected Matriculation Date
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="date"
                        value={formData.expectedMatricDate}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            expectedMatricDate: e.target.value,
                          }))
                        }
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-800 font-medium">
                        {user.guestProfile?.expectedMatricDate
                          ? new Date(
                              user.guestProfile.expectedMatricDate,
                            ).toLocaleDateString()
                          : "Not set"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {isGuest && guestType === "VISITOR" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6"
          >
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                Visit Information
              </h2>
            </div>
            <div className="p-5">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-2">
                    Purpose of Visit
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.purpose}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          purpose: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800 appearance-none cursor-pointer"
                    >
                      <option value="">Select purpose</option>
                      {visitPurposeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-800 font-medium capitalize">
                        {user.guestProfile?.purpose || "Not set"}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-2">
                    Organization
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={formData.organization}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            organization: e.target.value,
                          }))
                        }
                        placeholder="Company or organization name"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <Building className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-800 font-medium">
                        {user.guestProfile?.organization || "Not set"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6"
        >
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600" />
              Security
            </h2>
          </div>
          <div className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Password</p>
                  <p className="text-sm text-slate-500">
                    Change your account password
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsPasswordModalOpen(true)}
                className="inline-flex cursor-pointer items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors"
              >
                Change Password
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-red-100 bg-red-50/50">
            <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h2>
          </div>
          <div className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-red-50 border border-red-100 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white border border-red-200 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Delete Account</p>
                  <p className="text-sm text-slate-500">
                    Permanently delete your account and all data
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex cursor-pointer items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
              >
                Delete Account
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          if (!isChangingPassword) {
            setIsPasswordModalOpen(false);
            setPasswordData({
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
            });
            setShowCurrentPassword(false);
            setShowNewPassword(false);
          }
        }}
        title="Change Password"
        description="Enter your current password and choose a new one"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute cursor-pointer right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showNewPassword ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute cursor-pointer right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Minimum 6 characters, must contain at least one number
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-800"
              />
            </div>
            {passwordData.confirmPassword &&
              passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-xs text-red-500 mt-1.5">
                  Passwords do not match
                </p>
              )}
          </div>
        </div>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsPasswordModalOpen(false);
              setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              });
            }}
            disabled={isChangingPassword}
          >
            Cancel
          </Button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleChangePassword}
            disabled={
              isChangingPassword ||
              !passwordData.currentPassword ||
              !passwordData.newPassword ||
              !passwordData.confirmPassword
            }
            className="inline-flex cursor-pointer items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </motion.button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteConfirmText("");
        }}
        title="Delete Account"
        description="This action cannot be undone"
      >
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 mb-1">
                Are you absolutely sure?
              </p>
              <p className="text-sm text-red-700">
                This will permanently delete your account, all your bookings,
                complaints, and any other data associated with your account.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Type &quot;DELETE&quot; to confirm
          </label>
          <input
            type="text"
            placeholder="DELETE"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-slate-800"
          />
        </div>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setDeleteConfirmText("");
            }}
          >
            Cancel
          </Button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={deleteConfirmText !== "DELETE"}
            className="inline-flex cursor-pointer items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </motion.button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
