export interface TenantStudent {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  studentId: string | null;
  university: string | null;
  programme: string | null;
  level: string | null;
  emergencyContact: {
    name: string | null;
    phone: string | null;
    relationship: string | null;
  };
}


export interface TenantBooker {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  bookerId: string | null; 
  university: string | null;
  programme: string | null;
  level: string | null;
  emergencyContact: {
    name: string | null;
    phone: string | null;
    relationship: string | null;
  };
}


export interface TenantData {
  id: string;
  bookingId: string;
  booker: TenantBooker;
  hostel: {
    id: string;
    name: string;
  };
  roomType: {
    id: string;
    name: string;
    type: string;
  } | null;
  roomNumber: string | null;
  checkIn: string | null;
  checkOut: string | null;
  actualCheckOut: string | null;
  status: "active" | "checked_out" | "overdue" | "pending";
  paymentPlan: string;
  totalDue: number;
  totalPaid: number;
  balance: number;
  lastPaymentDate: string | null;
  createdAt: string;
}

export interface TenantStats {
  active: number;
  checkedOut: number;
  pending: number;
  overdue: number;
  totalCollected: number;
  totalOutstanding: number;
}

export interface TenantHostel {
  id: string;
  name: string;
}

export interface TenantsResponse {
  success: boolean;
  message: string;
  data: {
    tenants: TenantData[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    stats: TenantStats;
    hostels: TenantHostel[];
  };
}

export interface TenantQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  hostelId?: string;
  sortBy?: "checkInDate" | "name" | "roomNumber" | "createdAt";
  sortOrder?: "asc" | "desc";
}
