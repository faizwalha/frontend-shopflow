export interface AdminUser {
  id: number;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  role?: string;
  active: boolean;
  createdAt?: string;
}
