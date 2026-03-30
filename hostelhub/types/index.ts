export type UserRole = "student" | "hostel_manager" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  studentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student extends User {
  role: "student";
  studentId: string;
  department?: string;
  level?: string;
}

export interface HostelManager extends User {
  role: "hostel_manager";
  hostels: Hostel[];
  verified: boolean;
}

export interface Hostel {
  id: string;
  name: string;
  description: string;
  address: string;
  distanceFromCampus: number;
  managerId: string;
  manager?: HostelManager;
  images: string[];
  facilities: Facility[];
  rooms: Room[];
  rating: number;
  reviewCount: number;
  verified: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

export interface Facility {
  id: string;
  name: string;
  icon: string;
}

export interface Room {
  id: string;
  hostelId: string;
  name: string;
  type: RoomType;
  price: number;
  capacity: number;
  available: number;
  amenities: string[];
  images: string[];
}

export type RoomType = "single" | "double" | "triple" | "quad" | "dormitory";

export interface Booking {
  id: string;
  studentId: string;
  student?: Student;
  roomId: string;
  room?: Room;
  hostelId: string;
  hostel?: Hostel;
  checkInDate: Date;
  checkOutDate: Date;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded";

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  phone: string;
  provider: "mtn_momo";
  transactionId?: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Complaint {
  id: string;
  studentId: string;
  student?: Student;
  hostelId: string;
  hostel?: Hostel;
  subject: string;
  message: string;
  status: ComplaintStatus;
  response?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ComplaintStatus = "pending" | "in_progress" | "resolved" | "closed";

export interface HostelFilters {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  maxDistance?: number;
  facilities?: string[];
  roomType?: RoomType;
  sortBy?: "price_asc" | "price_desc" | "distance" | "rating";
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "booking" | "payment" | "complaint" | "system";
  read: boolean;
  createdAt: Date;
}
