"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  publicHostelService,
  type PublicHostelListItem,
  type PublicHostelDetail,
  type PaginationInfo,
  type GetHostelsParams,
} from "@/services/public.hostel.service";

interface UsePublicHostelsOptions extends GetHostelsParams {
  enabled?: boolean;
}

interface UsePublicHostelsReturn {
  hostels: PublicHostelListItem[];
  pagination: PaginationInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePublicHostels(
  options: UsePublicHostelsOptions = {},
): UsePublicHostelsReturn {
  const {
    page = 1,
    limit = 10,
    search,
    minPrice,
    maxPrice,
    maxDistance,
    facilities,
    occupancyType,
    sortBy,
    enabled = true,
  } = options;

  const [hostels, setHostels] = useState<PublicHostelListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const facilitiesKey = useMemo(
    () => (facilities ? facilities.sort().join(",") : ""),
    [facilities],
  );

  const fetchHostels = useCallback(async () => {
    if (!enabled) {
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
      const params: GetHostelsParams = { page, limit };
      if (search?.trim()) params.search = search.trim();
      if (minPrice !== undefined) params.minPrice = minPrice;
      if (maxPrice !== undefined) params.maxPrice = maxPrice;
      if (maxDistance !== undefined) params.maxDistance = maxDistance;
      if (facilitiesKey) params.facilities = facilitiesKey.split(",");
      if (occupancyType) params.occupancyType = occupancyType;
      if (sortBy) params.sortBy = sortBy;

      const result = await publicHostelService.getHostels(params);

      const normalizedHostels = (result.hostels || []).map((hostel) => ({
        ...hostel,
        facilities: hostel.facilities || [],
        images: hostel.images || [],
        roomTypes: hostel.roomTypes || [],
      }));

      setHostels(normalizedHostels);
      setPagination(result.pagination || null);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      if (err instanceof Error && err.name === "CanceledError") return;
      const message =
        err instanceof Error ? err.message : "Failed to fetch hostels";
      setError(message);
      setHostels([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    enabled,
    page,
    limit,
    search,
    minPrice,
    maxPrice,
    maxDistance,
    facilitiesKey,
    occupancyType,
    sortBy,
  ]);

  useEffect(() => {
    fetchHostels();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchHostels]);

  return { hostels, pagination, isLoading, error, refetch: fetchHostels };
}

interface UsePublicHostelDetailReturn {
  hostel: PublicHostelDetail | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePublicHostelBySlug(
  slug: string | null,
): UsePublicHostelDetailReturn {
  const [hostel, setHostel] = useState<PublicHostelDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHostel = useCallback(async () => {
    if (!slug) {
      setHostel(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await publicHostelService.getHostelBySlug(slug);

      const normalizedHostel: PublicHostelDetail = {
        ...result,
        facilities: result.facilities || [],
        images: result.images || [],
        roomTypes: result.roomTypes || [],
      };

      setHostel(normalizedHostel);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch hostel details";
      setError(message);
      setHostel(null);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchHostel();
  }, [fetchHostel]);

  return { hostel, isLoading, error, refetch: fetchHostel };
}

export function usePublicHostelById(
  hostelId: string | null,
): UsePublicHostelDetailReturn {
  const [hostel, setHostel] = useState<PublicHostelDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHostel = useCallback(async () => {
    if (!hostelId) {
      setHostel(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await publicHostelService.getHostelById(hostelId);

      const normalizedHostel: PublicHostelDetail = {
        ...result,
        facilities: result.facilities || [],
        images: result.images || [],
        roomTypes: result.roomTypes || [],
      };

      setHostel(normalizedHostel);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch hostel details";
      setError(message);
      setHostel(null);
    } finally {
      setIsLoading(false);
    }
  }, [hostelId]);

  useEffect(() => {
    fetchHostel();
  }, [fetchHostel]);

  return { hostel, isLoading, error, refetch: fetchHostel };
}
