export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export interface UserSummaryResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  product?: {
    id: number;
    name: string;
    images?: string[];
  };
  variantId?: number | null;
  variant?: {
    id: number;
    attribute: string;
    value: string;
  };
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: number;
  customerId: number;
  customer?: UserSummaryResponse;
  customerName?: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  totalTTC: number;
  items: OrderItem[];
  addressId: number;
  address?: {
    id: number;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  };
  couponCode?: string | null;
  discount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PlaceOrderRequest {
  addressId: number;
  couponCode?: string;
}

export interface OrderResponse extends Order {}

export interface AdminOrderItemResponse {
  productId: number;
  productName: string;
  variantInfo?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  seller: UserSummaryResponse;
}

export interface AdminOrderResponse {
  orderId: number;
  id?: number;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  totalTTC: number;
  discount?: number;
  orderDate: string;
  createdAt?: string;
  shippingAddress: string;
  customer: UserSummaryResponse;
  customerId?: number;
  items: AdminOrderItemResponse[];
}

export interface AdminOrderListResponse {
  content: AdminOrderResponse[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  size: number;
}

export interface OrderListResponse {
  content: Order[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  size: number;
}

export interface OrderStatusUpdate {
  status: OrderStatus;
}
