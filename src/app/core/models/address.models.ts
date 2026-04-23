export interface Address {
  id: number;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface AddressRequest {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface AddressResponse extends Address {}
