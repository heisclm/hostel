import api from "@/lib/api";

export interface PaginationResponse {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ManagerProfile {
  id: string;
  businessName: string;
  idNumber?: string;
  idImage?: string;
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  createdAt?: string;
}

export interface GuestProfile {
  id: string;
  guestType: string;
  beneficiaryName?: string;
  beneficiaryPhone?: string;
  beneficiaryEmail?: string;
  relationshipType?: string;
  staffId?: string;
  department?: string;
  admissionNumber?: string;
  expectedMatricDate?: string;
  programmeAdmitted?: string;
  purpose?: string;
  organization?: string;
}

export interface StudentProfile {
  studentId: string;
  programme?: string;
  level?: number;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "STUDENT" | "MANAGER" | "ADMIN" | "GUEST";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  emailVerified?: boolean;
  createdAt: string;
  updatedAt?: string;
  studentProfile?: StudentProfile | null;
  managerProfile?: ManagerProfile | null;
  guestProfile?: GuestProfile | null;
  _count?: {
    bookings?: number;
    complaints?: number;
    hostels?: number;
  };
}

export interface AdminUserDetail extends AdminUser {
  studentProfile: StudentProfile | null;
  managerProfile: ManagerProfile | null;
  _count: {
    bookings: number;
    complaints: number;
    hostels: number;
  };
}

export interface ManagerDetail extends AdminUser {
  managerProfile: ManagerProfile | null;
  _count: {
    hostels: number;
  };
}

export interface VerificationStats {
  totalManagers: number;
  pending: number;
  verified: number;
  rejected: number;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  role?: "STUDENT" | "MANAGER" | "ADMIN" | "GUEST";
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  search?: string;
}

export interface GetManagersParams {
  page?: number;
  limit?: number;
  status?: "PENDING" | "VERIFIED" | "REJECTED";
  search?: string;
}

export interface VerifyManagerPayload {
  action: "VERIFY" | "REJECT";
  rejectionReason?: string;
}

export interface UpdateUserStatusPayload {
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  reason?: string;
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

export interface AdminHostel {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  distanceToCampus: number | null;
  status: string;
  managerId: string;
  rejectionReason: string | null;
  totalRooms: number;
  pricingPeriod: string;
  allowSemesterPayment: boolean;
  createdAt: string;
  updatedAt: string;
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    managerProfile?: {
      businessName: string | null;
      verified: boolean;
    };
  };
  images: {
    id: string;
    url: string;
    isPrimary: boolean;
  }[];
  facilities: {
    id: string;
    name: string;
  }[];
  roomTypes: {
    id: string;
    occupancyType: string;
    pricePerPerson: string;
    totalRooms: number;
    availableRooms: number;
    amenities: string[];
    description: string | null;
  }[];
  _count?: {
    bookings: number;
    complaints: number;
  };
  paymentDetail?: {
    accountName: string;
    momoNumber: string;
    momoProvider: string;
    alternatePhone: string | null;
    notes: string | null;
  } | null;
}

export interface AdminHostelsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  managerId?: string;
}

export interface AdminHostelsResponse {
  hostels: AdminHostel[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface UpdateHostelStatusPayload {
  status: string;
  rejectionReason?: string;
}

export async function getAdminHostels(
  params: AdminHostelsParams,
): Promise<AdminHostelsResponse> {
  const response = await api.get("/admin/hostels", { params });

  const json = response.data;

  return {
    hostels: json.data ?? [],
    pagination: {
      page: json.pagination?.page ?? 1,
      limit: json.pagination?.limit ?? 10,
      totalItems: json.pagination?.total ?? 0,
      totalPages: json.pagination?.pages ?? 1,
    },
  };
}

export async function getAdminHostelDetail(
  hostelId: string,
): Promise<AdminHostel> {
  const response = await api.get<{
    success: boolean;
    message: string;
    data: AdminHostel;
  }>(`/admin/hostels/${hostelId}`);

  return response.data.data;
}

export async function updateHostelStatus(
  hostelId: string,
  payload: UpdateHostelStatusPayload,
): Promise<AdminHostel> {
  let endpoint = "";

  if (payload.status === "APPROVED" || payload.status === "REJECTED") {
    endpoint = `/admin/hostels/${hostelId}/verify`;
  } else if (payload.status === "SUSPENDED") {
    endpoint = `/admin/hostels/${hostelId}/suspend`;
  } else {
    throw new Error("Unsupported status update");
  }

  const response = await api.put(endpoint, payload);

  return response.data.data;
}

export interface AdminNavCounts {
  hostels: number;
  payments: number;
  disbursements: number;
  complaints: number;
  verifications: number;
}

interface NavCountsResponse {
  success: boolean;
  data: AdminNavCounts;
}

export interface PlatformStat {
  label: string;
  value: number;
  change: string;
  trending: "up" | "down" | "neutral";
  icon: string;
  color: string;
  bg: string;
  border: string;
}

export interface FinancialSummary {
  totalReceived: number;
  totalDisbursed: number;
  platformBalance: number;
  platformCommission: number;
  commissionRate: number;
  thisMonthReceived: number;
  thisMonthDisbursed: number;
}

export interface RecentPayment {
  id: string;
  studentName: string;
  amount: number;
  method: string;
  hostelName: string;
  managerName: string;
  status: string;
  disbursed: boolean;
  date: string;
}

export interface PendingDisbursement {
  id: string;
  managerId: string;
  managerName: string;
  hostelName: string;
  amount: number;
  paymentCount: number;
  oldestPayment: string;
  momoNumber: string;
  network: string;
}

export interface PendingVerification {
  id: string;
  type: "hostel" | "manager";
  name: string;
  submittedBy: string;
  date: string;
  location: string;
}

export interface EscalatedComplaint {
  id: string;
  title: string;
  hostelName: string;
  tenantName: string;
  priority: "high" | "urgent";
  daysOpen: number;
}

export interface AdminDashboardData {
  platformStats: PlatformStat[];
  financialSummary: FinancialSummary;
  recentPayments: RecentPayment[];
  pendingDisbursements: PendingDisbursement[];
  pendingVerifications: PendingVerification[];
  escalatedComplaints: EscalatedComplaint[];
  counts: {
    pendingManagerVerifications: number;
    pendingHostelVerifications: number;
    pendingDisbursements: number;
    escalatedComplaints: number;
  };
}

export const adminService = {
  getUsers: async (
    params: GetUsersParams = {},
  ): Promise<{ users: AdminUser[]; pagination: PaginationResponse }> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.set("page", String(params.page));
    if (params.limit) queryParams.set("limit", String(params.limit));
    if (params.role) queryParams.set("role", params.role);
    if (params.status) queryParams.set("status", params.status);
    if (params.search) queryParams.set("search", params.search);

    const response = await api.get<PaginatedApiResponse<AdminUser>>(
      `/admin/users?${queryParams.toString()}`,
    );

    return {
      users: response.data.data,
      pagination: response.data.pagination,
    };
  },

  getUserById: async (userId: string): Promise<AdminUserDetail> => {
    const response = await api.get<ApiResponse<AdminUserDetail>>(
      `/admin/users/${userId}`,
    );
    return response.data.data;
  },

  updateUserStatus: async (
    userId: string,
    payload: UpdateUserStatusPayload,
  ): Promise<AdminUser> => {
    const response = await api.put<ApiResponse<AdminUser>>(
      `/admin/users/${userId}/status`,
      payload,
    );
    return response.data.data;
  },

  getManagers: async (
    params: GetManagersParams = {},
  ): Promise<{ managers: AdminUser[]; pagination: PaginationResponse }> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.set("page", String(params.page));
    if (params.limit) queryParams.set("limit", String(params.limit));
    if (params.status) queryParams.set("status", params.status);
    if (params.search) queryParams.set("search", params.search);

    const response = await api.get<PaginatedApiResponse<AdminUser>>(
      `/admin/managers?${queryParams.toString()}`,
    );

    return {
      managers: response.data.data,
      pagination: response.data.pagination,
    };
  },

  getManagerById: async (managerId: string): Promise<ManagerDetail> => {
    const response = await api.get<ApiResponse<ManagerDetail>>(
      `/admin/managers/${managerId}`,
    );
    return response.data.data;
  },

  verifyManager: async (
    managerId: string,
    payload: VerifyManagerPayload,
  ): Promise<AdminUser> => {
    const response = await api.put<ApiResponse<AdminUser>>(
      `/admin/managers/${managerId}/verify`,
      payload,
    );
    return response.data.data;
  },

  getVerificationStats: async (): Promise<VerificationStats> => {
    const response = await api.get<ApiResponse<VerificationStats>>(
      "/admin/managers/stats/verification",
    );
    return response.data.data;
  },

  getNavCounts: async (): Promise<NavCountsResponse> => {
    const response = await api.get("/admin/nav-counts");
    return response.data;
  },

  getDashboardStats: async (): Promise<AdminDashboardData> => {
    const response =
      await api.get<ApiResponse<AdminDashboardData>>("/admin/dashboard");
    return response.data.data;
  },
};
