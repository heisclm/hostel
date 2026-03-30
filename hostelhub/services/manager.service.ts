import api from "@/lib/api";

export interface DashboardStats {
  totalRevenue: {
    value: number;
    change: number;
    changeType: "positive" | "negative";
  };
  activeBookings: {
    value: number;
    change: number;
    changeType: "positive" | "negative";
  };
  totalTenants: {
    value: number;
    change: number;
    changeType: "positive" | "negative";
  };
  occupancyRate: {
    value: number;
    change: number;
    changeType: "positive" | "negative";
  };
}

export interface RecentBooking {
  id: string;
  occupantName: string;
  occupantEmail: string;
  hostelName: string;
  roomType: string;
  roomNumber: string;
  amount: number;
  status: string;
  date: string;
}

export interface HostelSummary {
  id: string;
  name: string;
  address: string;
  status: string;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  primaryImage: string | null;
  bookingsCount: number;
  complaintsCount: number;
}

export interface PendingAction {
  id: string;
  type: "booking" | "complaint" | "payment";
  title: string;
  description: string;
  time: string;
  action: string;
  href: string;
}

export interface DashboardData {
  stats: DashboardStats;
  financials?: {
    totalRevenue: number;
    totalPlatformFees: number;
    grossPayments: number;
    currentMonthRevenue: number;
    lastMonthRevenue: number;
  };
  recentBookings: RecentBooking[];
  hostels: HostelSummary[];
  pendingActions: PendingAction[];
  pendingCounts: {
    bookings: number;
    complaints: number;
    payments: number;
  };
}

export interface ManagerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName: string;
  businessAddress: string;
  businessDescription: string;
  profileImage: string | null;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const managerService = {
  getDashboardStats: async (): Promise<DashboardData> => {
    const response =
      await api.get<ApiResponse<DashboardData>>("/manager/dashboard");
    return response.data.data;
  },

  getProfile: async (): Promise<ManagerProfile> => {
    const response =
      await api.get<ApiResponse<ManagerProfile>>("/manager/profile");
    return response.data.data;
  },
};
