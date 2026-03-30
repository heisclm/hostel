"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const { adminLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await adminLogin(formData.email, formData.password);
      toast.success("Welcome back, Admin!");
      router.push("/admin/dashboard");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid credentials";

      if (
        message.toLowerCase().includes("access denied") ||
        message.toLowerCase().includes("administrators")
      ) {
        setErrors({
          general: "Access denied. This portal is for administrators only.",
        });
      } else if (
        message.toLowerCase().includes("not found") ||
        message.toLowerCase().includes("no account")
      ) {
        setErrors({ email: "No admin account found with this email" });
      } else if (
        message.toLowerCase().includes("password") ||
        message.toLowerCase().includes("credentials")
      ) {
        setErrors({ general: "Invalid email or password" });
      } else if (message.toLowerCase().includes("suspended")) {
        setErrors({ general: message });
      } else {
        setErrors({ general: message });
      }

      toast.error(
        message.includes("Access denied")
          ? "Access denied"
          : "Authentication failed",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (errors.general) setErrors((prev) => ({ ...prev, general: "" }));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="relative bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size:3rem_3rem" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500/10 rounded-full blur-[80px]" />

        <div className="relative container-custom py-8">
          <Link href="/">
            <Logo variant={"white"} />
          </Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-linear-to-r from-slate-800 to-slate-900 p-6 text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Admin Portal
              </h1>
              <p className="text-slate-400 text-sm">
                Sign in to access the admin dashboard
              </p>
            </div>

            <div className="p-6 sm:p-8">
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Authentication Failed
                    </p>
                    <p className="text-sm text-red-600">{errors.general}</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      placeholder="admin@hostelhub.com"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className={cn(
                        "w-full pl-12 pr-4 py-3.5 rounded-xl border transition-all text-slate-800 placeholder:text-slate-400",
                        errors.email
                          ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          : "border-slate-200 bg-slate-50 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white",
                      )}
                    />
                    {formData.email && !errors.email && (
                      <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      className={cn(
                        "w-full pl-12 pr-12 py-3.5 rounded-xl border transition-all text-slate-800 placeholder:text-slate-400",
                        errors.password
                          ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          : "border-slate-200 bg-slate-50 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white",
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) =>
                        handleChange("rememberMe", e.target.checked)
                      }
                      className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-slate-600">Remember me</span>
                  </label>
                  <Link
                    href="/admin/forgot-password"
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.01 }}
                  whileTap={{ scale: isLoading ? 1 : 0.99 }}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-base transition-all",
                    isLoading
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-linear-to-r from-slate-800 to-slate-900 text-white hover:from-slate-900 hover:to-slate-800 shadow-lg shadow-slate-900/25",
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Shield className="w-4 h-4" />
                  <span>Protected by HostelHub Security</span>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-slate-500">
              Not an admin?{" "}
              <Link
                href="/login"
                className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Student / Manager Login
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>

      <footer className="py-6 text-center">
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} HostelHub. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
