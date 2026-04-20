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
}