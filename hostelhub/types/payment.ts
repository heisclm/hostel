export interface PaymentStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface PaymentManager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface PaymentHostelDetail {
  accountName: string;
  momoNumber: string;
  momoProvider: string;
}

export interface PaymentHostel {
  id: string;
  name: string;
  slug: string;
  managerId: string;
  manager: PaymentManager;
  paymentDetail: PaymentHostelDetail | null;
}

export interface PaymentRoomType {
  id: string;
  occupancyType: string;
  pricePerPerson: string;
}

export interface PaymentBooking {
  id: string;
  bookingReference: string;
  status: string;
  totalAmount: string;
  paymentPlan: string;
  semesterPeriod: string | null;
  academicYear: string | null;
  booker: PaymentStudent;
  hostel: PaymentHostel;
  roomType: PaymentRoomType;
}

export interface PaymentDisbursement {
  id: string;
  disbursementReference: string;
  amount: string;
  platformFee: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  disbursedAt: string | null;
  recipientPhone: string;
  recipientName: string;
}

export interface AdminPayment {
  id: string;
  paymentReference: string;
  bookingId: string;
  amount: string;
  method: "MTN_MOMO";
  status: "PENDING" | "SUCCESSFUL" | "FAILED" | "REFUNDED";
  momoTransactionId: string | null;
  momoRequestId: string | null;
  payerPhone: string | null;
  payerMessage: string | null;
  providerResponse: Record<string, unknown> | null;
  paidAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  booking: PaymentBooking;
  disbursement: PaymentDisbursement | null;
}

export interface AdminPaymentsListResponse {
  success: boolean;
  data: AdminPayment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaymentStatusBreakdownItem {
  count: number;
  amount: number;
}

export interface AdminPaymentStatsResponse {
  success: boolean;
  data: {
    totalPayments: number;
    statusBreakdown: {
      successful: PaymentStatusBreakdownItem;
      pending: PaymentStatusBreakdownItem;
      failed: PaymentStatusBreakdownItem;
      refunded: PaymentStatusBreakdownItem;
    };
    revenue: {
      totalReceived: number;
      totalSuccessfulPayments: number;
      platformFeesEarned: number;
    };
    disbursements: {
      pendingAmount: number;
      pendingCount: number;
      completedAmount: number;
      completedCount: number;
    };
    recentPayments: AdminPayment[];
    monthlyStats: {
      month: string;
      count: number;
      total: number;
    }[];
  };
}

export interface AdminPaymentDetailResponse {
  success: boolean;
  data: AdminPayment;
}

export interface AdminPaymentQueryParams {
  page?: number;
  limit?: number;
  status?: "PENDING" | "SUCCESSFUL" | "FAILED" | "REFUNDED";
  search?: string;
  hostelId?: string;
  sortBy?: "createdAt" | "amount" | "status" | "paidAt";
  sortOrder?: "asc" | "desc";
}
