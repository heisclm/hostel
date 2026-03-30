"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  Bell,
  User,
  Settings,
  LogOut,
  BookOpen,
  Heart,
  CreditCard,
  HelpCircle,
  Loader2,
  Book,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { useAuth, type UserRole, type GuestType } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Browse Hostels", href: "/hostels" },
  { label: "How It Works", href: "/#how-it-works" },
];

const userMenuItems = [
  {
    label: "My Profile",
    href: "/profile",
    icon: User,
    description: "View and edit your profile",
  },
  {
    label: "My Bookings",
    href: "/bookings",
    icon: BookOpen,
    description: "Track your hostel bookings",
  },
  {
    label: "Saved Hostels",
    href: "/saved",
    icon: Heart,
    description: "Your favorite hostels",
  },
  {
    label: "Complaint",
    href: "/complaints",
    icon: Book,
    description: "Report complaints about your hostel",
  },
  {
    label: "Payments",
    href: "/payments",
    icon: CreditCard,
    description: "Payment history & receipts",
  },
  
];

interface HeaderProps {
  variant?: "default" | "transparent";
}

const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case "STUDENT":
      return "Student";
    case "MANAGER":
      return "Manager";
    case "ADMIN":
      return "Administrator";
    case "GUEST":
      return "Guest";
    default:
      return "User";
  }
};

const getGuestTypeLabel = (guestType: GuestType): string => {
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
};

const getRoleBadgeStyles = (role: UserRole): string => {
  switch (role) {
    case "STUDENT":
      return "bg-primary-100 text-primary-700";
    case "MANAGER":
      return "bg-secondary-100 text-secondary-700";
    case "ADMIN":
      return "bg-red-100 text-red-700";
    case "GUEST":
      return "bg-violet-100 text-violet-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

export function Header({ variant = "default" }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const isHomePage = pathname === "/";
  const useTransparentHeader =
    variant === "transparent" && isHomePage && !isScrolled;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeAllMenus = useCallback(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
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

  const displayName = user ? `${user.firstName} ${user.lastName}` : "User";
  const roleLabel = user ? getRoleLabel(user.role) : "User";
  const roleBadgeStyles = user ? getRoleBadgeStyles(user.role) : "";

  const getUserIdentifier = () => {
    if (!user) return null;

    if (user.role === "STUDENT" && user.studentProfile) {
      return {
        primary: user.studentProfile.studentId,
        secondary: user.studentProfile.level
          ? `Level ${user.studentProfile.level}`
          : null,
      };
    }

    if (user.role === "GUEST" && user.guestProfile) {
      const guestTypeLabel = getGuestTypeLabel(user.guestProfile.guestType);

      switch (user.guestProfile.guestType) {
        case "PARENT_GUARDIAN":
          return {
            primary: guestTypeLabel,
            secondary: user.guestProfile.beneficiaryName
              ? `For: ${user.guestProfile.beneficiaryName}`
              : null,
          };
        case "UNIVERSITY_STAFF":
          return {
            primary: user.guestProfile.staffId || guestTypeLabel,
            secondary: user.guestProfile.department || null,
          };
        case "PROSPECTIVE_STUDENT":
          return {
            primary: guestTypeLabel,
            secondary: user.guestProfile.programmeAdmitted || null,
          };
        case "VISITOR":
          return {
            primary: guestTypeLabel,
            secondary: user.guestProfile.organization || null,
          };
        default:
          return { primary: guestTypeLabel, secondary: null };
      }
    }

    if (user.role === "MANAGER" && user.managerProfile) {
      return {
        primary: user.managerProfile.businessName || "Manager",
        secondary: user.managerProfile.verified ? "Verified" : "Pending",
      };
    }

    return null;
  };

  const userIdentifier = getUserIdentifier();

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        useTransparentHeader
          ? "bg-transparent py-4"
          : "bg-white/95 backdrop-blur-lg shadow-sm py-3 border-b border-slate-100"
      )}
    >
      <div className="container-custom">
        <nav className="flex items-center justify-between">
          <Link href="/" onClick={closeAllMenus}>
            <Logo variant={useTransparentHeader ? "white" : "default"} />
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeAllMenus}
                className={cn(
                  "text-sm font-medium transition-colors relative group",
                  useTransparentHeader
                    ? "text-white/90 hover:text-white"
                    : "text-slate-600 hover:text-primary-600",
                  pathname === item.href &&
                    (useTransparentHeader ? "text-white" : "text-primary-600")
                )}
              >
                {item.label}
                {pathname === item.href && (
                  <motion.div
                    layoutId="activeNav"
                    className={cn(
                      "absolute -bottom-1 left-0 right-0 h-0.5 rounded-full",
                      useTransparentHeader ? "bg-white" : "bg-primary-600"
                    )}
                  />
                )}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {isLoading ? (
              <div className="flex items-center gap-2 px-4 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              </div>
            ) : isAuthenticated && user ? (
              <>
                

                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                    className={cn(
                      "flex items-center gap-2.5 p-1.5 pr-3 rounded-xl transition-colors",
                      isProfileMenuOpen
                        ? "bg-slate-100"
                        : useTransparentHeader
                          ? "hover:bg-white/10"
                          : "hover:bg-slate-100"
                    )}
                  >
                    <Avatar name={displayName} size="sm" />
                    <div className="text-left hidden xl:block">
                      <p
                        className={cn(
                          "text-sm font-semibold leading-tight",
                          useTransparentHeader
                            ? "text-white"
                            : "text-slate-800"
                        )}
                      >
                        {user.firstName}
                      </p>
                      <p
                        className={cn(
                          "text-xs leading-tight",
                          useTransparentHeader
                            ? "text-white/60"
                            : "text-slate-400"
                        )}
                      >
                        {roleLabel}
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform",
                        isProfileMenuOpen && "rotate-180",
                        useTransparentHeader
                          ? "text-white/70"
                          : "text-slate-400"
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
                      >
                        <div className="p-4 bg-slate-50 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <Avatar name={displayName} size="md" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {displayName}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          {userIdentifier && (
                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                              <span
                                className={cn(
                                  "text-xs px-2 py-0.5 rounded-full font-medium",
                                  roleBadgeStyles
                                )}
                              >
                                {userIdentifier.primary}
                              </span>
                              {userIdentifier.secondary && (
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                  {userIdentifier.secondary}
                                </span>
                              )}
                            </div>
                          )}
                          {!userIdentifier && (
                            <div className="mt-3">
                              <span
                                className={cn(
                                  "text-xs px-2 py-0.5 rounded-full font-medium",
                                  roleBadgeStyles
                                )}
                              >
                                {roleLabel}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-2">
                          {userMenuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={closeAllMenus}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                                  pathname === item.href
                                    ? "bg-primary-50 text-primary-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                              >
                                <div
                                  className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                    pathname === item.href
                                      ? "bg-primary-100"
                                      : "bg-slate-100"
                                  )}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-medium">{item.label}</p>
                                  <p className="text-xs text-slate-400">
                                    {item.description}
                                  </p>
                                </div>
                              </Link>
                            );
                          })}
                        </div>

                        <div className="p-2 border-t border-slate-100">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                              <LogOut className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium">Sign Out</p>
                              <p className="text-xs text-red-400">
                                Log out of your account
                              </p>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="md"
                  className={cn(
                    useTransparentHeader
                      ? "text-white hover:bg-white/10"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                  asChild
                >
                  <Link href="/login">Log In</Link>
                </Button>
                <Button
                  variant={useTransparentHeader ? "secondary" : "primary"}
                  size="md"
                  asChild
                >
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className={cn(
              "lg:hidden p-2 rounded-lg transition-colors",
              useTransparentHeader
                ? "hover:bg-white/10 text-white"
                : "hover:bg-slate-100 text-slate-600"
            )}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </nav>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden"
            >
              <div
                className={cn(
                  "py-4 space-y-1 mt-4 rounded-xl",
                  useTransparentHeader
                    ? "bg-white/10 backdrop-blur-lg"
                    : "bg-slate-50"
                )}
              >
                {!isLoading && isAuthenticated && user && (
                  <div className="px-4 pb-3 mb-2 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <Avatar name={displayName} size="md" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {displayName}
                        </p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    {userIdentifier && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            roleBadgeStyles
                          )}
                        >
                          {userIdentifier.primary}
                        </span>
                        {userIdentifier.secondary && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {userIdentifier.secondary}
                          </span>
                        )}
                      </div>
                    )}
                    {!userIdentifier && (
                      <div className="mt-2">
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            roleBadgeStyles
                          )}
                        >
                          {roleLabel}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeAllMenus}
                    className={cn(
                      "block px-4 py-3 rounded-xl text-base font-medium transition-colors mx-2",
                      pathname === item.href
                        ? useTransparentHeader
                          ? "bg-white/20 text-white"
                          : "bg-primary-50 text-primary-600"
                        : useTransparentHeader
                          ? "text-white/80 hover:bg-white/10"
                          : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}

                {!isLoading && isAuthenticated && user && (
                  <>
                    <div className="mx-4 my-2 border-t border-slate-200" />
                    {userMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeAllMenus}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-slate-600 hover:bg-slate-100 mx-2 transition-colors"
                        >
                          <Icon className="w-5 h-5 text-slate-400" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </>
                )}

                <div
                  className={cn(
                    "pt-4 mt-4 mx-2 space-y-2",
                    useTransparentHeader
                      ? "border-t border-white/20"
                      : "border-t border-slate-200"
                  )}
                >
                  {isLoading ? (
                    <div className="flex justify-center py-3">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    </div>
                  ) : isAuthenticated ? (
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={handleLogout}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        fullWidth
                        asChild
                        className={
                          useTransparentHeader
                            ? "border-white text-white hover:bg-white/10"
                            : ""
                        }
                      >
                        <Link href="/login" onClick={closeAllMenus}>
                          Log In
                        </Link>
                      </Button>
                      <Button variant="primary" fullWidth asChild>
                        <Link href="/register" onClick={closeAllMenus}>
                          Get Started
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}