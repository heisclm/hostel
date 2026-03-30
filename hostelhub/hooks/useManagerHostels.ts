"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  hostelService,
  type HostelListItem,
  type HostelDetail,
  type PaginationResponse,
  type GetHostelsParams,
  type CreateHostelPayload,
  type UpdateHostelPayload,
  type CreateRoomTypePayload,
  type UpdateRoomTypePayload,
  type PaymentDetailPayload,
  type HostelStatus,
  type RoomType,
  type HostelFacility,
  type HostelImage,
  type HostelPaymentDetail,
} from "@/services/hostel.service";
import { useAuth } from "@/context/AuthContext";

interface UseManagerHostelsOptions {
  page?: number;
  limit?: number;
  status?: HostelStatus;
  search?: string;
  enabled?: boolean;
}

interface UseManagerHostelsReturn {
  hostels: HostelListItem[];
  pagination: PaginationResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useManagerHostels(
  options: UseManagerHostelsOptions = {},
): UseManagerHostelsReturn {
  const { page = 1, limit = 10, status, search, enabled = true } = options;
  const { isAuthenticated, user } = useAuth();

  const [hostels, setHostels] = useState<HostelListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchHostels = useCallback(async () => {
    if (!enabled || !isAuthenticated || user?.role !== "MANAGER") {
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
      if (status) params.status = status;
      if (search?.trim()) params.search = search.trim();

      const result = await hostelService.getMyHostels(params);
      setHostels(result.hostels);
      setPagination(result.pagination);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "CanceledError") return;
      const message =
        err instanceof Error ? err.message : "Failed to fetch hostels";
      setError(message);
      setHostels([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, isAuthenticated, user?.role, page, limit, status, search]);

  useEffect(() => {
    fetchHostels();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchHostels]);

  return { hostels, pagination, isLoading, error, refetch: fetchHostels };
}

interface UseManagerHostelDetailReturn {
  hostel: HostelDetail | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useManagerHostelDetail(
  hostelId: string | null,
): UseManagerHostelDetailReturn {
  const { isAuthenticated, user } = useAuth();

  const [hostel, setHostel] = useState<HostelDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!hostelId || !isAuthenticated || user?.role !== "MANAGER") {
      setHostel(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await hostelService.getMyHostelDetail(hostelId);
      setHostel(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch hostel details";
      setError(message);
      setHostel(null);
    } finally {
      setIsLoading(false);
    }
  }, [hostelId, isAuthenticated, user?.role]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { hostel, isLoading, error, refetch: fetchDetail };
}

interface UseCreateHostelReturn {
  createHostel: (payload: CreateHostelPayload) => Promise<HostelDetail>;
  isCreating: boolean;
  error: string | null;
}

export function useCreateHostel(): UseCreateHostelReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (payload: CreateHostelPayload): Promise<HostelDetail> => {
      setIsCreating(true);
      setError(null);

      try {
        const result = await hostelService.createHostel(payload);
        return result as HostelDetail;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to create hostel";
        setError(message);
        throw new Error(message);
      } finally {
        setIsCreating(false);
      }
    },
    [],
  );

  return { createHostel: create, isCreating, error };
}

interface UseUpdateHostelReturn {
  updateHostel: (
    hostelId: string,
    payload: UpdateHostelPayload,
  ) => Promise<HostelDetail>;
  isUpdating: boolean;
  error: string | null;
}

export function useUpdateHostel(): UseUpdateHostelReturn {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    async (
      hostelId: string,
      payload: UpdateHostelPayload,
    ): Promise<HostelDetail> => {
      setIsUpdating(true);
      setError(null);

      try {
        const result = await hostelService.updateHostel(hostelId, payload);
        return result as HostelDetail;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update hostel";
        setError(message);
        throw new Error(message);
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  return { updateHostel: update, isUpdating, error };
}

interface UseDeleteHostelReturn {
  deleteHostel: (hostelId: string) => Promise<void>;
  isDeleting: boolean;
  error: string | null;
}

export function useDeleteHostel(): UseDeleteHostelReturn {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (hostelId: string): Promise<void> => {
    setIsDeleting(true);
    setError(null);

    try {
      await hostelService.deleteHostel(hostelId);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete hostel";
      setError(message);
      throw new Error(message);
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return { deleteHostel: remove, isDeleting, error };
}

interface UseRoomTypesReturn {
  addRoomType: (
    hostelId: string,
    payload: CreateRoomTypePayload,
  ) => Promise<RoomType>;
  updateRoomType: (
    hostelId: string,
    roomTypeId: string,
    payload: UpdateRoomTypePayload,
  ) => Promise<RoomType>;
  deleteRoomType: (hostelId: string, roomTypeId: string) => Promise<void>;
  updateAvailability: (
    hostelId: string,
    roomTypeId: string,
    availableRooms: number,
  ) => Promise<RoomType>;
  isLoading: boolean;
  error: string | null;
}

export function useRoomTypes(): UseRoomTypesReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRoomType = useCallback(
    async (
      hostelId: string,
      payload: CreateRoomTypePayload,
    ): Promise<RoomType> => {
      setIsLoading(true);
      setError(null);

      try {
        return await hostelService.addRoomType(hostelId, payload);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to add room type";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const updateRoomType = useCallback(
    async (
      hostelId: string,
      roomTypeId: string,
      payload: UpdateRoomTypePayload,
    ): Promise<RoomType> => {
      setIsLoading(true);
      setError(null);

      try {
        return await hostelService.updateRoomType(
          hostelId,
          roomTypeId,
          payload,
        );
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update room type";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const deleteRoomType = useCallback(
    async (hostelId: string, roomTypeId: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        await hostelService.deleteRoomType(hostelId, roomTypeId);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to delete room type";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const updateAvailability = useCallback(
    async (
      hostelId: string,
      roomTypeId: string,
      availableRooms: number,
    ): Promise<RoomType> => {
      setIsLoading(true);
      setError(null);

      try {
        return await hostelService.updateRoomAvailability(
          hostelId,
          roomTypeId,
          { availableRooms },
        );
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update availability";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    addRoomType,
    updateRoomType,
    deleteRoomType,
    updateAvailability,
    isLoading,
    error,
  };
}

interface UseFacilitiesReturn {
  addFacilities: (
    hostelId: string,
    facilities: string[],
  ) => Promise<HostelFacility[]>;
  removeFacility: (hostelId: string, facilityId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useFacilities(): UseFacilitiesReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFacilities = useCallback(
    async (
      hostelId: string,
      facilities: string[],
    ): Promise<HostelFacility[]> => {
      setIsLoading(true);
      setError(null);

      try {
        return await hostelService.addFacilities(hostelId, facilities);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to add facilities";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const removeFacility = useCallback(
    async (hostelId: string, facilityId: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        await hostelService.removeFacility(hostelId, facilityId);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to remove facility";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { addFacilities, removeFacility, isLoading, error };
}

interface UseHostelImagesReturn {
  addImages: (hostelId: string, images: File[]) => Promise<HostelImage[]>;
  removeImage: (hostelId: string, imageId: string) => Promise<void>;
  setPrimaryImage: (hostelId: string, imageId: string) => Promise<HostelImage>;
  isLoading: boolean;
  error: string | null;
}

export function useHostelImages(): UseHostelImagesReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addImages = useCallback(
    async (hostelId: string, images: File[]): Promise<HostelImage[]> => {
      setIsLoading(true);
      setError(null);

      try {
        return await hostelService.addImages(hostelId, images);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to upload images";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const removeImage = useCallback(
    async (hostelId: string, imageId: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        await hostelService.removeImage(hostelId, imageId);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to remove image";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const setPrimaryImage = useCallback(
    async (hostelId: string, imageId: string): Promise<HostelImage> => {
      setIsLoading(true);
      setError(null);

      try {
        return await hostelService.setPrimaryImage(hostelId, imageId);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to set primary image";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { addImages, removeImage, setPrimaryImage, isLoading, error };
}

interface UsePaymentDetailReturn {
  upsertPaymentDetail: (
    hostelId: string,
    payload: PaymentDetailPayload,
  ) => Promise<HostelPaymentDetail>;
  isLoading: boolean;
  error: string | null;
}

export function usePaymentDetail(): UsePaymentDetailReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upsertPaymentDetail = useCallback(
    async (
      hostelId: string,
      payload: PaymentDetailPayload,
    ): Promise<HostelPaymentDetail> => {
      setIsLoading(true);
      setError(null);

      try {
        return await hostelService.upsertPaymentDetail(hostelId, payload);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to update payment details";
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { upsertPaymentDetail, isLoading, error };
}
