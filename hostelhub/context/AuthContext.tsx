"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
  useMemo,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/services/auth.services";
import {
  getActiveRoleFromPath,
  getTokenForRole,
  setActiveRole,
  removeTokenForRole,
  removeAllTokens,
  getActiveSessions,
  type TokenRole,
} from "@/lib/api";
import { AxiosError } from "axios";

export type UserRole = "STUDENT" | "MANAGER" | "ADMIN" | "GUEST";

export type GuestType =
  | "PARENT_GUARDIAN"
  | "UNIVERSITY_STAFF"
  | "PROSPECTIVE_STUDENT"
  | "VISITOR";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  studentProfile?: {
    id: string;
    studentId: string;
    programme?: string;
    level?: number;
    academicYear?: string;
    emergencyContact?: string;
  };
  managerProfile?: {
    id: string;
    businessName?: string;
    verified: boolean;
    verificationStatus: string;
  };
  guestProfile?: {
    id: string;
    guestType: GuestType;
    beneficiaryName?: string;
    beneficiaryPhone?: string;
    beneficiaryEmail?: string;
    relationshipType?: string;
    staffId?: string;
    department?: string;
    admissionNumber?: string;
    expectedMatricDate?: string;
    programmeAdmitted?: string;
    purpose?: string;
    organization?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    loginAs?: "STUDENT" | "MANAGER" | "GUEST",
  ) => Promise<{ role: UserRole }>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: User) => void;
  activeSessions: TokenRole[];
}

interface ApiErrorData {
  message?: string;
  success?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const alwaysAccessibleRoutes = [
  "/login",
  "/register",
  "/register/student",
  "/register/manager",
  "/register/guest",
  "/forgot-password",
  "/reset-password",
  "/admin-login",
];

const publicContentRoutes = ["/", "/hostels", "/contact"];

const studentOrGuestRoutes = [
  "/profile",
  "/bookings",
  "/saved",
  "/payments",
  "/settings",
  "/support",
  "/complaints",
];

function isAlwaysAccessible(path: string): boolean {
  return alwaysAccessibleRoutes.some(
    (route) => path === route || path.startsWith(route + "/"),
  );
}

function isPublicContent(path: string): boolean {
  if (path === "/") return true;
  return publicContentRoutes.some(
    (route) =>
      route !== "/" && (path === route || path.startsWith(route + "/")),
  );
}

function isStudentOrGuestRoute(path: string): boolean {
  return studentOrGuestRoutes.some(
    (route) => path === route || path.startsWith(route + "/"),
  );
}

function extractUser(response: {
  success: boolean;
  data?: Record<string, unknown> | null;
}): User | null {
  if (!response.success || !response.data) return null;
  const data = response.data;
  if (data.user && typeof data.user === "object") {
    return data.user as unknown as User;
  }
  if (data.id && data.email && data.role) {
    return data as unknown as User;
  }
  return null;
}

function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorData | undefined;
    return data?.message || error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

function getRoleRedirect(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "MANAGER":
      return "/manager/dashboard";
    case "STUDENT":
    case "GUEST":
    default:
      return "/";
  }
}

function getRoleForCurrentPath(pathname: string): TokenRole | null {
  if (pathname.startsWith("/admin")) return "ADMIN";
  if (pathname.startsWith("/manager")) return "MANAGER";
  if (isStudentOrGuestRoute(pathname)) {
    const activeRole = getActiveRoleFromPath();
    if (activeRole === "STUDENT" || activeRole === "GUEST") {
      return activeRole;
    }
    return "STUDENT";
  }
  return getActiveRoleFromPath();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentRoleRef = useRef<TokenRole | null>(null);
  const prevRoleContext = useRef<TokenRole | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const activeSessions = useMemo(() => {
    if (typeof window === "undefined") return [];
    return getActiveSessions();
  }, [user]);

  const loadUserForCurrentPath = useCallback(
    async (currentPathname: string) => {
      const role = getRoleForCurrentPath(currentPathname);

      if (!role) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const token = getTokenForRole(role);

      if (!token) {
        if (isStudentOrGuestRoute(currentPathname)) {
          const alternateRole = role === "STUDENT" ? "GUEST" : "STUDENT";
          const alternateToken = getTokenForRole(alternateRole);
          if (alternateToken) {
            try {
              const response = await authService.getMeForRole(alternateRole);
              const fetchedUser = extractUser(response);
              if (fetchedUser && fetchedUser.role === alternateRole) {
                currentRoleRef.current = alternateRole;
                setUser(fetchedUser);
                setIsLoading(false);
                return;
              }
            } catch {
              removeTokenForRole(alternateRole);
            }
          }
        }
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await authService.getMeForRole(role);
        const fetchedUser = extractUser(response);

        if (fetchedUser) {
          if (fetchedUser.role !== role) {
            console.warn(
              `Token role mismatch: expected ${role}, got ${fetchedUser.role}`,
            );
            removeTokenForRole(role);
            setUser(null);
          } else {
            currentRoleRef.current = role;
            setUser(fetchedUser);
          }
        } else {
          removeTokenForRole(role);
          setUser(null);
        }
      } catch {
        removeTokenForRole(role);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const role = getRoleForCurrentPath(pathname);
    prevRoleContext.current = role;
    loadUserForCurrentPath(pathname);
  }, []);

  useEffect(() => {
    const currentRoleContext = getRoleForCurrentPath(pathname);

    if (currentRoleContext !== prevRoleContext.current) {
      prevRoleContext.current = currentRoleContext;
      setIsLoading(true);
      loadUserForCurrentPath(pathname);
    }
  }, [pathname, loadUserForCurrentPath]);

  useEffect(() => {
    if (isLoading) return;

    let redirectTo: string | null = null;

    if (isAlwaysAccessible(pathname)) {
      if (pathname === "/admin-login" && user?.role === "ADMIN") {
        redirectTo = "/admin/dashboard";
      }
    } else if (isPublicContent(pathname)) {
    } else if (!user) {
      if (pathname.startsWith("/admin")) {
        redirectTo = "/admin-login";
      } else if (
        pathname.startsWith("/manager") ||
        isStudentOrGuestRoute(pathname)
      ) {
        redirectTo = "/login";
      }
    } else {
      if (pathname.startsWith("/admin") && user.role !== "ADMIN") {
        redirectTo = "/admin-login";
      } else if (pathname.startsWith("/manager") && user.role !== "MANAGER") {
        redirectTo = "/login";
      } else if (
        isStudentOrGuestRoute(pathname) &&
        user.role !== "STUDENT" &&
        user.role !== "GUEST"
      ) {
        redirectTo = getRoleRedirect(user.role);
      }
    }

    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [isLoading, user, pathname, router]);

  const refreshUser = useCallback(async () => {
    try {
      const role = getRoleForCurrentPath(pathname);
      if (!role) return;

      const response = await authService.getMeForRole(role);
      const freshUser = extractUser(response);
      if (freshUser && freshUser.role === role) {
        setUser(freshUser);
      }
    } catch {
      console.warn("Failed to refresh user data");
    }
  }, [pathname]);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const login = useCallback(
    async (
      email: string,
      password: string,
      loginAs?: "STUDENT" | "MANAGER" | "GUEST",
    ): Promise<{ role: UserRole }> => {
      try {
        const response = await authService.login(email, password, loginAs);
        const loggedInUser = extractUser(response);

        if (loggedInUser) {
          setActiveRole(loggedInUser.role as TokenRole);
          currentRoleRef.current = loggedInUser.role as TokenRole;
          setUser(loggedInUser);
          return { role: loggedInUser.role };
        }

        throw new Error("Login failed. Please try again.");
      } catch (error: unknown) {
        const message = getAuthErrorMessage(error, "Login failed");
        throw new Error(message);
      }
    },
    [],
  );

  const adminLogin = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        const response = await authService.login(email, password);
        const loggedInUser = extractUser(response);

        if (loggedInUser) {
          if (loggedInUser.role !== "ADMIN") {
            removeTokenForRole(loggedInUser.role as TokenRole);
            try {
              await authService.logoutRole(loggedInUser.role as TokenRole);
            } catch {}
            throw new Error(
              "Access denied. This portal is for administrators only.",
            );
          }

          setActiveRole("ADMIN");
          currentRoleRef.current = "ADMIN";
          setUser(loggedInUser);
          return;
        }

        throw new Error("Login failed. Please try again.");
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("Access denied")) {
          throw error;
        }
        const message = getAuthErrorMessage(error, "Login failed");
        throw new Error(message);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    const currentRole =
      currentRoleRef.current || getRoleForCurrentPath(pathname);
    const wasAdmin = user?.role === "ADMIN" || pathname.startsWith("/admin");

    try {
      if (currentRole) {
        await authService.logoutRole(currentRole);
      } else {
        await authService.logout();
      }
    } catch {
      if (currentRole) {
        removeTokenForRole(currentRole);
      } else {
        removeAllTokens();
      }
    } finally {
      setUser(null);
      currentRoleRef.current = null;

      if (wasAdmin) {
        router.push("/admin-login");
      } else {
        router.push("/login");
      }
    }
  }, [user, pathname, router]);

  const contextValue = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      adminLogin,
      logout,
      refreshUser,
      updateUser,
      activeSessions,
    }),
    [
      user,
      isLoading,
      login,
      adminLogin,
      logout,
      refreshUser,
      updateUser,
      activeSessions,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
