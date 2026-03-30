import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",

  headers: {
    "Content-Type": "application/json",
  },
});

const TOKEN_KEYS = {
  STUDENT: "hostelhub_token_student",
  MANAGER: "hostelhub_token_manager",
  ADMIN: "hostelhub_token_admin",
  GUEST: "hostelhub_token_guest",
} as const;

const ACTIVE_ROLE_KEY = "hostelhub_active_role";

export type TokenRole = keyof typeof TOKEN_KEYS;

function getSessionRole(): TokenRole | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACTIVE_ROLE_KEY) as TokenRole | null;
}

function setSessionRole(role: TokenRole): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ACTIVE_ROLE_KEY, role);
}

function clearSessionRole(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ACTIVE_ROLE_KEY);
}

const STUDENT_ROUTES = [
  "/profile",
  "/bookings",
  "/saved",
  "/payments",
  "/settings",
  "/support",
  "/complaints",
];

function isStudentRoute(path: string): boolean {
  return STUDENT_ROUTES.some(
    (route) => path === route || path.startsWith(route + "/"),
  );
}

export function getActiveRoleFromPath(): TokenRole | null {
  if (typeof window === "undefined") return null;

  const path = window.location.pathname;

  if (path.startsWith("/admin")) return "ADMIN";
  if (path.startsWith("/manager")) return "MANAGER";

  if (isStudentRoute(path)) {
    const studentToken = getTokenForRole("STUDENT");
    if (studentToken) return "STUDENT";

    const guestToken = getTokenForRole("GUEST");
    if (guestToken) return "GUEST";

    return "STUDENT";
  }

  if (
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password") ||
    path.startsWith("/admin-login")
  ) {
    return getSessionRole();
  }

  return getSessionRole();
}
export function setTokenForRole(role: TokenRole, token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEYS[role], token);
  setSessionRole(role);
}

export function getTokenForRole(role: TokenRole): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEYS[role]);
}

export function getActiveToken(): string | null {
  const role = getActiveRoleFromPath();
  if (!role) return null;
  return getTokenForRole(role);
}

export function setActiveRole(role: TokenRole): void {
  setSessionRole(role);
}

export function getActiveRole(): TokenRole | null {
  return getSessionRole();
}

export function removeTokenForRole(role: TokenRole): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEYS[role]);

  if (getSessionRole() === role) {
    clearSessionRole();
  }
}

export function removeAllTokens(): void {
  if (typeof window === "undefined") return;
  Object.values(TOKEN_KEYS).forEach((key) => localStorage.removeItem(key));
  clearSessionRole();
}

export function getActiveSessions(): TokenRole[] {
  if (typeof window === "undefined") return [];
  return (Object.keys(TOKEN_KEYS) as TokenRole[]).filter(
    (role) => !!localStorage.getItem(TOKEN_KEYS[role]),
  );
}

api.interceptors.request.use(
  (config) => {
    if (config.headers.Authorization) {
      return config;
    }

    const token = getActiveToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        const isAuthPage =
          path.startsWith("/login") ||
          path.startsWith("/register") ||
          path.startsWith("/admin-login") ||
          path.startsWith("/forgot-password") ||
          path.startsWith("/reset-password");

        const isPublicPage = path === "/" || path.startsWith("/hostels");

        if (!isAuthPage && !isPublicPage) {
          const role = getActiveRoleFromPath();
          if (role) {
            removeTokenForRole(role);
          }

          if (path.startsWith("/admin")) {
            window.location.href = "/admin-login";
          } else {
            window.location.href = "/login";
          }
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
