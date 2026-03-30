export interface DisbursementPaymentBooking {
  id: string;
  bookingReference: string;
  booker: {
    firstName: string;
    lastName: string;
  };
  hostel: {
    id: string;
    name: string;
  };
}

export interface DisbursementPayment {
  id: string;
  paymentReference: string;
  amount: string;
  status: string;
  paidAt: string | null;
  booking: DisbursementPaymentBooking;
}

export interface AdminDisbursement {
  id: string;
  disbursementReference: string;
  paymentId: string;
  hostelId: string;
  managerId: string;
  amount: string;
  platformFee: string;
  recipientPhone: string;
  recipientName: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  disbursedBy: string | null;
  disbursedAt: string | null;
  failureReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  payment: DisbursementPayment;
}

export interface DisbursementStatsResponse {
  success: boolean;
  data: {
    totalDisbursements: number;
    totalAmount: number;
    totalPlatformFees: number;
    statusBreakdown: {
      pending: { count: number; totalAmount: number };
      processing: { count: number; totalAmount: number };
      completed: { count: number; totalAmount: number };
      failed: { count: number; totalAmount: number };
    };
  };
}

export interface DisbursementsListResponse {
  success: boolean;
  data: AdminDisbursement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DisbursementActionResponse {
  success: boolean;
  message: string;
  data: AdminDisbursement | Record<string, unknown>;
}

export interface DisbursementQueryParams {
  page?: number;
  limit?: number;
  status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  search?: string;
}
