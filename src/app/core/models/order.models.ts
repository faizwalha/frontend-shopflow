export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

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
