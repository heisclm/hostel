/* eslint-disable @typescript-eslint/no-unused-vars */
import api from "@/lib/api";

export interface SavedHostelItem {
  savedAt: string;
  hostel: {
    id: string;
    name: string;
    slug: string;
    address: string;
    distanceToCampus: number | null;
    images: Array<{
      id: string;
      url: string;
      isPrimary: boolean;
    }>;
    facilities: Array<{
      id: string;
      name: string;
    }>;
    roomTypes: Array<{
      id: string;
      occupancyType: "IN_1" | "IN_2" | "IN_3" | "IN_4";
      pricePerPerson: string;
      availableRooms: number;
      availableSpots: number;
    }>;
    priceRange: {
      min: number;
      max: number;
    };
    totalAvailable: number;
    rating: number | null;
    reviewCount: number;
  };
}

export interface SavedHostelsResponse {
  hostels: SavedHostelItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface SavedHostelsParams {
  page?: number;
  limit?: number;
  sortBy?: "recent" | "name" | "distance" | "price-low" | "price-high";
  search?: string;
}

export const savedHostelService = {
  getSavedHostels: async (
    params: SavedHostelsParams = {},
  ): Promise<SavedHostelsResponse> => {
    const response = await api.get("/saved-hostels", { params });
    return response.data.data;
  },

  saveHostel: async (hostelId: string): Promise<{ isSaved: boolean }> => {
    const response = await api.post(`/saved-hostels/${hostelId}`);
    return { isSaved: true };
  },

  unsaveHostel: async (hostelId: string): Promise<{ isSaved: boolean }> => {
    await api.delete(`/saved-hostels/${hostelId}`);
    return { isSaved: false };
  },

  toggleSave: async (hostelId: string): Promise<{ isSaved: boolean }> => {
    const response = await api.patch(`/saved-hostels/${hostelId}/toggle`);
    return response.data.data;
  },

  checkSavedStatus: async (hostelId: string): Promise<{ isSaved: boolean }> => {
    const response = await api.get(`/saved-hostels/${hostelId}/status`);
    return response.data.data;
  },

  checkMultipleSavedStatus: async (
    hostelIds: string[],
  ): Promise<Record<string, boolean>> => {
    const response = await api.post("/saved-hostels/check-status", {
      hostelIds,
    });
    return response.data.data;
  },

  getSavedCount: async (): Promise<{ count: number }> => {
    const response = await api.get("/saved-hostels/count");
    return response.data.data;
  },

  clearAllSaved: async (): Promise<{ count: number }> => {
    const response = await api.delete("/saved-hostels/clear-all");
    return response.data.data;
  },
};
