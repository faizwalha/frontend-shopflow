export interface AdminDashboardResponse {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  topSellers: string[];
  topProducts: string[];
  recentOrders: RecentOrderSummary[];
}

export interface RecentOrderSummary {
  orderNumber: string;
  customerName: string;
  totalTTC: number;
  status: string;
  orderDate: string;
}

export interface SellerDashboardResponse {
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
  recentOrders: string[];
}
