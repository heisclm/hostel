import { useState, useEffect, useCallback } from "react";
import { adminService, type AdminNavCounts } from "@/services/admin.service";

const DEFAULT_COUNTS: AdminNavCounts = {
  hostels: 0,
  payments: 0,
  disbursements: 0,
  complaints: 0,
  verifications: 0,
};

export function useAdminNavCounts(pollingInterval = 60_000) {
  const [counts, setCounts] = useState<AdminNavCounts>(DEFAULT_COUNTS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    try {
      const response = await adminService.getNavCounts();
      if (response.success) {
        setCounts(response.data);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();

    const interval = setInterval(fetchCounts, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchCounts, pollingInterval]);

  return { counts, isLoading, refetch: fetchCounts };
}
