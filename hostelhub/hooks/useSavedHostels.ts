/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  savedHostelService,
  SavedHostelItem,
  SavedHostelsParams,
} from "@/services/saved-hostel.service";
import toast from "react-hot-toast";

interface UseSavedHostelsOptions extends SavedHostelsParams {
  autoFetch?: boolean;
}

interface UseSavedHostelsReturn {
  savedHostels: SavedHostelItem[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  } | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  saveHostel: (hostelId: string) => Promise<boolean>;
  unsaveHostel: (hostelId: string) => Promise<boolean>;
  toggleSave: (hostelId: string) => Promise<boolean>;
  isHostelSaved: (hostelId: string) => boolean;
  clearAll: () => Promise<void>;
  savedCount: number;
  canSave: boolean;
}

export function useSavedHostels(
  options: UseSavedHostelsOptions = {},
): UseSavedHostelsReturn {
  const {
    autoFetch = true,
    page = 1,
    limit = 10,
    sortBy = "recent",
    search = "",
  } = options;
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [savedHostels, setSavedHostels] = useState<SavedHostelItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  } | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  const savedIdsRef = useRef<Set<string>>(new Set());
  
  const canSave = user?.role === "STUDENT" || user?.role === "GUEST";

  const fetchSavedHostels = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
    
      if (authLoading || !isAuthenticated || !canSave) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await savedHostelService.getSavedHostels({
          page: pageNum,
          limit,
          sortBy,
          search,
        });

        if (append) {
          setSavedHostels((prev) => [...prev, ...response.hostels]);
        } else {
          setSavedHostels(response.hostels);
        }

        setPagination(response.pagination);
        setSavedCount(response.pagination.total);

        const ids = new Set(response.hostels.map((h) => h.hostel.id));
        if (append) {
          savedIdsRef.current = new Set([...savedIdsRef.current, ...ids]);
        } else {
          savedIdsRef.current = ids;
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch saved hostels";
        setError(message);
        console.error("Error fetching saved hostels:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [authLoading, isAuthenticated, canSave, limit, sortBy, search], 
  );

  const refetch = useCallback(async () => {
    await fetchSavedHostels(1, false);
  }, [fetchSavedHostels]);

  const loadMore = useCallback(async () => {
    if (!pagination?.hasMore || isLoading) return;
    await fetchSavedHostels(pagination.page + 1, true);
  }, [pagination, isLoading, fetchSavedHostels]);

  const saveHostel = useCallback(
    async (hostelId: string): Promise<boolean> => {
      if (!isAuthenticated) {
        toast.error("Please log in to save hostels");
        return false;
      }

      if (!canSave) {
        toast.error("Only students and guests can save hostels");
        return false;
      }

      try {
        await savedHostelService.saveHostel(hostelId);
        savedIdsRef.current.add(hostelId);
        setSavedCount((prev) => prev + 1);
        toast.success("Hostel saved!");
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save hostel";
        toast.error(message);
        return false;
      }
    },
    [isAuthenticated, canSave],
  );

  const unsaveHostel = useCallback(
    async (hostelId: string): Promise<boolean> => {
      if (!isAuthenticated || !canSave) return false;

      try {
        await savedHostelService.unsaveHostel(hostelId);
        savedIdsRef.current.delete(hostelId);
        setSavedCount((prev) => Math.max(0, prev - 1));
        setSavedHostels((prev) => prev.filter((h) => h.hostel.id !== hostelId));
        toast.success("Hostel removed from saved");
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to remove hostel";
        toast.error(message);
        return false;
      }
    },
    [isAuthenticated, canSave],
  );

  const toggleSave = useCallback(
    async (hostelId: string): Promise<boolean> => {
      if (!isAuthenticated) {
        toast.error("Please log in to save hostels");
        return false;
      }

      if (!canSave) {
        toast.error("Only students and guests can save hostels");
        return false;
      }

      const currentlySaved = savedIdsRef.current.has(hostelId);

      if (currentlySaved) {
        return unsaveHostel(hostelId);
      } else {
        return saveHostel(hostelId);
      }
    },
    [isAuthenticated, canSave, saveHostel, unsaveHostel],
  );

  const isHostelSaved = useCallback((hostelId: string): boolean => {
    return savedIdsRef.current.has(hostelId);
  }, []);

  const clearAll = useCallback(async () => {
    if (!isAuthenticated || !canSave) return;

    try {
      await savedHostelService.clearAllSaved();
      setSavedHostels([]);
      savedIdsRef.current.clear();
      setSavedCount(0);
      setPagination(null);
      toast.success("All saved hostels cleared");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to clear saved hostels";
      toast.error(message);
    }
  }, [isAuthenticated, canSave]);

  useEffect(() => {
    if (autoFetch && !authLoading && isAuthenticated && canSave) {
      fetchSavedHostels(page, false);
    }
  }, [autoFetch, authLoading, isAuthenticated, canSave, page, sortBy, search]); 

  return {
    savedHostels,
    isLoading,
    error,
    pagination,
    refetch,
    loadMore,
    saveHostel,
    unsaveHostel,
    toggleSave,
    isHostelSaved,
    clearAll,
    savedCount,
    canSave,
  };
}

export function useHostelSaveStatus(hostelId: string) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth(); 
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const canSave = user?.role === "STUDENT" || user?.role === "GUEST";

  useEffect(() => {
    const checkStatus = async () => {
      if (authLoading || !isAuthenticated || !canSave || !hostelId) {
        return;
      }

      setIsLoading(true);
      try {
        const result = await savedHostelService.checkSavedStatus(hostelId);
        setIsSaved(result.isSaved);
      } catch (err) {
        console.error("Error checking saved status:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [hostelId, authLoading, isAuthenticated, canSave]); 

  const toggle = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to save hostels");
      return;
    }

    if (!canSave) {
      toast.error("Only students and guests can save hostels");
      return;
    }

    setIsLoading(true);
    try {
      const result = await savedHostelService.toggleSave(hostelId);
      setIsSaved(result.isSaved);
      toast.success(
        result.isSaved ? "Hostel saved!" : "Hostel removed from saved",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [hostelId, isAuthenticated, canSave]);

  return { isSaved, isLoading, toggle, canSave };
}

export function useMultipleSaveStatus(hostelIds: string[]) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth(); 
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const canSave = user?.role === "STUDENT" || user?.role === "GUEST";

  useEffect(() => {
    const checkStatus = async () => {
      if (authLoading || !isAuthenticated || !canSave || hostelIds.length === 0) {
        return;
      }

      setIsLoading(true);
      try {
        const result =
          await savedHostelService.checkMultipleSavedStatus(hostelIds);
        setSavedStatus(result);
      } catch (err) {
        console.error("Error checking saved status:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [hostelIds.join(","), authLoading, isAuthenticated, canSave]); 

  const toggleSave = useCallback(
    async (hostelId: string) => {
      if (!isAuthenticated) {
        toast.error("Please log in to save hostels");
        return;
      }

      if (!canSave) {
        toast.error("Only students and guests can save hostels");
        return;
      }

      try {
        const result = await savedHostelService.toggleSave(hostelId);
        setSavedStatus((prev) => ({
          ...prev,
          [hostelId]: result.isSaved,
        }));
        toast.success(
          result.isSaved ? "Hostel saved!" : "Hostel removed from saved",
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update";
        toast.error(message);
      }
    },
    [isAuthenticated, canSave],
  );

  return { savedStatus, isLoading, toggleSave, canSave };
}