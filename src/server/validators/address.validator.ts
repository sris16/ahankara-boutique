import { z } from 'zod';
import { phoneSchema } from './user.validator';
import { AddressType } from '@prisma/client';

const addressBaseSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  phone: phoneSchema,
  addressLine1: z.string().trim().min(5, 'Address line 1 is required'),
  addressLine2: z.string().trim().optional(),
  landmark: z.string().trim().optional(),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().min(2, 'State is required'),
  country: z.string().trim().default('India'),
  postalCode: z.string().trim().min(3, 'Postal code is too short'),
  type: z.nativeEnum(AddressType).default(AddressType.HOME),
  isDefaultShipping: z.boolean().default(false),
  isDefaultBilling: z.boolean().default(false),
});

const pinCodeRefinement = (data: { country?: string; postalCode?: string }, ctx: z.RefinementCtx) => {
  if (data.country && data.country.toLowerCase() === 'india' && data.postalCode && !/^[1-9][0-9]{5}$/.test(data.postalCode)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid Indian PIN code. Must be 6 digits.',
      path: ['postalCode'],
    });
  }
};

export const addressSchema = addressBaseSchema.superRefine(pinCodeRefinement);
export const updateAddressSchema = addressBaseSchema.partial().superRefine(pinCodeRefinement);
