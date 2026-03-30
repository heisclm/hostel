"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  adminService,
  type AdminUser,
  type AdminUserDetail,
  type PaginationResponse,
  type GetUsersParams,
  type UpdateUserStatusPayload,
  type VerifyManagerPayload,
  type VerificationStats,
} from "@/services/admin.service";
import { useAuth } from "@/context/AuthContext";

interface UseAdminUsersOptions {
  page?: number;
  limit?: number;
  role?: "STUDENT" | "MANAGER" | "ADMIN" | "GUEST";
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  search?: string;
  enabled?: boolean;
}

interface UseAdminUsersReturn {
  users: AdminUser[];
  pagination: PaginationResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAdminUsers(
  options: UseAdminUsersOptions = {},
): UseAdminUsersReturn {
  const {
    page = 1,
    limit = 10,
    role,
    status,
    search,
    enabled = true,
  } = options;
  const { isAuthenticated, user } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<PaginationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!enabled || !isAuthenticated || user?.role !== "ADMIN") {
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const params: GetUsersParams = { page, limit };
      if (role) params.role = role;
      if (status) params.status = status;
      if (search?.trim()) params.search = search.trim();

      const result = await adminService.getUsers(params);
      setUsers(result.users);
      setPagination(result.pagination);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "CanceledError") return;
      const message =
        err instanceof Error ? err.message : "Failed to fetch users";
      setError(message);
      setUsers([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, isAuthenticated, user?.role, page, limit, role, status, search]);

  useEffect(() => {
    fetchUsers();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchUsers]);

  return { users, pagination, isLoading, error, refetch: fetchUsers };
}

interface UseAdminUserDetailReturn {
  user: AdminUserDetail | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAdminUserDetail(
  userId: string | null,
): UseAdminUserDetailReturn {
  const { isAuthenticated, user: authUser } = useAuth();

  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!userId || !isAuthenticated || authUser?.role !== "ADMIN") {
      setUserDetail(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await adminService.getUserById(userId);
      setUserDetail(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch user details";
      setError(message);
      setUserDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthenticated, authUser?.role]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { user: userDetail, isLoading, error, refetch: fetchDetail };
}

interface UseUpdateUserStatusReturn {
  updateStatus: (
    userId: string,
    payload: UpdateUserStatusPayload,
  ) => Promise<AdminUser>;
  isUpdating: boolean;
  error: string | null;
}

export function useUpdateUserStatus(): UseUpdateUserStatusReturn {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(
    async (
      userId: string,
      payload: UpdateUserStatusPayload,
    ): Promise<AdminUser> => {
      setIsUpdating(true);
      setError(null);

      try {
        const result = await adminService.updateUserStatus(userId, payload);
        return result;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update user status";
        setError(message);
        throw new Error(message);
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  return { updateStatus, isUpdating, error };
}

interface UseVerifyManagerReturn {
  verifyManager: (
    managerId: string,
    payload: VerifyManagerPayload,
  ) => Promise<AdminUser>;
  isVerifying: boolean;
  error: string | null;
}

export function useVerifyManager(): UseVerifyManagerReturn {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(
    async (
      managerId: string,
      payload: VerifyManagerPayload,
    ): Promise<AdminUser> => {
      setIsVerifying(true);
      setError(null);

      try {
        const result = await adminService.verifyManager(managerId, payload);
        return result;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to verify manager";
        setError(message);
        throw new Error(message);
      } finally {
        setIsVerifying(false);
      }
    },
    [],
  );

  return { verifyManager: verify, isVerifying, error };
}

interface UseVerificationStatsReturn {
  stats: VerificationStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVerificationStats(): UseVerificationStatsReturn {
  const { isAuthenticated, user } = useAuth();

  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated || user?.role !== "ADMIN") {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await adminService.getVerificationStats();
      setStats(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch stats";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
}
