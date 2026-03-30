import api from "@/lib/api";

export type HostelStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type OccupancyType = "IN_1" | "IN_2" | "IN_3" | "IN_4";
export type PricingPeriod = "PER_SEMESTER" | "PER_YEAR";

export interface HostelFacility {
  id: string;
  name: string;
  createdAt: string;
}

export interface HostelImage {
  id: string;
  url: string;
  publicId?: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface Room {
  id: string;
  roomTypeId: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  currentOccupants: number;
  status:
    | "AVAILABLE"
    | "PARTIALLY_OCCUPIED"
    | "FULLY_OCCUPIED"
    | "UNDER_MAINTENANCE"
    | "UNAVAILABLE";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomType {
  id: string;
  hostelId: string;
  occupancyType: OccupancyType;
  pricePerPerson: number;
  totalRooms: number;
  availableRooms: number;
  totalSpots: number;
  availableSpots: number;
  amenities: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
  rooms?: Room[];
  _count?: {
    bookings: number;
  };
}

export interface HostelPaymentDetail {
  id: string;
  hostelId: string;
  accountName: string;
  momoNumber: string;
  momoProvider: string;
  alternatePhone?: string;
  notes?: string;
}

export interface Hostel {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  distanceToCampus?: number;
  status: HostelStatus;
  managerId: string;
  rejectionReason?: string;
  totalRooms: number;
  pricingPeriod: PricingPeriod;
  allowSemesterPayment: boolean;
  createdAt: string;
  updatedAt: string;
  facilities?: HostelFacility[];
  images?: HostelImage[];
  roomTypes?: RoomType[];
  paymentDetail?: HostelPaymentDetail;
  _count?: {
    bookings: number;
    complaints: number;
    roomTypes: number;
  };
}


export interface CreateRoomTypePayload {
  occupancyType: OccupancyType;
  pricePerPerson: number;
  totalRooms: number;
  amenities?: string[];
  description?: string;
  rooms?: Array<{
    roomNumber: string;
    floor?: number;
    notes?: string;
  }>;
}


export interface HostelListItem extends Hostel {
  primaryImage?: HostelImage;
  priceRange?: {
    min: number;
    max: number;
  };
  occupancyStats?: {
    totalRooms: number;
    availableRooms: number;
    occupiedRooms: number;
    occupancyRate: number;
  };
}

export interface HostelDetail extends Hostel {
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export interface PaginationResponse {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CreateHostelPayload {
  name: string;
  description: string;
  address: string;
  distanceToCampus?: number;
  totalRooms: number;
  pricingPeriod: PricingPeriod;
  allowSemesterPayment?: boolean;
  facilities?: string[];
  roomTypes?: CreateRoomTypePayload[];
  paymentDetail?: PaymentDetailPayload;
}

export interface UpdateHostelPayload {
  name?: string;
  description?: string;
  address?: string;
  distanceToCampus?: number;
  totalRooms?: number;
  pricingPeriod?: PricingPeriod;
  allowSemesterPayment?: boolean;
}

export interface CreateRoomTypePayload {
  occupancyType: OccupancyType;
  pricePerPerson: number;
  totalRooms: number;
  availableRooms?: number;
  amenities?: string[];
  description?: string;
}

export interface UpdateRoomTypePayload {
  pricePerPerson?: number;
  totalRooms?: number;
  amenities?: string[];
  description?: string;
}

export interface UpdateAvailabilityPayload {
  availableRooms: number;
}

export interface PaymentDetailPayload {
  accountName: string;
  momoNumber: string;
  momoProvider?: string;
  alternatePhone?: string;
  notes?: string;
}

export interface GetHostelsParams {
  page?: number;
  limit?: number;
  status?: HostelStatus;
  search?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedApiResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: PaginationResponse;
}

export const hostelService = {
  getMyHostels: async (
    params: GetHostelsParams = {},
  ): Promise<{ hostels: HostelListItem[]; pagination: PaginationResponse }> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.set("page", String(params.page));
    if (params.limit) queryParams.set("limit", String(params.limit));
    if (params.status) queryParams.set("status", params.status);
    if (params.search) queryParams.set("search", params.search);

    const response = await api.get<PaginatedApiResponse<HostelListItem>>(
      `/hostels/my-hostels?${queryParams.toString()}`,
    );

    return {
      hostels: response.data.data,
      pagination: response.data.pagination,
    };
  },

  getMyHostelDetail: async (hostelId: string): Promise<HostelDetail> => {
    const response = await api.get<ApiResponse<HostelDetail>>(
      `/hostels/${hostelId}/manage`,
    );
    return response.data.data;
  },

  createHostel: async (payload: CreateHostelPayload): Promise<Hostel> => {
    const response = await api.post<ApiResponse<Hostel>>("/hostels", payload);
    return response.data.data;
  },

  updateHostel: async (
    hostelId: string,
    payload: UpdateHostelPayload,
  ): Promise<Hostel> => {
    const response = await api.put<ApiResponse<Hostel>>(
      `/hostels/${hostelId}`,
      payload,
    );
    return response.data.data;
  },

  deleteHostel: async (hostelId: string): Promise<void> => {
    await api.delete(`/hostels/${hostelId}`);
  },

  addRoomType: async (
    hostelId: string,
    payload: CreateRoomTypePayload,
  ): Promise<RoomType> => {
    const response = await api.post<ApiResponse<RoomType>>(
      `/hostels/${hostelId}/room-types`,
      payload,
    );
    return response.data.data;
  },

  updateRoomType: async (
    hostelId: string,
    roomTypeId: string,
    payload: UpdateRoomTypePayload,
  ): Promise<RoomType> => {
    const response = await api.put<ApiResponse<RoomType>>(
      `/hostels/${hostelId}/room-types/${roomTypeId}`,
      payload,
    );
    return response.data.data;
  },

  deleteRoomType: async (
    hostelId: string,
    roomTypeId: string,
  ): Promise<void> => {
    await api.delete(`/hostels/${hostelId}/room-types/${roomTypeId}`);
  },

  updateRoomAvailability: async (
    hostelId: string,
    roomTypeId: string,
    payload: UpdateAvailabilityPayload,
  ): Promise<RoomType> => {
    const response = await api.patch<ApiResponse<RoomType>>(
      `/hostels/${hostelId}/room-types/${roomTypeId}/availability`,
      payload,
    );
    return response.data.data;
  },

  addFacilities: async (
    hostelId: string,
    facilities: string[],
  ): Promise<HostelFacility[]> => {
    const response = await api.post<ApiResponse<HostelFacility[]>>(
      `/hostels/${hostelId}/facilities`,
      { facilities },
    );
    return response.data.data;
  },

  removeFacility: async (
    hostelId: string,
    facilityId: string,
  ): Promise<void> => {
    await api.delete(`/hostels/${hostelId}/facilities/${facilityId}`);
  },

  upsertPaymentDetail: async (
    hostelId: string,
    payload: PaymentDetailPayload,
  ): Promise<HostelPaymentDetail> => {
    const response = await api.put<ApiResponse<HostelPaymentDetail>>(
      `/hostels/${hostelId}/payment-details`,
      payload,
    );
    return response.data.data;
  },

  addImages: async (
    hostelId: string,
    images: File[],
  ): Promise<HostelImage[]> => {
    const formData = new FormData();

    images.forEach((image) => {
      formData.append("images", image);
    });

    const response = await api.post<ApiResponse<HostelImage[]>>(
      `/hostels/${hostelId}/images`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data.data;
  },

  removeImage: async (hostelId: string, imageId: string): Promise<void> => {
    await api.delete(`/hostels/${hostelId}/images/${imageId}`);
  },

  setPrimaryImage: async (
    hostelId: string,
    imageId: string,
  ): Promise<HostelImage> => {
    const response = await api.patch<ApiResponse<HostelImage>>(
      `/hostels/${hostelId}/images/${imageId}/primary`,
    );
    return response.data.data;
  },

  getApprovedHostels: async (
    params: GetHostelsParams = {},
  ): Promise<{ hostels: HostelListItem[]; pagination: PaginationResponse }> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.set("page", String(params.page));
    if (params.limit) queryParams.set("limit", String(params.limit));
    if (params.search) queryParams.set("search", params.search);

    const response = await api.get<PaginatedApiResponse<HostelListItem>>(
      `/hostels?${queryParams.toString()}`,
    );

    return {
      hostels: response.data.data,
      pagination: response.data.pagination,
    };
  },

  getHostelBySlug: async (slug: string): Promise<HostelDetail> => {
    const response = await api.get<ApiResponse<HostelDetail>>(
      `/hostels/slug/${slug}`,
    );
    return response.data.data;
  },

  getHostelById: async (hostelId: string): Promise<HostelDetail> => {
    const response = await api.get<ApiResponse<HostelDetail>>(
      `/hostels/${hostelId}`,
    );
    return response.data.data;
  },


  addRoomsToRoomType: async (
    hostelId: string,
    roomTypeId: string,
    rooms: Array<{
      roomNumber: string;
      floor?: number;
      notes?: string;
    }>
  ): Promise<RoomType> => {
    const response = await api.post<ApiResponse<RoomType>>(
      `/hostels/${hostelId}/room-types/${roomTypeId}/rooms`,
      { rooms }
    );
    return response.data.data;
  },

  
};
