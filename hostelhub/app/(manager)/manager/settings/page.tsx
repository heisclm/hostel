"use client";

import { useState, useEffect, useMemo } from "react";

import { motion } from "framer-motion";
import {
  Settings,
  User,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  Save,
  Smartphone,
  Clock,
  Key,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Building2,
  FileText,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth.services";
import { AxiosError } from "axios";

interface ManagerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName: string;
  idNumber: string;
  verified: boolean;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  createdAt: Date;
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

const mockProfile: ManagerProfile = {
  id: "manager1",
  firstName: "Kwame",
  lastName: "Asante",
  email: "kwame.asante@email.com",
  phone: "024 123 4567",
  businessName: "Sunrise Hostel",
  idNumber: "GHA-123456789-0",
  verified: true,
  verificationStatus: "VERIFIED",
  createdAt: new Date("2023-06-15"),
};

function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="h-6 w-40 bg-slate-200 rounded-lg mb-6" />
        <div className="space-y-4">
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  disabled = false,
  error,
  hint,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ElementType;
  disabled?: boolean;
  error?: string;
  hint?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        )}
        <input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full px-4 py-3 rounded-xl border text-sm transition-all",
            Icon && "pl-11",
            isPassword && "pr-11",
            disabled && "bg-slate-50 text-slate-500 cursor-not-allowed",
            error
              ? "border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              : "border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute cursor-pointer right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
      {hint && !error && <p className="text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-500">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        )}
        <div
          className={cn(
            "w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-sm text-slate-600",
            Icon && "pl-11",
          )}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export default function ManagerSettingsPage() {
  const [profile, setProfile] = useState<ManagerProfile>(mockProfile);
  const [isLoading, setIsLoading] = useState(true);

  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [phone, setPhone] = useState(profile.phone);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { refreshUser } = useAuth();

  const memberDays = useMemo(() => {
    const now = new Date();
    return Math.floor(
      (now.getTime() - profile.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );
  }, [profile.createdAt]);

  const passwordStrength = useMemo(() => {
    if (newPassword.length === 0) return { strength: 0, label: "", color: "" };
    if (newPassword.length < 6)
      return { strength: 25, label: "Weak", color: "bg-red-500" };
    if (newPassword.length < 8)
      return { strength: 50, label: "Fair", color: "bg-amber-500" };
    if (newPassword.length < 12)
      return { strength: 75, label: "Good", color: "bg-blue-500" };
    return { strength: 100, label: "Strong", color: "bg-emerald-500" };
  }, [newPassword]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authService.getMe();
        const user = response.data?.user as unknown as ApiUser;

        if (user && user.role === "MANAGER") {
          setProfile({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            businessName: user.managerProfile?.businessName || "",
            idNumber: user.managerProfile?.idNumber || "",
            verified: user.managerProfile?.verified || false,
            verificationStatus:
              user.managerProfile?.verificationStatus || "PENDING",
            createdAt: new Date(user.createdAt),
          });

          setFirstName(user.firstName);
          setLastName(user.lastName);
          setPhone(user.phone);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);

      const response = await authService.updateProfile({
        firstName,
        lastName,
        phone,
        businessName: profile.businessName,
      });

      if (response.success && response.data?.user) {
        const updatedUser = response.data.user as unknown as ApiUser;

        setProfile((prev) => ({
          ...prev,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
        }));

        toast.success("Profile updated successfully");
        refreshUser();
      } else {
        toast.error(response.message || "Update failed");
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.message || "Update failed");
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const validatePassword = () => {
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    try {
      setIsChangingPassword(true);

      const response = await authService.changePassword({
        currentPassword,
        newPassword,
      });

      if (response.success) {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(response.message);
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.message || "Failed to change password");
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const maskGhanaCard = (cardNumber: string) => {
    if (cardNumber.length <= 6) return cardNumber;
    return (
      cardNumber.substring(0, 4) +
      "****" +
      cardNumber.substring(cardNumber.length - 2)
    );
  };

  const hasProfileChanges =
    firstName !== profile.firstName ||
    lastName !== profile.lastName ||
    phone !== profile.phone;

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
        <SettingsSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center">
            <Settings className="w-7 h-7 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
            <p className="text-slate-500">Manage your profile and security</p>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-xl border p-4",
          profile.verificationStatus === "VERIFIED"
            ? "bg-emerald-50 border-emerald-200"
            : profile.verificationStatus === "PENDING"
              ? "bg-amber-50 border-amber-200"
              : "bg-red-50 border-red-200",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              profile.verificationStatus === "VERIFIED"
                ? "bg-emerald-100"
                : profile.verificationStatus === "PENDING"
                  ? "bg-amber-100"
                  : "bg-red-100",
            )}
          >
            {profile.verificationStatus === "VERIFIED" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : profile.verificationStatus === "PENDING" ? (
              <Clock className="w-5 h-5 text-amber-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
          </div>
          <div>
            <h3
              className={cn(
                "font-semibold text-sm",
                profile.verificationStatus === "VERIFIED"
                  ? "text-emerald-800"
                  : profile.verificationStatus === "PENDING"
                    ? "text-amber-800"
                    : "text-red-800",
              )}
            >
              {profile.verificationStatus === "VERIFIED"
                ? "Account Verified"
                : profile.verificationStatus === "PENDING"
                  ? "Verification Pending"
                  : "Verification Rejected"}
            </h3>
            <p
              className={cn(
                "text-xs",
                profile.verificationStatus === "VERIFIED"
                  ? "text-emerald-700"
                  : profile.verificationStatus === "PENDING"
                    ? "text-amber-700"
                    : "text-red-700",
              )}
            >
              {profile.verificationStatus === "VERIFIED"
                ? "Your account is verified and trusted by students"
                : profile.verificationStatus === "PENDING"
                  ? "We're reviewing your documents (1-2 business days)"
                  : "Please contact support for more information"}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-slate-200 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <User className="w-5 h-5 text-primary-600" />
          <h2 className="font-semibold text-slate-800">Profile Information</h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100">
                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary-400 to-primary-600">
                  <span className="text-2xl font-bold text-white">
                    {firstName[0]}
                    {lastName[0]}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="font-medium text-slate-800">
                {profile.firstName} {profile.lastName}
              </p>
              <p className="text-sm text-slate-500">
                Member for {memberDays} days
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <InputField
              label="First Name"
              value={firstName}
              onChange={setFirstName}
              placeholder="Enter your first name"
              icon={User}
            />
            <InputField
              label="Last Name"
              value={lastName}
              onChange={setLastName}
              placeholder="Enter your last name"
              icon={User}
            />
          </div>

          <InputField
            label="Phone Number"
            value={phone}
            onChange={setPhone}
            placeholder="Enter your phone number"
            icon={Phone}
          />

          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">
              Account Details (Read Only)
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <ReadOnlyField
                label="Email Address"
                value={profile.email}
                icon={Mail}
              />
              <ReadOnlyField
                label="Business Name"
                value={profile.businessName}
                icon={Building2}
              />
              <ReadOnlyField
                label="Ghana Card Number"
                value={maskGhanaCard(profile.idNumber)}
                icon={FileText}
              />
              <ReadOnlyField
                label="Member Since"
                value={profile.createdAt.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                icon={Clock}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleSaveProfile}
              disabled={isSavingProfile || !hasProfileChanges}
              className="inline-flex cursor-pointer items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingProfile ? (
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
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-slate-200 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <Shield className="w-5 h-5 text-primary-600" />
          <h2 className="font-semibold text-slate-800">Change Password</h2>
        </div>

        <div className="p-6 space-y-4">
          <InputField
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="Enter your current password"
            icon={Lock}
          />

          <InputField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(val) => {
              setNewPassword(val);
              setPasswordError("");
            }}
            placeholder="Enter your new password"
            icon={Key}
            error={passwordError}
          />

          {newPassword.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Password strength</span>
                <span
                  className={cn(
                    "font-medium",
                    passwordStrength.strength < 50
                      ? "text-red-600"
                      : passwordStrength.strength < 75
                        ? "text-amber-600"
                        : passwordStrength.strength < 100
                          ? "text-blue-600"
                          : "text-emerald-600",
                  )}
                >
                  {passwordStrength.label}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    passwordStrength.color,
                  )}
                  style={{ width: `${passwordStrength.strength}%` }}
                />
              </div>
            </div>
          )}

          <InputField
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(val) => {
              setConfirmPassword(val);
              setPasswordError("");
            }}
            placeholder="Confirm your new password"
            icon={Lock}
          />

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleChangePassword}
              disabled={
                isChangingPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
              className="inline-flex cursor-pointer items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Change Password
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-50 rounded-xl border border-slate-200 p-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-slate-800 text-sm">
              Account Security Tips
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>• Use a strong password with at least 8 characters</li>
              <li>• Include numbers, symbols, and mixed case letters</li>
              <li>• Never share your password with anyone</li>
              <li>• Contact support if you notice suspicious activity</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
