export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  promoPrice?: number;
  displayPrice: number;
  stock: number;
  active: boolean;
  createdAt: string;
  sellerName: string;
  images: string[];
  categories: string[];
  averageRating: number;
}

export interface ProductRequest {
  name: string;
  description: string;
  price: number;
  promoPrice?: number;
  stock: number;
  images?: string[];
  categoryIds?: number[];
}

export interface PageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  empty?: boolean;
}