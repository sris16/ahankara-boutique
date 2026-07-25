/*
  Warnings:

  - You are about to drop the column `rawProviderData` on the `shipment_tracking_events` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "shipment_items_orderItemId_idx";

-- DropIndex
DROP INDEX "shipments_provider_providerShipmentId_key";

-- DropIndex
DROP INDEX "shipments_trackingNumber_idx";

-- AlterTable
ALTER TABLE "shipment_items" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "shipment_tracking_events" DROP COLUMN "rawProviderData",
ADD COLUMN     "rawProviderStatus" JSONB;
