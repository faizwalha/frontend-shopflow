export interface AdminDashboardResponse {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  topSellers: string[];
}

export interface SellerDashboardResponse {
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
  recentOrders: string[];
}
