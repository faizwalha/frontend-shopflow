export interface Address {
  id: number;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  defaultAddress: boolean;
  createdAt?: string;
}

export interface AddressRequest {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  defaultAddress?: boolean;
}

export interface AddressResponse extends Address {}
