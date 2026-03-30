/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Users,
  CreditCard,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Plus,
  BarChart3,
  HelpCircle,
  Loader2,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoutes";
import toast from "react-hot-toast";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/manager/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "My Hostels", href: "/manager/hostels", icon: Building2 },
      {
        label: "Bookings",
        href: "/manager/bookings",
        icon: Calendar,
      },
      { label: "Tenants", href: "/manager/tenants", icon: Users },
    ],
  },

  {
    title: "Support",
    items: [
      {
        label: "Complaints",
        href: "/manager/complaints",
        icon: MessageSquare,
      },
      { label: "Help Center", href: "/manager/help", icon: HelpCircle },
    ],
  },
];

const verificationConfig = {
  PENDING: {
    label: "Verification Pending",
    shortLabel: "Pending",
    description:
      "Your account is being reviewed by admin. You'll be notified once verified.",
    icon: Loader2,
    iconClass: "animate-spin",
    badgeVariant: "warning" as const,
    headerBg: "bg-amber-50",
    headerBorder: "border-amber-200",
    headerText: "text-amber-700",
    bannerBg: "bg-amber-50",
    bannerBorder: "border-amber-200",
    bannerText: "text-amber-800",
    bannerIcon: ShieldAlert,
  },
  VERIFIED: {
    label: "Verified",
    shortLabel: "Verified",
    description: "Your account has been verified. You can now list hostels.",
    icon: ShieldCheck,
    iconClass: "",
    badgeVariant: "success" as const,
    headerBg: "bg-green-50",
    headerBorder: "border-green-200",
    headerText: "text-green-700",
    bannerBg: "",
    bannerBorder: "",
    bannerText: "",
    bannerIcon: ShieldCheck,
  },
  REJECTED: {
    label: "Verification Rejected",
    shortLabel: "Rejected",
    description:
      "Your verification was rejected. Please contact admin or update your details.",
    icon: ShieldX,
    iconClass: "",
    badgeVariant: "error" as const,
    headerBg: "bg-red-50",
    headerBorder: "border-red-200",
    headerText: "text-red-700",
    bannerBg: "bg-red-50",
    bannerBorder: "border-red-200",
    bannerText: "text-red-800",
    bannerIcon: ShieldX,
  },
};

type VerificationStatus = keyof typeof verificationConfig;

function VerificationBanner({
  status,
  rejectionReason,
}: {
  status: VerificationStatus;
  rejectionReason?: string;
}) {
  const config = verificationConfig[status];

  if (status === "VERIFIED") return null;

  const BannerIcon = config.bannerIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mx-4 lg:mx-6 mt-4 p-4 rounded-xl border",
        config.bannerBg,
        config.bannerBorder,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            status === "PENDING" ? "bg-amber-100" : "bg-red-100",
          )}
        >
          <BannerIcon
            className={cn(
              "w-5 h-5",
              status === "PENDING" ? "text-amber-600" : "text-red-600",
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn("font-semibold text-sm", config.bannerText)}>
            {config.label}
          </h3>
          <p className="text-sm text-slate-600 mt-0.5">{config.description}</p>

          {status === "REJECTED" && rejectionReason && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-red-100">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-red-700">
                    Reason for rejection:
                  </p>
                  <p className="text-sm text-red-600 mt-0.5">
                    {rejectionReason}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mt-3">
            {status === "PENDING" && (
              <span className="text-xs text-amber-600 font-medium">
                This may take 1-2 business days
              </span>
            )}
            {status === "REJECTED" && (
              <Link
                href="/manager/profile"
                className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
              >
                Update Profile →
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface SidebarContentProps {
  pathname: string;
  displayName: string;
  businessName: string;
  verificationStatus: VerificationStatus;
  onNavigate?: () => void;
}

function SidebarContent({
  pathname,
  displayName,
  businessName,
  verificationStatus,
  onNavigate,
}: SidebarContentProps) {
  const isVerified = verificationStatus === "VERIFIED";
  const config = verificationConfig[verificationStatus];
  const StatusIcon = config.icon;

  return (
    <>
      <div className="p-4">
        {isVerified ? (
          <Button
            fullWidth
            asChild
            className="bg-primary-600 hover:bg-primary-700"
          >
            <Link href="/manager/hostels/new" onClick={onNavigate}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Hostel
            </Link>
          </Button>
        ) : (
          <div className="relative">
            <Button
              fullWidth
              disabled
              className="bg-slate-700 text-slate-400 cursor-not-allowed opacity-60"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Hostel
            </Button>
            <p className="text-xs text-slate-500 text-center mt-2">
              {verificationStatus === "PENDING"
                ? "Available after verification"
                : "Verification required"}
            </p>
          </div>
        )}
      </div>

      <div className="px-4 pb-3">
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg",
            verificationStatus === "VERIFIED"
              ? "bg-green-900/30"
              : verificationStatus === "PENDING"
                ? "bg-amber-900/30"
                : "bg-red-900/30",
          )}
        >
          <StatusIcon
            className={cn(
              "w-4 h-4 shrink-0",
              config.iconClass,
              verificationStatus === "VERIFIED"
                ? "text-green-400"
                : verificationStatus === "PENDING"
                  ? "text-amber-400"
                  : "text-red-400",
            )}
          />
          <span
            className={cn(
              "text-xs font-medium",
              verificationStatus === "VERIFIED"
                ? "text-green-400"
                : verificationStatus === "PENDING"
                  ? "text-amber-400"
                  : "text-red-400",
            )}
          >
            {config.shortLabel}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-6">
            <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800",
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <Badge
                        variant={isActive ? "secondary" : "error"}
                        size="sm"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <Link
          href="/manager/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            pathname === "/manager/settings"
              ? "bg-primary-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800",
          )}
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <Avatar name={displayName} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {displayName}
            </p>
            <p className="text-xs text-slate-400 truncate">{businessName}</p>
          </div>
        </div>
      </div>
    </>
  );
}

function ManagerLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, refreshUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const displayName = user ? `${user.firstName} ${user.lastName}` : "Manager";
  const userEmail = user?.email || "";
  const businessName = user?.managerProfile?.businessName || "Hostel Manager";
  const isVerified = user?.managerProfile?.verified || false;
  const verificationStatus = (user?.managerProfile?.verificationStatus ||
    "PENDING") as VerificationStatus;

  useEffect(() => {
    if (verificationStatus !== "PENDING") return;

    const interval = setInterval(() => {
      refreshUser();
    }, 60000);

    return () => clearInterval(interval);
  }, [verificationStatus, refreshUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeAllMenus = useCallback(() => {
    setIsSidebarOpen(false);
    setIsProfileOpen(false);
    setIsNotificationsOpen(false);
  }, []);

  const handleLogout = useCallback(async () => {
    closeAllMenus();
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch {
      toast.error("Failed to log out");
    }
  }, [logout, closeAllMenus]);

  const notifications = [
    {
      id: 1,
      title: "New Booking",
      message: "John Doe booked a single room",
      time: "5 minutes ago",
      read: false,
    },
    {
      id: 2,
      title: "Payment Received",
      message: "Payment of GHS 800 received",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      title: "New Complaint",
      message: "Water supply issue reported",
      time: "2 hours ago",
      read: true,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const vConfig = verificationConfig[verificationStatus];
  const VerificationIcon = vConfig.icon;

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-slate-900 flex-col z-40">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link href="/manager/dashboard" onClick={closeAllMenus}>
            <Logo variant="white" size="md" />
          </Link>
        </div>
        <SidebarContent
          pathname={pathname}
          displayName={displayName}
          businessName={businessName}
          verificationStatus={verificationStatus}
          onNavigate={closeAllMenus}
        />
      </aside>

      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 300,
              }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-slate-900 z-50 lg:hidden overflow-y-auto flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
                <Logo variant="white" size="md" />
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent
                pathname={pathname}
                displayName={displayName}
                businessName={businessName}
                verificationStatus={verificationStatus}
                onNavigate={closeAllMenus}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 mr-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            className={cn(
              "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border",
              vConfig.headerBg,
              vConfig.headerBorder,
              vConfig.headerText,
            )}
          >
            <VerificationIcon
              className={cn("w-3.5 h-3.5", vConfig.iconClass)}
            />
            <span>{vConfig.shortLabel}</span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <div className="relative" ref={notificationsRef}>
            

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-20"
                  >
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                      <h3 className="font-semibold text-slate-800">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <Badge variant="primary" size="sm">
                          {unreadCount} new
                        </Badge>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer",
                            !notification.read && "bg-primary-50/50",
                          )}
                        >
                          <p className="text-sm font-medium text-slate-800">
                            {notification.title}
                          </p>
                          <p className="text-sm text-slate-500 truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                      <Link
                        href="/manager/notifications"
                        className="text-sm text-primary-600 font-medium hover:underline"
                        onClick={() => setIsNotificationsOpen(false)}
                      >
                        View all notifications
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setIsProfileOpen((prev) => !prev);
                  setIsNotificationsOpen(false);
                }}
                className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Avatar name={displayName} size="sm" />
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-slate-400 hidden sm:block transition-transform",
                    isProfileOpen && "rotate-180",
                  )}
                />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20"
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="font-medium text-slate-800">
                        {displayName}
                      </p>

                      <p className="text-sm text-slate-500 break-all">
                        {userEmail}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={vConfig.badgeVariant} size="sm">
                          <VerificationIcon
                            className={cn("w-3 h-3 mr-1", vConfig.iconClass)}
                          />
                          {vConfig.shortLabel}
                        </Badge>
                        {businessName && businessName !== "Hostel Manager" && (
                          <span className="text-xs text-slate-400">
                            {businessName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/manager/profile"
                        onClick={closeAllMenus}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Avatar name={displayName} size="sm" />
                        My Profile
                      </Link>
                      <Link
                        href="/manager/settings"
                        onClick={closeAllMenus}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                    </div>
                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <VerificationBanner
          status={verificationStatus}
          rejectionReason={
            (user?.managerProfile as Record<string, unknown>)
              ?.rejectionReason as string | undefined
          }
        />

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["MANAGER"]}>
      <ManagerLayoutContent>{children}</ManagerLayoutContent>
    </ProtectedRoute>
  );
}
