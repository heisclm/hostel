import api from "@/lib/api";
import type {
  DisbursementsListResponse,
  DisbursementStatsResponse,
  DisbursementActionResponse,
  DisbursementQueryParams,
} from "@/types/disbursement";

export const disbursementService = {
  adminGetAllDisbursements: async (
    params?: DisbursementQueryParams,
  ): Promise<DisbursementsListResponse> => {
    const cleanParams: Record<string, string | number> = {};
    if (params) {
      if (params.page) cleanParams.page = params.page;
      if (params.limit) cleanParams.limit = params.limit;
      if (params.status) cleanParams.status = params.status;
      if (params.search) cleanParams.search = params.search;
    }
    const response = await api.get("/admin/bookings/disbursements", {
      params: cleanParams,
    });
    return response.data;
  },

  adminGetDisbursementStats: async (): Promise<DisbursementStatsResponse> => {
    const response = await api.get("/admin/bookings/disbursements/stats");
    return response.data;
  },

  processDisbursement: async (
    disbursementId: string,
  ): Promise<DisbursementActionResponse> => {
    const response = await api.post(
      `/admin/bookings/disbursements/${disbursementId}/process`,
    );
    return response.data;
  },

  verifyDisbursement: async (
    disbursementId: string,
  ): Promise<DisbursementActionResponse> => {
    const response = await api.get(
      `/admin/bookings/disbursements/${disbursementId}/verify`,
    );
    return response.data;
  },

  markDisbursementComplete: async (
    disbursementId: string,
    notes?: string,
  ): Promise<DisbursementActionResponse> => {
    const response = await api.put(
      `/admin/bookings/disbursements/${disbursementId}/complete`,
      { notes },
    );
    return response.data;
  },
};
