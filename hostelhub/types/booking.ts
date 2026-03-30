export type BookingStatus =
  | "PENDING"
  | "PAID"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED"
  | "CHECKED_IN"
  | "CHECKED_OUT";

export type PaymentStatus = "PENDING" | "SUCCESSFUL" | "FAILED" | "REFUNDED";
export type PaymentPlan = "FULL_YEAR" | "SEMESTER";
export type SemesterPeriod = "FIRST_SEMESTER" | "SECOND_SEMESTER";
export type OccupancyType = "IN_1" | "IN_2" | "IN_3" | "IN_4";

export interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  studentProfile?: {
    id: string;
    studentId: string;
    programme?: string;
    level?: number;
    academicYear?: string;
    emergencyContact?: string;
  } | null;
}

export interface RoomTypeInfo {
  id: string;
  occupancyType: OccupancyType;
  pricePerPerson: number;
  totalRooms: number;
  availableRooms: number;
  amenities: string[];
  description?: string | null;
}

export interface PaymentInfo {
  id: string;
  paymentReference: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  momoTransactionId?: string | null;
  payerPhone?: string | null;
  paidAt?: string | null;
  failedAt?: string | null;
  failureReason?: string | null;
  createdAt: string;
}

export interface BookingData {
  id: string;
  bookingReference: string;
  studentId: string;
  hostelId: string;
  roomTypeId: string;
  status: BookingStatus;
  paymentPlan: PaymentPlan;
  semesterPeriod?: SemesterPeriod | null;
  academicYear?: string | null;
  totalAmount: number;
  checkInDate?: string | null;
  checkOutDate?: string | null;
  notes?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  student: StudentInfo;
  roomType: RoomTypeInfo;
  payment?: PaymentInfo | null;
  hostel?: {
    id: string;
    name: string;
    slug: string;
    address: string;
  };
}

export interface BookingRoomType {
  id: string;
  occupancyType: OccupancyType;
  pricePerPerson: string | number;
}

export interface BookingHostel {
  id: string;
  name: string;
  slug: string;
  address: string;
  managerId?: string;
  images?: Array<{
    id: string;
    url: string;
    isPrimary: boolean;
  }>;
  paymentDetail?: {
    accountName: string;
    momoNumber: string;
    momoProvider: string;
  };
}

export interface BookingStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  studentProfile?: {
    studentId: string;
    programme?: string;
    level?: number;
  };
}

export interface BookingDisbursement {
  id: string;
  disbursementReference: string;
  amount: string;
  platformFee: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  disbursedAt: string | null;
  recipientPhone: string;
  recipientName: string;
}

export interface BookingPayment {
  id: string;
  paymentReference: string;
  status: PaymentStatus;
  amount: string | number;
  method: string;
  paidAt: string | null;
  failureReason?: string;
  disbursement?: BookingDisbursement | null;
}

export interface BookingReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
}


export interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  currentOccupants: number;
  status: string;
  notes?: string | null;
}



export interface Booking {
  id: string;
  bookingReference: string;
  bookerId: string;
  hostelId: string;
  roomTypeId: string;
  roomId?: string | null;          
  bedNumber?: number | null;
  status: BookingStatus;
  paymentPlan: PaymentPlan;
  semesterPeriod: SemesterPeriod | null;
  academicYear: string | null;
  totalAmount: string | number;
  checkInDate: string | null;
  checkOutDate: string | null;
  expectedCheckOutDate: string | null;
  notes: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  hostel: BookingHostel;
  roomType: BookingRoomType;
  room?: Room | null;
  payment?: BookingPayment | null;
  booker?: BookingStudent;
  review?: BookingReview | null;
}

export interface CreateBookingPayload {
  hostelId: string;
  roomTypeId: string;
  paymentPlan: PaymentPlan;
  semesterPeriod?: SemesterPeriod;
  academicYear?: string;
  notes?: string;
}

export interface InitiatePaymentPayload {
  phone: string;
}

export interface PaymentInitiationResponse {
  paymentId: string;
  paymentReference: string;
  momoReferenceId: string;
  amount: number;
  status: string;
  bookingReference: string;
}

export interface PaymentVerificationResponse {
  paymentStatus: PaymentStatus | "PENDING";
  bookingStatus: BookingStatus;
  paymentReference?: string;
  bookingReference?: string;
  amount?: string | number;
  transactionId?: string | null;
  failureReason?: string;
}

export interface BookingPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface BookingsListResponse {
  success: boolean;
  data: Booking[];
  pagination: BookingPagination;
}

export interface BookingDetailResponse {
  success: boolean;
  data: Booking;
}

export interface CreateBookingResponse {
  success: boolean;
  message: string;
  data: Booking;
}

export interface InitiatePaymentResponse {
  success: boolean;
  message: string;
  data: PaymentInitiationResponse;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  data: PaymentVerificationResponse;
}

export interface CancelBookingResponse {
  success: boolean;
  message: string;
  data: Booking;
}

export interface ManagerBookingActionResponse {
  success: boolean;
  message: string;
  data: Booking;
}

export interface HostelBookingQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
