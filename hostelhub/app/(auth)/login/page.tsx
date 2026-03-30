"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  ArrowRight,
  Building2,
  GraduationCap,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/ui";

type LoginType = "student" | "manager" | "guest";

const loginTypes = [
  {
    type: "student" as LoginType,
    label: "Student",
    icon: GraduationCap,
    description: "Access your hostel bookings",
    accent: "from-primary-500 to-primary-600",
    lightBg: "bg-primary-50",
    lightText: "text-primary-600",
    lightBorder: "border-primary-200",
  },
   {
    type: "guest" as LoginType,
    label: "Guest",
    icon: Users,
    description: "Parents, staff & visitors",
    accent: "from-violet-500 to-violet-600",
    lightBg: "bg-violet-50",
    lightText: "text-violet-600",
    lightBorder: "border-violet-200",
  },
  {
    type: "manager" as LoginType,
    label: "Manager",
    icon: Building2,
    description: "Manage your hostel listings",
    accent: "from-secondary-500 to-secondary-600",
    lightBg: "bg-secondary-50",
    lightText: "text-secondary-600",
    lightBorder: "border-secondary-200",
  },
 
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loginType, setLoginType] = useState<LoginType>("student");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeType = loginTypes.find((t) => t.type === loginType)!;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getLoginAs = (type: LoginType): "STUDENT" | "MANAGER" | "GUEST" => {
    switch (type) {
      case "student":
        return "STUDENT";
      case "manager":
        return "MANAGER";
      case "guest":
        return "GUEST";
      default:
        return "STUDENT";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const loginAs = getLoginAs(loginType);

      const { role } = await login(formData.email, formData.password, loginAs);

      toast.success("Welcome back!");

      if (role === "MANAGER") router.push("/manager/dashboard");
      else if (role === "ADMIN") router.push("/admin/dashboard");
      else if (role === "GUEST") router.push("/");
      else router.push("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const getButtonGradient = () => {
    switch (loginType) {
      case "student":
        return "from-primary-500 to-primary-600";
      case "manager":
        return "from-secondary-500 to-secondary-600";
      case "guest":
        return "from-violet-500 to-violet-600";
      default:
        return "from-primary-500 to-primary-600";
    }
  };

  const getButtonShadow = () => {
    switch (loginType) {
      case "student":
        return "shadow-primary-500/25 hover:shadow-primary-500/30";
      case "manager":
        return "shadow-secondary-500/25 hover:shadow-secondary-500/30";
      case "guest":
        return "shadow-violet-500/25 hover:shadow-violet-500/30";
      default:
        return "shadow-primary-500/25 hover:shadow-primary-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative flex-col overflow-hidden bg-linear-to-br from-slate-900 via-primary-950 to-slate-900">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary-500/20 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent-500/10 rounded-full blur-[60px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size:4rem_4rem" />

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          <Link href="/">
            <Logo variant={"white"} />
          </Link>

          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm mb-8">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-slate-300">
                  Trusted by 500+ CUG Students
                </span>
              </div>

              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
                Your home
                <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-400 to-secondary-400">
                  away from home
                </span>
              </h2>

              <p className="text-slate-400 text-lg leading-relaxed max-w-sm mb-12">
                Discover verified hostels near Catholic University of Ghana.
                Book with confidence, move in stress-free.
              </p>

              <div className="space-y-4">
                {[
                  { icon: ShieldCheck, text: "Verified & trusted listings" },
                  { icon: Sparkles, text: "Instant booking confirmation" },
                  { icon: Building2, text: "50+ hostels near campus" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary-400" />
                    </div>
                    <span className="text-slate-300 text-sm">{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-5"
          >
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className="text-yellow-400 text-sm">
                  ★
                </span>
              ))}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              &quot;Found my perfect hostel in under 10 minutes. The booking
              process was seamless and secure. Highly recommend!&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary-400 to-secondary-400" />
              <div>
                <p className="text-white text-sm font-semibold">Ama Kyei</p>
                <p className="text-slate-500 text-xs">Level 300, CUG</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="lg:hidden flex items-center justify-between p-5 border-b border-slate-100 bg-white">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-linear-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">CUG Hostels</span>
          </Link>
          <Link
            href="/register/student"
            className="text-sm text-primary-600 font-medium hover:text-primary-700"
          >
            Create account
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-5 sm:p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                Welcome back 👋
              </h1>
              <p className="text-slate-500">
                Sign in to continue to your account
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-8">
              {loginTypes.map(
                ({
                  type,
                  label,
                  icon: Icon,
                  description,
                  accent,
                  lightBg,
                  lightText,
                  lightBorder,
                }) => (
                  <button
                    key={type}
                    onClick={() => setLoginType(type)}
                    className={cn(
                      "relative flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-2xl border-2 text-center transition-all duration-200",
                      loginType === type
                        ? `${lightBorder} ${lightBg} shadow-sm`
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    {loginType === type && (
                      <motion.span
                        layoutId="activeTypeDot"
                        className={cn(
                          "absolute top-2 right-2 w-2 h-2 rounded-full bg-linear-to-br",
                          accent
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center",
                        loginType === type
                          ? `bg-linear-to-br ${accent}`
                          : "bg-slate-100"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4",
                          loginType === type ? "text-white" : "text-slate-400"
                        )}
                      />
                    </div>
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        loginType === type ? lightText : "text-slate-700"
                      )}
                    >
                      {label}
                    </p>
                    <p className="text-xs text-slate-400 leading-snug hidden sm:block">
                      {description}
                    </p>
                  </button>
                )
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  leftIcon={<Mail className="w-4 h-4" />}
                  autoComplete="email"
                />

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
                    autoComplete="current-password"
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
              </div>

              <div className="flex items-center justify-between pt-1">
                <Checkbox
                  name="rememberMe"
                  label="Remember me"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                size="lg"
                fullWidth
                isLoading={isLoading}
                className={cn(
                  "relative overflow-hidden bg-linear-to-r shadow-lg transition-shadow hover:shadow-xl",
                  getButtonGradient(),
                  getButtonShadow()
                )}
              >
                {!isLoading && (
                  <>
                    Sign In as {activeType.label}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">
                New to CUG Hostels?
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  href: "/register/student",
                  icon: GraduationCap,
                  label: "Student",
                  sub: "Book a hostel",
                  gradient: "from-primary-400 to-primary-600",
                },
                {
                  href: "/register/guest",
                  icon: Users,
                  label: "Guest",
                  sub: "Parents & more",
                  gradient: "from-violet-400 to-violet-600",
                },
                {
                  href: "/register/manager",
                  icon: Building2,
                  label: "Manager",
                  sub: "List a hostel",
                  gradient: "from-secondary-400 to-secondary-600",
                },
                
              ].map(({ href, icon: Icon, label, sub, gradient }) => (
                <Link key={href} href={href}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 hover:shadow-md transition-all cursor-pointer text-center group"
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl bg-linear-to-br flex items-center justify-center shadow-sm",
                        gradient
                      )}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-primary-600 transition-colors">
                        {label}
                      </p>
                      <p className="text-xs text-slate-400 hidden sm:block">
                        {sub}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>

            <p className="text-center text-xs text-slate-400 mt-8 leading-relaxed">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="text-primary-600 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-primary-600 hover:underline"
              >
                Privacy Policy
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}