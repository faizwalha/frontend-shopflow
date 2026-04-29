import { Address } from './address.models';

export interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  message?: string;
  role?: 'ADMIN' | 'SELLER' | 'CUSTOMER';
  userId?: number;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  role: 'ADMIN' | 'SELLER' | 'CUSTOMER';
  userId?: number;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'ADMIN' | 'SELLER' | 'CUSTOMER';
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'SELLER' | 'CUSTOMER';
  address?: string;
  shopName?: string;
  description?: string;
  logo?: string;
  rating?: number;
  addresses?: Address[];
}

export interface SellerProfileRequest {
  shopName: string;
  description: string;
  logo?: string;
  userId?: number;
}

export interface SellerProfileResponse extends SellerProfileRequest {
  id: number;
  rating: number;
}
