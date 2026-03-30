import api from "@/lib/api";
import type {
  CreateBookingPayload,
  CreateBookingResponse,
  InitiatePaymentPayload,
  InitiatePaymentResponse,
  VerifyPaymentResponse,
  BookingsListResponse,
  BookingDetailResponse,
  CancelBookingResponse,
  ManagerBookingActionResponse,
  HostelBookingQueryParams,
} from "@/types/booking";


export interface AvailableRoom {
  id: string;
  roomNumber: string;
  floor: number | null;
  currentOccupancy: number;
  maxOccupancy: number;
  status: string;
  availableSlots: number;
}

export interface AvailableRoomsResponse {
  success: boolean;
  data: AvailableRoom[];
  message?: string;
}

export interface AssignRoomPayload {
  roomId: string;
}



export const bookingService = {
  createBooking: async (
    data: CreateBookingPayload,
  ): Promise<CreateBookingResponse> => {
    const response = await api.post("/bookings", data);
    return response.data;
  },

  initiatePayment: async (
    bookingId: string,
    data: InitiatePaymentPayload,
  ): Promise<InitiatePaymentResponse> => {
    const response = await api.post(`/bookings/${bookingId}/pay`, data);
    return response.data;
  },

  verifyPayment: async (bookingId: string): Promise<VerifyPaymentResponse> => {
    const response = await api.get(`/bookings/${bookingId}/verify-payment`);
    return response.data;
  },

  getMyBookings: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<BookingsListResponse> => {
    const response = await api.get("/bookings/my-bookings", { params });
    return response.data;
  },

  getBookingDetail: async (
    bookingId: string,
  ): Promise<BookingDetailResponse> => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },

  cancelBooking: async (
    bookingId: string,
    reason?: string,
  ): Promise<CancelBookingResponse> => {
    const response = await api.put(`/bookings/${bookingId}/cancel`, {
      reason,
    });
    return response.data;
  },

  getHostelBookings: async (
    hostelId: string,
    params?: HostelBookingQueryParams,
  ): Promise<BookingsListResponse> => {
    const cleanParams: Record<string, string | number> = {};
    if (params) {
      if (params.page) cleanParams.page = params.page;
      if (params.limit) cleanParams.limit = params.limit;
      if (params.status) cleanParams.status = params.status;
      if (params.search) cleanParams.search = params.search;
      if (params.sortBy) cleanParams.sortBy = params.sortBy;
      if (params.sortOrder) cleanParams.sortOrder = params.sortOrder;
    }
    const response = await api.get(`/bookings/hostel/${hostelId}`, {
      params: cleanParams,
    });
    return response.data;
  },


    getAvailableRoomsForAssignment: async (
    hostelId: string,
    roomTypeId: string,
  ): Promise<AvailableRoomsResponse> => {
    const response = await api.get(
      `/hostels/${hostelId}/room-types/${roomTypeId}/available-rooms`,
    );
    return response.data;
  },

  


  reassignRoom: async (
    hostelId: string,
    bookingId: string,
    newRoomId: string,
  ): Promise<ManagerBookingActionResponse> => {
    const response = await api.patch(
      `/bookings/hostel/${hostelId}/${bookingId}/reassign-room`,
      { roomId: newRoomId },
    );
    return response.data;
  },

    confirmBooking: async (
    hostelId: string,
    bookingId: string,
  ): Promise<ManagerBookingActionResponse> => {
    const response = await api.patch(
      `/bookings/hostel/${hostelId}/${bookingId}/confirm`,
    );
    return response.data;
  },


  checkInStudent: async (
    hostelId: string,
    bookingId: string,
  ): Promise<ManagerBookingActionResponse> => {
    const response = await api.put(
      `/bookings/hostel/${hostelId}/${bookingId}/check-in`,
    );
    return response.data;
  },

  checkOutStudent: async (
    hostelId: string,
    bookingId: string,
  ): Promise<ManagerBookingActionResponse> => {
    const response = await api.put(
      `/bookings/hostel/${hostelId}/${bookingId}/check-out`,
    );
    return response.data;
  },


    assignStudentToRoom: async (
    hostelId: string,
    bookingId: string,
    roomId: string,
  ): Promise<ManagerBookingActionResponse> => {
    const response = await api.post(
      `/bookings/hostel/${hostelId}/${bookingId}/assign-room`,
      { roomId },
    );
    return response.data;
  },
};
