export interface ReviewUser {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface Review {
  id: string;
  hostelId: string;
  bookingId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
  hostel?:{
    id: string;
    name: string;
    slug?: string;
  }
}



export interface CreateReviewPayload {
  hostelId: string;
  bookingId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewPayload {
  rating?: number;
  comment?: string;
}



export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}




export interface HostelReviewsResponse {
  success: boolean;
  data: Review[];
  stats?: {
    averageRating: number;
    totalReviews: number;
    distribution?: Record<number, number>;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ReviewResponse {
  success: boolean;
  message: string;
  data: Review;
}

export interface CreateReviewPayload {
  bookingId: string;
  hostelId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewPayload {
  rating?: number;
  comment?: string;
}
