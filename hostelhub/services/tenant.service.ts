import api from "@/lib/api";
import { TenantQueryParams, TenantsResponse } from "@/types/tenants";

export const tenantService = {
  getManagerTenants: async (
    params?: TenantQueryParams,
  ): Promise<TenantsResponse> => {
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
    const response = await api.get("/bookings/manager/tenants", {
      params: cleanParams,
    });
    return response.data;
  },
};
