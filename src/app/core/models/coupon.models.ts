export type CouponType = 'FIXED' | 'PERCENTAGE';

export interface CouponRequest {
  code: string;
  type: CouponType;
  value: number;
  expiryDate: string; // ISO
  maxUsages?: number | null;
  active?: boolean;
}

export interface CouponResponse {
  id: number;
  code: string;
  type: CouponType;
  value: number;
  expiryDate: string;
  maxUsages?: number | null;
  currentUsages?: number;
  active: boolean;
  createdAt?: string;
}
