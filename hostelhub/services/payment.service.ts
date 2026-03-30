import api from "@/lib/api";
import type {
  AdminPaymentsListResponse,
  AdminPaymentStatsResponse,
  AdminPaymentDetailResponse,
  AdminPaymentQueryParams,
} from "@/types/payment";

export interface StudentPaymentQueryParams {
  page?: number;
  limit?: number;
  status?: "PENDING" | "SUCCESSFUL" | "FAILED" | "REFUNDED";
  sortBy?: "createdAt" | "amount" | "status" | "paidAt";
  sortOrder?: "asc" | "desc";
}

export interface StudentPayment {
  id: string;
  paymentReference: string;
  amount: string;
  method: string;
  status: "PENDING" | "SUCCESSFUL" | "FAILED" | "REFUNDED";
  momoTransactionId: string | null;
  payerPhone: string | null;
  paidAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    bookingReference: string;
    status: string;
    baseAmount: string;
    platformFee: string;
    totalAmount: string;
    paymentPlan: string;
    semesterPeriod: string | null;
    academicYear: string | null;
    createdAt: string;
    hostel: {
      id: string;
      name: string;
      slug: string;
      address: string;
      images: Array<{ url: string }>;
    };
    roomType: {
      id: string;
      occupancyType: string;
      pricePerPerson: string;
    };
    room: {
      id: string;
      roomNumber: string;
    } | null;
  };
}

export interface StudentPaymentStats {
  total: number;
  successful: number;
  pending: number;
  failed: number;
  totalSpent: number;
}

export interface StudentPaymentsResponse {
  success: boolean;
  data: StudentPayment[];
  stats: StudentPaymentStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface StudentPaymentDetailResponse {
  success: boolean;
  data: StudentPayment;
}

export const paymentService = {
  getMyPayments: async (
    params?: StudentPaymentQueryParams,
  ): Promise<StudentPaymentsResponse> => {
    const cleanParams: Record<string, string | number> = {};
    if (params) {
      if (params.page) cleanParams.page = params.page;
      if (params.limit) cleanParams.limit = params.limit;
      if (params.status) cleanParams.status = params.status;
      if (params.sortBy) cleanParams.sortBy = params.sortBy;
      if (params.sortOrder) cleanParams.sortOrder = params.sortOrder;
    }
    const response = await api.get("/payments/my-payments", {
      params: cleanParams,
    });
    return response.data;
  },

  getMyPaymentDetail: async (
    paymentId: string,
  ): Promise<StudentPaymentDetailResponse> => {
    const response = await api.get(`/payments/my-payments/${paymentId}`);
    return response.data;
  },

  adminGetAllPayments: async (
    params?: AdminPaymentQueryParams,
  ): Promise<AdminPaymentsListResponse> => {
    const cleanParams: Record<string, string | number> = {};
    if (params) {
      if (params.page) cleanParams.page = params.page;
      if (params.limit) cleanParams.limit = params.limit;
      if (params.status) cleanParams.status = params.status;
      if (params.search) cleanParams.search = params.search;
      if (params.hostelId) cleanParams.hostelId = params.hostelId;
      if (params.sortBy) cleanParams.sortBy = params.sortBy;
      if (params.sortOrder) cleanParams.sortOrder = params.sortOrder;
    }
    const response = await api.get("/admin/payments", { params: cleanParams });
    return response.data;
  },

  adminGetPaymentStats: async (): Promise<AdminPaymentStatsResponse> => {
    const response = await api.get("/admin/payments/stats");
    return response.data;
  },

  adminGetPaymentDetail: async (
    paymentId: string,
  ): Promise<AdminPaymentDetailResponse> => {
    const response = await api.get(`/admin/payments/${paymentId}`);
    return response.data;
  },
};
