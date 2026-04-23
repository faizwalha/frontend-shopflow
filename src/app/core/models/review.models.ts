export interface Review {
  id: number;
  productId: number;
  customerId?: number;
  customerName?: string;
  rating: number; // 1-5
  comment: string;
  approved?: boolean;
  createdAt: string;
}

export interface PostReviewRequest {
  productId: number;
  rating: number;
  comment: string;
}

export interface ReviewResponse extends Review {}

export interface ReviewListResponse {
  content: Review[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  size: number;
}

export interface ApproveReviewRequest {
  approved: boolean;
}
