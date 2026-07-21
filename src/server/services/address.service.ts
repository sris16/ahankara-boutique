import { prisma } from '@/lib/prisma';

import { addressSchema, updateAddressSchema } from '../validators/address.validator';
import { NotFoundError } from '@/utils/errors';

export class AddressService {
  static async getUserAddresses(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getAddressById(addressId: string, userId: string) {
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    
    if (!address) {
      throw new NotFoundError('Address not found');
    }
    
    return address;
  }

  static async createAddress(userId: string, data: unknown) {
    const validData = addressSchema.parse(data);

    return prisma.$transaction(async (tx) => {
      // If this is the first address, it should automatically be default shipping & billing
      const count = await tx.address.count({ where: { userId } });
      const isFirst = count === 0;
      
      const isDefaultShipping = validData.isDefaultShipping || isFirst;
      const isDefaultBilling = validData.isDefaultBilling || isFirst;

      if (isDefaultShipping) {
        await tx.address.updateMany({
          where: { userId, isDefaultShipping: true },
          data: { isDefaultShipping: false },
        });
      }

      if (isDefaultBilling) {
        await tx.address.updateMany({
          where: { userId, isDefaultBilling: true },
          data: { isDefaultBilling: false },
        });
      }

      return tx.address.create({
        data: {
          ...validData,
          userId,
          isDefaultShipping,
          isDefaultBilling,
        },
      });
    });
  }

  static async updateAddress(addressId: string, userId: string, data: unknown) {
    const validData = updateAddressSchema.parse(data);
    
    // Check ownership first
    await this.getAddressById(addressId, userId);

    return prisma.$transaction(async (tx) => {
      if (validData.isDefaultShipping) {
        await tx.address.updateMany({
          where: { userId, isDefaultShipping: true, id: { not: addressId } },
          data: { isDefaultShipping: false },
        });
      }

      if (validData.isDefaultBilling) {
        await tx.address.updateMany({
          where: { userId, isDefaultBilling: true, id: { not: addressId } },
          data: { isDefaultBilling: false },
        });
      }

      return tx.address.update({
        where: { id: addressId },
        data: validData,
      });
    });
  }

  static async deleteAddress(addressId: string, userId: string) {
    // Check ownership first
    await this.getAddressById(addressId, userId);

    return prisma.address.delete({
      where: { id: addressId },
    });
  }

  static async setDefaultShipping(addressId: string, userId: string) {
    // Check ownership first
    await this.getAddressById(addressId, userId);

    return prisma.$transaction(async (tx) => {
      // Unset previous default
      await tx.address.updateMany({
        where: { userId, isDefaultShipping: true },
        data: { isDefaultShipping: false },
      });

      // Set new default
      return tx.address.update({
        where: { id: addressId },
        data: { isDefaultShipping: true },
      });
    });
  }

  static async setDefaultBilling(addressId: string, userId: string) {
    // Check ownership first
    await this.getAddressById(addressId, userId);

    return prisma.$transaction(async (tx) => {
      // Unset previous default
      await tx.address.updateMany({
        where: { userId, isDefaultBilling: true },
        data: { isDefaultBilling: false },
      });

      // Set new default
      return tx.address.update({
        where: { id: addressId },
        data: { isDefaultBilling: true },
      });
    });
  }
}
