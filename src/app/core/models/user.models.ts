export interface AdminUser {
  id: number;
  email: string;
  displayName?: string;
  roles?: string[];
  active: boolean;
  createdAt?: string;
}
