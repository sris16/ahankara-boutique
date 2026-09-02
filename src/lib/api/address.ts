import { apiClient } from './client';
import { Address, CreateAddressInput, UpdateAddressInput } from '@/types/address';

export const addressApi = {
  getAddresses: async (): Promise<Address[]> => {
    return apiClient.get('/api/me/addresses');
  },

  createAddress: async (data: CreateAddressInput): Promise<Address> => {
    return apiClient.post('/api/me/addresses', data);
  },

  updateAddress: async (id: string, data: UpdateAddressInput): Promise<Address> => {
    return apiClient.patch(`/api/me/addresses/${id}`, data);
  },

  deleteAddress: async (id: string): Promise<void> => {
    return apiClient.delete(`/api/me/addresses/${id}`);
  },

  setDefaultShipping: async (id: string): Promise<Address> => {
    return apiClient.patch(`/api/me/addresses/${id}/default-shipping`, {});
  },

  setDefaultBilling: async (id: string): Promise<Address> => {
    return apiClient.patch(`/api/me/addresses/${id}/default-billing`, {});
  }
};
