/* eslint-disable react-hooks/exhaustive-deps */

import { useState, useEffect, useCallback, useRef } from "react";
import { tenantService } from "@/services/tenant.service";
import type { TenantsResponse, TenantQueryParams } from "@/types/tenants";

interface UseTenantResult {
  data: TenantsResponse | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useManagerTenants(params?: TenantQueryParams): UseTenantResult {
  const [data, setData] = useState<TenantsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const hasFetched = useRef(false);

  const paramsKey = JSON.stringify(params);

  const fetchTenants = useCallback(async () => {
    try {
      if (hasFetched.current) {
        setIsFetching(true);
      } else {
        setIsLoading(true);
      }
      setIsError(false);
      setError(null);

      const result = await tenantService.getManagerTenants(params);
      setData(result);
      hasFetched.current = true;
    } catch (err) {
      setIsError(true);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch tenants"),
      );
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [paramsKey]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  return {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch: fetchTenants,
  };
}
