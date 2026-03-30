import api from "@/lib/api";

export type OccupancyType = "IN_1" | "IN_2" | "IN_3" | "IN_4";
export type PricingPeriod = "PER_SEMESTER" | "PER_YEAR";
export type HostelStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export interface HostelFacility {
  id: string;
  name: string;
}

export interface HostelImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface RoomType {
  id: string;
  occupancyType: OccupancyType;
  pricePerPerson: number;
  totalRooms: number;
  availableRooms: number;
  amenities: string[];
  description?: string;
}

export interface PublicHostelListItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  distanceToCampus?: number;
  status: HostelStatus;
  totalRooms: number;
  pricingPeriod: PricingPeriod;
  facilities: HostelFacility[];
  images: HostelImage[];
  roomTypes: RoomType[];
  priceRange?: {
    min: number;
    max: number;
  };
  availableRooms: number;
}

export interface PublicHostelDetail extends PublicHostelListItem {
  allowSemesterPayment: boolean;
  manager?: {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GetHostelsParams {
  page?: number;
  limit?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  maxDistance?: number;
  facilities?: string[];
  occupancyType?: OccupancyType;
  sortBy?: "price_asc" | "price_desc" | "distance" | "newest";
}

export interface GetHostelsResponse {
  hostels: PublicHostelListItem[];
  pagination: PaginationInfo;
}

function normalizeHostel<T extends PublicHostelListItem>(hostel: T): T {
  return {
    ...hostel,
    facilities: hostel.facilities || [],
    images: hostel.images || [],
    roomTypes: (hostel.roomTypes || []).map((rt) => ({
      ...rt,
      amenities: rt.amenities || [],
      pricePerPerson: Number(rt.pricePerPerson) || 0,
    })),
  };
}

class PublicHostelService {
  async getHostels(params: GetHostelsParams = {}): Promise<GetHostelsResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.minPrice !== undefined)
      queryParams.append("minPrice", params.minPrice.toString());
    if (params.maxPrice !== undefined)
      queryParams.append("maxPrice", params.maxPrice.toString());
    if (params.maxDistance !== undefined)
      queryParams.append("maxDistance", params.maxDistance.toString());
    if (params.facilities?.length) {
      params.facilities.forEach((f) => queryParams.append("facilities", f));
    }
    if (params.occupancyType)
      queryParams.append("occupancyType", params.occupancyType);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);

    try {
      console.log("Fetching hostels with params:", queryParams.toString());

      const response = await api.get(`/hostels?${queryParams.toString()}`);

      console.log("API Response:", response);
      console.log("Response data:", response.data);

      let data = response.data;

      if (data && data.data) {
        data = data.data;
      }

      if (Array.isArray(data)) {
        return {
          hostels: data.map(normalizeHostel),
          pagination: {
            currentPage: params.page || 1,
            totalPages: 1,
            totalItems: data.length,
            itemsPerPage: params.limit || 10,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }

      if (data && data.hostels) {
        return {
          hostels: (data.hostels || []).map(normalizeHostel),
          pagination: data.pagination || {
            currentPage: params.page || 1,
            totalPages: 1,
            totalItems: data.hostels?.length || 0,
            itemsPerPage: params.limit || 10,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }

      console.warn("Unexpected response structure:", data);
      return {
        hostels: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: params.limit || 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    } catch (error) {
      console.error("Error fetching hostels:", error);
      throw error;
    }
  }

  async getHostelBySlug(slug: string): Promise<PublicHostelDetail> {
    try {
      const response = await api.get(`/hostels/slug/${slug}`);
      const data = response.data.data || response.data;
      return normalizeHostel(data);
    } catch (error) {
      console.error("Error fetching hostel by slug:", error);
      throw error;
    }
  }

  async getHostelById(hostelId: string): Promise<PublicHostelDetail> {
    try {
      const response = await api.get(`/hostels/${hostelId}`);
      const data = response.data.data || response.data;
      return normalizeHostel(data);
    } catch (error) {
      console.error("Error fetching hostel by ID:", error);
      throw error;
    }
  }
}

export const publicHostelService = new PublicHostelService();
