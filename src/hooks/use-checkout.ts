"use client";

import { useState, useCallback } from 'react';
import { checkoutApi } from '@/lib/api/checkout';
import { CouponValidationResponse } from '@/types/checkout';

export function useCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [pricingInfo, setPricingInfo] = useState<CouponValidationResponse | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const applyCoupon = useCallback(async (code: string) => {
    setIsProcessing(true);
    setCouponError(null);
    try {
      const result = await checkoutApi.validateCoupon(code);
      setPricingInfo(result);
      setAppliedCoupon(code);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { error?: string })?.error || "Failed to apply coupon";
      setCouponError(msg);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setPricingInfo(null);
    setCouponError(null);
  }, []);

  return {
    isProcessing,
    error,
    pricingInfo,
    appliedCoupon,
    couponError,
    applyCoupon,
    clearCoupon,
    setIsProcessing,
    setError
  };
}
