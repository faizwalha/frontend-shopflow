export interface ProductVariant {
  id: number;
  attribute: string;
  value: string;
  additionalStock: number;
  priceDelta: number;
}

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
  sellerId?: number;
  images: string[];
  categories: string[];
  averageRating: number;
  reviewCount: number;
  variants?: ProductVariant[];
}

export interface ProductRequest {
  name: string;
  description: string;
  price: number;
  promoPrice?: number;
  stock: number;
  active?: boolean;
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