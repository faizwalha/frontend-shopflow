export interface CartItem {
  id: number;
  productId: number;
  variantId?: number | null;
  quantity: number;
  product?: {
    id: number;
    name: string;
    price: number;
    promotionalPrice?: number;
    images?: string[];
  };
  variant?: {
    id: number;
    attribute: string;
    value: string;
    priceDelta?: number;
  };
}

export interface Cart {
  id: number;
  customerId: number;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  totalTTC: number;
  couponCode?: string | null;
  discount?: number;
  lastModified: string;
}

export interface AddToCartRequest {
  productId: number;
  variantId?: number | null;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface ApplyCouponRequest {
  code: string;
}
