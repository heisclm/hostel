import api from "@/lib/api";

export interface EligibleHostel {
  id: string;
  name: string;
  address: string;
  image: string | null;
  roomNumber: string | null;
  bookingId: string;
  checkInDate: string;
}

export interface ComplaintResponse {
  id: string;
  complaintId: string;
  responderId: string;
  message: string;
  createdAt: string;
  responder: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface Complaint {
  id: string;
  userId: string;
  hostelId: string | null;
  subject: string;
  message: string;
  category: string | null;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  visibility: "ADMIN_ONLY" | "ADMIN_AND_MANAGER";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  escalated?: boolean;
  escalatedAt?: string | null;
  escalationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: string;
    studentProfile?: {
      studentId: string;
      programme: string | null;
      level: number | null;
    };
  };
  hostel?: {
    id: string;
    name: string;
    address?: string;
    managerId?: string;
    manager?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
    images?: { url: string }[];
  };
  responses?: ComplaintResponse[];
  _count?: {
    responses: number;
  };
}

export interface CreateComplaintPayload {
  hostelId: string;
  subject: string;
  message: string;
  category?: string;
  visibility?: "ADMIN_ONLY" | "ADMIN_AND_MANAGER";
}

export interface AddResponsePayload {
  message: string;
}

export interface UpdateStatusPayload {
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  resolution?: string;
}

export interface EscalateComplaintPayload {
  reason: string;
}

export interface ComplaintsListResponse {
  success: boolean;
  data: Complaint[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ComplaintDetailResponse {
  success: boolean;
  data: Complaint;
}

export interface EligibleHostelsResponse {
  success: boolean;
  data: EligibleHostel[];
  message?: string;
}

export interface ComplaintStatsResponse {
  success: boolean;
  data: {
    stats: {
      total: number;
      open: number;
      inProgress: number;
      resolved: number;
      closed: number;
      escalated?: number;
      avgDaysOpen?: number;
    };
    recent: Complaint[];
  };
}

export interface ManagerHostelsResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    address: string;
  }[];
}

export const complaintService = {
  getEligibleHostels: async (): Promise<EligibleHostelsResponse> => {
    const response = await api.get("/complaints/eligible-hostels");
    return response.data;
  },

  createComplaint: async (data: CreateComplaintPayload) => {
    const response = await api.post("/complaints", data);
    return response.data;
  },

  getMyComplaints: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ComplaintsListResponse> => {
    const response = await api.get("/complaints/my-complaints", { params });
    return response.data;
  },

  getComplaintDetail: async (
    complaintId: string,
  ): Promise<ComplaintDetailResponse> => {
    const response = await api.get(`/complaints/${complaintId}`);
    return response.data;
  },

  addResponse: async (complaintId: string, data: AddResponsePayload) => {
    const response = await api.post(
      `/complaints/${complaintId}/responses`,
      data,
    );
    return response.data;
  },

  getManagerHostels: async (): Promise<ManagerHostelsResponse> => {
    const response = await api.get("/hostels/my-hostels");
    return response.data;
  },

  getHostelComplaints: async (
    hostelId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      category?: string;
      priority?: string;
      search?: string;
    },
  ): Promise<ComplaintsListResponse> => {
    const response = await api.get(`/complaints/hostel/${hostelId}`, {
      params,
    });
    return response.data;
  },

  getHostelComplaintStats: async (
    hostelId: string,
  ): Promise<ComplaintStatsResponse> => {
    const response = await api.get(`/complaints/hostel/${hostelId}/stats`);
    return response.data;
  },

  updateComplaintStatus: async (
    complaintId: string,
    data: UpdateStatusPayload,
  ) => {
    const response = await api.patch(`/complaints/${complaintId}/status`, data);
    return response.data;
  },

  getAllComplaints: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    hostelId?: string;
    category?: string;
    priority?: string;
    escalated?: boolean;
    search?: string;
  }): Promise<ComplaintsListResponse> => {
    const response = await api.get("/complaints", { params });
    return response.data;
  },

  getAdminComplaintStats: async (): Promise<ComplaintStatsResponse> => {
    const response = await api.get("/complaints/admin/stats");
    return response.data;
  },

  escalateComplaint: async (
    complaintId: string,
    data: EscalateComplaintPayload,
  ) => {
    const response = await api.post(
      `/complaints/${complaintId}/escalate`,
      data,
    );
    return response.data;
  },
};
