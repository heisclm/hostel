"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  MessageSquare,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  Banknote,
  Globe,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoutes";
import { useAdminNavCounts } from "@/hooks/useAdminNavCounts";
import type { AdminNavCounts } from "@/services/admin.service";
import toast from "react-hot-toast";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  countKey?: keyof AdminNavCounts;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Management",
    items: [
      {
        label: "Hostels",
        href: "/admin/hostels",
        icon: Building2,
        countKey: "hostels",
      },
      { label: "Users", href: "/admin/users", icon: Users },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        label: "Payments",
        href: "/admin/payments",
        icon: CreditCard,
        countKey: "payments",
      },
      {
        label: "Disbursements",
        href: "/admin/disbursements",
        icon: Banknote,
        countKey: "disbursements",
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        label: "Complaints",
        href: "/admin/complaints",
        icon: MessageSquare,
        countKey: "complaints",
      },
    ],
  },
];

interface AdminSidebarContentProps {
  pathname: string;
  displayName: string;
  counts: AdminNavCounts;
  onNavigate?: () => void;
}

function AdminSidebarContent({
  pathname,
  displayName,
  counts,
  onNavigate,
}: AdminSidebarContentProps) {
  return (
    <>
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
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

                const badgeCount = item.countKey
                  ? counts[item.countKey]
                  : undefined;

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
                    {badgeCount !== undefined && badgeCount > 0 && (
                      <Badge
                        variant={isActive ? "secondary" : "error"}
                        size="sm"
                      >
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <Avatar name={displayName} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {displayName}
            </p>
            <p className="text-xs text-slate-400 truncate">Super Admin</p>
          </div>
        </div>
      </div>
    </>
  );
}

function getNotificationColor(type: string) {
  switch (type) {
    case "payment":
      return "bg-green-500";
    case "disbursement":
      return "bg-amber-500";
    case "verification":
      return "bg-blue-500";
    case "complaint":
      return "bg-red-500";
    default:
      return "bg-slate-500";
  }
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { counts } = useAdminNavCounts(60_000);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const displayName = user ? `${user.firstName} ${user.lastName}` : "Admin";
  const userEmail = user?.email || "admin@hostelhub.com";

  const pendingDisbursements = counts.disbursements;

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
      title: "New Hostel Submission",
      message: "Grace Hostel submitted for verification",
      time: "10 minutes ago",
      read: false,
      type: "verification",
    },
    {
      id: 2,
      title: "Payment Received",
      message: "GHS 3,500 received from Ama Mensah via MoMo",
      time: "25 minutes ago",
      read: false,
      type: "payment",
    },
    {
      id: 3,
      title: "Disbursement Due",
      message: `${pendingDisbursements} pending disbursements`,
      time: "1 hour ago",
      read: false,
      type: "disbursement",
    },
    {
      id: 4,
      title: "New Complaint",
      message: "Escalated complaint from Sunrise Hostel tenant",
      time: "2 hours ago",
      read: true,
      type: "complaint",
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-slate-900 flex-col z-40">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link href="/admin/dashboard" onClick={closeAllMenus}>
            <Logo variant="white" size="md" />
          </Link>
          <Badge variant="warning" size="sm" className="ml-2">
            Admin
          </Badge>
        </div>
        <AdminSidebarContent
          pathname={pathname}
          displayName={displayName}
          counts={counts}
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
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-slate-900 z-50 lg:hidden overflow-y-auto flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <Logo variant="white" size="md" />
                  <Badge variant="warning" size="sm">
                    Admin
                  </Badge>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <AdminSidebarContent
                pathname={pathname}
                displayName={displayName}
                counts={counts}
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

          <div className="hidden sm:flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-slate-600">
              Admin Panel
            </span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {pendingDisbursements > 0 && (
              <Link
                href="/admin/disbursements"
                onClick={closeAllMenus}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <Banknote className="w-3.5 h-3.5" />
                {pendingDisbursements} Pending
              </Link>
            )}

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
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full mt-1.5 shrink-0",
                                getNotificationColor(notification.type),
                              )}
                            />
                            <div>
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
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                      <Link
                        href="/admin/notifications"
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
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20"
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="font-medium text-slate-800">
                        {displayName}
                      </p>
                      <p className="text-sm text-slate-500">{userEmail}</p>
                      <Badge variant="warning" size="sm" className="mt-1">
                        Super Admin
                      </Badge>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/"
                        onClick={closeAllMenus}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        <Globe className="w-4 h-4" />
                        View Website
                      </Link>
                    </div>
                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full"
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

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </ProtectedRoute>
  );
}
