-- CreateTable
CREATE TABLE "shipping_configuration" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "mode" TEXT NOT NULL,
    "flatRateAmount" INTEGER NOT NULL,
    "freeShippingThreshold" INTEGER,
    "defaultProvider" "ShippingProvider" NOT NULL DEFAULT 'SHIPROCKET',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_configuration_pkey" PRIMARY KEY ("id")
);
