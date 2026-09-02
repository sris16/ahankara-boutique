"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './use-auth';
import { addressApi } from '@/lib/api/address';
import { Address, CreateAddressInput, UpdateAddressInput } from '@/types/address';

interface AddressContextType {
  addresses: Address[];
  isLoading: boolean;
  error: Error | null;
  refreshAddresses: () => Promise<void>;
  createAddress: (data: CreateAddressInput) => Promise<Address>;
  updateAddress: (id: string, data: UpdateAddressInput) => Promise<Address>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultShipping: (id: string) => Promise<void>;
  setDefaultBilling: (id: string) => Promise<void>;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export function AddressProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refreshAddresses = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await addressApi.getAddresses();
      setAddresses(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch addresses'));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshAddresses();
    }
  }, [loading, refreshAddresses]);

  const createAddress = async (data: CreateAddressInput) => {
    if (!user) throw new Error("Unauthorized");
    setIsLoading(true);
    try {
      const newAddress = await addressApi.createAddress(data);
      await refreshAddresses();
      return newAddress;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAddress = async (id: string, data: UpdateAddressInput) => {
    if (!user) throw new Error("Unauthorized");
    setIsLoading(true);
    try {
      const updated = await addressApi.updateAddress(id, data);
      await refreshAddresses();
      return updated;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!user) throw new Error("Unauthorized");
    setIsLoading(true);
    try {
      await addressApi.deleteAddress(id);
      await refreshAddresses();
    } finally {
      setIsLoading(false);
    }
  };

  const setDefaultShipping = async (id: string) => {
    if (!user) throw new Error("Unauthorized");
    setIsLoading(true);
    try {
      await addressApi.setDefaultShipping(id);
      await refreshAddresses();
    } finally {
      setIsLoading(false);
    }
  };

  const setDefaultBilling = async (id: string) => {
    if (!user) throw new Error("Unauthorized");
    setIsLoading(true);
    try {
      await addressApi.setDefaultBilling(id);
      await refreshAddresses();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AddressContext.Provider value={{ 
      addresses, 
      isLoading, 
      error, 
      refreshAddresses, 
      createAddress, 
      updateAddress, 
      deleteAddress, 
      setDefaultShipping, 
      setDefaultBilling 
    }}>
      {children}
    </AddressContext.Provider>
  );
}

export function useAddress() {
  const context = useContext(AddressContext);
  if (context === undefined) {
    throw new Error('useAddress must be used within an AddressProvider');
  }
  return context;
}
