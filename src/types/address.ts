export interface Address {
  id: string;
  userId: string;
  type: 'HOME' | 'WORK' | 'OTHER';
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressInput {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  country?: string;
  postalCode: string;
  type?: 'HOME' | 'WORK' | 'OTHER';
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
}

export type UpdateAddressInput = Partial<CreateAddressInput>;
