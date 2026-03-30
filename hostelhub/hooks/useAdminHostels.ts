"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getAdminHostels,
  getAdminHostelDetail,
  updateHostelStatus,
  type AdminHostel,
  type AdminHostelsParams,
  type UpdateHostelStatusPayload,
  type AdminHostelsResponse,
} from "@/services/admin.service";

export function useAdminHostels(params: AdminHostelsParams) {
  const [hostels, setHostels] = useState<AdminHostel[]>([]);
  const [pagination, setPagination] = useState<
    AdminHostelsResponse["pagination"] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const paramsKey = JSON.stringify({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    status: params.status ?? "",
    search: params.search ?? "",
  });

  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    let cancelled = false;

    const fetchHostels = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getAdminHostels(paramsRef.current);

        if (!cancelled) {
          setHostels(data.hostels ?? []);
          setPagination(data.pagination ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch hostels",
          );
          setHostels([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchHostels();

    return () => {
      cancelled = true;
    };
  }, [paramsKey, fetchTrigger]);

  const refetch = useCallback(() => {
    setFetchTrigger((prev) => prev + 1);
  }, []);

  return {
    hostels,
    pagination,
    isLoading,
    error,
    refetch,
  };
}

export function useAdminHostelDetail(hostelId: string | null) {
  const [hostel, setHostel] = useState<AdminHostel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hostelId) {
      setHostel(null);
      return;
    }

    let cancelled = false;

    const fetchHostel = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getAdminHostelDetail(hostelId);

        if (!cancelled) {
          setHostel(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch hostel",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchHostel();

    return () => {
      cancelled = true;
    };
  }, [hostelId]);

  return { hostel, isLoading, error };
}

export function useUpdateHostelStatus() {
  const [isLoading, setIsLoading] = useState(false);

  const update = useCallback(
    async (hostelId: string, payload: UpdateHostelStatusPayload) => {
      setIsLoading(true);
      try {
        const result = await updateHostelStatus(hostelId, payload);
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { updateStatus: update, isLoading };
}
